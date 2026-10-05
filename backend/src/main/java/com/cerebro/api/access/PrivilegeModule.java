package com.cerebro.api.access;

import static com.cerebro.api.access.AccessLevel.DELETE;
import static com.cerebro.api.access.AccessLevel.EDIT;
import static com.cerebro.api.access.AccessLevel.VIEW;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * The privilege catalogue: one module per screen and the levels it supports. Mirrors the
 * frontend's {@code PRIVILEGE_MODULES} (cerebro: src/domains/auth/types) and the {@code access_privileges}
 * table seeded by {@code V2__privileges_and_system_role.sql} and later seed migrations; {@code PrivilegeCatalogTest} keeps the
 * three in step.
 */
public enum PrivilegeModule {
  DASHBOARD("dashboard", VIEW),
  PROJECTS("projects", VIEW, EDIT, DELETE),
  APPLICATIONS("applications", VIEW, EDIT, DELETE),
  RELEASES("releases", VIEW, EDIT, DELETE),
  CONNECTIONS("connections", VIEW, EDIT, DELETE),
  RISKS("risks", VIEW, EDIT, DELETE),
  CONTRACTS("contracts", VIEW, EDIT, DELETE),
  PROCUREMENT("procurement", VIEW, EDIT),
  REPORTS("reports", VIEW),
  TEAMS("teams", VIEW, EDIT, DELETE),
  PEOPLE("people", VIEW, EDIT, DELETE),
  TECHNOLOGIES("technologies", VIEW, EDIT, DELETE),
  RESOURCES("resources", VIEW, EDIT),
  LEAVES("leaves", VIEW, EDIT),
  DEMANDS("demands", VIEW, EDIT),
  DEMAND_MANAGEMENT("demandManagement", VIEW, EDIT, DELETE),
  MASTER_DATA("masterData", VIEW, EDIT),
  USERS("users", VIEW, EDIT),
  ROLES("roles", VIEW, EDIT);

  private final String id;
  private final List<AccessLevel> levels;

  PrivilegeModule(String id, AccessLevel... levels) {
    this.id = id;
    this.levels = List.of(levels);
  }

  public String id() {
    return id;
  }

  public List<AccessLevel> levels() {
    return levels;
  }

  /** {@code "<module>:<level>"}, the code stored in {@code role_privileges}. */
  public String privilege(AccessLevel level) {
    if (!levels.contains(level)) {
      throw new IllegalArgumentException(id + " has no " + level.code() + " level");
    }
    return id + ":" + level.code();
  }

  public static Optional<PrivilegeModule> byId(String id) {
    return Arrays.stream(values()).filter(module -> module.id.equals(id)).findFirst();
  }

  /** Every privilege code in catalogue order. */
  public static List<String> allPrivileges() {
    return Arrays.stream(values())
        .flatMap(module -> module.levels.stream().map(module::privilege))
        .toList();
  }
}
