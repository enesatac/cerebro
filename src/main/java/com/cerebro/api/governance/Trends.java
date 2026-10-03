package com.cerebro.api.governance;

import com.cerebro.api.applications.Application;
import com.cerebro.api.governance.GovernanceModels.CategoryCount;
import com.cerebro.api.governance.GovernanceModels.PortfolioTrends;
import com.cerebro.api.governance.GovernanceModels.RiskCell;
import com.cerebro.api.governance.GovernanceModels.TrendSeries;
import com.cerebro.api.operations.Escalation;
import com.cerebro.api.planning.Allocation;
import com.cerebro.api.planning.LeaveRecord;
import com.cerebro.api.projects.Project;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.technologies.Technology;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Monthly series and current distributions for the reports ({@code trends.ts}). Past months use
 * what happened (actual dates); months after today use plans, so the charts show history and
 * outlook together.
 */
final class Trends {

  /** Statuses of projects that will not run, so they never count as active. */
  private static final Set<String> NOT_RUNNING = Set.of("cancelled", "rejected");

  private static final int TOP_TECHNOLOGIES = 10;

  private record Month(LocalDate from, LocalDate to) {}

  private Trends() {}

  static PortfolioTrends build(Snapshot source, LocalDate first, int count, LocalDate today) {
    List<Month> months =
        IntStream.range(0, Math.max(0, count))
            .mapToObj(
                index -> {
                  LocalDate start = first.plusMonths(index);
                  return new Month(start, start.withDayOfMonth(start.lengthOfMonth()));
                })
            .toList();
    int currentMonthIndex = monthOf(months, today);

    List<Integer> activeProjects =
        months.stream()
            .map(
                month ->
                    (int)
                        source.projects().stream()
                            .filter(
                                project -> {
                                  if (NOT_RUNNING.contains(project.status())) {
                                    return false;
                                  }
                                  String start =
                                      first(
                                          project.timeline().actualStartDate(),
                                          project.timeline().plannedStartDate());
                                  String end =
                                      first(
                                          project.timeline().actualEndDate(),
                                          project.timeline().plannedEndDate());
                                  return start != null
                                      && start.compareTo(month.to().toString()) <= 0
                                      && (end == null || end.compareTo(month.from().toString()) >= 0);
                                })
                            .count())
            .toList();

    List<Integer> escalationsOpenAtMonthEnd = new ArrayList<>();
    for (Month month : months) {
      if (month.from().isAfter(today)) {
        escalationsOpenAtMonthEnd.add(null);
        continue;
      }
      LocalDate cutoff = month.to().isBefore(today) ? month.to() : today;
      escalationsOpenAtMonthEnd.add(
          (int)
              source.escalations().stream()
                  .filter(
                      e -> {
                        LocalDate raised = raisedOn(e);
                        if (raised.isAfter(cutoff)) {
                          return false;
                        }
                        if (e.resolvedOn() != null) {
                          return LocalDate.parse(e.resolvedOn()).isAfter(cutoff);
                        }
                        return Snapshot.activeEscalation(e.status());
                      })
                  .count());
    }

    List<Double> medianDays =
        months.stream()
            .map(
                month ->
                    median(
                        source.escalations().stream()
                            .filter(e -> e.resolvedOn() != null && within(e.resolvedOn(), month))
                            .map(
                                e ->
                                    (double)
                                        ChronoUnit.DAYS.between(
                                            raisedOn(e), LocalDate.parse(e.resolvedOn())))
                            .toList()))
            .toList();

    List<Long> projectIds =
        source.allocations().stream().map(Allocation::projectId).distinct().sorted().toList();
    List<TrendSeries> capacityByProject =
        projectIds.stream()
            .map(
                projectId ->
                    new TrendSeries(
                        String.valueOf(projectId),
                        months.stream()
                            .map(
                                month -> {
                                  int capacity = workingDays(month.from(), month.to());
                                  double fte =
                                      source.allocations().stream()
                                          .filter(a -> a.projectId() == projectId)
                                          .mapToDouble(
                                              a ->
                                                  overlapDays(a.startDate(), a.endDate(), month)
                                                      * a.percent()
                                                      / 100.0)
                                          .sum();
                                  return capacity == 0
                                      ? 0.0
                                      : Math.round(fte / capacity * 10) / 10.0;
                                })
                            .toList()))
            .toList();

    Set<Long> people =
        source.allocations().stream()
            .map(Allocation::personId)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    List<Integer> overallocatedPeople =
        months.stream()
            .map(
                month ->
                    (int)
                        people.stream()
                            .filter(personId -> overallocated(source.allocations(), personId, month))
                            .count())
            .toList();

    Set<String> leaveTypes =
        source.leaves().stream()
            .map(LeaveRecord::type)
            .collect(Collectors.toCollection(LinkedHashSet::new));
    List<TrendSeries> leaveDaysByType =
        leaveTypes.stream()
            .map(
                type ->
                    new TrendSeries(
                        type,
                        months.stream()
                            .map(
                                month ->
                                    source.leaves().stream()
                                        .filter(l -> l.type().equals(type))
                                        .mapToInt(l -> overlapDays(l.startDate(), l.endDate(), month))
                                        .sum())
                            .toList()))
            .toList();

    Map<Long, String> technologyNames =
        source.technologies().stream()
            .collect(Collectors.toMap(Technology::id, Technology::name, (a, b) -> a));
    List<Application> live = source.applications().stream().filter(Snapshot::live).toList();

    List<CategoryCount> byUnit =
        counts(live, a -> String.valueOf(a.businessUnitId() == null ? 0 : a.businessUnitId()))
            .stream()
            .map(
                c ->
                    new CategoryCount(
                        c.key(),
                        source.businessUnits().getOrDefault(Long.valueOf(c.key()), "İş birimi yok"),
                        c.value()))
            .sorted(Comparator.comparingInt(CategoryCount::value).reversed())
            .toList();

    List<Long> usedTechnologies =
        live.stream()
            .flatMap(
                a ->
                    a.technologies().stream()
                        .map(Application.TechnologyUsage::technologyId)
                        .collect(Collectors.toCollection(LinkedHashSet::new))
                        .stream())
            .toList();
    List<CategoryCount> topTechnologies =
        counts(usedTechnologies, String::valueOf).stream()
            .map(
                c ->
                    new CategoryCount(
                        c.key(),
                        technologyNames.getOrDefault(Long.valueOf(c.key()), "#" + c.key()),
                        c.value()))
            .sorted(
                Comparator.comparingInt(CategoryCount::value)
                    .reversed()
                    .thenComparing(Collation.by(CategoryCount::label)))
            .limit(TOP_TECHNOLOGIES)
            .toList();

    List<RiskCell> riskMatrix =
        counts(
                source.risks().stream().filter(r -> Snapshot.activeRisk(r.status())).toList(),
                r -> r.probability() + "|" + r.impact())
            .stream()
            .map(
                c -> {
                  String[] parts = c.key().split("\\|", -1);
                  return new RiskCell(parts[0], parts.length > 1 ? parts[1] : "", c.value());
                })
            .toList();

    return new PortfolioTrends(
        months.stream().map(m -> m.from().toString()).toList(),
        currentMonthIndex,
        activeProjects,
        countByMonth(
            source.projects().stream().flatMap(p -> p.milestones().stream()).toList(),
            months,
            Project.Milestone::dueDate,
            Project.Milestone::status),
        countByMonth(
            source.escalations(), months, e -> e.raisedAt().substring(0, 10), Escalation::severity),
        escalationsOpenAtMonthEnd,
        medianDays,
        countByMonth(
            source.risks(),
            months,
            r -> r.audit().createdAt().substring(0, 10),
            r -> r.severity()),
        countByMonth(source.decisions(), months, d -> d.decisionDate(), d -> d.status()),
        capacityByProject,
        overallocatedPeople,
        leaveDaysByType,
        counts(source.applications(), Application::lifecycle),
        counts(live, Application::criticality),
        byUnit,
        counts(source.projects(), Project::status),
        counts(
            source.projects().stream().filter(p -> !NOT_RUNNING.contains(p.status())).toList(),
            Project::health),
        topTechnologies,
        riskMatrix);
  }

