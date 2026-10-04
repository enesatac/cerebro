package com.cerebro.api.connections;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dependencies and integrations: readable by every signed-in user (impact analysis); changes need
 * {@code connections:edit}, deletion {@code connections:delete}.
 */
@Service
@Transactional
public class ConnectionService {

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public ConnectionService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  // ---------------------------------------------------------------------------------------------
  // Dependencies
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Dependency> dependencies() {
    access.current();
    return loadDependencies("", Map.of());
  }

  @Transactional(readOnly = true)
  public Dependency.OfApplication dependenciesOf(long applicationId) {
    access.current();
    return new Dependency.OfApplication(
        loadDependencies("WHERE source_application_id = :id", Map.of("id", applicationId)),
        loadDependencies("WHERE target_application_id = :id", Map.of("id", applicationId)));
  }

  @Transactional(readOnly = true)
  public Dependency dependency(long id) {
    access.current();
    return findDependency(id);
  }

  public Dependency createDependency(Dependency.Input input) {
    SessionUser user = access.require("connections:edit");
    validate(input, null);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO dependencies (source_application_id, target_application_id,"
                        + " type, criticality, description, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:source, :target, :type, :criticality, :description, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .params(columns(input)));
    return findDependency(id);
  }

  public Dependency updateDependency(long id, Dependency.Input input) {
    SessionUser user = access.require("connections:edit");
    Dependency current = findDependency(id);
    validate(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE dependencies SET source_application_id = :source, target_application_id ="
                    + " :target, type = :type, criticality = :criticality, description ="
                    + " :description, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(columns(input))
        .param("id", id)
        .update();
    return findDependency(id);
  }

  public void removeDependency(long id) {
    access.require("connections:delete");
    findDependency(id);
    jdbc.sql("DELETE FROM dependencies WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact dependencyDeletionImpact(long id) {
    access.current();
    findDependency(id);
    return DeletionImpact.NONE;
  }

  private void validate(Dependency.Input input, Dependency current) {
    codes.assertAll(
        dependencyChecks(input.type(), input.criticality()),
        current == null ? List.of() : dependencyChecks(current.type(), current.criticality()));
    checks.assertRefs(
        List.of(input.sourceApplicationId(), input.targetApplicationId()),
        "applications",
        "uygulama",
        "targetApplicationId");
    if (input.sourceApplicationId() == input.targetApplicationId()) {
      throw new ValidationException(
          "Bir uygulama kendisine bağımlı olamaz.", "targetApplicationId");
    }
    boolean duplicate =
        jdbc.sql(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM dependencies WHERE source_application_id = :source"
                    + " AND target_application_id = :target AND type = :type AND id <> :id) THEN 1 ELSE 0 END FROM dual")
            .param("source", input.sourceApplicationId())
            .param("target", input.targetApplicationId())
            .param("type", input.type())
            .param("id", current == null ? -1L : current.id())
            .query(Boolean.class)
            .single();
    if (duplicate) {
      throw new ValidationException("Bu bağımlılık zaten kayıtlı.", "targetApplicationId");
    }
  }

  private static List<Check> dependencyChecks(String type, String criticality) {
    return List.of(
        Check.of("dependencyTypes", type, "type"),
        Check.of("criticalities", criticality, "criticality"));
  }

  private static Map<String, Object> columns(Dependency.Input input) {
    return Map.of(
        "source", input.sourceApplicationId(),
        "target", input.targetApplicationId(),
        "type", input.type(),
        "criticality", input.criticality(),
        "description", input.description() == null ? "" : input.description());
  }

  private Dependency findDependency(long id) {
    return loadDependencies("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Bağımlılık", id));
  }

  private List<Dependency> loadDependencies(String where, Map<String, Object> params) {
    return jdbc.sql("SELECT * FROM dependencies " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) ->
                new Dependency(
                    rs.getLong("id"),
                    rs.getLong("source_application_id"),
                    rs.getLong("target_application_id"),
                    rs.getString("type"),
                    rs.getString("criticality"),
                    Sql.text(rs, "description"),
                    Sql.audit(rs)))
        .list();
  }

  // ---------------------------------------------------------------------------------------------
  // Integrations
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Integration> integrations() {
    access.current();
    return loadIntegrations("", Map.of());
  }

  @Transactional(readOnly = true)
  public Integration.OfApplication integrationsOf(long applicationId) {
    access.current();
    return new Integration.OfApplication(
        loadIntegrations("WHERE from_application_id = :id", Map.of("id", applicationId)),
        loadIntegrations("WHERE to_application_id = :id", Map.of("id", applicationId)));
  }

  @Transactional(readOnly = true)
  public Integration integration(long id) {
    access.current();
    return findIntegration(id);
  }

  public Integration createIntegration(Integration.Input input) {
    SessionUser user = access.require("connections:edit");
    validate(input, null);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO integrations (name, type, from_application_id,"
                        + " to_application_id, external_party_name, frequency, data_exchanged,"
                        + " description, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:name, :type, :from, :to, :external, :frequency, :data,"
                        + " :description, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .params(columns(input)));
    return findIntegration(id);
  }

  public Integration updateIntegration(long id, Integration.Input input) {
    SessionUser user = access.require("connections:edit");
    Integration current = findIntegration(id);
    validate(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE integrations SET name = :name, type = :type, from_application_id = :from,"
                    + " to_application_id = :to, external_party_name = :external, frequency ="
                    + " :frequency, data_exchanged = :data, description = :description, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(columns(input))
        .param("id", id)
        .update();
    return findIntegration(id);
  }

  public void removeIntegration(long id) {
    access.require("connections:delete");
    findIntegration(id);
    jdbc.sql("DELETE FROM integrations WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact integrationDeletionImpact(long id) {
    access.current();
    findIntegration(id);
    return DeletionImpact.NONE;
  }

  private void validate(Integration.Input input, Integration current) {
    codes.assertAll(
        integrationChecks(input.type(), input.frequency()),
        current == null ? List.of() : integrationChecks(current.type(), current.frequency()));
    checks.assertRefs(
        Arrays.asList(input.fromApplicationId(), input.toApplicationId()),
        "applications",
        "uygulama",
        "toApplicationId");
    if ((input.toApplicationId() == null) == (input.externalPartyName() == null)) {
      throw new ValidationException(
          "Hedef uygulama veya harici taraftan birini seçin.", "toApplicationId");
    }
  }

  private static List<Check> integrationChecks(String type, String frequency) {
    return List.of(
        Check.of("integrationTypes", type, "type"),
        Check.of("integrationFrequencies", frequency, "frequency"));
  }

  private static Map<String, Object> columns(Integration.Input input) {
    Map<String, Object> columns = new java.util.HashMap<>();
    columns.put("name", input.name());
    columns.put("type", input.type());
    columns.put("from", input.fromApplicationId());
    columns.put("to", input.toApplicationId());
    columns.put("external", input.externalPartyName());
    columns.put("frequency", input.frequency());
    columns.put("data", input.dataExchanged() == null ? "" : input.dataExchanged());
    columns.put("description", input.description() == null ? "" : input.description());
    return columns;
  }

  private Integration findIntegration(long id) {
    return loadIntegrations("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Entegrasyon", id));
  }

  private List<Integration> loadIntegrations(String where, Map<String, Object> params) {
    return jdbc.sql("SELECT * FROM integrations " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) ->
                new Integration(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("type"),
                    rs.getLong("from_application_id"),
                    Sql.longOrNull(rs, "to_application_id"),
                    rs.getString("external_party_name"),
                    rs.getString("frequency"),
                    Sql.text(rs, "description"),
                    Sql.text(rs, "data_exchanged"),
                    Sql.audit(rs)))
        .list();
  }
}
