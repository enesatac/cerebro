package com.cerebro.api.governance;

import com.cerebro.api.applications.Application;
import com.cerebro.api.portfolio.PortfolioChildren;
import java.util.List;
import java.util.function.Predicate;

/**
 * Application data-quality rules ({@code applicationCompleteness.ts}). Required rules weigh 3,
 * recommended rules 1 — a missing owner matters more than a missing dashboard link.
 */
final class Completeness {

  record Rule(
      String id,
      String label,
      boolean required,
      int weight,
      Predicate<Application> appliesTo,
      Predicate<Application> satisfied) {}

  record Result(int score, List<Rule> missing) {}

  private static final Predicate<Application> ALWAYS = application -> true;

  private static boolean vendorHosted(Application a) {
    return a.hosting().model().equals("saas");
  }

  private static boolean preProduction(Application a) {
    return a.lifecycle().equals("planned") || a.lifecycle().equals("development");
  }

  private static boolean retired(Application a) {
    return a.lifecycle().equals("retired");
  }

  static final List<Rule> RULES =
      List.of(
          new Rule(
              "technical-owner",
              "Teknik sahip",
              true,
              3,
              ALWAYS,
              a -> PortfolioChildren.primaryHolder(a.roles(), "technical-owner") != null),
          new Rule(
              "business-owner",
              "İş sahibi",
              true,
              3,
              ALWAYS,
              a -> PortfolioChildren.primaryHolder(a.roles(), "business-owner") != null),
          new Rule("business-unit", "İş birimi", true, 3, ALWAYS, a -> a.businessUnitId() != null),
          new Rule(
              "description",
              "Açıklama ve amaç",
              true,
              3,
              ALWAYS,
              a -> !a.shortDescription().trim().isEmpty() && !a.businessPurpose().trim().isEmpty()),
          new Rule("development-team", "Sorumlu ekip", true, 3, ALWAYS, a -> !a.teams().isEmpty()),
          new Rule(
              "technologies",
              "Teknolojiler",
              false,
              1,
              a -> !vendorHosted(a),
              a -> !a.technologies().isEmpty()),
          new Rule(
              "repository",
              "Kaynak kod deposu",
              false,
              1,
              a -> !vendorHosted(a) && !retired(a),
              a -> !a.repositories().isEmpty()),
          new Rule(
              "production-environment",
              "Canlı ortam",
              false,
              1,
              a -> !preProduction(a) && !retired(a),
              a -> a.environments().stream().anyMatch(e -> e.type().equals("production"))),
          new Rule(
              "documentation",
              "Dokümantasyon",
              false,
              1,
              ALWAYS,
              a -> !a.documentation().isEmpty()));

  private Completeness() {}

  static Result evaluate(Application application) {
    List<Rule> applicable = RULES.stream().filter(r -> r.appliesTo().test(application)).toList();
    int total = applicable.stream().mapToInt(Rule::weight).sum();
    int satisfied =
        applicable.stream()
            .filter(r -> r.satisfied().test(application))
            .mapToInt(Rule::weight)
            .sum();
    List<Rule> missing =
        applicable.stream().filter(r -> !r.satisfied().test(application)).toList();
    int score = total == 0 ? 100 : (int) Math.round((double) satisfied / total * 100);
    return new Result(score, missing);
  }
}
