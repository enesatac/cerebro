package com.cerebro.api.contracts;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Sql.Keyed;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Contracts and suppliers. Commercial terms are not open to every user: reading needs {@code
 * contracts:view}, changes {@code contracts:edit}, deleting {@code contracts:delete}.
 */
@Service
@Transactional
public class ContractService {

  private static final Pattern EMAIL = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
  private static final Pattern TAX_NUMBER = Pattern.compile("^\\d{10,11}$");

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public ContractService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  // ---------------------------------------------------------------------------------------------
  // Contracts
  // ---------------------------------------------------------------------------------------------

  /** Contracts, optionally of one project or vendor, newest start first (undated first). */
  @Transactional(readOnly = true)
  public List<Contract> list(Long projectId, Long vendorId) {
    access.require("contracts:view");
    Map<String, Object> params = new HashMap<>();
    String where = "WHERE 1 = 1";
    if (projectId != null) {
      where += " AND project_id = :project";
      params.put("project", projectId);
    }
    if (vendorId != null) {
      where += " AND vendor_id = :vendor";
      params.put("vendor", vendorId);
    }
    return load(where, params).stream()
        .sorted(
            (a, b) ->
                Objects.requireNonNullElse(b.startDate(), "9999")
                    .compareTo(Objects.requireNonNullElse(a.startDate(), "9999")))
        .toList();
  }

  @Transactional(readOnly = true)
  public Contract get(long id) {
    access.require("contracts:view");
    return find(id);
  }

