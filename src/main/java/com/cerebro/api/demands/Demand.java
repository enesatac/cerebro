package com.cerebro.api.demands;

import com.cerebro.api.shared.Audit;
import java.math.BigDecimal;
import java.util.List;

/**
 * A request for change from a business unit: what is needed and why (the requester's part), the
 * portfolio office's assessment and schedule, and the status history.
 */
public record Demand(
    long id,
    String code,
    String title,
    String type,
    long businessUnitId,
    long requesterId,
    Long sponsorId,
    String problem,
    String proposedSolution,
    String expectedBenefits,
    List<String> benefitTypes,
    String urgency,
    String desiredDate,
    String deadlineReason,
    boolean regulatory,
    Long affectedUsers,
    BigDecimal estimatedBudget,
    String currency,
    List<Long> relatedApplicationIds,
    String status,
    String submittedAt,
    Assessment assessment,
    List<Event> history,
    Audit audit) {

  /** Waiting for a decision (the triage inbox), and closed for good. */
  public static final List<String> CLOSED = List.of("converted", "rejected", "withdrawn");

  /** The requester may still change the request (before a decision, or when asked for more). */
  public static final List<String> REQUESTER_EDITABLE = List.of("submitted", "needs-info");

  /** WSJF scores (1–5), the decided priority, the plan and the decision note. */
  public record Assessment(
      Integer businessValue,
      Integer strategicFit,
      Integer timeCriticality,
      Integer riskReduction,
      Integer effort,
      String priority,
      Long assessorId,
      String plannedStart,
      String plannedEnd,
      String decisionNote,
      Long projectId) {}

  /** A status change, written by the server only. */
  public record Event(long id, String at, Long byId, String status, String note) {}

  /** What the requester fills in. */
  public record Input(
      String title,
      String type,
      long businessUnitId,
      long requesterId,
      Long sponsorId,
      String problem,
      String proposedSolution,
      String expectedBenefits,
      List<String> benefitTypes,
      String urgency,
      String desiredDate,
      String deadlineReason,
      boolean regulatory,
      Long affectedUsers,
      BigDecimal estimatedBudget,
      String currency,
      List<Long> relatedApplicationIds) {

    public Input {
      title = title == null ? "" : title;
      problem = problem == null ? "" : problem;
      proposedSolution = proposedSolution == null ? "" : proposedSolution;
      expectedBenefits = expectedBenefits == null ? "" : expectedBenefits;
      deadlineReason = deadlineReason == null ? "" : deadlineReason;
      benefitTypes = benefitTypes == null ? List.of() : benefitTypes;
      relatedApplicationIds = relatedApplicationIds == null ? List.of() : relatedApplicationIds;
    }
  }

  /** What the portfolio office decides. */
  public record AssessmentInput(
      Integer businessValue,
      Integer strategicFit,
      Integer timeCriticality,
      Integer riskReduction,
      Integer effort,
      String priority,
      Long assessorId,
      String plannedStart,
      String plannedEnd,
      String decisionNote,
      Long projectId,
      String status) {

    public AssessmentInput {
      decisionNote = decisionNote == null ? "" : decisionNote;
      priority = priority == null || priority.isBlank() ? null : priority;
    }
  }

  public record Withdrawal(String note) {}
}
