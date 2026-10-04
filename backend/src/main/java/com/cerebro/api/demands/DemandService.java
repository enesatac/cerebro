package com.cerebro.api.demands;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.ForbiddenException;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Demands are visible to every signed-in user. Anyone with {@code demands:edit} may raise one and
 * change or withdraw their own until it is decided; {@code demandManagement:edit} (the portfolio
 * office) assesses, schedules, edits and withdraws any demand; {@code demandManagement:delete}
 * deletes.
 */
@Service
@Transactional
public class DemandService {

  private static final String ENTITY = "Talep";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public DemandService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  /** Every demand, newest submission first. */
  @Transactional(readOnly = true)
  public List<Demand> list() {
    access.current();
    return load("", Map.of()).stream()
        .sorted((a, b) -> b.submittedAt().compareTo(a.submittedAt()))
        .toList();
  }

  @Transactional(readOnly = true)
  public Demand get(long id) {
    access.current();
    return find(id);
  }

  /** Submits a new demand (status {@code submitted}). */
  public Demand create(Demand.Input input) {
    SessionUser user = access.require("demands:edit");
    validateRequest(input, null);
    Demand.Input clean = clean(input);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO demands (title, type, business_unit_id, requester_person_id,"
                        + " sponsor_person_id, problem, proposed_solution, expected_benefits,"
                        + " urgency, desired_date, deadline_reason, regulatory, affected_users,"
                        + " estimated_budget, currency, status, submitted_at, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:title, :type, :unit, :requester, :sponsor, :problem,"
                        + " :solution, :benefits, :urgency, :desired, :deadlineReason,"
                        + " :regulatory, :affectedUsers, :budget, :currency, 'submitted',"
                        + " :submittedAt, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .params(requestColumns(clean))
            .param("submittedAt", Times.parseTimestamp(audit.createdAt())));
    saveLinks(id, clean);
    event(id, user, "submitted", "");
    return find(id);
  }

