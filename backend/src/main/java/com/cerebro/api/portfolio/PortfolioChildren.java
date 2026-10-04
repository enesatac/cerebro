package com.cerebro.api.portfolio;

import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Sql.Keyed;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * Ownership shared by applications and projects: role assignments, team assignments and
 * documentation links. Each row has exactly one parent ({@code application_id} or {@code
 * project_id}).
 */
@Component
public class PortfolioChildren {

  /** Which parent column the rows hang off. */
  public enum Owner {
    APPLICATION("application_id", "applications"),
    PROJECT("project_id", "projects");

    final String column;
    final String table;

    Owner(String column, String table) {
      this.column = column;
      this.table = table;
    }
  }

  public record Children(
      Map<Long, List<RoleAssignment>> roles,
      Map<Long, List<TeamAssignment>> teams,
      Map<Long, List<DocumentationLink>> documentation) {}

  private final JdbcClient jdbc;

  public PortfolioChildren(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  /** Children of the parents selected by {@code parentWhere} (on the parent table, alias p). */
  public Children load(Owner owner, String parentWhere, Map<String, Object> params) {
    String filter =
        " WHERE "
            + owner.column
            + " IN (SELECT p.id FROM "
            + owner.table
            + " p "
            + parentWhere
            + ")";
    List<Keyed<RoleAssignment>> roles =
        jdbc.sql(
                "SELECT * FROM role_assignments" + filter + " ORDER BY sort_order, id")
            .params(params)
            .query(
                (rs, row) ->
                    new Keyed<>(
                        rs.getLong(owner.column),
                        new RoleAssignment(
                            rs.getLong("id"), rs.getLong("person_id"), rs.getString("role"))))
            .list();
    List<Keyed<TeamAssignment>> teams =
        jdbc.sql("SELECT * FROM team_assignments" + filter + " ORDER BY id")
            .params(params)
            .query(
                (rs, row) ->
                    new Keyed<>(
                        rs.getLong(owner.column),
                        new TeamAssignment(
                            rs.getLong("id"),
                            rs.getLong("team_id"),
                            rs.getString("responsibility"))))
            .list();
    List<Keyed<DocumentationLink>> documentation =
        jdbc.sql("SELECT * FROM documentation_links" + filter + " ORDER BY id")
            .params(params)
            .query(
                (rs, row) ->
                    new Keyed<>(
                        rs.getLong(owner.column),
                        new DocumentationLink(
                            rs.getLong("id"),
                            rs.getString("type"),
                            rs.getString("title"),
                            rs.getString("url"),
                            rs.getString("description"))))
            .list();
    return new Children(Sql.group(roles), Sql.group(teams), Sql.group(documentation));
  }

  public void save(
      Owner owner,
      long parentId,
      List<RoleAssignment> roles,
      List<TeamAssignment> teams,
      List<DocumentationLink> documentation) {
    List<RoleAssignment> ordered = roles == null ? List.of() : roles;
    ChildRows.replace(
        jdbc,
        "role_assignments",
        owner.column,
        parentId,
        ordered,
        RoleAssignment::id,
        owner.column + ", person_id, role, sort_order",
        ":parent, :person, :role, :order",
        (statement, row, index) ->
            statement
                .param("person", row.personId())
                .param("role", row.role())
                .param("order", index));
    ChildRows.replace(
        jdbc,
        "team_assignments",
        owner.column,
        parentId,
        teams == null ? List.of() : teams,
        TeamAssignment::id,
        owner.column + ", team_id, responsibility",
        ":parent, :team, :responsibility",
        (statement, row, index) ->
            statement.param("team", row.teamId()).param("responsibility", row.responsibility()));
    ChildRows.replace(
        jdbc,
        "documentation_links",
        owner.column,
        parentId,
        documentation == null ? List.of() : documentation,
        DocumentationLink::id,
        owner.column + ", type, title, url, description",
        ":parent, :type, :title, :url, :description",
        (statement, row, index) ->
            statement
                .param("type", row.type())
                .param("title", row.title())
                .param("url", row.url())
                .param("description", row.description()));
  }

  /** Master data codes on the shared children, for write validation. */
  public static List<Check> checks(
      List<RoleAssignment> roles, List<TeamAssignment> teams, List<DocumentationLink> docs) {
    return List.of(
        new Check("stakeholderRoles", roles.stream().map(RoleAssignment::role).toList(), "roles"),
        new Check(
            "teamResponsibilities",
            teams.stream().map(TeamAssignment::responsibility).toList(),
            "teams"),
        new Check(
            "documentationLinkTypes",
            docs.stream().map(DocumentationLink::type).toList(),
            "documentation"));
  }

  /** The first (primary) holder of {@code role}, or {@code null}. */
  public static Long primaryHolder(List<RoleAssignment> roles, String role) {
    return roles.stream()
        .filter(assignment -> assignment.role().equals(role))
        .map(RoleAssignment::personId)
        .findFirst()
        .orElse(null);
  }
}
