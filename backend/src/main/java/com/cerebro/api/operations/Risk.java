package com.cerebro.api.operations;

import com.cerebro.api.shared.Audit;
import java.util.List;

public record Risk(
    long id,
    String title,
    String description,
    String category,
    String probability,
    String impact,
    String severity,
    String status,
    Long ownerId,
    String mitigationPlan,
    String dueDate,
    List<Long> relatedProjectIds,
    List<Long> relatedApplicationIds,
    Audit audit) {

  public record Input(
      String title,
      String description,
      String category,
      String probability,
      String impact,
      String severity,
      String status,
      Long ownerId,
      String mitigationPlan,
      String dueDate,
      List<Long> relatedProjectIds,
      List<Long> relatedApplicationIds)
      implements Related {

    public Input {
      relatedProjectIds = relatedProjectIds == null ? List.of() : relatedProjectIds;
      relatedApplicationIds = relatedApplicationIds == null ? List.of() : relatedApplicationIds;
    }
  }
}
