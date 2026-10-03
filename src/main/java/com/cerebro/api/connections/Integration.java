package com.cerebro.api.connections;

import com.cerebro.api.shared.Audit;
import java.util.List;

/**
 * A concrete technical interface: {@code fromApplicationId} initiates or produces; the receiver is
 * another application or an external party.
 */
public record Integration(
    long id,
    String name,
    String type,
    long fromApplicationId,
    Long toApplicationId,
    String externalPartyName,
    String frequency,
    String description,
    String dataExchanged,
    Audit audit) {

  public record Input(
      String name,
      String type,
      long fromApplicationId,
      Long toApplicationId,
      String externalPartyName,
      String frequency,
      String description,
      String dataExchanged) {}

  public record OfApplication(List<Integration> outbound, List<Integration> inbound) {}
}
