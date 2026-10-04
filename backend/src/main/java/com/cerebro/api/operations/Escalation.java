package com.cerebro.api.operations;

import com.cerebro.api.shared.Audit;
import java.util.List;

public record Escalation(
    long id,
    String title,
    String description,
    String severity,
    String status,
    Long ownerId,
    Long responsibleTeamId,
    long raisedById,
    String raisedAt,
    String targetResolutionDate,
    String resolution,
    String resolvedOn,
    List<Long> relatedProjectIds,
    List<Long> relatedApplicationIds,
    Audit audit) {

  public record Input(
      String title,
      String description,
      String severity,
      String status,
      Long ownerId,
      Long responsibleTeamId,
      long raisedById,
      String raisedAt,
      String targetResolutionDate,
      String resolution,
      String resolvedOn,
      List<Long> relatedProjectIds,
      List<Long> relatedApplicationIds)
      implements Related {

    public Input {
      relatedProjectIds = relatedProjectIds == null ? List.of() : relatedProjectIds;
      relatedApplicationIds = relatedApplicationIds == null ? List.of() : relatedApplicationIds;
    }
  }
}
