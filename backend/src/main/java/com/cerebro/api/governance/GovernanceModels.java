package com.cerebro.api.governance;

import com.cerebro.api.shared.EntityRef;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.List;

/** Read models of the dashboard and the reports (the frontend's {@code governance/types}). */
public final class GovernanceModels {

  private GovernanceModels() {}

  /** {@code never-reviewed}, {@code stale} or {@code current}. */
  public record ReviewState(String kind, @JsonInclude(Include.NON_NULL) Integer daysSinceReview) {}

  public record AttentionItem(
      String id, String kind, String severity, Subject subject, String reason, String date) {}

  public record Subject(String kind, long id, String name) {}

  public record LifecycleCount(String lifecycle, int count) {}

  public record RecentlyUpdatedEntry(
      String kind, long id, String name, String code, String updatedAt, EntityRef updatedBy) {}

  public record UpcomingMilestone(
      long projectId,
      String projectName,
      long milestoneId,
      String title,
      String dueDate,
      String status) {}

  public record ApplicationCounts(
      int total, int active, int critical, int withoutTechnicalOwner, int reviewOverdue) {}

  public record ProjectCounts(int total, int inProgress, int atRiskOrCritical) {}

  public record ActiveCounts(int active, int activeCritical) {}

  public record PortfolioOverview(
      ApplicationCounts applications,
      ProjectCounts projects,
      ActiveCounts risks,
      ActiveCounts escalations,
      List<LifecycleCount> lifecycleDistribution,
      List<AttentionItem> attention,
      List<RecentlyUpdatedEntry> recentlyUpdated,
      List<UpcomingMilestone> upcomingMilestones) {}

  public record OutdatedTechnology(long id, String name, String status) {}

  public record ApplicationHealthRow(
      long id,
      String name,
      String code,
      String lifecycle,
      String criticality,
      EntityRef businessUnit,
      EntityRef technicalOwner,
      int completenessScore,
      List<String> missingRequired,
      List<String> missingRecommended,
      ReviewState reviewState,
      List<OutdatedTechnology> outdatedTechnologies,
      int activeRiskCount,
      int activeEscalationCount) {}

  /** One line or stack layer of a monthly chart; {@code null} values are gaps. */
  public record TrendSeries(String key, List<? extends Number> values) {}

  public record CategoryCount(String key, @JsonInclude(Include.NON_NULL) String label, int value) {}

  public record RiskCell(String probability, String impact, int count) {}

  public record PortfolioTrends(
      List<String> months,
      int currentMonthIndex,
      List<Integer> activeProjects,
      List<TrendSeries> milestonesByStatus,
      List<TrendSeries> escalationsRaised,
      List<Integer> escalationsOpenAtMonthEnd,
      List<Double> escalationMedianDaysToResolve,
      List<TrendSeries> risksRegistered,
      List<TrendSeries> decisionsByStatus,
      List<TrendSeries> capacityByProject,
      List<Integer> overallocatedPeople,
      List<TrendSeries> leaveDaysByType,
      List<CategoryCount> applicationsByLifecycle,
      List<CategoryCount> applicationsByCriticality,
      List<CategoryCount> applicationsByBusinessUnit,
      List<CategoryCount> projectsByStatus,
      List<CategoryCount> projectsByHealth,
      List<CategoryCount> topTechnologies,
      List<RiskCell> activeRiskMatrix) {}
}
