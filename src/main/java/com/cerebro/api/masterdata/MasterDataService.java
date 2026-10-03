package com.cerebro.api.masterdata;

import com.cerebro.api.access.Access;
import com.cerebro.api.masterdata.MasterDataCatalog.ListDefinition;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Administrable value lists. Readable by every signed-in user (every form needs them); changes
 * need {@code masterData:edit}.
 */
@Service
@Transactional
public class MasterDataService {

  private static final Pattern CODE = Pattern.compile("^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$");
  private static final Locale TURKISH = Locale.forLanguageTag("tr-TR");

  /** Where each list's codes are stored: one SELECT of codes per use. */
  private static final Map<String, List<String>> USES = new LinkedHashMap<>();

  static {
    use("applicationLifecycles", "SELECT lifecycle FROM applications");
    use("applicationTypes", "SELECT type FROM applications");
    use("operationalStatuses", "SELECT operational_status FROM applications");
    use("hostingModels", "SELECT hosting_model FROM applications");
    use("environmentTypes", "SELECT type FROM environments");
    use("environmentStatuses", "SELECT status FROM environments");
    use("sourceRepositoryTypes", "SELECT type FROM source_repositories");
    use(
        "technologyCategories",
        "SELECT category FROM technologies",
        "SELECT layer FROM technology_usages");
    use("technologyStatuses", "SELECT status FROM technologies");
    use("projectStatuses", "SELECT status FROM projects");
    use("projectHealths", "SELECT health FROM projects");
    use("projectTypes", "SELECT type FROM projects");
    use("projectPhases", "SELECT current_phase FROM projects");
    use("milestoneStatuses", "SELECT status FROM milestones");
    use("applicationImpactTypes", "SELECT impact_type FROM application_impacts");
    use("confidentialityLevels", "SELECT confidentiality FROM projects");
    use(
        "currencies",
        "SELECT currency FROM projects WHERE currency IS NOT NULL",
        "SELECT currency FROM demands WHERE estimated_budget IS NOT NULL",
        "SELECT currency FROM contracts");
    use(
        "criticalities",
        "SELECT criticality FROM applications",
        "SELECT priority FROM projects",
        "SELECT severity FROM risks",
        "SELECT probability FROM risks",
        "SELECT impact FROM risks",
        "SELECT severity FROM escalations",
        "SELECT criticality FROM dependencies",
        "SELECT urgency FROM demands");
    use(
        "stakeholderRoles",
        "SELECT role FROM role_assignments",
        "SELECT role FROM resource_allocations");
    use("teamResponsibilities", "SELECT responsibility FROM team_assignments");
    use("documentationLinkTypes", "SELECT type FROM documentation_links");
    use("riskCategories", "SELECT category FROM risks");
    use("riskStatuses", "SELECT status FROM risks");
    use("escalationStatuses", "SELECT status FROM escalations");
    use("decisionStatuses", "SELECT status FROM decisions");
    use("dependencyTypes", "SELECT type FROM dependencies");
    use("integrationTypes", "SELECT type FROM integrations");
    use("integrationFrequencies", "SELECT frequency FROM integrations");
    use("documentTypes", "SELECT document_type FROM attachments");
    use("runbookLinkTypes", "SELECT type FROM runbook_links");
    use("leaveTypes", "SELECT type FROM leave_records");
    use("demandStatuses", "SELECT status FROM demands");
    use("demandTypes", "SELECT type FROM demands");
    use("demandBenefitTypes", "SELECT code FROM demand_benefit_types");
    use("demandPriorities", "SELECT priority FROM demands WHERE priority IS NOT NULL");
    use("contractTypes", "SELECT type FROM contracts");
    use("contractStatuses", "SELECT status FROM contracts");
    use("billingFrequencies", "SELECT billing_frequency FROM contracts");
    use("paymentStatuses", "SELECT status FROM contract_payments");
  }

  private static void use(String list, String... selects) {
    USES.put(list, List.of(selects));
  }

