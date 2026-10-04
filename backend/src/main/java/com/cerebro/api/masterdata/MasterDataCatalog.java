package com.cerebro.api.masterdata;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

/**
 * The administrable value lists and the rules on them: which codes the logic relies on (they
 * cannot be deleted or deactivated), whether admins may add values, whether values carry a colour.
 * Generated from the frontend catalogue ({@code domains/master-data/catalog.ts}) into {@code
 * master-data-catalog.json}.
 */
@Component
public class MasterDataCatalog {

  /** Badge colours an administrator may pick (Takeoff {@code Badge} variants). */
  public static final List<String> VARIANTS =
      List.of(
          "neutral", "info", "primary", "secondary", "success", "warning", "danger", "purple",
          "cyan", "teal", "business", "dark");

  public record ListDefinition(
      String key, String label, List<String> systemCodes, boolean extensible, boolean colored) {}

  private final Map<String, ListDefinition> lists = new LinkedHashMap<>();

  public MasterDataCatalog() {
    try (InputStream in = new ClassPathResource("master-data-catalog.json").getInputStream()) {
      List<ListDefinition> definitions =
          JsonMapper.builder().build().readValue(in, new TypeReference<List<ListDefinition>>() {});
      definitions.forEach(definition -> lists.put(definition.key(), definition));
    } catch (IOException e) {
      throw new UncheckedIOException(e);
    }
  }

  public List<ListDefinition> lists() {
    return List.copyOf(lists.values());
  }

  public Optional<ListDefinition> find(String key) {
    return Optional.ofNullable(lists.get(key));
  }

  public ListDefinition get(String key) {
    ListDefinition definition = lists.get(key);
    if (definition == null) {
      throw new IllegalArgumentException("Unknown master data list " + key);
    }
    return definition;
  }
}
