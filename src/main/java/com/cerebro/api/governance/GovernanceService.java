package com.cerebro.api.governance;

import com.cerebro.api.access.Access;
import com.cerebro.api.applications.Application;
import com.cerebro.api.applications.ApplicationStore;
import com.cerebro.api.governance.GovernanceModels.ActiveCounts;
import com.cerebro.api.governance.GovernanceModels.ApplicationCounts;
import com.cerebro.api.governance.GovernanceModels.ApplicationHealthRow;
import com.cerebro.api.governance.GovernanceModels.AttentionItem;
import com.cerebro.api.governance.GovernanceModels.LifecycleCount;
import com.cerebro.api.governance.GovernanceModels.OutdatedTechnology;
import com.cerebro.api.governance.GovernanceModels.PortfolioOverview;
import com.cerebro.api.governance.GovernanceModels.PortfolioTrends;
import com.cerebro.api.governance.GovernanceModels.ProjectCounts;
import com.cerebro.api.governance.GovernanceModels.RecentlyUpdatedEntry;
import com.cerebro.api.governance.GovernanceModels.ReviewState;
import com.cerebro.api.governance.GovernanceModels.Subject;
import com.cerebro.api.governance.GovernanceModels.UpcomingMilestone;
import com.cerebro.api.operations.Escalation;
import com.cerebro.api.operations.OperationsService;
import com.cerebro.api.operations.Risk;
import com.cerebro.api.organisation.Names;
import com.cerebro.api.planning.PlanningService;
import com.cerebro.api.portfolio.PortfolioChildren;
import com.cerebro.api.projects.Project;
import com.cerebro.api.projects.ProjectStore;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.EntityRef;
import com.cerebro.api.technologies.Technology;
import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Portfolio-wide aggregates for the dashboard and reports: the same rules as the frontend's
 * {@code governance/utils/portfolio.ts} and {@code trends.ts}, computed server-side.
 */
@Service
@Transactional(readOnly = true)
public class GovernanceService {

  /** Records not reviewed within this many days are flagged for review. */
  static final int REVIEW_INTERVAL_DAYS = 180;

  static final int RECENTLY_UPDATED_LIMIT = 8;
  static final int UPCOMING_MILESTONE_DAYS = 60;
  static final List<String> CRITICALITIES = List.of("low", "medium", "high", "critical");

  private final Access access;
  private final ApplicationStore applications;
  private final ProjectStore projects;
  private final OperationsService operations;
  private final PlanningService planning;
  private final Names names;
  private final JdbcClient jdbc;
  private final Clock clock;

  public GovernanceService(
      Access access,
      ApplicationStore applications,
      ProjectStore projects,
      OperationsService operations,
      PlanningService planning,
      Names names,
      JdbcClient jdbc,
      Clock clock) {
    this.access = access;
    this.applications = applications;
    this.projects = projects;
    this.operations = operations;
    this.planning = planning;
    this.names = names;
    this.jdbc = jdbc;
    this.clock = clock;
  }

  public PortfolioOverview overview() {
    access.current();
    Snapshot snapshot = snapshot();
    LocalDate today = LocalDate.now(clock);
    List<Application> live = snapshot.applications().stream().filter(Snapshot::live).toList();
    List<Risk> activeRisks =
        snapshot.risks().stream().filter(r -> Snapshot.activeRisk(r.status())).toList();
    List<Escalation> activeEscalations =
        snapshot.escalations().stream().filter(e -> Snapshot.activeEscalation(e.status())).toList();
    return new PortfolioOverview(
        new ApplicationCounts(
            snapshot.applications().size(),
            count(snapshot.applications().stream().filter(a -> a.lifecycle().equals("active"))),
            count(live.stream().filter(a -> a.criticality().equals("critical"))),
            count(live.stream().filter(a -> technicalOwner(a) == null)),
            count(live.stream().filter(a -> !reviewState(a, today).kind().equals("current")))),
        new ProjectCounts(
            snapshot.projects().size(),
            count(snapshot.projects().stream().filter(p -> p.status().equals("in-progress"))),
            count(
                snapshot.projects().stream()
                    .filter(
                        p ->
                            Snapshot.openProject(p)
                                && (p.health().equals("at-risk")
                                    || p.health().equals("critical"))))),
        new ActiveCounts(
            activeRisks.size(),
            count(activeRisks.stream().filter(r -> r.severity().equals("critical")))),
        new ActiveCounts(
            activeEscalations.size(),
            count(activeEscalations.stream().filter(e -> e.severity().equals("critical")))),
        Application.LIFECYCLES.stream()
            .map(
                lifecycle ->
                    new LifecycleCount(
                        lifecycle,
                        count(
                            snapshot.applications().stream()
                                .filter(a -> a.lifecycle().equals(lifecycle)))))
            .toList(),
        attention(snapshot, today),
        recentlyUpdated(snapshot),
        upcomingMilestones(snapshot, today));
  }

