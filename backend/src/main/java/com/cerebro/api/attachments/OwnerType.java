package com.cerebro.api.attachments;

import com.cerebro.api.shared.error.ValidationException;
import java.util.Arrays;

/**
 * Records that can hold files, each with its own nullable foreign key in {@code attachments}, and
 * the screen whose privileges govern them.
 */
enum OwnerType {
  APPLICATION("application", "applications", "applications", "Uygulama"),
  PROJECT("project", "projects", "projects", "Proje"),
  TEAM("team", "teams", "teams", "Ekip"),
  TECHNOLOGY("technology", "technologies", "technologies", "Teknoloji"),
  RISK("risk", "risks", "risks", "Risk"),
  ESCALATION("escalation", "escalations", "risks", "Eskalasyon"),
  DECISION("decision", "decisions", "risks", "Karar"),
  DEMAND("demand", "demands", "demandManagement", "Talep"),
  CONTRACT("contract", "contracts", "contracts", "Sözleşme");

  final String code;
  final String table;
  final String module;
  final String label;

  OwnerType(String code, String table, String module, String label) {
    this.code = code;
    this.table = table;
    this.module = module;
    this.label = label;
  }

  /** The {@code attachments} column holding this owner's id. */
  String column() {
    return code + "_id";
  }

  /** Who may read the files: whoever may view the record's screen. */
  String[] viewPrivileges() {
    return this == DEMAND
        ? new String[] {"demands:view", "demandManagement:view"}
        : new String[] {module + ":view"};
  }

  static OwnerType of(String code) {
    return Arrays.stream(values())
        .filter(type -> type.code.equals(code))
        .findFirst()
        .orElseThrow(() -> new ValidationException("Geçersiz kayıt türü: " + code + ".", "owner"));
  }
}
