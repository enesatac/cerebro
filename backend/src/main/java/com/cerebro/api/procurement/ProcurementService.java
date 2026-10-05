package com.cerebro.api.procurement;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Sql.Keyed;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The procurement tracker: steps and notes of every purchase (contract). Reading needs {@code
 * procurement:view}; changing steps and writing or deleting notes {@code procurement:edit}, which
 * also shows internal notes. The rules and messages are the mock repository's
 * (frontend/src/services/mock/MockProcurementRepository.ts).
 */
@Service
@Transactional
public class ProcurementService {

  static final int MAX_STEPS = 30;

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public ProcurementService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  /** Every purchase, in contract order. */
  @Transactional(readOnly = true)
  public List<Procurement.Summary> list() {
    SessionUser user = access.require("procurement:view");
    return summaries("", Map.of(), notes("", Map.of(), user));
  }

  @Transactional(readOnly = true)
  public Procurement.Process get(long contractId) {
    SessionUser user = access.require("procurement:view");
    return process(contractId, user);
  }

  public Procurement.Process saveSteps(long contractId, List<Procurement.Step> steps) {
    SessionUser user = access.require("procurement:edit");
    requireContract(contractId);
    List<Procurement.Step> current = steps(contractId);
    codes.assertAll(codeChecks(steps), codeChecks(current));
    checks.assertRefs(
        steps.stream().map(Procurement.Step::ownerId).toList(), "people", "kişi", "steps");
    validate(steps);
    ChildRows.replace(
        jdbc,
        "procurement_steps",
        "contract_id",
        contractId,
        steps,
        Procurement.Step::id,
        "contract_id, sort_order, step_type, status, owner_person_id, planned_start, planned_end,"
            + " actual_start, actual_end, note",
        ":parent, :position, :type, :status, :owner, :plannedStart, :plannedEnd, :actualStart,"
            + " :actualEnd, :note",
        (s, step, index) ->
            s.param("position", index)
                .param("type", step.type())
                .param("status", step.status())
                .param("owner", step.ownerId())
                .param("plannedStart", Times.parseDate(step.plannedStart()))
                .param("plannedEnd", Times.parseDate(step.plannedEnd()))
                .param("actualStart", Times.parseDate(step.actualStart()))
                .param("actualEnd", Times.parseDate(step.actualEnd()))
                .param("note", n(step.note()).trim()));
    return process(contractId, user);
  }

