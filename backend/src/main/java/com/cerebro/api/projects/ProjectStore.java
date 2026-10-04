package com.cerebro.api.projects;

import com.cerebro.api.portfolio.PortfolioChildren;
import com.cerebro.api.portfolio.PortfolioChildren.Children;
import com.cerebro.api.portfolio.PortfolioChildren.Owner;
import com.cerebro.api.projects.Project.ApplicationImpact;
import com.cerebro.api.projects.Project.Financials;
import com.cerebro.api.projects.Project.Milestone;
import com.cerebro.api.projects.Project.Timeline;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Sql.Keyed;
import com.cerebro.api.shared.Times;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.stereotype.Repository;

/** {@code projects} and its child tables. */
@Repository
public class ProjectStore {

  private static final String COLUMNS =
      "code, name, short_name, description, objective, scope, out_of_scope, type, priority,"
          + " status, health, confidentiality, tags, business_unit_id, planned_start_date,"
          + " actual_start_date, planned_end_date, actual_end_date, progress_percentage,"
          + " current_phase, latest_status_summary, next_steps, currency, budget, actual_cost,"
          + " forecast_cost";
  private static final String VALUES =
      ":code, :name, :shortName, :description, :objective, :scope, :outOfScope, :type,"
          + " :priority, :status, :health, :confidentiality, :tags, :businessUnitId,"
          + " :plannedStart, :actualStart, :plannedEnd, :actualEnd, :progress, :phase, :summary,"
          + " :nextSteps, :currency, :budget, :actualCost, :forecastCost";

  private final JdbcClient jdbc;
  private final PortfolioChildren portfolio;

  public ProjectStore(JdbcClient jdbc, PortfolioChildren portfolio) {
    this.jdbc = jdbc;
    this.portfolio = portfolio;
  }

  public List<Project> findAll() {
    return load("", Map.of());
  }

  public Optional<Project> findById(long id) {
    return load("WHERE p.id = :id", Map.of("id", id)).stream().findFirst();
  }

