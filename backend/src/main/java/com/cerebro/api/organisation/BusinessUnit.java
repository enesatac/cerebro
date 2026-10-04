package com.cerebro.api.organisation;

/** An organisational unit that owns applications, projects and demands. */
public record BusinessUnit(long id, String code, String name, String description, Long headId) {

  public record Input(String code, String name, String description, Long headId) {}
}