  private final JdbcClient jdbc;
  private final Access access;
  private final MasterDataCatalog catalog;

  public MasterDataService(JdbcClient jdbc, Access access, MasterDataCatalog catalog) {
    this.jdbc = jdbc;
    this.access = access;
    this.catalog = catalog;
  }

  /** Every list with its items in display order, lists in catalogue order. */
  @Transactional(readOnly = true)
  public List<MasterDataItem.List> listAll() {
    access.current();
    Map<String, List<MasterDataItem>> items = new LinkedHashMap<>();
    // Lists in the order they were seeded (oldest first value), then any list still empty.
    jdbc.sql(
            "SELECT * FROM master_data_items i ORDER BY (SELECT min(f.id) FROM"
                + " master_data_items f WHERE f.list_key = i.list_key), sort_order, id")
        .query(
            rs -> {
              items
                  .computeIfAbsent(rs.getString("list_key"), key -> new ArrayList<>())
                  .add(item(rs));
            });
    catalog.lists().forEach(list -> items.putIfAbsent(list.key(), new ArrayList<>()));
    return items.entrySet().stream()
        .map(entry -> new MasterDataItem.List(entry.getKey(), entry.getValue()))
        .toList();
  }

  /** How many records use each code of {@code key}. */
  @Transactional(readOnly = true)
  public Map<String, Integer> usage(String key) {
    access.current();
    return countUsage(definition(key).key());
  }

  /**
   * Replaces the items of one list (order included).
   *
   * @throws ValidationException when a system value is missing or deactivated, a code or label is
   *     duplicated, or a removed value is still used by records
   */
  public MasterDataItem.List update(String key, List<MasterDataItem> input) {
    access.require("masterData:edit");
    ListDefinition definition = definition(key);
    List<MasterDataItem> current = items(key);
    Set<Long> owned = new HashSet<>(current.stream().map(MasterDataItem::id).toList());
    input.stream()
        .filter(item -> item.id() != null && !owned.contains(item.id()))
        .findFirst()
        .ifPresent(
            foreign -> {
              throw new ValidationException("Geçersiz değer kimliği: " + foreign.id() + ".");
            });
    List<MasterDataItem> next =
        input.stream()
            .map(
                item ->
                    new MasterDataItem(
                        item.id(),
                        trim(item.code()),
                        trim(item.label()),
                        trim(item.description()),
                        definition.colored() ? item.variant() : null,
                        item.active()))
            .toList();
    validate(definition, next, current);
    save(key, next);
    return new MasterDataItem.List(key, items(key));
  }

  private void validate(
      ListDefinition definition, List<MasterDataItem> items, List<MasterDataItem> current) {
    Set<String> codes = new HashSet<>();
    Set<String> labels = new HashSet<>();
    for (int index = 0; index < items.size(); index++) {
      MasterDataItem item = items.get(index);
      String row = (index + 1) + ". satır";
      String prefix = "items." + index + ".";
      if (!CODE.matcher(item.code()).matches()) {
        throw new ValidationException(
            row + ": kod yalnızca harf, rakam, kısa çizgi ve alt çizgi içerebilir.",
            prefix + "code");
      }
      if (!codes.add(item.code())) {
        throw new ValidationException(
            row + ": \"" + item.code() + "\" kodu listede birden fazla kez var.", prefix + "code");
      }
      String label = item.label();
      if (label.isEmpty()) {
        throw new ValidationException(row + ": ad zorunludur.", prefix + "label");
      }
      if (!labels.add(label.toLowerCase(TURKISH))) {
        throw new ValidationException(
            row + ": \"" + label + "\" adı listede zaten var.", prefix + "label");
      }
      if (definition.colored() && !MasterDataCatalog.VARIANTS.contains(item.variant())) {
        throw new ValidationException(row + ": bir renk seçin.", prefix + "variant");
      }
      if (definition.systemCodes().contains(item.code()) && !item.active()) {
        throw new ValidationException(
            row + ": \"" + label + "\" sistem değeridir ve pasife alınamaz.", prefix + "active");
      }
    }
    List<String> missingSystem =
        definition.systemCodes().stream().filter(code -> !codes.contains(code)).toList();
    if (!missingSystem.isEmpty()) {
      throw new ValidationException(
          "Sistem değerleri silinemez: " + String.join(", ", missingSystem) + ".");
    }
    if (!definition.extensible()
        && codes.stream().anyMatch(code -> !definition.systemCodes().contains(code))) {
      throw new ValidationException("Bu listeye yeni değer eklenemez.");
    }
    Map<String, Integer> usage = countUsage(definition.key());
    current.stream()
        .filter(item -> !codes.contains(item.code()) && usage.getOrDefault(item.code(), 0) > 0)
        .findFirst()
        .ifPresent(
            removed -> {
              throw new ValidationException(
                  "\""
                      + removed.label()
                      + "\" "
                      + usage.get(removed.code())
                      + " kayıtta kullanılıyor; silmek yerine pasife alın.");
            });
  }

