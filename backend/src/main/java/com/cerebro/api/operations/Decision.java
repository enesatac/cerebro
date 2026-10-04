package com.cerebro.api.operations;

import com.cerebro.api.shared.Audit;
import java.util.List;

/** Lightweight architecture decision record. */
public record Decision(
    long id,
    String title,
    String context,
    String decision,
    String rationale,
    List<String> alternatives,
    String consequences,
    String decisionDate,
    List<Long> decidedByIds,
    String status,
    List<Long> relatedProjectIds,
    List<Long> relatedApplicationIds,
    Audit audit) {

  public record Input(
      String title,
      String context,
      String decision,
      String rationale,
      List<String> alternatives,
      String consequences,
      String decisionDate,
      List<Long> decidedByIds,
      String status,
      List<Long> relatedProjectIds,
      List<Long> relatedApplicationIds)
      implements Related {

    public Input {
      relatedProjectIds = relatedProjectIds == null ? List.of() : relatedProjectIds;
      relatedApplicationIds = relatedApplicationIds == null ? List.of() : relatedApplicationIds;
      alternatives = alternatives == null ? List.of() : alternatives;
      decidedByIds = decidedByIds == null ? List.of() : decidedByIds;
    }
  }
}
