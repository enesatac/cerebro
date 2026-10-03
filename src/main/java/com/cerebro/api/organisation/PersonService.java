package com.cerebro.api.organisation;

import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.organisation.PersonWorkload.AllocationItem;
import com.cerebro.api.organisation.PersonWorkload.GovernanceItem;
import com.cerebro.api.organisation.PersonWorkload.LeaveItem;
import com.cerebro.api.organisation.PersonWorkload.Load;
import com.cerebro.api.organisation.PersonWorkload.TeamLink;
import com.cerebro.api.organisation.PersonWorkload.ViaTeam;
import com.cerebro.api.organisation.PersonWorkload.WorkItem;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.EntityRef;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** People: readable by every signed-in user; changes need {@code people:edit}/{@code :delete}. */
@Service
@Transactional
public class PersonService {

  private static final String ENTITY = "Kişi";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final Names names;

  public PersonService(JdbcClient jdbc, Access access, Checks checks, Names names) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.names = names;
  }

  @Transactional(readOnly = true)
  public List<Person> list() {
    access.current();
    return jdbc.sql("SELECT * FROM people ORDER BY id").query(this::row).list();
  }

  @Transactional(readOnly = true)
  public Person get(long id) {
    access.current();
    return find(id);
  }

  public Person create(Person.Input input) {
    access.require("people:edit");
    validate(input, null);
    long id =
        jdbc.sql(
                "INSERT INTO people (full_name, job_title, email, business_unit_id, location)"
                    + " VALUES (:fullName, :jobTitle, :email, :unit, :location) RETURNING id")
            .param("fullName", input.fullName())
            .param("jobTitle", input.jobTitle())
            .param("email", input.email())
            .param("unit", input.businessUnitId())
            .param("location", input.location())
            .query(Long.class)
            .single();
    return find(id);
  }

  public Person update(long id, Person.Input input) {
    access.require("people:edit");
    find(id);
    validate(input, id);
    jdbc.sql(
            "UPDATE people SET full_name = :fullName, job_title = :jobTitle, email = :email,"
                + " business_unit_id = :unit, location = :location WHERE id = :id")
        .param("fullName", input.fullName())
        .param("jobTitle", input.jobTitle())
        .param("email", input.email())
        .param("unit", input.businessUnitId())
        .param("location", input.location())
        .param("id", id)
        .update();
    return find(id);
  }

  public void remove(long id) {
    access.require("people:delete");
    find(id);
    DeletionImpact impact = impact(id);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM people WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return impact(id);
  }

  /** People are referenced from history and ownership; deleting a referenced person is refused. */
  private DeletionImpact impact(long id) {
    String audited =
        List.of(
                "applications",
                "projects",
                "risks",
                "escalations",
                "decisions",
                "dependencies",
                "integrations",
                "teams",
                "demands",
                "contracts",
                "vendors")
            .stream()
            .map(
                table ->
                    "(SELECT count(*) FROM "
                        + table
                        + " WHERE :id IN (created_by_person_id, updated_by_person_id,"
                        + " last_reviewed_by_person_id))")
            .collect(Collectors.joining(" + "));
    DeletionImpact references =
        DeletionImpact.of(
            ref(
                "uygulama/proje rolü",
                count(
                    "SELECT count(DISTINCT coalesce('a' || application_id, 'p' || project_id))"
                        + " FROM role_assignments WHERE person_id = :id",
                    id)),
            ref(
                "ekip üyeliği",
                count(
                    "SELECT count(*) FROM teams t WHERE t.manager_person_id = :id OR EXISTS"
                        + " (SELECT 1 FROM team_members m WHERE m.team_id = t.id AND m.person_id"
                        + " = :id)",
                    id)),
            ref(
                "iş birimi yöneticiliği",
                count("SELECT count(*) FROM business_units WHERE head_person_id = :id", id)),
            ref(
                "risk/eskalasyon/karar",
                count(
                    "SELECT (SELECT count(*) FROM risks WHERE owner_person_id = :id)"
                        + " + (SELECT count(*) FROM escalations WHERE owner_person_id = :id OR"
                        + " raised_by_person_id = :id)"
                        + " + (SELECT count(DISTINCT decision_id) FROM decision_makers WHERE"
                        + " person_id = :id)",
                    id)),
            ref("kullanıcı hesabı", count("SELECT count(*) FROM user_accounts WHERE person_id = :id", id)),
            ref("izin kaydı", count("SELECT count(*) FROM leave_records WHERE person_id = :id", id)),
            ref(
                "kaynak ataması",
                count("SELECT count(*) FROM resource_allocations WHERE person_id = :id", id)),
            ref(
                "sözleşme sorumluluğu",
                count("SELECT count(*) FROM contracts WHERE owner_person_id = :id", id)),
            ref(
                "talep (talep eden, sponsor veya değerlendiren)",
                count(
                    "SELECT count(*) FROM demands WHERE :id IN (requester_person_id,"
                        + " sponsor_person_id, assessor_person_id)",
                    id)),
            ref(
                "müdahale rehberi kişisi",
                count("SELECT count(*) FROM runbook_contacts WHERE person_id = :id", id)),
            ref("kayıt geçmişi", count("SELECT " + audited, id)));
    return new DeletionImpact(
        references.references(),
        references.references().isEmpty()
            ? null
            : "Bu kişi başka kayıtlarda geçiyor. Önce bu kayıtlardan kaldırın; kayıt geçmişinde yer"
                + " alan kişiler silinemez.");
  }

  private long count(String sql, long id) {
    return jdbc.sql(sql).param("id", id).query(Long.class).single();
  }

  private void validate(Person.Input input, Long excludeId) {
    checks.assertUnique(
        "people",
        "email",
        input.email(),
        excludeId,
        input.email() + " adresiyle kayıtlı bir kişi zaten var.",
        "email");
    checks.assertRefs(
        Collections.singletonList(input.businessUnitId()),
        "business_units",
        "iş birimi",
        "businessUnitId");
  }

  // ---------------------------------------------------------------------------------------------
  // Workload: the joins behind the person page
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public PersonWorkload workload(long personId, LocalDate today) {
    access.current();
    Person person = find(personId);
    Map<Long, String> teamNames = names.teams();
    Map<Long, String> applicationNames = names.applications();
    Map<Long, String> projectNames = names.projects();

    List<TeamLink> teams =
        jdbc.sql(
                "SELECT t.id, t.name, t.manager_person_id = :id AS manager, EXISTS (SELECT 1"
                    + " FROM team_members m WHERE m.team_id = t.id AND m.person_id = :id) AS"
                    + " member FROM teams t ORDER BY t.id")
            .param("id", personId)
            .query(
                (rs, row) ->
                    new TeamLink(
                        new EntityRef(rs.getLong("id"), rs.getString("name")),
                        rs.getBoolean("manager"),
                        rs.getBoolean("member")))
            .list()
            .stream()
            .filter(link -> link.manager() || link.member())
            .sorted(Collation.by(link -> link.team().name()))
            .toList();
    Set<Long> teamIds = teams.stream().map(link -> link.team().id()).collect(Collectors.toSet());

    List<EntityRef> headOf =
        jdbc.sql("SELECT id, name FROM business_units WHERE head_person_id = :id ORDER BY id")
            .param("id", personId)
            .query((rs, row) -> new EntityRef(rs.getLong("id"), rs.getString("name")))
            .list()
            .stream()
            .sorted(Collation.by(EntityRef::name))
            .toList();

    List<WorkItem> applications =
        workItems(
            "SELECT id, code, name, lifecycle AS status, criticality FROM applications ORDER BY id",
            "application_id",
            personId,
            teamIds,
            teamNames);
    List<WorkItem> projects =
        workItems(
            "SELECT id, code, name, status, priority AS criticality FROM projects ORDER BY id",
            "project_id",
            personId,
            teamIds,
            teamNames);

    Related risksRelated = related("risk", applicationNames, projectNames);
    List<GovernanceItem> risks =
        jdbc.sql(
                "SELECT id, title, status, severity, due_date FROM risks WHERE owner_person_id ="
                    + " :id ORDER BY id")
            .param("id", personId)
            .query(
                (rs, row) -> {
                  long id = rs.getLong("id");
                  String status = rs.getString("status");
                  return new GovernanceItem(
                      id,
                      rs.getString("title"),
                      status,
                      status.equals("open") || status.equals("monitoring"),
                      rs.getString("severity"),
                      Sql.date(rs, "due_date"),
                      List.of("owner"),
                      risksRelated.applications(id),
                      risksRelated.projects(id));
                })
            .list();

    Related escalationsRelated = related("escalation", applicationNames, projectNames);
    List<GovernanceItem> escalations =
        jdbc.sql(
                "SELECT id, title, status, severity, target_resolution_date, owner_person_id,"
                    + " raised_by_person_id FROM escalations WHERE owner_person_id = :id OR"
                    + " raised_by_person_id = :id ORDER BY id")
            .param("id", personId)
            .query(
                (rs, row) -> {
                  long id = rs.getLong("id");
                  String status = rs.getString("status");
                  List<String> involvement = new ArrayList<>();
                  if (Objects.equals(Sql.longOrNull(rs, "owner_person_id"), personId)) {
                    involvement.add("owner");
                  }
                  if (rs.getLong("raised_by_person_id") == personId) {
                    involvement.add("raised");
                  }
                  return new GovernanceItem(
                      id,
                      rs.getString("title"),
                      status,
                      status.equals("open") || status.equals("in-progress"),
                      rs.getString("severity"),
                      Sql.date(rs, "target_resolution_date"),
                      involvement,
                      escalationsRelated.applications(id),
                      escalationsRelated.projects(id));
                })
            .list();

    Related decisionsRelated = related("decision", applicationNames, projectNames);
    List<GovernanceItem> decisions =
        jdbc.sql(
                "SELECT d.id, d.title, d.status, d.decision_date FROM decisions d WHERE EXISTS"
                    + " (SELECT 1 FROM decision_makers m WHERE m.decision_id = d.id AND"
                    + " m.person_id = :id) ORDER BY d.id")
            .param("id", personId)
            .query(
                (rs, row) -> {
                  long id = rs.getLong("id");
                  return new GovernanceItem(
                      id,
                      rs.getString("title"),
                      rs.getString("status"),
                      false,
                      null,
                      Sql.date(rs, "decision_date"),
                      List.of("decider"),
                      decisionsRelated.applications(id),
                      decisionsRelated.projects(id));
                })
            .list();

    List<AllocationItem> allocations =
        jdbc.sql(
                "SELECT id, project_id, role, start_date, end_date, percent FROM"
                    + " resource_allocations WHERE person_id = :id AND end_date >= :today"
                    + " ORDER BY start_date, id")
            .param("id", personId)
            .param("today", today)
            .query(
                (rs, row) ->
                    new AllocationItem(
                        rs.getLong("id"),
                        Names.ref(projectNames, rs.getLong("project_id")),
                        rs.getString("role"),
                        Sql.date(rs, "start_date"),
                        Sql.date(rs, "end_date"),
                        rs.getInt("percent")))
            .list()
            .stream()
            .filter(item -> item.project() != null)
            .toList();

    Load loadToday =
        jdbc.sql(
                "SELECT count(*)::int AS count, coalesce(sum(percent), 0)::int AS percent FROM"
                    + " resource_allocations WHERE person_id = :id AND start_date <= :today AND"
                    + " :today <= end_date")
            .param("id", personId)
            .param("today", today)
            .query((rs, row) -> new Load(rs.getInt("count"), rs.getInt("percent")))
            .single();

    List<LeaveItem> leaves =
        jdbc.sql(
                "SELECT id, type, start_date, end_date FROM leave_records WHERE person_id = :id"
                    + " AND end_date >= :today ORDER BY start_date, id")
            .param("id", personId)
            .param("today", today)
            .query(
                (rs, row) ->
                    new LeaveItem(
                        rs.getLong("id"),
                        rs.getString("type"),
                        Sql.date(rs, "start_date"),
                        Sql.date(rs, "end_date")))
            .list();

    Comparator<GovernanceItem> newestFirst =
        (a, b) ->
            Objects.requireNonNullElse(b.date(), "")
                .compareTo(Objects.requireNonNullElse(a.date(), ""));
    return new PersonWorkload(
        person,
        Names.ref(names.businessUnits(), person.businessUnitId()),
        teams,
        headOf,
        applications,
        projects,
        risks.stream().sorted(newestFirst).toList(),
        escalations.stream().sorted(newestFirst).toList(),
        decisions.stream().sorted(newestFirst).toList(),
        allocations,
        loadToday,
        leaves);
  }

  /** Records the person holds a role on, or that one of their teams is assigned to. */
  private List<WorkItem> workItems(
      String recordsSql,
      String ownerColumn,
      long personId,
      Set<Long> teamIds,
      Map<Long, String> teamNames) {
    Map<Long, List<String>> roles = new HashMap<>();
    jdbc.sql(
            "SELECT "
                + ownerColumn
                + " AS owner, role FROM role_assignments WHERE person_id = :id AND "
                + ownerColumn
                + " IS NOT NULL ORDER BY sort_order, id")
        .param("id", personId)
        .query(
            rs -> {
              roles.computeIfAbsent(rs.getLong("owner"), k -> new ArrayList<>()).add(rs.getString("role"));
            });
    Map<Long, List<ViaTeam>> viaTeams = new HashMap<>();
    if (!teamIds.isEmpty()) {
      jdbc.sql(
              "SELECT "
                  + ownerColumn
                  + " AS owner, team_id, responsibility FROM team_assignments WHERE team_id ="
                  + " ANY(:teams) AND "
                  + ownerColumn
                  + " IS NOT NULL ORDER BY id")
          .param("teams", Sql.longs(teamIds))
          .query(
              rs -> {
                EntityRef team = Names.ref(teamNames, rs.getLong("team_id"));
                if (team != null) {
                  viaTeams
                      .computeIfAbsent(rs.getLong("owner"), k -> new ArrayList<>())
                      .add(new ViaTeam(team, rs.getString("responsibility")));
                }
              });
    }
    return jdbc.sql(recordsSql)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new WorkItem(
                  id,
                  rs.getString("code"),
                  rs.getString("name"),
                  rs.getString("status"),
                  rs.getString("criticality"),
                  roles.getOrDefault(id, List.of()),
                  viaTeams.getOrDefault(id, List.of()));
            })
        .list()
        .stream()
        .filter(item -> !item.roles().isEmpty() || !item.viaTeams().isEmpty())
        // Direct roles first, then team work; alphabetical within each.
        .sorted(
            Comparator.<WorkItem, Boolean>comparing(item -> item.roles().isEmpty())
                .thenComparing(Collation.by(WorkItem::name)))
        .toList();
  }

  private record Related(Map<Long, List<EntityRef>> apps, Map<Long, List<EntityRef>> projs) {

    List<EntityRef> applications(long id) {
      return apps.getOrDefault(id, List.of());
    }

    List<EntityRef> projects(long id) {
      return projs.getOrDefault(id, List.of());
    }
  }

  /** Related applications and projects of risks, escalations or decisions ({@code kind}). */
  private Related related(
      String kind, Map<Long, String> applicationNames, Map<Long, String> projectNames) {
    Map<Long, List<EntityRef>> apps = new HashMap<>();
    jdbc.sql("SELECT " + kind + "_id AS owner, application_id FROM " + kind + "_applications ORDER BY id")
        .query(
            rs -> {
              EntityRef ref = Names.ref(applicationNames, rs.getLong("application_id"));
              if (ref != null) {
                apps.computeIfAbsent(rs.getLong("owner"), k -> new ArrayList<>()).add(ref);
              }
            });
    Map<Long, List<EntityRef>> projs = new HashMap<>();
    jdbc.sql("SELECT " + kind + "_id AS owner, project_id FROM " + kind + "_projects ORDER BY id")
        .query(
            rs -> {
              EntityRef ref = Names.ref(projectNames, rs.getLong("project_id"));
              if (ref != null) {
                projs.computeIfAbsent(rs.getLong("owner"), k -> new ArrayList<>()).add(ref);
              }
            });
    return new Related(apps, projs);
  }

  Person find(long id) {
    return jdbc.sql("SELECT * FROM people WHERE id = :id")
        .param("id", id)
        .query(this::row)
        .optional()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private Person row(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new Person(
        rs.getLong("id"),
        rs.getString("full_name"),
        rs.getString("job_title"),
        rs.getString("email"),
        Sql.longOrNull(rs, "business_unit_id"),
        rs.getString("location"));
  }
}
