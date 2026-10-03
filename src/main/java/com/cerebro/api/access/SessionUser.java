package com.cerebro.api.access;

import com.cerebro.api.shared.Audit;
import java.util.List;

/**
 * The signed-in account with what its roles allow, resolved on every request so role changes apply
 * without signing in again. Same shape as the frontend's {@code SessionUser}; privileges are in
 * catalogue order.
 */
public record SessionUser(
    long id,
    String displayName,
    String email,
    List<Long> roleIds,
    Long personId,
    boolean active,
    String lastSignInAt,
    Audit audit,
    List<String> roleNames,
    List<String> privileges) {

  public boolean has(String privilege) {
    return active && privileges.contains(privilege);
  }

  public boolean hasAny(String... wanted) {
    for (String privilege : wanted) {
      if (has(privilege)) {
        return true;
      }
    }
    return false;
  }
}
