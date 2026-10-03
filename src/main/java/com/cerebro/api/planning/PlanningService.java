package com.cerebro.api.planning;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.DisplayDates;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Leaves and resource allocations: readable by every signed-in user; writes need {@code
 * leaves:edit} or {@code resources:edit}.
 */
@Service
@Transactional
public class PlanningService {

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public PlanningService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  // ---------------------------------------------------------------------------------------------
  // Leaves
  // ---------------------------------------------------------------------------------------------

  /** Leaves overlapping {@code [from, to]}, optionally for some people only, by start date. */
  @Transactional(readOnly = true)
  public List<LeaveRecord> leaves(LocalDate from, LocalDate to, List<Long> personIds) {
    access.current();
    Map<String, Object> params = new HashMap<>(Map.of("from", from, "to", to));
    String where = "WHERE start_date <= :to AND :from <= end_date";
    if (personIds != null) {
      where += " AND person_id = ANY(:people)";
      params.put("people", Sql.longs(personIds));
    }
    return loadLeaves(where, params);
  }

  /** Every leave in id order (reports). */
  public List<LeaveRecord> allLeaves() {
    return loadLeaves("", Map.of(), "id");
  }

  @Transactional(readOnly = true)
  public LeaveRecord leave(long id) {
    access.current();
    return findLeave(id);
  }

