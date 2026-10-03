package com.cerebro.api.contracts;

import com.cerebro.api.shared.Audit;

/** A supplier. Business contacts only — never credentials or bank details. */
public record Vendor(
    long id,
    String name,
    String taxNumber,
    String contactName,
    String contactEmail,
    String contactPhone,
    String website,
    String notes,
    Audit audit) {

  public record Input(
      String name,
      String taxNumber,
      String contactName,
      String contactEmail,
      String contactPhone,
      String website,
      String notes) {

    /** Trimmed, e-mail lower-cased, missing text as empty. */
    public Input clean() {
      return new Input(
          t(name), t(taxNumber), t(contactName), t(contactEmail).toLowerCase(), t(contactPhone),
          t(website), t(notes));
    }

    private static String t(String value) {
      return value == null ? "" : value.trim();
    }
  }
}
