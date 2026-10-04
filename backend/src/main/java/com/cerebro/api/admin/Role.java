package com.cerebro.api.admin;

import com.cerebro.api.shared.Audit;
import java.util.List;

/** A named bundle of privileges; a user's access is the union of their roles. */
public record Role(
    long id,
    String name,
    String description,
    List<String> privileges,
    boolean system,
    int userCount,
    Audit audit) {

  public record Input(String name, String description, List<String> privileges) {}
}