  public LeaveRecord createLeave(LeaveRecord.Input input) {
    SessionUser user = access.require("leaves:edit");
    validateLeave(input, null);
    long id =
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO leave_records (person_id, type, start_date, end_date, note, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:person, :type, :start, :end, :note, "
                        + Sql.AUDIT_VALUES
                        + ") RETURNING id"),
                stamp.created(user))
            .params(leaveColumns(input))
            .query(Long.class)
            .single();
    return findLeave(id);
  }

  public LeaveRecord updateLeave(long id, LeaveRecord.Input input) {
    SessionUser user = access.require("leaves:edit");
    LeaveRecord current = findLeave(id);
    validateLeave(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE leave_records SET person_id = :person, type = :type, start_date = :start,"
                    + " end_date = :end, note = :note, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(leaveColumns(input))
        .param("id", id)
        .update();
    return findLeave(id);
  }

  public void removeLeave(long id) {
    access.require("leaves:edit");
    findLeave(id);
    jdbc.sql("DELETE FROM leave_records WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact leaveDeletionImpact(long id) {
    access.current();
    findLeave(id);
    return DeletionImpact.NONE;
  }

  private void validateLeave(LeaveRecord.Input input, LeaveRecord current) {
    checks.assertRefs(List.of(input.personId()), "people", "kişi", "personId");
    codes.assertAll(
        List.of(Check.of("leaveTypes", input.type(), "type")),
        current == null ? List.of() : List.of(Check.of("leaveTypes", current.type(), "type")));
    assertPeriod(input.startDate(), input.endDate());
    // One person cannot be on two leaves at once (an exclusion constraint in the database too).
    jdbc.sql(
            "SELECT start_date, end_date FROM leave_records WHERE person_id = :person AND id <>"
                + " :id AND start_date <= :end AND :start <= end_date ORDER BY start_date LIMIT 1")
        .param("person", input.personId())
        .param("id", current == null ? -1L : current.id())
        .param("start", LocalDate.parse(input.startDate()))
        .param("end", LocalDate.parse(input.endDate()))
        .query(
            (rs, row) ->
                DisplayDates.range(
                    rs.getObject("start_date", LocalDate.class),
                    rs.getObject("end_date", LocalDate.class)))
        .optional()
        .ifPresent(
            clash -> {
              throw new ValidationException(
                  "Bu kişinin " + clash + " tarihlerinde başka bir izni var.", "startDate");
            });
  }

  private static Map<String, Object> leaveColumns(LeaveRecord.Input input) {
    return Map.of(
        "person", input.personId(),
        "type", input.type(),
        "start", LocalDate.parse(input.startDate()),
        "end", LocalDate.parse(input.endDate()),
        "note", input.note() == null ? "" : input.note().trim());
  }

  private LeaveRecord findLeave(long id) {
    return loadLeaves("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("İzin", id));
  }

  private List<LeaveRecord> loadLeaves(String where, Map<String, Object> params) {
    return loadLeaves(where, params, "start_date, id");
  }

  private List<LeaveRecord> loadLeaves(String where, Map<String, Object> params, String order) {
    return jdbc.sql("SELECT * FROM leave_records " + where + " ORDER BY " + order)
        .params(params)
        .query(
            (rs, row) ->
                new LeaveRecord(
                    rs.getLong("id"),
                    rs.getLong("person_id"),
                    rs.getString("type"),
                    Sql.date(rs, "start_date"),
                    Sql.date(rs, "end_date"),
                    rs.getString("note"),
                    Sql.audit(rs)))
        .list();
  }

  // ---------------------------------------------------------------------------------------------
  // Allocations
  // ---------------------------------------------------------------------------------------------

  /** Allocations overlapping {@code [from, to]}, optionally for some people or projects. */
  @Transactional(readOnly = true)
  public List<Allocation> allocations(
      LocalDate from, LocalDate to, List<Long> personIds, List<Long> projectIds) {
    access.current();
    Map<String, Object> params = new HashMap<>(Map.of("from", from, "to", to));
    String where = "WHERE start_date <= :to AND :from <= end_date";
    if (personIds != null) {
      where += " AND person_id = ANY(:people)";
      params.put("people", Sql.longs(personIds));
    }
    if (projectIds != null) {
      where += " AND project_id = ANY(:projects)";
      params.put("projects", Sql.longs(projectIds));
    }
    return loadAllocations(where, params);
  }

  /** Every allocation in id order (reports). */
  public List<Allocation> allAllocations() {
    return loadAllocations("", Map.of(), "id");
  }

  @Transactional(readOnly = true)
  public Allocation allocation(long id) {
    access.current();
    return findAllocation(id);
  }

  public Allocation createAllocation(Allocation.Input input) {
    SessionUser user = access.require("resources:edit");
    validateAllocation(input, null);
    long id =
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO resource_allocations (person_id, project_id, role, start_date,"
                        + " end_date, percent, note, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:person, :project, :role, :start, :end, :percent, :note, "
                        + Sql.AUDIT_VALUES
                        + ") RETURNING id"),
                stamp.created(user))
            .params(allocationColumns(input))
            .query(Long.class)
            .single();
    return findAllocation(id);
  }

  public Allocation updateAllocation(long id, Allocation.Input input) {
    SessionUser user = access.require("resources:edit");
    Allocation current = findAllocation(id);
    validateAllocation(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE resource_allocations SET person_id = :person, project_id = :project, role"
                    + " = :role, start_date = :start, end_date = :end, percent = :percent, note"
                    + " = :note, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(allocationColumns(input))
        .param("id", id)
        .update();
    return findAllocation(id);
  }

  public void removeAllocation(long id) {
    access.require("resources:edit");
    findAllocation(id);
    jdbc.sql("DELETE FROM resource_allocations WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact allocationDeletionImpact(long id) {
    access.current();
    findAllocation(id);
    return DeletionImpact.NONE;
  }

  /**
   * Overlaps are allowed — parallel work is what the planner shows — but the same person cannot be
   * planned twice onto the same project for overlapping days.
   */
  private void validateAllocation(Allocation.Input input, Allocation current) {
    checks.assertRefs(List.of(input.personId()), "people", "kişi", "personId");
    checks.assertRefs(List.of(input.projectId()), "projects", "proje", "projectId");
    codes.assertAll(
        List.of(Check.of("stakeholderRoles", input.role(), "role")),
        current == null ? List.of() : List.of(Check.of("stakeholderRoles", current.role(), "role")));
    assertPeriod(input.startDate(), input.endDate());
    if (input.percent() < 5 || input.percent() > 100 || input.percent() % 5 != 0) {
      throw new ValidationException("Doluluk %5–%100 arasında, 5'in katı olmalı.", "percent");
    }
    boolean duplicate =
        jdbc.sql(
                "SELECT EXISTS (SELECT 1 FROM resource_allocations WHERE person_id = :person AND"
                    + " project_id = :project AND id <> :id AND start_date <= :end AND :start <="
                    + " end_date)")
            .param("person", input.personId())
            .param("project", input.projectId())
            .param("id", current == null ? -1L : current.id())
            .param("start", LocalDate.parse(input.startDate()))
            .param("end", LocalDate.parse(input.endDate()))
            .query(Boolean.class)
            .single();
    if (duplicate) {
      throw new ValidationException(
          "Bu kişi bu tarihlerde zaten bu projeye atanmış. Mevcut atamayı düzenleyin.",
          "projectId");
    }
  }

  private static Map<String, Object> allocationColumns(Allocation.Input input) {
    return Map.of(
        "person", input.personId(),
        "project", input.projectId(),
        "role", input.role(),
        "start", LocalDate.parse(input.startDate()),
        "end", LocalDate.parse(input.endDate()),
        "percent", input.percent(),
        "note", input.note() == null ? "" : input.note().trim());
  }

  private Allocation findAllocation(long id) {
    return loadAllocations("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Atama", id));
  }

  private List<Allocation> loadAllocations(String where, Map<String, Object> params) {
    return loadAllocations(where, params, "start_date, id");
  }

  private List<Allocation> loadAllocations(
      String where, Map<String, Object> params, String order) {
    return jdbc.sql("SELECT * FROM resource_allocations " + where + " ORDER BY " + order)
        .params(params)
        .query(
            (rs, row) ->
                new Allocation(
                    rs.getLong("id"),
                    rs.getLong("person_id"),
                    rs.getLong("project_id"),
                    rs.getString("role"),
                    Sql.date(rs, "start_date"),
                    Sql.date(rs, "end_date"),
                    rs.getInt("percent"),
                    rs.getString("note"),
                    Sql.audit(rs)))
        .list();
  }

  private static void assertPeriod(String start, String end) {
    if (!Times.isIsoDate(start) || !Times.isIsoDate(end)) {
      throw new ValidationException("Geçerli tarihler girin.", "startDate");
    }
    if (end.compareTo(start) < 0) {
      throw new ValidationException("Bitiş tarihi başlangıçtan önce olamaz.", "endDate");
    }
  }
}