  public List<ApplicationHealthRow> healthReport() {
    access.current();
    Snapshot snapshot = snapshot();
    LocalDate today = LocalDate.now(clock);
    Map<Long, Technology> technologies = technologyIndex(snapshot);
    List<Risk> activeRisks =
        snapshot.risks().stream().filter(r -> Snapshot.activeRisk(r.status())).toList();
    List<Escalation> activeEscalations =
        snapshot.escalations().stream().filter(e -> Snapshot.activeEscalation(e.status())).toList();
    return snapshot.applications().stream()
        .map(
            app -> {
              Completeness.Result completeness = Completeness.evaluate(app);
              Map<Long, OutdatedTechnology> outdated = new LinkedHashMap<>();
              for (Application.TechnologyUsage usage : app.technologies()) {
                Technology tech = technologies.get(usage.technologyId());
                if (tech != null
                    && (tech.status().equals("deprecated") || tech.status().equals("retired"))) {
                  outdated.put(tech.id(), new OutdatedTechnology(tech.id(), tech.name(), tech.status()));
                }
              }
              return new ApplicationHealthRow(
                  app.id(),
                  app.name(),
                  app.code(),
                  app.lifecycle(),
                  app.criticality(),
                  Names.ref(snapshot.businessUnits(), app.businessUnitId()),
                  Names.ref(snapshot.people(), technicalOwner(app)),
                  completeness.score(),
                  completeness.missing().stream()
                      .filter(Completeness.Rule::required)
                      .map(Completeness.Rule::label)
                      .toList(),
                  completeness.missing().stream()
                      .filter(rule -> !rule.required())
                      .map(Completeness.Rule::label)
                      .toList(),
                  reviewState(app, today),
                  List.copyOf(outdated.values()),
                  count(activeRisks.stream().filter(r -> r.relatedApplicationIds().contains(app.id()))),
                  count(
                      activeEscalations.stream()
                          .filter(e -> e.relatedApplicationIds().contains(app.id()))));
            })
        .toList();
  }

  public PortfolioTrends trends(LocalDate from, int months, LocalDate today) {
    access.current();
    return Trends.build(snapshot(), from, months, today);
  }

  // ---------------------------------------------------------------------------------------------

  Snapshot snapshot() {
    List<Technology> technologies =
        jdbc.sql("SELECT * FROM technologies ORDER BY id")
            .query(
                (rs, row) ->
                    new Technology(
                        rs.getLong("id"),
                        rs.getString("name"),
                        rs.getString("category"),
                        rs.getString("description"),
                        rs.getString("status")))
            .list();
    return new Snapshot(
        applications.findAll(),
        projects.findAll(),
        operations.allRisks(),
        operations.allEscalations(),
        operations.allDecisions(),
        technologies,
        planning.allAllocations(),
        planning.allLeaves(),
        names.people(),
        names.businessUnits());
  }

  private static Map<Long, Technology> technologyIndex(Snapshot snapshot) {
    return snapshot.technologies().stream()
        .collect(Collectors.toMap(Technology::id, t -> t, (a, b) -> a, LinkedHashMap::new));
  }

