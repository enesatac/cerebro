package com.cerebro.api.operations;

import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * The {@code <kind>_applications} / {@code <kind>_projects} link tables of risks, escalations and
 * decisions.
 */
@Component
class RelatedLinks {

  /** Which register: the prefix of its link tables and of the owner column. */
  enum Kind {
    RISK("risk"),
    ESCALATION("escalation"),
    DECISION("decision");

    final String prefix;

    Kind(String prefix) {
      this.prefix = prefix;
    }
  }

  record Links(Map<Long, List<Long>> applications, Map<Long, List<Long>> projects) {

    List<Long> applicationsOf(long id) {
      return applications.getOrDefault(id, List.of());
    }

    List<Long> projectsOf(long id) {
      return projects.getOrDefault(id, List.of());
    }
  }

  private final JdbcClient jdbc;
  private final Checks checks;

  RelatedLinks(JdbcClient jdbc, Checks checks) {
    this.jdbc = jdbc;
    this.checks = checks;
  }

  Links load(Kind kind) {
    return new Links(load(kind, "applications", "application_id"), load(kind, "projects", "project_id"));
  }

  private Map<Long, List<Long>> load(Kind kind, String suffix, String column) {
    Map<Long, List<Long>> links = new HashMap<>();
    jdbc.sql(
            "SELECT "
                + kind.prefix
                + "_id AS owner, "
                + column
                + " AS target FROM "
                + kind.prefix
                + "_"
                + suffix
                + " ORDER BY id")
        .query(
            rs -> {
              links.computeIfAbsent(rs.getLong("owner"), k -> new ArrayList<>()).add(rs.getLong("target"));
            });
    return links;
  }

  void save(Kind kind, long ownerId, Related input) {
    save(kind, ownerId, "applications", "application_id", input.relatedApplicationIds());
    save(kind, ownerId, "projects", "project_id", input.relatedProjectIds());
  }

  private void save(Kind kind, long ownerId, String suffix, String column, List<Long> ids) {
    String table = kind.prefix + "_" + suffix;
    jdbc.sql("DELETE FROM " + table + " WHERE " + kind.prefix + "_id = :owner")
        .param("owner", ownerId)
        .update();
    for (Long id : new LinkedHashSet<>(ids)) {
      jdbc.sql(
              "INSERT INTO "
                  + table
                  + " ("
                  + kind.prefix
                  + "_id, "
                  + column
                  + ") VALUES (:owner, :target)")
          .param("owner", ownerId)
          .param("target", id)
          .update();
    }
  }

  /** Every linked id exists, and at least one application or project is linked. */
  void validate(Related input) {
    checks.assertRefs(
        input.relatedApplicationIds(), "applications", "uygulama", "relatedApplicationIds");
    checks.assertRefs(input.relatedProjectIds(), "projects", "proje", "relatedProjectIds");
    if (input.relatedApplicationIds().size() + input.relatedProjectIds().size() == 0) {
      throw new ValidationException(
          "En az bir uygulama veya proje bağlayın.", "relatedApplicationIds");
    }
  }

  /** SQL condition on the owner alias {@code o} for the list filters. */
  static String filter(Kind kind, Long applicationId, Long projectId) {
    StringBuilder where = new StringBuilder("WHERE 1 = 1");
    if (applicationId != null) {
      where
          .append(" AND EXISTS (SELECT 1 FROM ")
          .append(kind.prefix)
          .append("_applications l WHERE l.")
          .append(kind.prefix)
          .append("_id = o.id AND l.application_id = :applicationId)");
    }
    if (projectId != null) {
      where
          .append(" AND EXISTS (SELECT 1 FROM ")
          .append(kind.prefix)
          .append("_projects l WHERE l.")
          .append(kind.prefix)
          .append("_id = o.id AND l.project_id = :projectId)");
    }
    return where.toString();
  }
}
