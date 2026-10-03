package com.cerebro.api.portfolio;

/** A person holding a role in the context of an application or project. */
public record RoleAssignment(Long id, long personId, String role) {}
