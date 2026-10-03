package com.cerebro.api.access;

/**
 * Access levels, each including the ones before it: {@code VIEW} (read-only), {@code EDIT} (create
 * and change) and {@code DELETE}.
 */
public enum AccessLevel {
  VIEW("view"),
  EDIT("edit"),
  DELETE("delete");

  private final String code;

  AccessLevel(String code) {
    this.code = code;
  }

  public String code() {
    return code;
  }
}
