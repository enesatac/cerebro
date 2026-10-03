package com.cerebro.api.shared;

/**
 * Audit metadata carried by every aggregate ({@code AuditMetadata} in the frontend). {@code *By}
 * are person ids, {@code null} when the acting account is not linked to a person.
 */
public record Audit(
    String createdAt,
    Long createdBy,
    String updatedAt,
    Long updatedBy,
    String lastReviewedAt,
    Long lastReviewedBy) {}
