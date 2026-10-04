package com.cerebro.api.connections;

import com.cerebro.api.shared.Audit;
import java.util.List;

/** {@code sourceApplicationId} depends on {@code targetApplicationId}. */
public record Dependency(
    long id,
    long sourceApplicationId,
    long targetApplicationId,
    String type,
    String criticality,
    String description,
    Audit audit) {

  public record Input(
      long sourceApplicationId,
      long targetApplicationId,
      String type,
      String criticality,
      String description) {}

  /** Dependencies of one application, split by direction. */
  public record OfApplication(List<Dependency> outgoing, List<Dependency> incoming) {}
}
