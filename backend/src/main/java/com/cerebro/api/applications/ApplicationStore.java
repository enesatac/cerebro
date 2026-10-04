package com.cerebro.api.applications;

import com.cerebro.api.applications.Application.DataStore;
import com.cerebro.api.applications.Application.Environment;
import com.cerebro.api.applications.Application.Hosting;
import com.cerebro.api.applications.Application.SourceRepository;
import com.cerebro.api.applications.Application.TechnologyUsage;
import com.cerebro.api.portfolio.PortfolioChildren;
import com.cerebro.api.portfolio.PortfolioChildren.Children;
import com.cerebro.api.portfolio.PortfolioChildren.Owner;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Sql.Keyed;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.stereotype.Repository;

/** {@code applications} and its child tables. */
@Repository
public class ApplicationStore {

  private final JdbcClient jdbc;
  private final PortfolioChildren portfolio;

  public ApplicationStore(JdbcClient jdbc, PortfolioChildren portfolio) {
    this.jdbc = jdbc;
    this.portfolio = portfolio;
  }

  public List<Application> findAll() {
    return load("", Map.of());
  }

  public Optional<Application> findById(long id) {
    return load("WHERE p.id = :id", Map.of("id", id)).stream().findFirst();
  }

  public long insert(Application.Input input, Audit audit) {
    long id =
        Sql.insert(
        bind(
                Sql.audit(
                    jdbc.sql(
                        "INSERT INTO applications (code, name, short_description,"
                            + " detailed_description, business_purpose, type, lifecycle,"
                            + " criticality, operational_status, tags, business_unit_id,"
                            + " business_processes, user_groups, estimated_user_count,"
                            + " hosting_model, cloud_provider, hosting_notes, "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES (:code, :name, :shortDescription, :detailedDescription,"
                            + " :businessPurpose, :type, :lifecycle, :criticality,"
                            + " :operationalStatus, :tags, :businessUnitId, :businessProcesses,"
                            + " :userGroups, :estimatedUserCount, :hostingModel, :cloudProvider,"
                            + " :hostingNotes, "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    audit),
                input));
    saveChildren(id, input);
    return id;
  }

  public void update(long id, Application.Input input, Audit audit) {
    bind(
            Sql.audit(
                jdbc.sql(
                    "UPDATE applications SET code = :code, name = :name, short_description ="
                        + " :shortDescription, detailed_description = :detailedDescription,"
                        + " business_purpose = :businessPurpose, type = :type, lifecycle ="
                        + " :lifecycle, criticality = :criticality, operational_status ="
                        + " :operationalStatus, tags = :tags, business_unit_id = :businessUnitId,"
                        + " business_processes = :businessProcesses, user_groups = :userGroups,"
                        + " estimated_user_count = :estimatedUserCount, hosting_model ="
                        + " :hostingModel, cloud_provider = :cloudProvider, hosting_notes ="
                        + " :hostingNotes, "
                        + Sql.AUDIT_UPDATE
                        + " WHERE id = :id"),
                audit),
            input)
        .param("id", id)
        .update();
    saveChildren(id, input);
  }

  public void delete(long id) {
    jdbc.sql("DELETE FROM applications WHERE id = :id").param("id", id).update();
  }

  private StatementSpec bind(StatementSpec statement, Application.Input input) {
    return statement
        .param("code", input.code())
        .param("name", input.name())
        .param("shortDescription", input.shortDescription())
        .param("detailedDescription", orEmpty(input.detailedDescription()))
        .param("businessPurpose", input.businessPurpose())
        .param("type", input.type())
        .param("lifecycle", input.lifecycle())
        .param("criticality", input.criticality())
        .param("operationalStatus", input.operationalStatus())
        .param("tags", Sql.json(input.tags()))
        .param("businessUnitId", input.businessUnitId())
        .param("businessProcesses", Sql.json(input.businessProcesses()))
        .param("userGroups", Sql.json(input.userGroups()))
        .param("estimatedUserCount", input.estimatedUserCount())
        .param("hostingModel", input.hosting().model())
        .param("cloudProvider", input.hosting().cloudProvider())
        .param("hostingNotes", input.hosting().notes());
  }

  private void saveChildren(long id, Application.Input input) {
    portfolio.save(Owner.APPLICATION, id, input.roles(), input.teams(), input.documentation());
    ChildRows.replace(
        jdbc,
        "technology_usages",
        "application_id",
        id,
        input.technologies(),
        TechnologyUsage::id,
        "application_id, technology_id, layer, version",
        ":parent, :technology, :layer, :version",
        (s, row, index) ->
            s.param("technology", row.technologyId())
                .param("layer", row.layer())
                .param("version", row.version()));
    ChildRows.replace(
        jdbc,
        "data_stores",
        "application_id",
        id,
        input.dataStores(),
        DataStore::id,
        "application_id, name, technology_id, purpose, contains_personal_data",
        ":parent, :name, :technology, :purpose, :personal",
        (s, row, index) ->
            s.param("name", row.name())
                .param("technology", row.technologyId())
                .param("purpose", orEmpty(row.purpose()))
                .param("personal", Sql.flag(row.containsPersonalData())));
    ChildRows.replace(
        jdbc,
        "source_repositories",
        "application_id",
        id,
        input.repositories(),
        SourceRepository::id,
        "application_id, name, type, url, default_branch, description",
        ":parent, :name, :type, :url, :branch, :description",
        (s, row, index) ->
            s.param("name", row.name())
                .param("type", row.type())
                .param("url", row.url())
                .param("branch", row.defaultBranch())
                .param("description", row.description()));
    ChildRows.replace(
        jdbc,
        "environments",
        "application_id",
        id,
        input.environments(),
        Environment::id,
        "application_id, type, name, url, status, region, notes",
        ":parent, :type, :name, :url, :status, :region, :notes",
        (s, row, index) ->
            s.param("type", row.type())
                .param("name", row.name())
                .param("url", row.url())
                .param("status", row.status())
                .param("region", row.region())
                .param("notes", row.notes()));
  }

  /** Applications selected by {@code where} (alias {@code p}) with all their child rows. */
  private List<Application> load(String where, Map<String, Object> params) {
    Children shared = portfolio.load(Owner.APPLICATION, where, params);
    String filter = " WHERE application_id IN (SELECT p.id FROM applications p " + where + ")";
    Map<Long, List<TechnologyUsage>> technologies =
        Sql.group(
            jdbc.sql("SELECT * FROM technology_usages" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("application_id"),
                            new TechnologyUsage(
                                rs.getLong("id"),
                                rs.getLong("technology_id"),
                                rs.getString("layer"),
                                rs.getString("version"))))
                .list());
    Map<Long, List<DataStore>> dataStores =
        Sql.group(
            jdbc.sql("SELECT * FROM data_stores" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("application_id"),
                            new DataStore(
                                rs.getLong("id"),
                                rs.getString("name"),
                                rs.getLong("technology_id"),
                                Sql.text(rs, "purpose"),
                                rs.getBoolean("contains_personal_data"))))
                .list());
    Map<Long, List<SourceRepository>> repositories =
        Sql.group(
            jdbc.sql("SELECT * FROM source_repositories" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("application_id"),
                            new SourceRepository(
                                rs.getLong("id"),
                                rs.getString("name"),
                                rs.getString("type"),
                                rs.getString("url"),
                                rs.getString("default_branch"),
                                rs.getString("description"))))
                .list());
    Map<Long, List<Environment>> environments =
        Sql.group(
            jdbc.sql("SELECT * FROM environments" + filter + " ORDER BY id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("application_id"),
                            new Environment(
                                rs.getLong("id"),
                                rs.getString("type"),
                                rs.getString("name"),
                                rs.getString("url"),
                                rs.getString("status"),
                                rs.getString("region"),
                                rs.getString("notes"))))
                .list());
    return jdbc.sql("SELECT * FROM applications p " + where + " ORDER BY p.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Application(
                  id,
                  rs.getString("code"),
                  rs.getString("name"),
                  Sql.text(rs, "short_description"),
                  Sql.text(rs, "detailed_description"),
                  Sql.text(rs, "business_purpose"),
                  rs.getString("type"),
                  rs.getString("lifecycle"),
                  rs.getString("criticality"),
                  rs.getString("operational_status"),
                  Sql.jsonList(rs, "tags"),
                  Sql.longOrNull(rs, "business_unit_id"),
                  Sql.jsonList(rs, "business_processes"),
                  Sql.jsonList(rs, "user_groups"),
                  Sql.longOrNull(rs, "estimated_user_count"),
                  shared.roles().getOrDefault(id, List.of()),
                  shared.teams().getOrDefault(id, List.of()),
                  technologies.getOrDefault(id, List.of()),
                  dataStores.getOrDefault(id, List.of()),
                  new Hosting(
                      rs.getString("hosting_model"),
                      rs.getString("cloud_provider"),
                      rs.getString("hosting_notes")),
                  repositories.getOrDefault(id, List.of()),
                  environments.getOrDefault(id, List.of()),
                  shared.documentation().getOrDefault(id, List.of()),
                  Sql.audit(rs));
            })
        .list();
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }
}