  public Contract create(Contract.Input input) {
    SessionUser user = access.require("contracts:edit");
    validate(input, null);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO contracts (title, project_id, vendor_id, type, status,"
                        + " description, owner_person_id, purchase_order_number, signed_date,"
                        + " start_date, end_date, notice_period_days, auto_renewal, total_value,"
                        + " currency, billing_frequency, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:title, :project, :vendor, :type, :status, :description,"
                        + " :owner, :po, :signed, :start, :end, :notice, :autoRenewal, :total,"
                        + " :currency, :billing, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .params(columns(input)));
    saveChildren(id, input);
    return find(id);
  }

  public Contract update(long id, Contract.Input input) {
    SessionUser user = access.require("contracts:edit");
    Contract current = find(id);
    validate(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE contracts SET title = :title, project_id = :project, vendor_id = :vendor,"
                    + " type = :type, status = :status, description = :description,"
                    + " owner_person_id = :owner, purchase_order_number = :po, signed_date ="
                    + " :signed, start_date = :start, end_date = :end, notice_period_days ="
                    + " :notice, auto_renewal = :autoRenewal, total_value = :total, currency ="
                    + " :currency, billing_frequency = :billing, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(columns(input))
        .param("id", id)
        .update();
    saveChildren(id, input);
    return find(id);
  }

  public void remove(long id) {
    access.require("contracts:delete");
    find(id);
    jdbc.sql("DELETE FROM contracts WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.require("contracts:view");
    find(id);
    long files =
        jdbc.sql("SELECT count(*) FROM attachments WHERE contract_id = :id")
            .param("id", id)
            .query(Long.class)
            .single();
    return DeletionImpact.of(DeletionImpact.ref("ek dosya (silinir)", files));
  }

  private void validate(Contract.Input input, Contract previous) {
    if (input.title().isBlank()) {
      throw new ValidationException("Başlık zorunludur.", "title");
    }
    assertText(input.title(), "title", 200, "Başlık");
    assertText(input.description(), "description", 4000, "Kapsam");
    assertText(input.purchaseOrderNumber(), "purchaseOrderNumber", 60, "Sipariş numarası");
    checks.assertRefs(List.of(input.projectId()), "projects", "proje", "projectId");
    checks.assertRefs(List.of(input.vendorId()), "vendors", "tedarikçi", "vendorId");
    checks.assertRefs(Collections.singletonList(input.ownerId()), "people", "kişi", "ownerId");
    checks.assertRefs(
        input.relatedApplicationIds(), "applications", "uygulama", "relatedApplicationIds");
    codes.assertAll(
        codeChecks(
            input.type(),
            input.status(),
            input.currency(),
            input.billingFrequency(),
            input.payments()),
        previous == null
            ? List.of()
            : codeChecks(
                previous.type(),
                previous.status(),
                previous.currency(),
                previous.billingFrequency(),
                previous.payments()));
    assertDate(input.signedDate(), "signedDate");
    assertDate(input.startDate(), "startDate");
    assertDate(input.endDate(), "endDate");
    if (input.startDate() != null
        && input.endDate() != null
        && input.endDate().compareTo(input.startDate()) < 0) {
      throw new ValidationException("Bitiş başlangıçtan önce olamaz.", "endDate");
    }
    if ("active".equals(input.status()) && input.startDate() == null) {
      throw new ValidationException(
          "Yürürlükteki sözleşmenin başlangıç tarihi olmalıdır.", "startDate");
    }
    if (input.noticePeriodDays() != null && input.noticePeriodDays() < 0) {
      throw new ValidationException("İhbar süresi gün olarak girilmelidir.", "noticePeriodDays");
    }
    if (input.noticePeriodDays() != null
        && input.noticePeriodDays() > 0
        && input.endDate() == null) {
      throw new ValidationException("İhbar süresi için bitiş tarihi gereklidir.", "endDate");
    }
    if (input.totalValue() != null && input.totalValue().signum() < 0) {
      throw new ValidationException("Bedel sıfır veya pozitif olmalıdır.", "totalValue");
    }
    BigDecimal scheduled = BigDecimal.ZERO;
    for (int index = 0; index < input.payments().size(); index++) {
      Contract.Payment payment = input.payments().get(index);
      String field = "payments." + index;
      assertDate(payment.dueDate(), field + ".dueDate");
      if (payment.dueDate() == null) {
        throw new ValidationException("Geçerli bir tarih girin.", field + ".dueDate");
      }
      assertDate(payment.paidDate(), field + ".paidDate");
      if (payment.amount() == null || payment.amount().signum() <= 0) {
        throw new ValidationException("Tutar sıfırdan büyük olmalıdır.", field + ".amount");
      }
      if ("paid".equals(payment.status()) && payment.paidDate() == null) {
        throw new ValidationException(
            "Ödenen taksitin ödeme tarihini girin.", field + ".paidDate");
      }
      assertText(n(payment.description()), field + ".description", 200, "Açıklama");
      assertText(n(payment.invoiceNumber()), field + ".invoiceNumber", 60, "Fatura numarası");
      if (!"cancelled".equals(payment.status())) {
        scheduled = scheduled.add(payment.amount());
      }
    }
    if (input.totalValue() != null && scheduled.compareTo(input.totalValue()) > 0) {
      throw new ValidationException("Ödeme planı toplamı sözleşme bedelini aşamaz.", "payments");
    }
  }

  private static List<Check> codeChecks(
      String type,
      String status,
      String currency,
      String billingFrequency,
      List<Contract.Payment> payments) {
    return List.of(
        Check.of("contractTypes", type, "type"),
        Check.of("contractStatuses", status, "status"),
        Check.of("currencies", currency, "currency"),
        Check.of("billingFrequencies", billingFrequency, "billingFrequency"),
        new Check(
            "paymentStatuses", payments.stream().map(Contract.Payment::status).toList(), "payments"));
  }

  private static void assertText(String value, String field, int max, String label) {
    if (value.length() > max) {
      throw new ValidationException(label + " en fazla " + max + " karakter olabilir.", field);
    }
    if (Texts.looksLikeSecret(value)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, field);
    }
  }

  private static void assertDate(String value, String field) {
    if (value != null && !Times.isIsoDate(value)) {
      throw new ValidationException("Geçerli bir tarih girin.", field);
    }
  }

  private static String n(String value) {
    return value == null ? "" : value;
  }

  private static Map<String, Object> columns(Contract.Input input) {
    Map<String, Object> columns = new HashMap<>();
    columns.put("title", input.title().trim());
    columns.put("project", input.projectId());
    columns.put("vendor", input.vendorId());
    columns.put("type", input.type());
    columns.put("status", input.status());
    columns.put("description", input.description().trim());
    columns.put("owner", input.ownerId());
    columns.put("po", input.purchaseOrderNumber().trim());
    columns.put("signed", Times.parseDate(input.signedDate()));
    columns.put("start", Times.parseDate(input.startDate()));
    columns.put("end", Times.parseDate(input.endDate()));
    columns.put("notice", input.noticePeriodDays());
    columns.put("autoRenewal", Sql.flag(input.autoRenewal()));
    columns.put("total", input.totalValue());
    columns.put("currency", input.currency());
    columns.put("billing", input.billingFrequency());
    return columns;
  }

  private void saveChildren(long id, Contract.Input input) {
    jdbc.sql("DELETE FROM contract_applications WHERE contract_id = :id").param("id", id).update();
    int position = 0;
    for (Long application : new LinkedHashSet<>(input.relatedApplicationIds())) {
      jdbc.sql(
              "INSERT INTO contract_applications (contract_id, application_id, sort_order) VALUES"
                  + " (:id, :app, :position)")
          .param("id", id)
          .param("app", application)
          .param("position", position++)
          .update();
    }
    ChildRows.replace(
        jdbc,
        "contract_payments",
        "contract_id",
        id,
        input.payments(),
        Contract.Payment::id,
        "contract_id, description, due_date, amount, status, invoice_number, paid_date",
        ":parent, :description, :due, :amount, :status, :invoice, :paid",
        (s, row, index) ->
            s.param("description", n(row.description()))
                .param("due", Times.parseDate(row.dueDate()))
                .param("amount", row.amount())
                .param("status", row.status())
                .param("invoice", n(row.invoiceNumber()))
                .param("paid", Times.parseDate(row.paidDate())));
  }

  /** The reference shown to users, derived from the id: {@code SZL-0007}. */
  static String code(long id) {
    return String.format("SZL-%04d", id);
  }

  private Contract find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Sözleşme", id));
  }

  private List<Contract> load(String where, Map<String, Object> params) {
    String filter = " WHERE contract_id IN (SELECT id FROM contracts " + where + ")";
    Map<Long, List<Long>> applications = new HashMap<>();
    jdbc.sql(
            "SELECT contract_id, application_id FROM contract_applications"
                + filter
                + " ORDER BY sort_order, application_id")
        .params(params)
        .query(
            rs -> {
              applications
                  .computeIfAbsent(rs.getLong("contract_id"), k -> new ArrayList<>())
                  .add(rs.getLong("application_id"));
            });
    Map<Long, List<Contract.Payment>> payments =
        Sql.group(
            jdbc.sql("SELECT * FROM contract_payments" + filter + " ORDER BY due_date, id")
                .params(params)
                .query(
                    (rs, row) ->
                        new Keyed<>(
                            rs.getLong("contract_id"),
                            new Contract.Payment(
                                rs.getLong("id"),
                                Sql.text(rs, "description"),
                                Sql.date(rs, "due_date"),
                                Sql.decimal(rs, "amount"),
                                rs.getString("status"),
                                Sql.text(rs, "invoice_number"),
                                Sql.date(rs, "paid_date"))))
                .list());
    return jdbc.sql("SELECT * FROM contracts " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Contract(
                  id,
                  code(id),
                  rs.getString("title"),
                  rs.getLong("project_id"),
                  rs.getLong("vendor_id"),
                  rs.getString("type"),
                  rs.getString("status"),
                  Sql.text(rs, "description"),
                  Sql.longOrNull(rs, "owner_person_id"),
                  Sql.text(rs, "purchase_order_number"),
                  Sql.date(rs, "signed_date"),
                  Sql.date(rs, "start_date"),
                  Sql.date(rs, "end_date"),
                  Sql.intOrNull(rs, "notice_period_days"),
                  rs.getBoolean("auto_renewal"),
                  Sql.decimal(rs, "total_value"),
                  rs.getString("currency"),
                  rs.getString("billing_frequency"),
                  applications.getOrDefault(id, List.of()),
                  payments.getOrDefault(id, List.of()),
                  Sql.audit(rs));
            })
        .list();
  }

