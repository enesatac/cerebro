package com.cerebro.api.organisation;

/**
 * A person known to Cerebro. Roles are not stored here — they exist in the context of an
 * application or project; team membership is owned by the team.
 */
public record Person(
    long id,
    String fullName,
    String jobTitle,
    String email,
    Long businessUnitId,
    String location) {

  public record Input(
      String fullName, String jobTitle, String email, Long businessUnitId, String location) {}
}
