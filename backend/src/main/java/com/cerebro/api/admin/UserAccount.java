package com.cerebro.api.admin;

import com.cerebro.api.shared.Audit;
import java.util.List;

/** A Cerebro login, optionally linked to the person it represents ({@code UserAccount}). */
public record UserAccount(
    long id,
    String displayName,
    String email,
    List<Long> roleIds,
    Long personId,
    boolean active,
    String lastSignInAt,
    Audit audit) {

  public record Input(
      String displayName, String email, List<Long> roleIds, Long personId, boolean active) {}
}
