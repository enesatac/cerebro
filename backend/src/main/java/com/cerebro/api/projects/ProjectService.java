package com.cerebro.api.projects;

import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.organisation.Names;
import com.cerebro.api.portfolio.PortfolioChildren;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.PagedResult;
import com.cerebro.api.shared.Sorting;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Projects: readable by every signed-in user; changes need {@code projects:edit}, deletion {@code
 * projects:delete}. Projects with contracts cannot be deleted.
 */
@Service
@Transactional
public class ProjectService {

  static final String ENTITY = "Proje";
  private static final List<String> PRIORITIES = List.of("low", "medium", "high", "critical");

  private final ProjectStore store;
  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;
  private final Names names;

  public ProjectService(
      ProjectStore store,
      JdbcClient jdbc,
      Access access,
      Checks checks,
      MasterCodes codes,
      AuditStamp stamp,
      Names names) {
    this.store = store;
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
    this.names = names;
  }

  public record Query(
      String search,
      List<String> statuses,
      List<String> healths,
      Long businessUnitId,
      Long teamId,
      int page,
      int pageSize,
      String sort,
      String direction) {}

  @Transactional(readOnly = true)
  public PagedResult<Project.ListItem> list(Query query) {
    access.current();
    Map<Long, String> people = names.people();
    Map<Long, String> units = names.businessUnits();
    List<Project.ListItem> rows =
        store.findAll().stream()
            .filter(project -> matches(project, query))
            .map(project -> listItem(project, people, units))
            .sorted(Sorting.by(sortKey(query.sort()), !"desc".equals(query.direction())))
            .toList();
    return PagedResult.of(rows, query.page(), query.pageSize());
  }

  @Transactional(readOnly = true)
  public Project get(long id) {
    access.current();
    return find(id);
  }

  @Transactional(readOnly = true)
  public List<Project.Ref> refs() {
    access.current();
    return jdbc.sql("SELECT id, name, code FROM projects ORDER BY id")
        .query((rs, row) -> new Project.Ref(rs.getLong("id"), rs.getString("name"), rs.getString("code")))
        .list();
  }

  /** Projects that affect an application, with the nature of the impact. */
  @Transactional(readOnly = true)
  public List<Project.ApplicationLink> listByApplication(long applicationId) {
    access.current();
    Map<Long, String> people = names.people();
    Map<Long, String> units = names.businessUnits();
    List<Project.ApplicationLink> links = new ArrayList<>();
    for (Project project : store.findAll()) {
      for (Project.ApplicationImpact impact : project.applicationImpacts()) {
        if (impact.applicationId() == applicationId) {
          links.add(new Project.ApplicationLink(listItem(project, people, units), impact));
        }
      }
    }
    return links;
  }

  public Project create(Project.Input input) {
    SessionUser user = access.require("projects:edit");
    validate(input, null);
    return find(store.insert(input, stamp.created(user)));
  }

  public Project update(long id, Project.Input input) {
    SessionUser user = access.require("projects:edit");
    Project current = find(id);
    validate(input, current);
    store.update(id, input, stamp.touched(current.audit(), user));
    return find(id);
  }

  /**
   * Allocations and files go with the project; risks, escalations, decisions and demands lose the
   * link (foreign keys).
   */
  public void remove(long id) {
    access.require("projects:delete");
    find(id);
    DeletionImpact impact = impact(id);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    store.delete(id);
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return impact(id);
  }

  private DeletionImpact impact(long id) {
    long contracts = count("SELECT count(*) FROM contracts WHERE project_id = :id", id);
    return DeletionImpact.of(
        // Contracts are commercial records; they are never deleted as a side effect.
        contracts > 0
            ? "Bu projenin sözleşmeleri var. Önce sözleşmeleri başka bir projeye taşıyın veya silin."
            : null,
        ref("risk", count("SELECT count(*) FROM risk_projects WHERE project_id = :id", id)),
        ref("eskalasyon", count("SELECT count(*) FROM escalation_projects WHERE project_id = :id", id)),
        ref("karar", count("SELECT count(*) FROM decision_projects WHERE project_id = :id", id)),
        ref(
            "kaynak ataması (silinir)",
            count("SELECT count(*) FROM resource_allocations WHERE project_id = :id", id)),
        ref("sözleşme", contracts),
        ref(
            "kaynak talep (bağlantı kaldırılır)",
            count("SELECT count(*) FROM demands WHERE project_id = :id", id)),
        ref(
            "canlı geçiş (proje bağı kaldırılır)",
            count("SELECT count(*) FROM releases WHERE project_id = :id", id)),
        ref("ek dosya (silinir)", count("SELECT count(*) FROM attachments WHERE project_id = :id", id)));
  }

