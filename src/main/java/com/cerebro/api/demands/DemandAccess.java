package com.cerebro.api.demands;

import com.cerebro.api.access.SessionUser;

/**
 * Who may change a demand: the single rule shared with the frontend ({@code demandAccess.ts}),
 * which only hides what this refuses.
 */
public final class DemandAccess {

  private DemandAccess() {}

  /** The person who asked, or the one who typed it in on their behalf. */
  public static boolean owns(SessionUser user, long requesterId, Long createdBy) {
    Long personId = user.personId();
    return personId != null && (requesterId == personId || personId.equals(createdBy));
  }

  public static boolean canEdit(SessionUser user, Demand demand) {
    if (user.has("demandManagement:edit")) {
      return true;
    }
    return user.has("demands:edit")
        && owns(user, demand.requesterId(), demand.audit().createdBy())
        && Demand.REQUESTER_EDITABLE.contains(demand.status());
  }

  public static boolean canWithdraw(SessionUser user, Demand demand) {
    if (Demand.CLOSED.contains(demand.status())) {
      return false;
    }
    return user.has("demandManagement:edit")
        || (user.has("demands:edit") && owns(user, demand.requesterId(), demand.audit().createdBy()));
  }

  /** Files on a demand: its requester while it is open, and the portfolio office. */
  public static boolean canAttach(
      SessionUser user, long requesterId, Long createdBy, String status) {
    if (user.has("demandManagement:edit")) {
      return true;
    }
    return user.has("demands:edit")
        && owns(user, requesterId, createdBy)
        && !Demand.CLOSED.contains(status);
  }
}
