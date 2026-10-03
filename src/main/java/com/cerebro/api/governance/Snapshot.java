package com.cerebro.api.governance;

import com.cerebro.api.applications.Application;
import com.cerebro.api.operations.Decision;
import com.cerebro.api.operations.Escalation;
import com.cerebro.api.operations.Risk;
import com.cerebro.api.planning.Allocation;
import com.cerebro.api.planning.LeaveRecord;
import com.cerebro.api.projects.Project;
import com.cerebro.api.technologies.Technology;
import java.util.List;
import java.util.Map;

/** The tables the portfolio rules read, loaded once per request. */
record Snapshot(
    List<Application> applications,
    List<Project> projects,
    List<Risk> risks,
    List<Escalation> escalations,
    List<Decision> decisions,
    List<Technology> technologies,
    List<Allocation> allocations,
    List<LeaveRecord> leaves,
    Map<Long, String> people,
    Map<Long, String> businessUnits) {

  static boolean activeRisk(String status) {
    return status.equals("open") || status.equals("monitoring");
  }

  static boolean activeEscalation(String status) {
    return status.equals("open") || status.equals("in-progress");
  }

  static boolean openProject(Project project) {
    return !project.status().equals("completed") && !project.status().equals("cancelled");
  }

  static boolean live(Application application) {
    return !application.lifecycle().equals("retired");
  }
}