  private void save(String key, List<MasterDataItem> items) {
    List<Long> kept = items.stream().map(MasterDataItem::id).filter(id -> id != null).toList();
    jdbc.sql("DELETE FROM master_data_items WHERE list_key = :key AND NOT (id = ANY(:kept))")
        .param("key", key)
        .param("kept", Sql.longs(kept))
        .update();
    // Labels are unique per list: park the kept ones so values can swap labels in one save.
    jdbc.sql(
            "UPDATE master_data_items SET label = '#parked-' || id::text, sort_order = -id::int"
                + " WHERE list_key = :key")
        .param("key", key)
        .update();
    for (int index = 0; index < items.size(); index++) {
      MasterDataItem item = items.get(index);
      String sql =
          item.id() == null
              ? "INSERT INTO master_data_items (list_key, code, label, description, variant,"
                  + " active, sort_order) VALUES (:key, :code, :label, :description, :variant,"
                  + " :active, :order)"
              : "UPDATE master_data_items SET code = :code, label = :label,"
                  + " description = :description, variant = :variant, active = :active,"
                  + " sort_order = :order WHERE id = :id AND list_key = :key";
      jdbc.sql(sql)
          .param("key", key)
          .param("id", item.id())
          .param("code", item.code())
          .param("label", item.label())
          .param("description", item.description())
          .param("variant", item.variant())
          .param("active", item.active())
          .param("order", index + 1)
          .update();
    }
  }

  private Map<String, Integer> countUsage(String key) {
    List<String> selects = USES.getOrDefault(key, List.of());
    Map<String, Integer> usage = new LinkedHashMap<>();
    if (selects.isEmpty()) {
      return usage;
    }
    jdbc.sql(
            "SELECT code, count(*) AS uses FROM ("
                + String.join(" UNION ALL ", selects)
                + ") AS used(code) GROUP BY code ORDER BY code")
        .query(
            rs -> {
              usage.put(rs.getString("code"), rs.getInt("uses"));
            });
    return usage;
  }

  private List<MasterDataItem> items(String key) {
    return jdbc.sql("SELECT * FROM master_data_items WHERE list_key = :key ORDER BY sort_order, id")
        .param("key", key)
        .query((rs, row) -> item(rs))
        .list();
  }

  private static MasterDataItem item(java.sql.ResultSet rs) throws java.sql.SQLException {
    return new MasterDataItem(
        rs.getLong("id"),
        rs.getString("code"),
        rs.getString("label"),
        rs.getString("description"),
        rs.getString("variant"),
        rs.getBoolean("active"));
  }

  private ListDefinition definition(String key) {
    return catalog.find(key).orElseThrow(() -> new NotFoundException("Değer listesi", key));
  }

  private static String trim(String value) {
    return value == null ? "" : value.trim();
  }
}
