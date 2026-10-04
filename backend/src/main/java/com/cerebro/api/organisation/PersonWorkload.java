package com.cerebro.api.organisation;

import com.cerebro.api.shared.EntityRef;
import java.util.List;

/**
 * Everything a person is mapped to, for the person page: roles, teams, the applications and
 * projects they work on (directly or through a team), risks, escalations, decisions, allocations
 * and upcoming leaves.
 */
public record PersonWorkload(
    Person person,
    EntityRef businessUnit,
    List<TeamLink> teams,
    List<EntityRef> headOf,
    List<WorkItem> applications,
    List<WorkItem> projects,
    List<GovernanceItem> risks,
    List<GovernanceItem> escalations,
    List<GovernanceItem> decisions,
    List<AllocationItem> allocations,
    Load loadToday,
    List<LeaveItem> leaves) {

  public record TeamLink(EntityRef team, boolean manager, boolean member) {}

  public record WorkItem(
      long id,
      String code,
      String name,
      String status,
      String criticality,
      List<String> roles,
      List<ViaTeam> viaTeams) {}

  public record ViaTeam(EntityRef team, String responsibility) {}

  public record GovernanceItem(
      long id,
      String title,
      String status,
      boolean active,
      String severity,
      String date,
      List<String> involvement,
      List<EntityRef> applications,
      List<EntityRef> projects) {}

  public record AllocationItem(
      long id, EntityRef project, String role, String startDate, String endDate, int percent) {}

  public record Load(int count, int percent) {}

  public record LeaveItem(long id, String type, String startDate, String endDate) {}
}
