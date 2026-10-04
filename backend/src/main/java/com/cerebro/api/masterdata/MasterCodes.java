package com.cerebro.api.masterdata;

import com.cerebro.api.shared.error.ValidationException;
import java.util.Collection;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

/**
 * Server-side check used by entity writes: every stored code must exist in its list. Inactive
 * values are accepted only when the record already had them, so old records stay editable.
 */
@Component
public class MasterCodes {

  /** Codes of one list stored on a record, and the form field they come from. */
  public record Check(String list, Collection<String> codes, String field) {

    public static Check of(String list, String code, String field) {
      return new Check(list, code == null ? List.of() : List.of(code), field);
    }
  }

  private final JdbcClient jdbc;
  private final MasterDataCatalog catalog;

  public MasterCodes(JdbcClient jdbc, MasterDataCatalog catalog) {
    this.jdbc = jdbc;
    this.catalog = catalog;
  }

  /** {@code previous} holds the checks of the stored record on update (empty on create). */
  public void assertAll(List<Check> checks, List<Check> previous) {
    for (Check check : checks) {
      List<String> before =
          previous.stream()
              .filter(p -> p.list().equals(check.list()))
              .flatMap(p -> p.codes().stream())
              .toList();
      assertCodes(check.list(), check.codes(), check.field(), before);
    }
  }

  public void assertCodes(
      String list, Collection<String> codes, String field, Collection<String> previous) {
    Map<String, Boolean> active = new HashMap<>();
    jdbc.sql("SELECT code, active FROM master_data_items WHERE list_key = :list")
        .param("list", list)
        .query(rs -> {
          active.put(rs.getString("code"), rs.getBoolean("active"));
        });
    List<String> invalid =
        codes.stream()
            .filter(
                code ->
                    code == null
                        || !active.containsKey(code)
                        || (!active.get(code) && !previous.contains(code)))
            .map(code -> Objects.toString(code, ""))
            .toList();
    if (!invalid.isEmpty()) {
      throw new ValidationException(
          "Geçersiz veya pasif değer ("
              + catalog.get(list).label()
              + "): "
              + new LinkedHashSet<>(invalid).stream().collect(Collectors.joining(", "))
              + ".",
          field);
    }
  }
}
