package com.cerebro.api.planning;

import com.cerebro.api.shared.Audit;

/** A person's absence. Dates are inclusive calendar days. */
public record LeaveRecord(
    long id, long personId, String type, String startDate, String endDate, String note, Audit audit) {

  public record Input(long personId, String type, String startDate, String endDate, String note) {}
}
