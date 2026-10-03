package com.cerebro.api.access;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

/**
 * The signed-in account with what its roles allow, resolved on every request so role changes apply
 * without signing in again. Same shape as the frontend's {@code SessionUser}.
 */
public record SessionUser(
    long id,
    String displayName,
    String email,
    List<Long> roleIds,
    Long personId,
    boolean active,
    OffsetDateTime lastSignInAt,
    List<String> roleNames,
    Set<String> privileges) {

  public boolean has(String privilege) {
    return active && privileges.contains(privilege);
  }
}
