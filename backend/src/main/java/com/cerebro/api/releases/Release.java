package com.cerebro.api.releases;

import com.cerebro.api.shared.Audit;

/**
 * A production release (canlı geçiş) of an application, optionally delivered by a project
 * (frontend: {@code domains/releases/types}).
 */
public record Release(
    long id,
    String releaseNumber,
    String title,
    long applicationId,
    Long projectId,
    String type,
    String status,
    String plannedDate,
    String startTime,
    String endTime,
    String version,
    Long ownerId,
    boolean serviceInterruption,
    String description,
    String rollbackPlan,
    String outcomeNote,
    Audit audit) {

  public record Input(
      String releaseNumber,
      String title,
      long applicationId,
      Long projectId,
      String type,
      String status,
      String plannedDate,
      String startTime,
      String endTime,
      String version,
      Long ownerId,
      boolean serviceInterruption,
      String description,
      String rollbackPlan,
      String outcomeNote) {}
}
