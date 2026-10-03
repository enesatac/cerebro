package com.cerebro.api.access;

import com.cerebro.api.shared.error.ForbiddenException;
import org.springframework.stereotype.Component;

/**
 * Privilege checks for controllers and services, by screen privilege code
 * ({@code "projects:edit"}). Usable in {@code @PreAuthorize("@access.has('projects:edit')")} or
 * imperatively with {@link #require(String)} — every write and every read of restricted data must
 * pass through one of them.
 */
@Component("access")
public class Access {

  private final CurrentUser currentUser;

  public Access(CurrentUser currentUser) {
    this.currentUser = currentUser;
  }

  public boolean has(String privilege) {
    return currentUser.require().has(privilege);
  }

  /** The caller, when they hold {@code privilege}; otherwise 403. */
  public SessionUser require(String privilege) {
    SessionUser user = currentUser.require();
    if (!user.has(privilege)) {
      throw new ForbiddenException();
    }
    return user;
  }
}