  private static String first(String a, String b) {
    return a != null ? a : b;
  }

  /** The raising day as recorded (the UTC date of the timestamp, as the frontend slices it). */
  private static LocalDate raisedOn(Escalation escalation) {
    return LocalDate.parse(escalation.raisedAt().substring(0, 10));
  }

  private static int monthOf(List<Month> months, LocalDate date) {
    for (int i = 0; i < months.size(); i++) {
      if (!date.isBefore(months.get(i).from()) && !date.isAfter(months.get(i).to())) {
        return i;
      }
    }
    return -1;
  }

  private static boolean within(String date, Month month) {
    LocalDate day = LocalDate.parse(date);
    return !day.isBefore(month.from()) && !day.isAfter(month.to());
  }

  /** Monday–Friday days in {@code [start, end]}. */
  static int workingDays(LocalDate start, LocalDate end) {
    if (end.isBefore(start)) {
      return 0;
    }
    int days = 0;
    for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
      if (day.getDayOfWeek() != DayOfWeek.SATURDAY && day.getDayOfWeek() != DayOfWeek.SUNDAY) {
        days++;
      }
    }
    return days;
  }

  private static int overlapDays(String start, String end, Month month) {
    LocalDate from = max(LocalDate.parse(start), month.from());
    LocalDate to = min(LocalDate.parse(end), month.to());
    return from.isAfter(to) ? 0 : workingDays(from, to);
  }

  private static LocalDate max(LocalDate a, LocalDate b) {
    return a.isAfter(b) ? a : b;
  }

  private static LocalDate min(LocalDate a, LocalDate b) {
    return a.isBefore(b) ? a : b;
  }

  private static boolean overallocated(List<Allocation> allocations, long personId, Month month) {
    List<Allocation> own =
        allocations.stream()
            .filter(
                a ->
                    a.personId() == personId
                        && a.startDate().compareTo(month.to().toString()) <= 0
                        && a.endDate().compareTo(month.from().toString()) >= 0)
            .toList();
    if (own.size() < 2) {
      return own.stream().anyMatch(a -> a.percent() > 100);
    }
    for (LocalDate day = month.from(); !day.isAfter(month.to()); day = day.plusDays(1)) {
      String date = day.toString();
      int load =
          own.stream()
              .filter(a -> a.startDate().compareTo(date) <= 0 && date.compareTo(a.endDate()) <= 0)
              .mapToInt(Allocation::percent)
              .sum();
      if (load > 100) {
        return true;
      }
    }
    return false;
  }

  private static Double median(List<Double> values) {
    if (values.isEmpty()) {
      return null;
    }
    List<Double> sorted = values.stream().sorted().toList();
    int mid = sorted.size() / 2;
    return sorted.size() % 2 == 1 ? sorted.get(mid) : (sorted.get(mid - 1) + sorted.get(mid)) / 2;
  }

  /** Counts per month, split by {@code keyOf}; keys keep first-seen order. */
  private static <T> List<TrendSeries> countByMonth(
      Collection<T> rows,
      List<Month> months,
      Function<T, String> dateOf,
      Function<T, String> keyOf) {
    Map<String, int[]> series = new LinkedHashMap<>();
    for (T row : rows) {
      String date = dateOf.apply(row);
      int index = date == null ? -1 : monthOf(months, LocalDate.parse(date));
      if (index == -1) {
        continue;
      }
      series.computeIfAbsent(keyOf.apply(row), key -> new int[months.size()])[index]++;
    }
    return series.entrySet().stream()
        .map(
            entry ->
                new TrendSeries(
                    entry.getKey(), IntStream.of(entry.getValue()).boxed().toList()))
        .toList();
  }

  private static <T> List<CategoryCount> counts(Collection<T> rows, Function<T, String> keyOf) {
    Map<String, Integer> counts = new LinkedHashMap<>();
    for (T row : rows) {
      counts.merge(Objects.toString(keyOf.apply(row)), 1, Integer::sum);
    }
    return counts.entrySet().stream()
        .map(entry -> new CategoryCount(entry.getKey(), null, entry.getValue()))
        .toList();
  }
}
