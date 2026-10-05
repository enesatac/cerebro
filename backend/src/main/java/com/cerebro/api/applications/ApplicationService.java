package com.cerebro.api.applications;

import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.organisation.Names;
import com.cerebro.api.portfolio.PortfolioChildren;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.PagedResult;
import com.cerebro.api.shared.Sorting;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.error.NotFoundException;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Stream;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Applications: readable by every signed-in user (other screens resolve them); changes need {@code
 * applications:edit}, deletion {@code applications:delete}.
 */
@Service
@Transactional
public class ApplicationService {

  static final String ENTITY = "Uygulama";

  /** Criticality scale in business order (sorting). */
  public static final List<String> CRITICALITIES = List.of("low", "medium", "high", "critical");

  private final ApplicationStore store;
  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;
  private final Names names;

  public ApplicationService(
      ApplicationStore store,
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

  @Transactional(readOnly = true)
  public PagedResult<Application.ListItem> list(ApplicationQuery query) {
    access.current();
    Map<Long, String> people = names.people();
    Map<Long, String> teams = names.teams();
    Map<Long, String> units = names.businessUnits();
    boolean ascending = !"desc".equals(query.direction());
    Comparator<Application.ListItem> order =
        Sorting.by(sortKey(query.sort()), ascending)
            .thenComparing(Collation.by(Application.ListItem::name));
    List<Application.ListItem> rows =
        store.findAll().stream()
            .filter(application -> matches(application, query))
            .map(application -> listItem(application, people, teams, units))
            .sorted(order)
            .toList();
    return PagedResult.of(rows, query.page(), query.pageSize());
  }

  @Transactional(readOnly = true)
  public Application get(long id) {
    access.current();
    return find(id);
  }

  @Transactional(readOnly = true)
  public List<Application.Ref> refs() {
    access.current();
    return jdbc.sql("SELECT id, name, code FROM applications ORDER BY id")
        .query(
            (rs, row) ->
                new Application.Ref(rs.getLong("id"), rs.getString("name"), rs.getString("code")))
        .list();
  }

  public Application create(Application.Input input) {
    SessionUser user = access.require("applications:edit");
    validate(input, null);
    return find(store.insert(input, stamp.created(user)));
  }

  public Application update(long id, Application.Input input) {
    SessionUser user = access.require("applications:edit");
    Application current = find(id);
    validate(input, current);
    store.update(id, input, stamp.touched(current.audit(), user));
    return find(id);
  }

  /**
   * Dependencies, integrations, project impacts, the runbook, links from risks, escalations,
   * decisions, demands and contracts, and files go with the application (foreign keys).
   */
  public void remove(long id) {
    access.require("applications:delete");
    find(id);
    store.delete(id);
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return DeletionImpact.of(
        ref("proje", count("SELECT count(DISTINCT project_id) FROM application_impacts WHERE application_id = :id", id)),
        ref(
            "bağımlılık",
            count("SELECT count(*) FROM dependencies WHERE :id IN (source_application_id, target_application_id)", id)),
        ref(
            "entegrasyon",
            count("SELECT count(*) FROM integrations WHERE from_application_id = :id OR to_application_id = :id", id)),
        ref("risk", count("SELECT count(*) FROM risk_applications WHERE application_id = :id", id)),
        ref("eskalasyon", count("SELECT count(*) FROM escalation_applications WHERE application_id = :id", id)),
        ref("karar", count("SELECT count(*) FROM decision_applications WHERE application_id = :id", id)),
        ref(
            "müdahale rehberi (silinir)",
            count("SELECT count(*) FROM application_runbooks WHERE application_id = :id", id)),
        ref(
            "talep (bağlantı kaldırılır)",
            count("SELECT count(*) FROM demand_applications WHERE application_id = :id", id)),
        ref(
            "sözleşme (bağlantı kaldırılır)",
            count("SELECT count(*) FROM contract_applications WHERE application_id = :id", id)),
        ref(
            "canlı geçiş (silinir)",
            count("SELECT count(*) FROM releases WHERE application_id = :id", id)),
        ref("ek dosya (silinir)", count("SELECT count(*) FROM attachments WHERE application_id = :id", id)));
  }

  Application find(long id) {
    return store.findById(id).orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private long count(String sql, long id) {
    return jdbc.sql(sql).param("id", id).query(Long.class).single();
  }

  /** Unique code, valid master data codes, and every referenced id must exist. */
  private void validate(Application.Input input, Application current) {
    checks.assertUnique(
        "applications",
        "code",
        input.code(),
        current == null ? null : current.id(),
        "\"" + input.code() + "\" kodu başka bir uygulama tarafından kullanılıyor.",
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
        Stream.concat(
                input.technologies().stream().map(t -> (Long) t.technologyId()),
                input.dataStores().stream().map(d -> (Long) d.technologyId()))
            .toList(),
        "technologies",
        "teknoloji",
        "technologies");
  }

  static List<Check> codeChecks(Application.Input a) {
    List<Check> checks = new ArrayList<>();
    checks.add(Check.of("applicationTypes", a.type(), "type"));
    checks.add(Check.of("applicationLifecycles", a.lifecycle(), "lifecycle"));
    checks.add(Check.of("criticalities", a.criticality(), "criticality"));
    checks.add(Check.of("operationalStatuses", a.operationalStatus(), "operationalStatus"));
    checks.add(Check.of("hostingModels", a.hosting().model(), "hostingModel"));
    checks.add(
        new Check(
            "environmentTypes",
            a.environments().stream().map(Application.Environment::type).toList(),
            "environments"));
    checks.add(
        new Check(
            "environmentStatuses",
            a.environments().stream().map(Application.Environment::status).toList(),
            "environments"));
    checks.add(
        new Check(
            "sourceRepositoryTypes",
            a.repositories().stream().map(Application.SourceRepository::type).toList(),
            "repositories"));
    checks.add(
        new Check(
            "technologyCategories",
            a.technologies().stream().map(Application.TechnologyUsage::layer).toList(),
            "technologies"));
    checks.addAll(PortfolioChildren.checks(a.roles(), a.teams(), a.documentation()));
    return checks;
  }

  static Application.Input asInput(Application a) {
    return new Application.Input(
        a.code(),
        a.name(),
        a.shortDescription(),
        a.detailedDescription(),
        a.businessPurpose(),
        a.type(),
        a.lifecycle(),
        a.criticality(),
        a.operationalStatus(),
        a.tags(),
        a.businessUnitId(),
        a.businessProcesses(),
        a.userGroups(),
        a.estimatedUserCount(),
        a.roles(),
        a.teams(),
        a.technologies(),
        a.dataStores(),
        a.hosting(),
        a.repositories(),
        a.environments(),
        a.documentation());
  }

  static boolean matches(Application a, ApplicationQuery query) {
    List<String> searchable = new ArrayList<>(List.of(a.name(), a.code(), a.shortDescription()));
    searchable.addAll(a.tags());
    if (!Texts.matchesSearch(query.search(), searchable)) {
      return false;
    }
    if (notEmpty(query.lifecycles()) && !query.lifecycles().contains(a.lifecycle())) {
      return false;
    }
    if (notEmpty(query.criticalities()) && !query.criticalities().contains(a.criticality())) {
      return false;
    }
    if (query.businessUnitId() != null
        && !Objects.equals(a.businessUnitId(), query.businessUnitId())) {
      return false;
    }
    if (query.teamId() != null && a.teams().stream().noneMatch(t -> t.teamId() == query.teamId())) {
      return false;
    }
    return query.technologyId() == null
        || a.technologies().stream().anyMatch(t -> t.technologyId() == query.technologyId());
  }

  private static boolean notEmpty(List<String> values) {
    return values != null && !values.isEmpty();
  }

  static Application.ListItem listItem(
      Application a, Map<Long, String> people, Map<Long, String> teams, Map<Long, String> units) {
    return new Application.ListItem(
        a.id(),
        a.code(),
        a.name(),
        a.shortDescription(),
        a.lifecycle(),
        a.criticality(),
        a.operationalStatus(),
        Names.ref(units, a.businessUnitId()),
        Names.ref(people, PortfolioChildren.primaryHolder(a.roles(), "technical-owner")),
        a.teams().stream()
            .filter(t -> teams.containsKey(t.teamId()))
            .map(t -> new Application.TeamRef(t.teamId(), teams.get(t.teamId()), t.responsibility()))
            .toList(),
        a.audit().updatedAt());
  }

  /** Enumerations sort by business order (planned → retired, low → critical), not alphabetically. */
  private static Function<Application.ListItem, ? extends Comparable<?>> sortKey(String field) {
    return switch (field == null ? "name" : field) {
      case "code" -> Application.ListItem::code;
      case "lifecycle" -> item -> Application.LIFECYCLES.indexOf(item.lifecycle());
      case "criticality" -> item -> CRITICALITIES.indexOf(item.criticality());
      case "businessUnit" -> item -> item.businessUnit() == null ? null : item.businessUnit().name();
      case "technicalOwner" ->
          item -> item.technicalOwner() == null ? null : item.technicalOwner().name();
      case "updatedAt" -> Application.ListItem::updatedAt;
      default -> Application.ListItem::name;
    };
  }
}