  public Procurement.Note addNote(long contractId, Procurement.NoteInput input) {
    SessionUser user = access.require("procurement:edit");
    requireContract(contractId);
    String text = n(input.text()).trim();
    if (text.isEmpty()) {
      throw new ValidationException("Notu yazın.", "text");
    }
    if (text.length() > 2000) {
      throw new ValidationException("Not en fazla 2000 karakter olabilir.", "text");
    }
    if (Texts.looksLikeSecret(text)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, "text");
    }
    String at = stamp.now();
    long id =
        Sql.insert(
            jdbc.sql(
                    "INSERT INTO procurement_notes (contract_id, created_at, author_person_id,"
                        + " note_text, internal) VALUES (:contract, :at, :author, :text,"
                        + " :internal)")
                .param("contract", contractId)
                .param("at", Times.parseTimestamp(at))
                .param("author", user.personId())
                .param("text", text)
                .param("internal", Sql.flag(input.internal())));
    return new Procurement.Note(id, at, user.personId(), text, input.internal());
  }

  public void removeNote(long noteId) {
    access.require("procurement:edit");
    checks.requireExists("procurement_notes", noteId, "Not");
    jdbc.sql("DELETE FROM procurement_notes WHERE id = :id").param("id", noteId).update();
  }

  // ---------------------------------------------------------------------------------------------

  private static void validate(List<Procurement.Step> steps) {
    if (steps.size() > MAX_STEPS) {
      throw new ValidationException("En fazla " + MAX_STEPS + " adım girilebilir.", "steps");
    }
    for (int index = 0; index < steps.size(); index++) {
      Procurement.Step step = steps.get(index);
      String field = "steps." + index + ".";
      assertDate(step.plannedStart(), field + "plannedStart");
      assertDate(step.plannedEnd(), field + "plannedEnd");
      assertDate(step.actualStart(), field + "actualStart");
      assertDate(step.actualEnd(), field + "actualEnd");
      if (step.plannedStart() != null
          && step.plannedEnd() != null
          && step.plannedEnd().compareTo(step.plannedStart()) < 0) {
        throw new ValidationException(
            "Planlanan bitiş başlangıçtan önce olamaz.", field + "plannedEnd");
      }
      if (step.actualStart() != null
          && step.actualEnd() != null
          && step.actualEnd().compareTo(step.actualStart()) < 0) {
        throw new ValidationException(
            "Gerçekleşen bitiş başlangıçtan önce olamaz.", field + "actualEnd");
      }
      if ("done".equals(step.status()) && step.actualEnd() == null) {
        throw new ValidationException("Tamamlanan adımın bitiş tarihini girin.", field + "actualEnd");
      }
      if ("in-progress".equals(step.status()) && step.actualStart() == null) {
        throw new ValidationException(
            "Başlayan adımın başlangıç tarihini girin.", field + "actualStart");
      }
      String note = n(step.note());
      if (note.length() > 1000) {
        throw new ValidationException("Not en fazla 1000 karakter olabilir.", field + "note");
      }
      if (Texts.looksLikeSecret(note)) {
        throw new ValidationException(Texts.NO_SECRETS_MESSAGE, field + "note");
      }
    }
  }

  private static List<Check> codeChecks(List<Procurement.Step> steps) {
    return List.of(
        new Check("procurementSteps", steps.stream().map(Procurement.Step::type).toList(), "steps"),
        new Check(
            "procurementStepStatuses",
            steps.stream().map(Procurement.Step::status).toList(),
            "steps"));
  }

  private static void assertDate(String value, String field) {
    if (value != null && !Times.isIsoDate(value)) {
      throw new ValidationException("Geçerli bir tarih girin.", field);
    }
  }

  private static String n(String value) {
    return value == null ? "" : value;
  }

  private void requireContract(long contractId) {
    if (!checks.exists("contracts", contractId)) {
      throw new NotFoundException("Satın alma", contractId);
    }
  }

  private Procurement.Process process(long contractId, SessionUser user) {
    Map<String, Object> params = Map.of("id", contractId);
    Map<Long, List<Procurement.Note>> notes = notes("WHERE contract_id = :id", params, user);
    return summaries("WHERE c.id = :id", params, notes).stream()
        .findFirst()
        .map(s -> Procurement.Process.of(s, notes.getOrDefault(contractId, List.of())))
        .orElseThrow(() -> new NotFoundException("Satın alma", contractId));
  }

  private List<Procurement.Step> steps(long contractId) {
    return stepsWhere("WHERE contract_id = :id", Map.of("id", contractId))
        .getOrDefault(contractId, List.of());
  }

  private Map<Long, List<Procurement.Step>> stepsWhere(String where, Map<String, ?> params) {
    return Sql.group(
        jdbc.sql("SELECT * FROM procurement_steps " + where + " ORDER BY contract_id, sort_order, id")
            .params(params)
            .query(
                (rs, row) ->
                    new Keyed<>(
                        rs.getLong("contract_id"),
                        new Procurement.Step(
                            rs.getLong("id"),
                            rs.getString("step_type"),
                            rs.getString("status"),
                            Sql.longOrNull(rs, "owner_person_id"),
                            Sql.date(rs, "planned_start"),
                            Sql.date(rs, "planned_end"),
                            Sql.date(rs, "actual_start"),
                            Sql.date(rs, "actual_end"),
                            Sql.text(rs, "note"))))
            .list());
  }

  /** Notes per contract, newest first; internal ones only for the procurement team. */
  private Map<Long, List<Procurement.Note>> notes(
      String where, Map<String, ?> params, SessionUser user) {
    String visible = user.has("procurement:edit") ? "" : "internal = 0";
    String filter =
        where.isEmpty()
            ? (visible.isEmpty() ? "" : "WHERE " + visible)
            : where + (visible.isEmpty() ? "" : " AND " + visible);
    Map<Long, List<Procurement.Note>> grouped =
        Sql.group(
            jdbc.sql("SELECT * FROM procurement_notes " + filter)
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("contract_id"),
                            new Procurement.Note(
                                rs.getLong("id"),
                                Sql.timestamp(rs, "created_at"),
                                Sql.longOrNull(rs, "author_person_id"),
                                rs.getString("note_text"),
                                rs.getBoolean("internal"))))
                .list());
    Map<Long, List<Procurement.Note>> sorted = new HashMap<>();
    grouped.forEach(
        (contract, list) ->
            sorted.put(
                contract,
                list.stream()
                    .sorted(
                        Comparator.comparing(Procurement.Note::at)
                            .thenComparingLong(Procurement.Note::id)
                            .reversed())
                    .toList()));
    return sorted;
  }

  private List<Procurement.Summary> summaries(
      String where, Map<String, ?> params, Map<Long, List<Procurement.Note>> notes) {
    Map<Long, List<Procurement.Step>> steps =
        stepsWhere(
            where.isEmpty() ? "" : "WHERE contract_id IN (SELECT c.id FROM contracts c " + where + ")",
            params);
    return jdbc.sql(
            "SELECT c.id, c.title, c.project_id, c.status, c.owner_person_id, p.business_unit_id,"
                + " v.name AS vendor_name FROM contracts c JOIN projects p ON p.id = c.project_id"
                + " JOIN vendors v ON v.id = c.vendor_id "
                + where
                + " ORDER BY c.id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              List<Procurement.Note> visible = notes.getOrDefault(id, List.of());
              return new Procurement.Summary(
                  id,
                  String.format("SZL-%04d", id),
                  rs.getString("title"),
                  rs.getLong("project_id"),
                  Sql.longOrNull(rs, "business_unit_id"),
                  rs.getString("vendor_name"),
                  rs.getString("status"),
                  Sql.longOrNull(rs, "owner_person_id"),
                  steps.getOrDefault(id, List.of()),
                  visible.size(),
                  visible.isEmpty() ? null : visible.get(0).at());
            })
        .list();
  }
}