  // ---------------------------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------------------------

  @Transactional(readOnly = true)
  public List<Vendor> vendors() {
    access.require("contracts:view");
    return loadVendors("", Map.of()).stream().sorted(Collation.by(Vendor::name)).toList();
  }

  public Vendor createVendor(Vendor.Input raw) {
    SessionUser user = access.require("contracts:edit");
    validateVendor(raw, null);
    Vendor.Input input = raw.clean();
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO vendors (name, tax_number, contact_name, contact_email,"
                        + " contact_phone, website, notes, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:name, :tax, :contact, :email, :phone, :website, :notes, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                stamp.created(user))
            .params(vendorColumns(input)));
    return findVendor(id);
  }

  public Vendor updateVendor(long id, Vendor.Input raw) {
    SessionUser user = access.require("contracts:edit");
    Vendor current = findVendor(id);
    validateVendor(raw, id);
    Sql.audit(
            jdbc.sql(
                "UPDATE vendors SET name = :name, tax_number = :tax, contact_name = :contact,"
                    + " contact_email = :email, contact_phone = :phone, website = :website, notes"
                    + " = :notes, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .params(vendorColumns(raw.clean()))
        .param("id", id)
        .update();
    return findVendor(id);
  }

  public void removeVendor(long id) {
    access.require("contracts:delete");
    findVendor(id);
    DeletionImpact impact = vendorImpact(id);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM vendors WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact vendorDeletionImpact(long id) {
    access.require("contracts:view");
    findVendor(id);
    return vendorImpact(id);
  }

  private DeletionImpact vendorImpact(long id) {
    long used =
        jdbc.sql("SELECT count(*) FROM contracts WHERE vendor_id = :id")
            .param("id", id)
            .query(Long.class)
            .single();
    return DeletionImpact.of(
        used > 0 ? "Bu tedarikçinin sözleşmeleri var. Önce sözleşmeleri silin veya taşıyın." : null,
        DeletionImpact.ref("sözleşme", used));
  }

  private void validateVendor(Vendor.Input raw, Long excludeId) {
    Vendor.Input input = raw.clean();
    if (input.name().isEmpty()) {
      throw new ValidationException("Firma adı zorunludur.", "name");
    }
    checks.assertUnique(
        "vendors",
        "name",
        input.name(),
        excludeId,
        "\"" + input.name() + "\" adında bir tedarikçi zaten var.",
        "name");
    if (!input.taxNumber().isEmpty() && !TAX_NUMBER.matcher(input.taxNumber()).matches()) {
      throw new ValidationException("Vergi numarası 10 veya 11 haneli olmalıdır.", "taxNumber");
    }
    if (!input.contactEmail().isEmpty() && !EMAIL.matcher(input.contactEmail()).matches()) {
      throw new ValidationException("Geçerli bir e-posta adresi girin.", "contactEmail");
    }
    if (!input.website().isEmpty() && !Texts.isHttpUrl(input.website())) {
      throw new ValidationException("Tam bir http(s) adresi girin.", "website");
    }
    assertText(input.notes(), "notes", 1000, "Not");
  }

  private static Map<String, Object> vendorColumns(Vendor.Input input) {
    return Map.of(
        "name", input.name(),
        "tax", input.taxNumber(),
        "contact", input.contactName(),
        "email", input.contactEmail(),
        "phone", input.contactPhone(),
        "website", input.website(),
        "notes", input.notes());
  }

  private Vendor findVendor(long id) {
    return loadVendors("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException("Tedarikçi", id));
  }

  private List<Vendor> loadVendors(String where, Map<String, Object> params) {
    return jdbc.sql("SELECT * FROM vendors " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) ->
                new Vendor(
                    rs.getLong("id"),
                    rs.getString("name"),
                    Sql.text(rs, "tax_number"),
                    Sql.text(rs, "contact_name"),
                    Sql.text(rs, "contact_email"),
                    Sql.text(rs, "contact_phone"),
                    Sql.text(rs, "website"),
                    Sql.text(rs, "notes"),
                    Sql.audit(rs)))
        .list();
  }
}