  private static Long technicalOwner(Application application) {
    return PortfolioChildren.primaryHolder(application.roles(), "technical-owner");
  }

  /** Whole calendar days since the last review, in the organisation's time zone. */
  ReviewState reviewState(Application application, LocalDate today) {
    String reviewed = application.audit().lastReviewedAt();
    if (reviewed == null) {
      return new ReviewState("never-reviewed", null);
    }
    LocalDate day = OffsetDateTime.parse(reviewed).atZoneSameInstant(clock.getZone()).toLocalDate();
    int days = (int) ChronoUnit.DAYS.between(day, today);
    return new ReviewState(days > REVIEW_INTERVAL_DAYS ? "stale" : "current", days);
  }

  private static int rank(String severity) {
    return CRITICALITIES.indexOf(severity);
  }

  /**
   * Attention rules — each narrow so the list stays actionable: live applications without a
   * technical owner, overdue for review or on a retired technology; active high/critical risks;
   * active escalations; open projects with overdue milestones or critical health.
   */
  private List<AttentionItem> attention(Snapshot snapshot, LocalDate today) {
    Map<Long, String> applicationNames = new LinkedHashMap<>();
    snapshot.applications().forEach(a -> applicationNames.put(a.id(), a.name()));
    Map<Long, String> projectNames = new LinkedHashMap<>();
    snapshot.projects().forEach(p -> projectNames.put(p.id(), p.name()));
    Map<Long, Technology> technologies = technologyIndex(snapshot);
    String todayText = today.toString();
    List<AttentionItem> items = new ArrayList<>();

    for (Application app : snapshot.applications()) {
      if (!Snapshot.live(app)) {
        continue;
      }
      Subject subject = new Subject("application", app.id(), app.name());
      boolean important = app.criticality().equals("high") || app.criticality().equals("critical");
      if (technicalOwner(app) == null) {
        items.add(
            new AttentionItem(
                "owner-" + app.id(),
                "missing-technical-owner",
                important ? "high" : "medium",
                subject,
                "Teknik sahip atanmamış",
                null));
      }
      ReviewState review = reviewState(app, today);
      if (!review.kind().equals("current")) {
        items.add(
            new AttentionItem(
                "review-" + app.id(),
                "review-overdue",
                app.criticality().equals("critical") ? "medium" : "low",
                subject,
                review.kind().equals("never-reviewed")
                    ? "Bilgiler hiç gözden geçirilmemiş"
                    : "Son gözden geçirme " + review.daysSinceReview() + " gün önce",
                app.audit().lastReviewedAt()));
      }
      List<String> retired =
          app.technologies().stream()
              .map(usage -> technologies.get(usage.technologyId()))
              .filter(t -> t != null && t.status().equals("retired"))
              .map(Technology::name)
              .collect(Collectors.toCollection(LinkedHashSet::new))
              .stream()
              .toList();
      if (!retired.isEmpty()) {
        items.add(
            new AttentionItem(
                "retired-tech-" + app.id(),
                "retired-technology",
                "high",
                subject,
                "Emekli teknoloji kullanıyor: " + String.join(", ", retired),
                null));
      }
    }

    for (Risk risk : snapshot.risks()) {
      if (!Snapshot.activeRisk(risk.status()) || rank(risk.severity()) < rank("high")) {
        continue;
      }
      items.add(
          new AttentionItem(
              "risk-" + risk.id(),
              "critical-risk",
              risk.severity(),
              new Subject("risk", risk.id(), risk.title()),
              "Etkilenen: "
                  + describe(
                      risk.relatedApplicationIds(),
                      risk.relatedProjectIds(),
                      applicationNames,
                      projectNames),
              risk.dueDate()));
    }

    for (Escalation escalation : snapshot.escalations()) {
      if (!Snapshot.activeEscalation(escalation.status())) {
        continue;
      }
      items.add(
          new AttentionItem(
              "escalation-" + escalation.id(),
              "active-escalation",
              escalation.severity(),
              new Subject("escalation", escalation.id(), escalation.title()),
              "Etkilenen: "
                  + describe(
                      escalation.relatedApplicationIds(),
                      escalation.relatedProjectIds(),
                      applicationNames,
                      projectNames),
              escalation.targetResolutionDate()));
    }

    for (Project project : snapshot.projects()) {
      if (!Snapshot.openProject(project)) {
        continue;
      }
      Subject subject = new Subject("project", project.id(), project.name());
      for (Project.Milestone milestone : project.milestones()) {
        boolean overdue =
            milestone.status().equals("missed")
                || (!milestone.status().equals("completed")
                    && milestone.dueDate().compareTo(todayText) < 0);
        if (!overdue) {
          continue;
        }
        items.add(
            new AttentionItem(
                "milestone-" + milestone.id(),
                "overdue-milestone",
                project.priority().equals("critical") || project.priority().equals("high")
                    ? "high"
                    : "medium",
                subject,
                "“" + milestone.title() + "” kilometre taşı gecikmiş",
                milestone.dueDate()));
      }
      if (project.health().equals("critical")) {
        items.add(
            new AttentionItem(
                "health-" + project.id(),
                "project-health",
                "high",
                subject,
                "Proje sağlığı kritik",
                null));
      }
    }

    // Severity first, then oldest date first (undated last).
    items.sort(
        Comparator.<AttentionItem>comparingInt(item -> -rank(item.severity()))
            .thenComparing(item -> Objects.requireNonNullElse(item.date(), "￿"))
            .thenComparing(Collation.by(item -> item.subject().name())));
    return items;
  }

