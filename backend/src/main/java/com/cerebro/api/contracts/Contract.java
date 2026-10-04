package com.cerebro.api.contracts;

import com.cerebro.api.shared.Audit;
import java.math.BigDecimal;
import java.util.List;

/**
 * A purchase or contract made for a project: who supplies what, for how long, at what value, and
 * how it is paid. The signed contract, offers and invoices are attachments.
 */
public record Contract(
    long id,
    String code,
    String title,
    long projectId,
    long vendorId,
    String type,
    String status,
    String description,
    Long ownerId,
    String purchaseOrderNumber,
    String signedDate,
    String startDate,
    String endDate,
    Integer noticePeriodDays,
    boolean autoRenewal,
    BigDecimal totalValue,
    String currency,
    String billingFrequency,
    List<Long> relatedApplicationIds,
    List<Payment> payments,
    Audit audit) {

  /** One instalment of the payment plan. */
  public record Payment(
      Long id,
      String description,
      String dueDate,
      BigDecimal amount,
      String status,
      String invoiceNumber,
      String paidDate) {}

  public record Input(
      String title,
      long projectId,
      long vendorId,
      String type,
      String status,
      String description,
      Long ownerId,
      String purchaseOrderNumber,
      String signedDate,
      String startDate,
      String endDate,
      Integer noticePeriodDays,
      boolean autoRenewal,
      BigDecimal totalValue,
      String currency,
      String billingFrequency,
      List<Long> relatedApplicationIds,
      List<Payment> payments) {

    public Input {
      title = title == null ? "" : title;
      description = description == null ? "" : description;
      purchaseOrderNumber = purchaseOrderNumber == null ? "" : purchaseOrderNumber;
      relatedApplicationIds = relatedApplicationIds == null ? List.of() : relatedApplicationIds;
      payments = payments == null ? List.of() : payments;
    }
  }
}