  public long insert(Project.Input input, Audit audit) {
    long id =
        Sql.insert(
        bind(
                Sql.audit(
                    jdbc.sql(
                        "INSERT INTO projects ("
                            + COLUMNS
                            + ", "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES ("
                            + VALUES
                            + ", "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    audit),
                input));
    saveChildren(id, input);
    return id;
  }

  public void update(long id, Project.Input input, Audit audit) {
    String[] columns = COLUMNS.split(",\\s*");
    String[] values = VALUES.split(",\\s*");
    StringBuilder set = new StringBuilder();
    for (int i = 0; i < columns.length; i++) {
      set.append(columns[i]).append(" = ").append(values[i]).append(", ");
    }
    bind(
            Sql.audit(
                jdbc.sql("UPDATE projects SET " + set + Sql.AUDIT_UPDATE + " WHERE id = :id"),
                audit),
            input)
        .param("id", id)
        .update();
    saveChildren(id, input);
  }

  public void delete(long id) {
    jdbc.sql("DELETE FROM projects WHERE id = :id").param("id", id).update();
  }

  private StatementSpec bind(StatementSpec statement, Project.Input input) {
    Financials financials = input.financials();
    Timeline timeline = input.timeline();
    return statement
        .param("code", input.code())
        .param("name", input.name())
        .param("shortName", input.shortName())
        .param("description", input.description())
        .param("objective", orEmpty(input.objective()))
        .param("scope", orEmpty(input.scope()))
        .param("outOfScope", orEmpty(input.outOfScope()))
        .param("type", input.type())
        .param("priority", input.priority())
        .param("status", input.status())
        .param("health", input.health())
        .param("confidentiality", input.confidentiality())
        .param("tags", Sql.json(input.tags()))
        .param("businessUnitId", input.businessUnitId())
        .param("plannedStart", Times.parseDate(timeline.plannedStartDate()))
        .param("actualStart", Times.parseDate(timeline.actualStartDate()))
        .param("plannedEnd", Times.parseDate(timeline.plannedEndDate()))
        .param("actualEnd", Times.parseDate(timeline.actualEndDate()))
        .param("progress", input.progressPercentage())
        .param("phase", input.currentPhase())
        .param("summary", orEmpty(input.latestStatusSummary()))
        .param("nextSteps", orEmpty(input.nextSteps()))
        .param("currency", financials == null ? null : financials.currency())
        .param("budget", financials == null ? null : financials.budget())
        .param("actualCost", financials == null ? null : financials.actualCost())
        .param("forecastCost", financials == null ? null : financials.forecastCost());
  }

  private void saveChildren(long id, Project.Input input) {
    portfolio.save(Owner.PROJECT, id, input.roles(), input.teams(), input.documentation());
    ChildRows.replace(
        jdbc,
        "application_impacts",
        "project_id",
        id,
        input.applicationImpacts(),
        ApplicationImpact::id,
        "project_id, application_id, impact_type, description",
        ":parent, :application, :type, :description",
        (s, row, index) ->
            s.param("application", row.applicationId())
                .param("type", row.impactType())
                .param("description", orEmpty(row.description())));
    ChildRows.replace(
        jdbc,
        "milestones",
        "project_id",
        id,
        input.milestones(),
        Milestone::id,
        "project_id, title, due_date, completed_date, status",
        ":parent, :title, :due, :completed, :status",
        (s, row, index) ->
            s.param("title", row.title())
                .param("due", Times.parseDate(row.dueDate()))
                .param("completed", Times.parseDate(row.completedDate()))
                .param("status", row.status()));
  }

  private List<Project> load(String where, Map<String, Object> params) {
    Children shared = portfolio.load(Owner.PROJECT, where, params);
    String filter = " WHERE project_id IN (SELECT p.id FROM projects p " + where + ")";
    Map<Long, List<ApplicationImpact>> impacts =
        Sql.group(
            jdbc.sql("SELECT * FROM application_impacts" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("project_id"),
                            new ApplicationImpact(
                                rs.getLong("id"),
                                rs.getLong("application_id"),
                                rs.getString("impact_type"),
                                Sql.text(rs, "description"))))
                .list());
    Map<Long, List<Milestone>> milestones =
        Sql.group(
            jdbc.sql("SELECT * FROM milestones" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("project_id"),
                            new Milestone(
                                rs.getLong("id"),
                                rs.getString("title"),
                                Sql.date(rs, "due_date"),
                                Sql.date(rs, "completed_date"),
                                rs.getString("status"))))
                .list());
    return jdbc.sql("SELECT * FROM projects p " + where + " ORDER BY p.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              String currency = rs.getString("currency");
              return new Project(
                  id,
                  rs.getString("code"),
                  rs.getString("name"),
                  Sql.text(rs, "short_name"),
                  Sql.text(rs, "description"),
                  Sql.text(rs, "objective"),
                  Sql.text(rs, "scope"),
                  Sql.text(rs, "out_of_scope"),
                  rs.getString("type"),
                  rs.getString("priority"),
                  rs.getString("status"),
                  rs.getString("health"),
                  rs.getString("confidentiality"),
                  Sql.jsonList(rs, "tags"),
                  Sql.longOrNull(rs, "business_unit_id"),
                  shared.roles().getOrDefault(id, List.of()),
                  shared.teams().getOrDefault(id, List.of()),
                  new Timeline(
                      Sql.date(rs, "planned_start_date"),
                      Sql.date(rs, "actual_start_date"),
                      Sql.date(rs, "planned_end_date"),
                      Sql.date(rs, "actual_end_date")),
                  rs.getInt("progress_percentage"),
                  rs.getString("current_phase"),
                  Sql.text(rs, "latest_status_summary"),
                  Sql.text(rs, "next_steps"),
                  currency == null
                      ? null
                      : new Financials(
                          currency,
                          Sql.decimal(rs, "budget"),
                          Sql.decimal(rs, "actual_cost"),
                          Sql.decimal(rs, "forecast_cost")),
                  impacts.getOrDefault(id, List.of()),
                  milestones.getOrDefault(id, List.of()),
                  shared.documentation().getOrDefault(id, List.of()),
                  Sql.audit(rs));
            })
        .list();
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }
}