  /** Changes the request. A requester answering "needs info" sends it back to {@code submitted}. */
  public Demand update(long id, Demand.Input input) {
    SessionUser user = access.require("demands:edit");
    Demand current = find(id);
    if (!DemandAccess.canEdit(user, current)) {
      throw new ForbiddenException(
          "Bu talebi değiştiremezsiniz. Talep sahibi, talebini yalnızca karar verilmeden önce veya"
              + " bilgi istendiğinde güncelleyebilir.");
    }
    validateRequest(input, current);
    Demand.Input clean = clean(input);
    boolean answered =
        current.status().equals("needs-info") && !user.has("demandManagement:edit");
    Sql.audit(
            jdbc.sql(
                "UPDATE demands SET title = :title, type = :type, business_unit_id = :unit,"
                    + " requester_person_id = :requester, sponsor_person_id = :sponsor, problem ="
                    + " :problem, proposed_solution = :solution, expected_benefits = :benefits,"
                    + " urgency = :urgency, desired_date = :desired, deadline_reason ="
                    + " :deadlineReason, regulatory = :regulatory, affected_users ="
                    + " :affectedUsers, estimated_budget = :budget, currency = :currency, status"
                    + " = :status, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(requestColumns(clean))
        .param("status", answered ? "submitted" : current.status())
        .param("id", id)
        .update();
    saveLinks(id, clean);
    if (answered) {
      event(id, user, "submitted", "Talep sahibi istenen bilgiyi ekledi.");
    }
    return find(id);
  }

  /** Records the assessment; a status change is added to the history with the decision note. */
  public Demand assess(long id, Demand.AssessmentInput input) {
    SessionUser user = access.require("demandManagement:edit");
    Demand current = find(id);
    validateAssessment(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE demands SET status = :status, business_value = :value, strategic_fit ="
                    + " :fit, time_criticality = :time, risk_reduction = :risk, effort = :effort,"
                    + " priority = :priority, assessor_person_id = :assessor, planned_start ="
                    + " :start, planned_end = :end, decision_note = :note, project_id = :project, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .param("status", input.status())
        .param("value", input.businessValue())
        .param("fit", input.strategicFit())
        .param("time", input.timeCriticality())
        .param("risk", input.riskReduction())
        .param("effort", input.effort())
        .param("priority", input.priority())
        .param("assessor", input.assessorId())
        .param("start", Times.parseDate(input.plannedStart()))
        .param("end", Times.parseDate(input.plannedEnd()))
        .param("note", input.decisionNote().trim())
        .param("project", input.projectId())
        .param("id", id)
        .update();
    if (!input.status().equals(current.status())) {
      event(id, user, input.status(), input.decisionNote());
    }
    return find(id);
  }

  /** The requester (or the portfolio office) takes the demand back. */
  public Demand withdraw(long id, String note) {
    SessionUser user = access.require("demands:edit");
    Demand current = find(id);
    if (!DemandAccess.canWithdraw(user, current)) {
      throw new ForbiddenException("Bu talebi geri çekemezsiniz.");
    }
    String text = note == null ? "" : note;
    if (Texts.looksLikeSecret(text)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, "note");
    }
    Sql.audit(
            jdbc.sql(
                "UPDATE demands SET status = 'withdrawn', " + Sql.AUDIT_UPDATE + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .param("id", id)
        .update();
    event(id, user, "withdrawn", text);
    return find(id);
  }

  public void remove(long id) {
    access.require("demandManagement:delete");
    find(id);
    jdbc.sql("DELETE FROM demands WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    long files =
        jdbc.sql("SELECT count(*) FROM attachments WHERE demand_id = :id")
            .param("id", id)
            .query(Long.class)
            .single();
    return DeletionImpact.of(DeletionImpact.ref("ek dosya (silinir)", files));
  }

  // ---------------------------------------------------------------------------------------------

  private void validateRequest(Demand.Input input, Demand previous) {
    if (input.title().isBlank()) {
      throw new ValidationException("Başlık zorunludur.", "title");
    }
    if (input.problem().isBlank()) {
      throw new ValidationException("Mevcut durumu ve ihtiyacı yazın.", "problem");
    }
    if (input.expectedBenefits().isBlank()) {
      throw new ValidationException("Beklenen faydayı yazın.", "expectedBenefits");
    }
    Map<String, String> texts = new LinkedHashMap<>();
    texts.put("title", input.title());
    texts.put("problem", input.problem());
    texts.put("proposedSolution", input.proposedSolution());
    texts.put("expectedBenefits", input.expectedBenefits());
    texts.put("deadlineReason", input.deadlineReason());
    Map<String, Integer> limits =
        Map.of(
            "title", 200,
            "problem", 4000,
            "proposedSolution", 4000,
            "expectedBenefits", 4000,
            "deadlineReason", 500);
    texts.forEach(
        (field, value) -> {
          int max = limits.get(field);
          if (value.length() > max) {
            throw new ValidationException("En fazla " + max + " karakter girilebilir.", field);
          }
          if (Texts.looksLikeSecret(value)) {
            throw new ValidationException(Texts.NO_SECRETS_MESSAGE, field);
          }
        });
    checks.assertRefs(
        List.of(input.businessUnitId()), "business_units", "iş birimi", "businessUnitId");
    checks.assertRefs(List.of(input.requesterId()), "people", "kişi", "requesterId");
    checks.assertRefs(Collections.singletonList(input.sponsorId()), "people", "kişi", "sponsorId");
    checks.assertRefs(
        input.relatedApplicationIds(), "applications", "uygulama", "relatedApplicationIds");
    codes.assertAll(
        requestChecks(
            input.type(),
            input.urgency(),
            input.benefitTypes(),
            input.currency(),
            input.estimatedBudget()),
        previous == null
            ? List.of()
            : requestChecks(
                previous.type(),
                previous.urgency(),
                previous.benefitTypes(),
                previous.currency(),
                previous.estimatedBudget()));
    if (input.desiredDate() != null && !Times.isIsoDate(input.desiredDate())) {
      throw new ValidationException("Geçerli bir tarih girin.", "desiredDate");
    }
    if (input.affectedUsers() != null && input.affectedUsers() < 0) {
      throw new ValidationException("Sıfır veya pozitif bir sayı girin.", "affectedUsers");
    }
    if (input.estimatedBudget() != null && input.estimatedBudget().signum() < 0) {
      throw new ValidationException("Sıfır veya pozitif bir sayı girin.", "estimatedBudget");
    }
  }

  private static List<Check> requestChecks(
      String type, String urgency, List<String> benefits, String currency, BigDecimal budget) {
    return List.of(
        Check.of("demandTypes", type, "type"),
        Check.of("criticalities", urgency, "urgency"),
        new Check("demandBenefitTypes", benefits, "benefitTypes"),
        new Check("currencies", budget != null ? List.of(currency) : List.of(), "currency"));
  }

  private void validateAssessment(Demand.AssessmentInput input, Demand previous) {
    Map<String, Integer> scores = new LinkedHashMap<>();
    scores.put("businessValue", input.businessValue());
    scores.put("strategicFit", input.strategicFit());
    scores.put("timeCriticality", input.timeCriticality());
    scores.put("riskReduction", input.riskReduction());
    scores.put("effort", input.effort());
    scores.forEach(
        (field, score) -> {
          if (score != null && (score < 1 || score > 5)) {
            throw new ValidationException("Puanlar 1 ile 5 arasında olmalıdır.", field);
          }
        });
    checks.assertRefs(Collections.singletonList(input.assessorId()), "people", "kişi", "assessorId");
    checks.assertRefs(Collections.singletonList(input.projectId()), "projects", "proje", "projectId");
    codes.assertAll(
        List.of(
            Check.of("demandStatuses", input.status(), "status"),
            Check.of("demandPriorities", input.priority(), "priority")),
        List.of(
            Check.of("demandStatuses", previous.status(), "status"),
            Check.of("demandPriorities", previous.assessment().priority(), "priority")));
    if (input.plannedStart() != null && !Times.isIsoDate(input.plannedStart())) {
      throw new ValidationException("Geçerli bir tarih girin.", "plannedStart");
    }
    if (input.plannedEnd() != null && !Times.isIsoDate(input.plannedEnd())) {
      throw new ValidationException("Geçerli bir tarih girin.", "plannedEnd");
    }
    if (input.plannedStart() != null
        && input.plannedEnd() != null
        && input.plannedEnd().compareTo(input.plannedStart()) < 0) {
      throw new ValidationException("Bitiş başlangıçtan önce olamaz.", "plannedEnd");
    }
    if (Texts.looksLikeSecret(input.decisionNote())) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, "decisionNote");
    }
    if (input.decisionNote().length() > 2000) {
      throw new ValidationException("Not en fazla 2000 karakter olabilir.", "decisionNote");
    }
    assertStatusRules(input);
  }

  /** Status changes that need something recorded with them. */
  private static void assertStatusRules(Demand.AssessmentInput input) {
    String status = input.status();
    if ((status.equals("rejected") || status.equals("needs-info"))
        && input.decisionNote().isBlank()) {
      throw new ValidationException(
          status.equals("rejected")
              ? "Reddetmek için gerekçeyi yazın; talep sahibi bu notu görür."
              : "Talep sahibinden hangi bilgiyi beklediğinizi yazın.",
          "decisionNote");
    }
    if (List.of("approved", "scheduled", "converted").contains(status)
        && (input.priority() == null || input.priority().isEmpty())) {
      throw new ValidationException("Onaylanan talebin önceliğini belirleyin.", "priority");
    }
    if (List.of("scheduled", "converted").contains(status)
        && (input.plannedStart() == null || input.plannedEnd() == null)) {
      throw new ValidationException(
          "Takvime almak için planlanan başlangıç ve bitişi girin.", "plannedStart");
    }
    if (status.equals("converted") && input.projectId() == null) {
      throw new ValidationException("Talebin dönüştüğü projeyi seçin.", "projectId");
    }
  }

  private static Demand.Input clean(Demand.Input input) {
    return new Demand.Input(
        input.title().trim(),
        input.type(),
        input.businessUnitId(),
        input.requesterId(),
        input.sponsorId(),
        input.problem().trim(),
        input.proposedSolution().trim(),
        input.expectedBenefits().trim(),
        List.copyOf(new LinkedHashSet<>(input.benefitTypes())),
        input.urgency(),
        input.desiredDate(),
        input.deadlineReason().trim(),
        input.regulatory(),
        input.affectedUsers(),
        input.estimatedBudget(),
        input.currency(),
        List.copyOf(new LinkedHashSet<>(input.relatedApplicationIds())));
  }

  private static Map<String, Object> requestColumns(Demand.Input input) {
    Map<String, Object> columns = new HashMap<>();
    columns.put("title", input.title());
    columns.put("type", input.type());
    columns.put("unit", input.businessUnitId());
    columns.put("requester", input.requesterId());
    columns.put("sponsor", input.sponsorId());
    columns.put("problem", input.problem());
    columns.put("solution", input.proposedSolution());
    columns.put("benefits", input.expectedBenefits());
    columns.put("urgency", input.urgency());
    columns.put("desired", Times.parseDate(input.desiredDate()));
    columns.put("deadlineReason", input.deadlineReason());
    columns.put("regulatory", Sql.flag(input.regulatory()));
    columns.put("affectedUsers", input.affectedUsers());
    columns.put("budget", input.estimatedBudget());
    columns.put("currency", input.currency() == null ? "TRY" : input.currency());
    return columns;
  }

  private void saveLinks(long id, Demand.Input input) {
    jdbc.sql("DELETE FROM demand_benefit_types WHERE demand_id = :id").param("id", id).update();
    int position = 0;
    for (String code : input.benefitTypes()) {
      jdbc.sql(
              "INSERT INTO demand_benefit_types (demand_id, code, sort_order) VALUES (:id, :code,"
                  + " :position)")
          .param("id", id)
          .param("code", code)
          .param("position", position++)
          .update();
    }
    jdbc.sql("DELETE FROM demand_applications WHERE demand_id = :id").param("id", id).update();
    position = 0;
    for (Long application : input.relatedApplicationIds()) {
      jdbc.sql(
              "INSERT INTO demand_applications (demand_id, application_id, sort_order) VALUES"
                  + " (:id, :app, :position)")
          .param("id", id)
          .param("app", application)
          .param("position", position++)
          .update();
    }
  }

  private void event(long demandId, SessionUser user, String status, String note) {
    jdbc.sql(
            "INSERT INTO demand_events (demand_id, occurred_at, by_person_id, status, note) VALUES (:id,"
                + " :at, :by, :status, :note)")
        .param("id", demandId)
        .param("at", Times.parseTimestamp(stamp.now()))
        .param("by", user.personId())
        .param("status", status)
        .param("note", note == null ? "" : note.trim())
        .update();
  }

  /** The reference shown to users, derived from the id: {@code TLP-0012}. */
  static String code(long id) {
    return String.format("TLP-%04d", id);
  }

  private Demand find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private List<Demand> load(String where, Map<String, Object> params) {
    String filter = " WHERE demand_id IN (SELECT id FROM demands " + where + ")";
    Map<Long, List<String>> benefits = new HashMap<>();
    jdbc.sql("SELECT demand_id, code FROM demand_benefit_types" + filter + " ORDER BY sort_order, code")
        .params(params)
        .query(
            rs -> {
              benefits.computeIfAbsent(rs.getLong("demand_id"), k -> new ArrayList<>()).add(rs.getString("code"));
            });
    Map<Long, List<Long>> applications = new HashMap<>();
    jdbc.sql(
            "SELECT demand_id, application_id FROM demand_applications"
                + filter
                + " ORDER BY sort_order, application_id")
        .params(params)
        .query(
            rs -> {
              applications
                  .computeIfAbsent(rs.getLong("demand_id"), k -> new ArrayList<>())
                  .add(rs.getLong("application_id"));
            });
    Map<Long, List<Demand.Event>> history = new HashMap<>();
    jdbc.sql("SELECT * FROM demand_events" + filter + " ORDER BY occurred_at, id")
        .params(params)
        .query(
            rs -> {
              history
                  .computeIfAbsent(rs.getLong("demand_id"), k -> new ArrayList<>())
                  .add(
                      new Demand.Event(
                          rs.getLong("id"),
                          Sql.timestamp(rs, "occurred_at"),
                          Sql.longOrNull(rs, "by_person_id"),
                          rs.getString("status"),
                          Sql.text(rs, "note")));
            });
    return jdbc.sql("SELECT * FROM demands " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Demand(
                  id,
                  code(id),
                  rs.getString("title"),
                  rs.getString("type"),
                  rs.getLong("business_unit_id"),
                  rs.getLong("requester_person_id"),
                  Sql.longOrNull(rs, "sponsor_person_id"),
                  rs.getString("problem"),
                  Sql.text(rs, "proposed_solution"),
                  rs.getString("expected_benefits"),
                  benefits.getOrDefault(id, List.of()),
                  rs.getString("urgency"),
                  Sql.date(rs, "desired_date"),
                  Sql.text(rs, "deadline_reason"),
                  rs.getBoolean("regulatory"),
                  Sql.longOrNull(rs, "affected_users"),
                  Sql.decimal(rs, "estimated_budget"),
                  rs.getString("currency"),
                  applications.getOrDefault(id, List.of()),
                  rs.getString("status"),
                  Sql.timestamp(rs, "submitted_at"),
                  new Demand.Assessment(
                      Sql.intOrNull(rs, "business_value"),
                      Sql.intOrNull(rs, "strategic_fit"),
                      Sql.intOrNull(rs, "time_criticality"),
                      Sql.intOrNull(rs, "risk_reduction"),
                      Sql.intOrNull(rs, "effort"),
                      rs.getString("priority"),
                      Sql.longOrNull(rs, "assessor_person_id"),
                      Sql.date(rs, "planned_start"),
                      Sql.date(rs, "planned_end"),
                      Sql.text(rs, "decision_note"),
                      Sql.longOrNull(rs, "project_id")),
                  history.getOrDefault(id, List.of()),
                  Sql.audit(rs));
            })
        .list();
  }
}
