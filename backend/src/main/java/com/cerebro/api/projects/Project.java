package com.cerebro.api.projects;

import com.cerebro.api.portfolio.DocumentationLink;
import com.cerebro.api.portfolio.RoleAssignment;
import com.cerebro.api.portfolio.TeamAssignment;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.EntityRef;
import java.math.BigDecimal;
import java.util.List;

/** A project with its plan, ownership, affected applications and milestones. */
public record Project(
    long id,
    String code,
    String name,
    String shortName,
    String description,
    String objective,
    String scope,
    String outOfScope,
    String type,
    String priority,
    String status,
    String health,
    String confidentiality,
    List<String> tags,
    Long businessUnitId,
    List<RoleAssignment> roles,
    List<TeamAssignment> teams,
    Timeline timeline,
    int progressPercentage,
    String currentPhase,
    String latestStatusSummary,
    String nextSteps,
    Financials financials,
    List<ApplicationImpact> applicationImpacts,
    List<Milestone> milestones,
    List<DocumentationLink> documentation,
    Audit audit) {

  public static final List<String> STATUSES =
      List.of("proposed", "approved", "in-progress", "on-hold", "completed", "cancelled");
  public static final List<String> HEALTHS = List.of("on-track", "at-risk", "critical", "completed");

  public record Input(
      String code,
      String name,
      String shortName,
      String description,
      String objective,
      String scope,
      String outOfScope,
      String type,
      String priority,
      String status,
      String health,
      String confidentiality,
      List<String> tags,
      Long businessUnitId,
      List<RoleAssignment> roles,
      List<TeamAssignment> teams,
      Timeline timeline,
      int progressPercentage,
      String currentPhase,
      String latestStatusSummary,
      String nextSteps,
      Financials financials,
      List<ApplicationImpact> applicationImpacts,
      List<Milestone> milestones,
      List<DocumentationLink> documentation) {

    public Input {
      tags = tags == null ? List.of() : tags;
      roles = roles == null ? List.of() : roles;
      teams = teams == null ? List.of() : teams;
      applicationImpacts = applicationImpacts == null ? List.of() : applicationImpacts;
      milestones = milestones == null ? List.of() : milestones;
      documentation = documentation == null ? List.of() : documentation;
      timeline = timeline == null ? new Timeline(null, null, null, null) : timeline;
    }
  }

  public record Timeline(
      String plannedStartDate, String actualStartDate, String plannedEndDate, String actualEndDate) {}

  /** Optional; {@code null} when no financial information is recorded. */
  public record Financials(
      String currency, BigDecimal budget, BigDecimal actualCost, BigDecimal forecastCost) {}

  /** The project's explicit relationship to an application it affects. */
  public record ApplicationImpact(
      Long id, long applicationId, String impactType, String description) {}

  public record Milestone(
      Long id, String title, String dueDate, String completedDate, String status) {}

  public record ListItem(
      long id,
      String code,
      String name,
      String status,
      String health,
      String priority,
      String currentPhase,
      int progressPercentage,
      EntityRef businessUnit,
      EntityRef projectManager,
      String plannedEndDate) {}

  /** A project as seen from one application it affects. */
  public record ApplicationLink(ListItem project, ApplicationImpact impact) {}

  public record Ref(long id, String name, String code) {}
}