  private static String describe(
      List<Long> applicationIds,
      List<Long> projectIds,
      Map<Long, String> applicationNames,
      Map<Long, String> projectNames) {
    return Stream.concat(
            applicationIds.stream().map(id -> applicationNames.getOrDefault(id, "#" + id)),
            projectIds.stream().map(id -> projectNames.getOrDefault(id, "#" + id)))
        .collect(Collectors.joining(", "));
  }

  private static List<RecentlyUpdatedEntry> recentlyUpdated(Snapshot snapshot) {
    List<RecentlyUpdatedEntry> entries = new ArrayList<>();
    snapshot
        .applications()
        .forEach(
            a ->
                entries.add(
                    new RecentlyUpdatedEntry(
                        "application",
                        a.id(),
                        a.name(),
                        a.code(),
                        a.audit().updatedAt(),
                        person(snapshot, a.audit().updatedBy()))));
    snapshot
        .projects()
        .forEach(
            p ->
                entries.add(
                    new RecentlyUpdatedEntry(
                        "project",
                        p.id(),
                        p.name(),
                        p.code(),
                        p.audit().updatedAt(),
                        person(snapshot, p.audit().updatedBy()))));
    return entries.stream()
        .sorted((a, b) -> b.updatedAt().compareTo(a.updatedAt()))
        .limit(RECENTLY_UPDATED_LIMIT)
        .toList();
  }

  private static EntityRef person(Snapshot snapshot, Long id) {
    return Names.ref(snapshot.people(), id);
  }

  private static List<UpcomingMilestone> upcomingMilestones(Snapshot snapshot, LocalDate today) {
    String from = today.toString();
    String horizon = today.plusDays(UPCOMING_MILESTONE_DAYS).toString();
    List<UpcomingMilestone> upcoming = new ArrayList<>();
    for (Project project : snapshot.projects()) {
      if (!Snapshot.openProject(project)) {
        continue;
      }
      for (Project.Milestone m : project.milestones()) {
        if (!m.status().equals("completed")
            && m.dueDate().compareTo(from) >= 0
            && m.dueDate().compareTo(horizon) <= 0) {
          upcoming.add(
              new UpcomingMilestone(
                  project.id(), project.name(), m.id(), m.title(), m.dueDate(), m.status()));
        }
      }
    }
    upcoming.sort(Comparator.comparing(UpcomingMilestone::dueDate));
    return upcoming;
  }

  private static int count(Stream<?> rows) {
    return (int) rows.count();
  }
}
