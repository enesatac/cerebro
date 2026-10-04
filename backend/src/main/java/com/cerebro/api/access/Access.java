package com.cerebro.api.access;

import com.cerebro.api.shared.error.ForbiddenException;
import org.springframework.stereotype.Component;

/**
 * Privilege checks by screen privilege code ({@code "projects:edit"}). Every write and every read
 * of restricted data passes through one of them; the frontend only mirrors these rules.
 */
@Component("access")
public class Access {

  private final CurrentUser currentUser;

  public Access(CurrentUser currentUser) {
    this.currentUser = currentUser;
  }

  /** The signed-in account (any privileges); 401 without one. */
  public SessionUser current() {
    return currentUser.require();
  }

  public boolean has(String privilege) {
    return currentUser.require().has(privilege);
  }

  /** The caller, when they hold {@code privilege}; otherwise 403. */
  public SessionUser require(String privilege) {
    return requireAny(privilege);
  }

  /** The caller, when they hold at least one of {@code privileges}; otherwise 403. */
  public SessionUser requireAny(String... privileges) {
    SessionUser user = currentUser.require();
    if (!user.hasAny(privileges)) {
      throw new ForbiddenException();
    }
    return user;
  }
}
