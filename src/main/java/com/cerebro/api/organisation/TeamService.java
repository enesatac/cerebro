package com.cerebro.api.organisation;

import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Teams: readable by every signed-in user; changes need {@code teams:edit}/{@code :delete}. */
@Service
@Transactional
public class TeamService {

  private static final String ENTITY = "Ekip";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final AuditStamp stamp;
  private final Names names;

  public TeamService(
      JdbcClient jdbc, Access access, Checks checks, AuditStamp stamp, Names names) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.stamp = stamp;
    this.names = names;
  }

  @Transactional(readOnly = true)
  public List<Team> list() {
    access.current();
    return load("", Map.of());
  }

  @Transactional(readOnly = true)
  public Team get(long id) {
    access.current();
    return find(id);
  }

  /** Teams with manager and ownership counts, by name. */
  @Transactional(readOnly = true)
  public List<Team.ListItem> summaries() {
    access.current();
    Map<Long, String> people = names.people();
    Map<Long, Integer> applications = assignmentCounts("application_id");
    Map<Long, Integer> projects = assignmentCounts("project_id");
    return load("", Map.of()).stream()
        .map(
            team ->
                new Team.ListItem(
                    team.id(),
                    team.name(),
                    team.description(),
                    Names.ref(people, team.managerId()),
                    team.memberIds().size(),
                    applications.getOrDefault(team.id(), 0),
                    projects.getOrDefault(team.id(), 0),
                    team.contactEmail(),
                    team.chatChannel()))
        .sorted(Collation.by(Team.ListItem::name))
        .toList();
  }

  public Team create(Team.Input input) {
    SessionUser user = access.require("teams:edit");
    validate(input, null);
    Audit audit = stamp.created(user);
    long id =
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO teams (name, description, manager_person_id, contact_email,"
                        + " chat_channel, responsibilities, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:name, :description, :manager, :email, :channel,"
                        + " :responsibilities, "
                        + Sql.AUDIT_VALUES
                        + ") RETURNING id"),
                audit)
            .params(columns(input))
            .query(Long.class)
            .single();
    saveMembers(id, input.memberIds());
    return find(id);
  }

  public Team update(long id, Team.Input input) {
    SessionUser user = access.require("teams:edit");
    Team current = find(id);
    validate(input, id);
    Sql.audit(
            jdbc.sql(
                "UPDATE teams SET name = :name, description = :description, manager_person_id ="
                    + " :manager, contact_email = :email, chat_channel = :channel,"
                    + " responsibilities = :responsibilities, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(columns(input))
        .param("id", id)
        .update();
    jdbc.sql("DELETE FROM team_members WHERE team_id = :id").param("id", id).update();
    saveMembers(id, input.memberIds());
    return find(id);
  }

  /**
   * Assignments to applications and projects, runbook contacts and files go with the team;
   * escalations it was responsible for keep no team (foreign keys).
   */
  public void remove(long id) {
    access.require("teams:delete");
    find(id);
    jdbc.sql("DELETE FROM teams WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return DeletionImpact.of(
        ref("uygulama", count("SELECT count(DISTINCT application_id) FROM team_assignments WHERE team_id = :id", id)),
        ref("proje", count("SELECT count(DISTINCT project_id) FROM team_assignments WHERE team_id = :id", id)),
        ref("eskalasyon", count("SELECT count(*) FROM escalations WHERE responsible_team_id = :id", id)),
        ref("ek dosya (silinir)", count("SELECT count(*) FROM attachments WHERE team_id = :id", id)),
        ref(
            "müdahale rehberi kişisi (kaldırılır)",
            count("SELECT count(*) FROM runbook_contacts WHERE team_id = :id", id)));
  }

  private long count(String sql, long id) {
    return jdbc.sql(sql).param("id", id).query(Long.class).single();
  }

  private Map<Long, Integer> assignmentCounts(String ownerColumn) {
    Map<Long, Integer> counts = new HashMap<>();
    jdbc.sql(
            "SELECT team_id, count(DISTINCT "
                + ownerColumn
                + ")::int AS n FROM team_assignments WHERE "
                + ownerColumn
                + " IS NOT NULL GROUP BY team_id")
        .query(
            rs -> {
              counts.put(rs.getLong("team_id"), rs.getInt("n"));
            });
    return counts;
  }

  private void validate(Team.Input input, Long excludeId) {
    checks.assertUnique(
        "teams",
        "name",
        input.name(),
        excludeId,
        "\"" + input.name() + "\" adında bir ekip zaten var.",
        "name");
    List<Long> people = new ArrayList<>();
    people.add(input.managerId());
    people.addAll(input.memberIds() == null ? List.of() : input.memberIds());
    checks.assertRefs(people, "people", "kişi", "memberIds");
  }

  private static Map<String, Object> columns(Team.Input input) {
    Map<String, Object> columns = new HashMap<>();
    columns.put("name", input.name());
    columns.put("description", input.description() == null ? "" : input.description());
    columns.put("manager", input.managerId());
    columns.put("email", input.contactEmail());
    columns.put("channel", input.chatChannel());
    columns.put(
        "responsibilities",
        Sql.texts(input.responsibilities() == null ? List.of() : input.responsibilities()));
    return columns;
  }

  private void saveMembers(long teamId, List<Long> memberIds) {
    for (Long personId : new LinkedHashSet<>(memberIds == null ? List.<Long>of() : memberIds)) {
      jdbc.sql("INSERT INTO team_members (team_id, person_id) VALUES (:team, :person)")
          .param("team", teamId)
          .param("person", personId)
          .update();
    }
  }

  Team find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private List<Team> load(String where, Map<String, Object> params) {
    Map<Long, List<Long>> members = new HashMap<>();
    jdbc.sql("SELECT team_id, person_id FROM team_members ORDER BY id")
        .query(
            rs -> {
              members.computeIfAbsent(rs.getLong("team_id"), k -> new ArrayList<>()).add(rs.getLong("person_id"));
            });
    return jdbc.sql("SELECT * FROM teams " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) ->
                new Team(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("description"),
                    Sql.longOrNull(rs, "manager_person_id"),
                    members.getOrDefault(rs.getLong("id"), List.of()),
                    rs.getString("contact_email"),
                    rs.getString("chat_channel"),
                    Sql.textArray(rs, "responsibilities"),
                    Sql.audit(rs)))
        .list();
  }
}
