package com.cerebro.api.operations;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.operations.RelatedLinks.Kind;
import com.cerebro.api.operations.RelatedLinks.Links;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.jdbc.core.simple.JdbcClient.StatementSpec;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Operational knowledge: risks, escalations and decisions. Readable by every signed-in user;
 * changes need {@code risks:edit}, deletion {@code risks:delete}. Each is linked to at least one
 * application or project.
 */
@Service
@Transactional
public class OperationsService {

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;
  private final RelatedLinks links;

  public OperationsService(
      JdbcClient jdbc,
      Access access,
      Checks checks,
      MasterCodes codes,
      AuditStamp stamp,
      RelatedLinks links) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
    this.links = links;
  }

  // ---------------------------------------------------------------------------------------------
  // Risks
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Risk> risks(Long applicationId, Long projectId) {
    access.current();
    return loadRisks(RelatedLinks.filter(Kind.RISK, applicationId, projectId), filter(applicationId, projectId));
  }

  @Transactional(readOnly = true)
  public Risk risk(long id) {
    access.current();
    return findRisk(id);
  }

  public Risk createRisk(Risk.Input input) {
    SessionUser user = access.require("risks:edit");
    validateRisk(input, null);
    long id =
        Sql.insert(
        bindRisk(
                Sql.audit(
                    jdbc.sql(
                        "INSERT INTO risks (title, description, category, probability, impact,"
                            + " severity, status, owner_person_id, mitigation_plan, due_date, "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES (:title, :description, :category, :probability, :impact,"
                            + " :severity, :status, :owner, :mitigation, :due, "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    stamp.created(user)),
                input));
    links.save(Kind.RISK, id, input);
    return findRisk(id);
  }

  public Risk updateRisk(long id, Risk.Input input) {
    SessionUser user = access.require("risks:edit");
    Risk current = findRisk(id);
    validateRisk(input, current);
    bindRisk(
            Sql.audit(
                jdbc.sql(
                    "UPDATE risks SET title = :title, description = :description, category ="
                        + " :category, probability = :probability, impact = :impact, severity ="
                        + " :severity, status = :status, owner_person_id = :owner,"
                        + " mitigation_plan = :mitigation, due_date = :due, "
                        + Sql.AUDIT_UPDATE
                        + " WHERE id = :id"),
                stamp.touched(current.audit(), user)),
            input)
        .param("id", id)
        .update();
    links.save(Kind.RISK, id, input);
    return findRisk(id);
  }

  public void removeRisk(long id) {
    access.require("risks:delete");
    findRisk(id);
    jdbc.sql("DELETE FROM risks WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact riskDeletionImpact(long id) {
    access.current();
    findRisk(id);
    return attachmentsOnly("risk_id", id);
  }

  private void validateRisk(Risk.Input input, Risk current) {
    codes.assertAll(
        riskChecks(input.category(), input.status(), input.probability(), input.impact(), input.severity()),
        current == null
            ? List.of()
            : riskChecks(
                current.category(),
                current.status(),
                current.probability(),
                current.impact(),
                current.severity()));
    checks.assertRefs(Collections.singletonList(input.ownerId()), "people", "kişi", "ownerId");
    links.validate(input);
  }

  private static List<Check> riskChecks(
      String category, String status, String probability, String impact, String severity) {
    return List.of(
        Check.of("riskCategories", category, "category"),
        Check.of("riskStatuses", status, "status"),
        new Check("criticalities", Arrays.asList(probability, impact, severity), "severity"));
  }

  private StatementSpec bindRisk(StatementSpec statement, Risk.Input input) {
    return statement
        .param("title", input.title())
        .param("description", orEmpty(input.description()))
        .param("category", input.category())
        .param("probability", input.probability())
        .param("impact", input.impact())
        .param("severity", input.severity())
        .param("status", input.status())
        .param("owner", input.ownerId())
        .param("mitigation", orEmpty(input.mitigationPlan()))
        .param("due", Times.parseDate(input.dueDate()));
  }

  private Risk findRisk(long id) {
    return loadRisks("WHERE o.id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Risk", id));
  }

  public List<Risk> allRisks() {
    return loadRisks("", Map.of());
  }

  private List<Risk> loadRisks(String where, Map<String, Object> params) {
    Links related = links.load(Kind.RISK);
    return jdbc.sql("SELECT * FROM risks o " + where + " ORDER BY o.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Risk(
                  id,
                  rs.getString("title"),
                  Sql.text(rs, "description"),
                  rs.getString("category"),
                  rs.getString("probability"),
                  rs.getString("impact"),
                  rs.getString("severity"),
                  rs.getString("status"),
                  Sql.longOrNull(rs, "owner_person_id"),
                  Sql.text(rs, "mitigation_plan"),
                  Sql.date(rs, "due_date"),
                  related.projectsOf(id),
                  related.applicationsOf(id),
                  Sql.audit(rs));
            })
        .list();
  }

  // ---------------------------------------------------------------------------------------------
  // Escalations
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Escalation> escalations(Long applicationId, Long projectId) {
    access.current();
    return loadEscalations(
        RelatedLinks.filter(Kind.ESCALATION, applicationId, projectId),
        filter(applicationId, projectId));
  }

  @Transactional(readOnly = true)
  public Escalation escalation(long id) {
    access.current();
    return findEscalation(id);
  }

  public Escalation createEscalation(Escalation.Input input) {
    SessionUser user = access.require("risks:edit");
    validateEscalation(input, null);
    long id =
        Sql.insert(
        bindEscalation(
                Sql.audit(
                    jdbc.sql(
                        "INSERT INTO escalations (title, description, severity, status,"
                            + " owner_person_id, responsible_team_id, raised_by_person_id,"
                            + " raised_at, target_resolution_date, resolution, resolved_on, "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES (:title, :description, :severity, :status, :owner, :team,"
                            + " :raisedBy, :raisedAt, :target, :resolution, :resolvedOn, "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    stamp.created(user)),
                input));
    links.save(Kind.ESCALATION, id, input);
    return findEscalation(id);
  }

  public Escalation updateEscalation(long id, Escalation.Input input) {
    SessionUser user = access.require("risks:edit");
    Escalation current = findEscalation(id);
    validateEscalation(input, current);
    bindEscalation(
            Sql.audit(
                jdbc.sql(
                    "UPDATE escalations SET title = :title, description = :description, severity"
                        + " = :severity, status = :status, owner_person_id = :owner,"
                        + " responsible_team_id = :team, raised_by_person_id = :raisedBy,"
                        + " raised_at = :raisedAt, target_resolution_date = :target, resolution"
                        + " = :resolution, resolved_on = :resolvedOn, "
                        + Sql.AUDIT_UPDATE
                        + " WHERE id = :id"),
                stamp.touched(current.audit(), user)),
            input)
        .param("id", id)
        .update();
    links.save(Kind.ESCALATION, id, input);
    return findEscalation(id);
  }

  public void removeEscalation(long id) {
    access.require("risks:delete");
    findEscalation(id);
    jdbc.sql("DELETE FROM escalations WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact escalationDeletionImpact(long id) {
    access.current();
    findEscalation(id);
    return attachmentsOnly("escalation_id", id);
  }

  private void validateEscalation(Escalation.Input input, Escalation current) {
    codes.assertAll(
        escalationChecks(input.status(), input.severity()),
        current == null ? List.of() : escalationChecks(current.status(), current.severity()));
    checks.assertRefs(Arrays.asList(input.ownerId(), input.raisedById()), "people", "kişi", "ownerId");
    checks.assertRefs(
        Collections.singletonList(input.responsibleTeamId()), "teams", "ekip", "responsibleTeamId");
    links.validate(input);
  }

  private static List<Check> escalationChecks(String status, String severity) {
    return List.of(
        Check.of("escalationStatuses", status, "status"),
        Check.of("criticalities", severity, "severity"));
  }

  private StatementSpec bindEscalation(StatementSpec statement, Escalation.Input input) {
    return statement
        .param("title", input.title())
        .param("description", orEmpty(input.description()))
        .param("severity", input.severity())
        .param("status", input.status())
        .param("owner", input.ownerId())
        .param("team", input.responsibleTeamId())
        .param("raisedBy", input.raisedById())
        .param("raisedAt", Times.parseTimestamp(input.raisedAt()))
        .param("target", Times.parseDate(input.targetResolutionDate()))
        .param("resolution", input.resolution())
        .param("resolvedOn", Times.parseDate(input.resolvedOn()));
  }

  private Escalation findEscalation(long id) {
    return loadEscalations("WHERE o.id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Eskalasyon", id));
  }

  public List<Escalation> allEscalations() {
    return loadEscalations("", Map.of());
  }

  private List<Escalation> loadEscalations(String where, Map<String, Object> params) {
    Links related = links.load(Kind.ESCALATION);
    return jdbc.sql("SELECT * FROM escalations o " + where + " ORDER BY o.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Escalation(
                  id,
                  rs.getString("title"),
                  Sql.text(rs, "description"),
                  rs.getString("severity"),
                  rs.getString("status"),
                  Sql.longOrNull(rs, "owner_person_id"),
                  Sql.longOrNull(rs, "responsible_team_id"),
                  rs.getLong("raised_by_person_id"),
                  Sql.timestamp(rs, "raised_at"),
                  Sql.date(rs, "target_resolution_date"),
                  rs.getString("resolution"),
                  Sql.date(rs, "resolved_on"),
                  related.projectsOf(id),
                  related.applicationsOf(id),
                  Sql.audit(rs));
            })
        .list();
  }

  // ---------------------------------------------------------------------------------------------
  // Decisions
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Decision> decisions(Long applicationId, Long projectId) {
    access.current();
    return loadDecisions(
        RelatedLinks.filter(Kind.DECISION, applicationId, projectId),
        filter(applicationId, projectId));
  }

  @Transactional(readOnly = true)
  public Decision decision(long id) {
    access.current();
    return findDecision(id);
  }

  public Decision createDecision(Decision.Input input) {
    SessionUser user = access.require("risks:edit");
    validateDecision(input, null);
    long id =
        Sql.insert(
        bindDecision(
                Sql.audit(
                    jdbc.sql(
                        "INSERT INTO decisions (title, context, decision, rationale,"
                            + " alternatives, consequences, decision_date, status, "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES (:title, :context, :decision, :rationale, :alternatives,"
                            + " :consequences, :date, :status, "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    stamp.created(user)),
                input));
    saveDeciders(id, input.decidedByIds());
    links.save(Kind.DECISION, id, input);
    return findDecision(id);
  }

  public Decision updateDecision(long id, Decision.Input input) {
    SessionUser user = access.require("risks:edit");
    Decision current = findDecision(id);
    validateDecision(input, current);
    bindDecision(
            Sql.audit(
                jdbc.sql(
                    "UPDATE decisions SET title = :title, context = :context, decision ="
                        + " :decision, rationale = :rationale, alternatives = :alternatives,"
                        + " consequences = :consequences, decision_date = :date, status ="
                        + " :status, "
                        + Sql.AUDIT_UPDATE
                        + " WHERE id = :id"),
                stamp.touched(current.audit(), user)),
            input)
        .param("id", id)
        .update();
    saveDeciders(id, input.decidedByIds());
    links.save(Kind.DECISION, id, input);
    return findDecision(id);
  }

  public void removeDecision(long id) {
    access.require("risks:delete");
    findDecision(id);
    jdbc.sql("DELETE FROM decisions WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact decisionDeletionImpact(long id) {
    access.current();
    findDecision(id);
    return attachmentsOnly("decision_id", id);
  }

  private void validateDecision(Decision.Input input, Decision current) {
    codes.assertAll(
        List.of(Check.of("decisionStatuses", input.status(), "status")),
        current == null
            ? List.of()
            : List.of(Check.of("decisionStatuses", current.status(), "status")));
    checks.assertRefs(input.decidedByIds(), "people", "kişi", "decidedByIds");
    links.validate(input);
  }

  private StatementSpec bindDecision(StatementSpec statement, Decision.Input input) {
    return statement
        .param("title", input.title())
        .param("context", input.context())
        .param("decision", input.decision())
        .param("rationale", orEmpty(input.rationale()))
        .param("alternatives", Sql.json(input.alternatives()))
        .param("consequences", orEmpty(input.consequences()))
        .param("date", Times.parseDate(input.decisionDate()))
        .param("status", input.status());
  }

  private void saveDeciders(long decisionId, List<Long> people) {
    jdbc.sql("DELETE FROM decision_makers WHERE decision_id = :id").param("id", decisionId).update();
    for (Long personId : new LinkedHashSet<>(people)) {
      jdbc.sql("INSERT INTO decision_makers (decision_id, person_id) VALUES (:decision, :person)")
          .param("decision", decisionId)
          .param("person", personId)
          .update();
    }
  }

  private Decision findDecision(long id) {
    return loadDecisions("WHERE o.id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Karar", id));
  }

  public List<Decision> allDecisions() {
    return loadDecisions("", Map.of());
  }

  private List<Decision> loadDecisions(String where, Map<String, Object> params) {
    Links related = links.load(Kind.DECISION);
    Map<Long, List<Long>> deciders = new HashMap<>();
    jdbc.sql("SELECT decision_id, person_id FROM decision_makers ORDER BY id")
        .query(
            rs -> {
              deciders.computeIfAbsent(rs.getLong("decision_id"), k -> new ArrayList<>()).add(rs.getLong("person_id"));
            });
    return jdbc.sql("SELECT * FROM decisions o " + where + " ORDER BY o.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Decision(
                  id,
                  rs.getString("title"),
                  Sql.text(rs, "context"),
                  Sql.text(rs, "decision"),
                  Sql.text(rs, "rationale"),
                  Sql.jsonList(rs, "alternatives"),
                  Sql.text(rs, "consequences"),
                  Sql.date(rs, "decision_date"),
                  deciders.getOrDefault(id, List.of()),
                  rs.getString("status"),
                  related.projectsOf(id),
                  related.applicationsOf(id),
                  Sql.audit(rs));
            })
        .list();
  }

  // ---------------------------------------------------------------------------------------------

  private DeletionImpact attachmentsOnly(String ownerColumn, long id) {
    long files =
        jdbc.sql("SELECT count(*) FROM attachments WHERE " + ownerColumn + " = :id")
            .param("id", id)
            .query(Long.class)
            .single();
    return DeletionImpact.of(DeletionImpact.ref("ek dosya (silinir)", files));
  }

  private static Map<String, Object> filter(Long applicationId, Long projectId) {
    Map<String, Object> params = new HashMap<>();
    if (applicationId != null) {
      params.put("applicationId", applicationId);
    }
    if (projectId != null) {
      params.put("projectId", projectId);
    }
    return params;
  }

  private static String orEmpty(String value) {
    return value == null ? "" : value;
  }
}
