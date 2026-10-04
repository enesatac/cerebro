package com.cerebro.api.technologies;

/** A catalogued technology and the organisation's stance on it. */
public record Technology(long id, String name, String category, String description, String status) {

  public record Input(String name, String category, String description, String status) {}

  /** Catalogue row with where-used information. */
  public record ListItem(
      long id,
      String name,
      String category,
      String description,
      String status,
      int applicationCount,
      int activeApplicationCount) {}
}
