package com.cerebro.api.organisation;

import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.EntityRef;
import java.util.List;

public record Team(
    long id,
    String name,
    String description,
    Long managerId,
    List<Long> memberIds,
    String contactEmail,
    String chatChannel,
    List<String> responsibilities,
    Audit audit) {

  public record Input(
      String name,
      String description,
      Long managerId,
      List<Long> memberIds,
      String contactEmail,
      String chatChannel,
      List<String> responsibilities) {}

  /** Team row with ownership counts. */
  public record ListItem(
      long id,
      String name,
      String description,
      EntityRef manager,
      int memberCount,
      int applicationCount,
      int projectCount,
      String contactEmail,
      String chatChannel) {}
}
