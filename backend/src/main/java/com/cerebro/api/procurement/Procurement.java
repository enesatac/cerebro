package com.cerebro.api.procurement;

import java.util.List;

/**
 * The procurement tracker's records (frontend: {@code domains/procurement/types}). A purchase is a
 * contract seen without its commercial terms, so business units can be given {@code
 * procurement:view}.
 */
public final class Procurement {

  private Procurement() {}

  /** One step of a purchase; on write, {@code id} is null for a new step. */
  public record Step(
      Long id,
      String type,
      String status,
      Long ownerId,
      String plannedStart,
      String plannedEnd,
      String actualStart,
      String actualEnd,
      String note) {}

  public record Note(long id, String at, Long authorId, String text, boolean internal) {}

  public record NoteInput(String text, boolean internal) {}

  /** {@code ProcurementSummary}. */
  public record Summary(
      long contractId,
      String code,
      String title,
      long projectId,
      Long businessUnitId,
      String vendorName,
      String contractStatus,
      Long ownerId,
      List<Step> steps,
      int noteCount,
      String lastNoteAt) {}

  /** {@code ProcurementProcess}: the summary with the notes the viewer may read. */
  public record Process(
      long contractId,
      String code,
      String title,
      long projectId,
      Long businessUnitId,
      String vendorName,
      String contractStatus,
      Long ownerId,
      List<Step> steps,
      int noteCount,
      String lastNoteAt,
      List<Note> notes) {

    static Process of(Summary s, List<Note> notes) {
      return new Process(
          s.contractId(),
          s.code(),
          s.title(),
          s.projectId(),
          s.businessUnitId(),
          s.vendorName(),
          s.contractStatus(),
          s.ownerId(),
          s.steps(),
          s.noteCount(),
          s.lastNoteAt(),
          notes);
    }
  }
}
