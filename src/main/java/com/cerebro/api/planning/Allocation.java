package com.cerebro.api.planning;

import com.cerebro.api.shared.Audit;

/** A person planned onto a project for a period at a share of their time (5–100 %). */
public record Allocation(
    long id,
    long personId,
    long projectId,
    String role,
    String startDate,
    String endDate,
    int percent,
    String note,
    Audit audit) {

  public record Input(
      long personId,
      long projectId,
      String role,
      String startDate,
      String endDate,
      int percent,
      String note) {}
}
