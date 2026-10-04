package com.cerebro.api.search;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Texts;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Global search. Results only come from screens the user may view. */
@Service
@Transactional(readOnly = true)
public class SearchService {

  static final int DEFAULT_LIMIT = 20;

  private static final Map<String, String> KIND_PRIVILEGE =
      Map.of(
          "application", "applications:view",
          "project", "projects:view",
          "team", "teams:view",
          "person", "people:view",
          "technology", "technologies:view");

  private final JdbcClient jdbc;
  private final Access access;

  public SearchService(JdbcClient jdbc, Access access) {
    this.jdbc = jdbc;
    this.access = access;
  }

  public List<SearchResult> search(String term, List<String> kinds, Integer limit) {
    SessionUser user = access.current();
    if (term == null || term.isBlank()) {
      return List.of();
    }
    List<SearchResult> results = new ArrayList<>();
    if (wants("application", kinds, user)) {
      jdbc.sql("SELECT id, name, code, short_description, tags FROM applications ORDER BY id")
          .query(
              rs -> {
                List<String> fields =
                    new ArrayList<>(
                        List.of(
                            rs.getString("name"),
                            rs.getString("code"),
                            Sql.text(rs, "short_description")));
                fields.addAll(Sql.jsonList(rs, "tags"));
                if (Texts.matchesSearch(term, fields)) {
                  results.add(
                      new SearchResult(
                          "application",
                          rs.getLong("id"),
                          rs.getString("name"),
                          rs.getString("code"),
                          Sql.text(rs, "short_description")));
                }
              });
    }
    if (wants("project", kinds, user)) {
      jdbc.sql("SELECT id, name, code, short_name, description, tags FROM projects ORDER BY id")
          .query(
              rs -> {
                List<String> fields =
                    new ArrayList<>(
                        List.of(
                            rs.getString("name"),
                            rs.getString("code"),
                            Sql.text(rs, "short_name"),
                            Sql.text(rs, "description")));
                fields.addAll(Sql.jsonList(rs, "tags"));
                if (Texts.matchesSearch(term, fields)) {
                  results.add(
                      new SearchResult(
                          "project",
                          rs.getLong("id"),
                          rs.getString("name"),
                          rs.getString("code"),
                          Sql.text(rs, "description")));
                }
              });
    }
    if (wants("team", kinds, user)) {
      jdbc.sql("SELECT id, name, description FROM teams ORDER BY id")
          .query(
              rs -> {
                if (Texts.matchesSearch(
                    term, List.of(rs.getString("name"), Sql.text(rs, "description")))) {
                  results.add(
                      new SearchResult(
                          "team",
                          rs.getLong("id"),
                          rs.getString("name"),
                          "Ekip",
                          Sql.text(rs, "description")));
                }
              });
    }
    if (wants("person", kinds, user)) {
      jdbc.sql("SELECT id, full_name, job_title FROM people ORDER BY id")
          .query(
              rs -> {
                if (Texts.matchesSearch(
                    term, List.of(rs.getString("full_name"), Sql.text(rs, "job_title")))) {
                  results.add(
                      new SearchResult(
                          "person",
                          rs.getLong("id"),
                          rs.getString("full_name"),
                          Sql.text(rs, "job_title"),
                          null));
                }
              });
    }
    if (wants("technology", kinds, user)) {
      jdbc.sql("SELECT id, name, category, description FROM technologies ORDER BY id")
          .query(
              rs -> {
                if (Texts.matchesSearch(term, List.of(rs.getString("name")))) {
                  results.add(
                      new SearchResult(
                          "technology",
                          rs.getLong("id"),
                          rs.getString("name"),
                          rs.getString("category"),
                          Sql.text(rs, "description")));
                }
              });
    }
    int max = limit == null ? DEFAULT_LIMIT : Math.max(0, limit);
    return results.size() > max ? List.copyOf(results.subList(0, max)) : results;
  }

  private static boolean wants(String kind, List<String> kinds, SessionUser user) {
    return (kinds == null || kinds.isEmpty() || kinds.contains(kind))
        && user.has(KIND_PRIVILEGE.get(kind));
  }
}
