package com.cerebro.api.releases;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Production releases. Reading needs {@code releases:view}, recording and changing {@code
 * releases:edit}, deleting {@code releases:delete}. Rules and messages are the mock repository's
 * (frontend/src/services/mock/MockReleaseRepository.ts).
 */
@Service
@Transactional
public class ReleaseService {

  private static final String ENTITY = "Canlı geçiş";
  private static final Pattern TIME = Pattern.compile("^([01]\\d|2[0-3]):[0-5]\\d$");

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public ReleaseService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  /** By date, start time and release number; every filter optional. */
  @Transactional(readOnly = true)
  public List<Release> list(LocalDate from, LocalDate to, Long applicationId, Long projectId) {
    access.require("releases:view");
    Map<String, Object> params = new HashMap<>();
    String where = "WHERE 1 = 1";
    if (from != null) {
      where += " AND planned_date >= :from";
      params.put("from", from);
    }
    if (to != null) {
      where += " AND planned_date <= :to";
      params.put("to", to);
    }
    if (applicationId != null) {
      where += " AND application_id = :application";
      params.put("application", applicationId);
    }
    if (projectId != null) {
      where += " AND project_id = :project";
      params.put("project", projectId);
    }
    return load(where, params);
  }

  @Transactional(readOnly = true)
  public Release get(long id) {
    access.require("releases:view");
    return find(id);
  }

  public Release create(Release.Input input) {
    SessionUser user = access.require("releases:edit");
    validate(input, null);
    long id =
        Sql.insert(
            Sql.audit(
                    jdbc.sql(
                        "INSERT INTO releases (release_number, title, application_id, project_id,"
                            + " type, status, planned_date, start_time, end_time, version,"
                            + " owner_person_id, service_interruption, description, rollback_plan,"
                            + " outcome_note, "
                            + Sql.AUDIT_COLUMNS
                            + ") VALUES (:number, :title, :application, :project, :type, :status,"
                            + " :date, :start, :end, :version, :owner, :interruption,"
                            + " :description, :rollback, :outcome, "
                            + Sql.AUDIT_VALUES
                            + ")"),
                    stamp.created(user))
                .params(columns(input)));
    return find(id);
  }

  public Release update(long id, Release.Input input) {
    SessionUser user = access.require("releases:edit");
    Release current = find(id);
    validate(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE releases SET release_number = :number, title = :title, application_id ="
                    + " :application, project_id = :project, type = :type, status = :status,"
                    + " planned_date = :date, start_time = :start, end_time = :end, version ="
                    + " :version, owner_person_id = :owner, service_interruption = :interruption,"
                    + " description = :description, rollback_plan = :rollback, outcome_note ="
                    + " :outcome, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(columns(input))
        .param("id", id)
        .update();
    return find(id);
  }

  public void remove(long id) {
    access.require("releases:delete");
    find(id);
    jdbc.sql("DELETE FROM releases WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    find(id);
    return DeletionImpact.NONE;
  }

  private void validate(Release.Input input, Release previous) {
    if (n(input.releaseNumber()).isBlank()) {
      throw new ValidationException("Geçiş numarası zorunludur.", "releaseNumber");
    }
    if (n(input.title()).isBlank()) {
      throw new ValidationException("Başlık zorunludur.", "title");
    }
    assertText(input.releaseNumber(), "releaseNumber", "Geçiş numarası", 40);
    assertText(input.title(), "title", "Başlık", 200);
    assertText(input.version(), "version", "Sürüm", 40);
    assertText(input.description(), "description", "Geçiş detayları", 4000);
    assertText(input.rollbackPlan(), "rollbackPlan", "Geri alma planı", 2000);
    assertText(input.outcomeNote(), "outcomeNote", "Sonuç notu", 2000);
    checks.assertUnique(
        "releases",
        "release_number",
        input.releaseNumber(),
        previous == null ? null : previous.id(),
        input.releaseNumber().trim() + " numaralı bir geçiş zaten var.",
        "releaseNumber");
    checks.assertRefs(List.of(input.applicationId()), "applications", "uygulama", "applicationId");
    checks.assertRefs(
        Collections.singletonList(input.projectId()), "projects", "proje", "projectId");
    checks.assertRefs(Collections.singletonList(input.ownerId()), "people", "kişi", "ownerId");
    codes.assertAll(
        codeChecks(input.type(), input.status()),
        previous == null ? List.of() : codeChecks(previous.type(), previous.status()));
    if (input.plannedDate() == null || !Times.isIsoDate(input.plannedDate())) {
      throw new ValidationException("Geçerli bir tarih girin.", "plannedDate");
    }
    assertTime(input.startTime(), "startTime");
    assertTime(input.endTime(), "endTime");
    if (!n(input.endTime()).isEmpty() && n(input.startTime()).isEmpty()) {
      throw new ValidationException("Bitiş saati için başlangıç saatini de girin.", "startTime");
    }
  }

  private static List<Check> codeChecks(String type, String status) {
    return List.of(Check.of("releaseTypes", type, "type"), Check.of("releaseStatuses", status, "status"));
  }

  private static void assertText(String raw, String field, String label, int max) {
    String value = n(raw);
    if (value.length() > max) {
      throw new ValidationException(label + " en fazla " + max + " karakter olabilir.", field);
    }
    if (Texts.looksLikeSecret(value)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, field);
    }
  }

  private static void assertTime(String value, String field) {
    if (!n(value).isEmpty() && !TIME.matcher(value).matches()) {
      throw new ValidationException("Saati SS:DD biçiminde girin.", field);
    }
  }

  private static String n(String value) {
    return value == null ? "" : value;
  }

  private static Map<String, Object> columns(Release.Input input) {
    Map<String, Object> columns = new HashMap<>();
    columns.put("number", input.releaseNumber().trim());
    columns.put("title", input.title().trim());
    columns.put("application", input.applicationId());
    columns.put("project", input.projectId());
    columns.put("type", input.type());
    columns.put("status", input.status());
    columns.put("date", Times.parseDate(input.plannedDate()));
    columns.put("start", n(input.startTime()));
    columns.put("end", n(input.endTime()));
    columns.put("version", n(input.version()).trim());
    columns.put("owner", input.ownerId());
    columns.put("interruption", Sql.flag(input.serviceInterruption()));
    columns.put("description", n(input.description()).trim());
    columns.put("rollback", n(input.rollbackPlan()).trim());
    columns.put("outcome", n(input.outcomeNote()).trim());
    return columns;
  }

  private Release find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private List<Release> load(String where, Map<String, Object> params) {
    return jdbc.sql(
            "SELECT * FROM releases "
                + where
                + " ORDER BY planned_date, start_time NULLS FIRST, release_number, id")
        .params(params)
        .query(
            (rs, row) ->
                new Release(
                    rs.getLong("id"),
                    rs.getString("release_number"),
                    rs.getString("title"),
                    rs.getLong("application_id"),
                    Sql.longOrNull(rs, "project_id"),
                    rs.getString("type"),
                    rs.getString("status"),
                    Sql.date(rs, "planned_date"),
                    Sql.text(rs, "start_time"),
                    Sql.text(rs, "end_time"),
                    Sql.text(rs, "version"),
                    Sql.longOrNull(rs, "owner_person_id"),
                    rs.getBoolean("service_interruption"),
                    Sql.text(rs, "description"),
                    Sql.text(rs, "rollback_plan"),
                    Sql.text(rs, "outcome_note"),
                    Sql.audit(rs)))
        .list();
  }
}