  Project find(long id) {
    return store.findById(id).orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private long count(String sql, long id) {
    return jdbc.sql(sql).param("id", id).query(Long.class).single();
  }

  private void validate(Project.Input input, Project current) {
    checks.assertUnique(
        "projects",
        "code",
        input.code(),
        current == null ? null : current.id(),
        "\"" + input.code() + "\" kodu başka bir proje tarafından kullanılıyor.",
        "code");
    codes.assertAll(codeChecks(input), current == null ? List.of() : codeChecks(asInput(current)));
    checks.assertRefs(
        Collections.singletonList(input.businessUnitId()),
        "business_units",
        "iş birimi",
        "businessUnitId");
    checks.assertRefs(
        input.roles().stream().map(r -> (Long) r.personId()).toList(), "people", "kişi", "roles");
    checks.assertRefs(
        input.teams().stream().map(t -> (Long) t.teamId()).toList(), "teams", "ekip", "teams");
    checks.assertRefs(
        input.applicationImpacts().stream().map(i -> (Long) i.applicationId()).toList(),
        "applications",
        "uygulama",
        "applicationImpacts");
  }

  static List<Check> codeChecks(Project.Input p) {
    List<Check> checks = new ArrayList<>();
    checks.add(Check.of("projectTypes", p.type(), "type"));
    checks.add(Check.of("projectStatuses", p.status(), "status"));
    checks.add(Check.of("projectHealths", p.health(), "health"));
    checks.add(Check.of("criticalities", p.priority(), "priority"));
    checks.add(Check.of("confidentialityLevels", p.confidentiality(), "confidentiality"));
    checks.add(Check.of("projectPhases", p.currentPhase(), "currentPhase"));
    checks.add(
        new Check(
            "currencies",
            p.financials() == null ? List.of() : List.of(p.financials().currency()),
            "currency"));
    checks.add(
        new Check(
            "applicationImpactTypes",
            p.applicationImpacts().stream().map(Project.ApplicationImpact::impactType).toList(),
            "applicationImpacts"));
    checks.add(
        new Check(
            "milestoneStatuses",
            p.milestones().stream().map(Project.Milestone::status).toList(),
            "milestones"));
    checks.addAll(PortfolioChildren.checks(p.roles(), p.teams(), p.documentation()));
    return checks;
  }

  static Project.Input asInput(Project p) {
    return new Project.Input(
        p.code(),
        p.name(),
        p.shortName(),
        p.description(),
        p.objective(),
        p.scope(),
        p.outOfScope(),
        p.type(),
        p.priority(),
        p.status(),
        p.health(),
        p.confidentiality(),
        p.tags(),
        p.businessUnitId(),
        p.roles(),
        p.teams(),
        p.timeline(),
        p.progressPercentage(),
        p.currentPhase(),
        p.latestStatusSummary(),
        p.nextSteps(),
        p.financials(),
        p.applicationImpacts(),
        p.milestones(),
        p.documentation());
  }

  private static boolean matches(Project p, Query query) {
    List<String> searchable =
        new ArrayList<>(List.of(p.name(), p.code(), p.shortName(), p.description()));
    searchable.addAll(p.tags());
    return Texts.matchesSearch(query.search(), searchable)
        && (empty(query.statuses()) || query.statuses().contains(p.status()))
        && (empty(query.healths()) || query.healths().contains(p.health()))
        && (query.businessUnitId() == null
            || Objects.equals(p.businessUnitId(), query.businessUnitId()))
        && (query.teamId() == null
            || p.teams().stream().anyMatch(t -> t.teamId() == query.teamId()));
  }

  private static boolean empty(List<String> values) {
    return values == null || values.isEmpty();
  }

  static Project.ListItem listItem(Project p, Map<Long, String> people, Map<Long, String> units) {
    return new Project.ListItem(
        p.id(),
        p.code(),
        p.name(),
        p.status(),
        p.health(),
        p.priority(),
        p.currentPhase(),
        p.progressPercentage(),
        Names.ref(units, p.businessUnitId()),
        Names.ref(people, PortfolioChildren.primaryHolder(p.roles(), "project-manager")),
        p.timeline().plannedEndDate());
  }

  private static Function<Project.ListItem, ? extends Comparable<?>> sortKey(String field) {
    return switch (field == null ? "name" : field) {
      case "code" -> Project.ListItem::code;
      case "status" -> item -> Project.STATUSES.indexOf(item.status());
      case "health" -> item -> Project.HEALTHS.indexOf(item.health());
      case "priority" -> item -> PRIORITIES.indexOf(item.priority());
      case "plannedEndDate" -> Project.ListItem::plannedEndDate;
      default -> Project.ListItem::name;
    };
  }
}
