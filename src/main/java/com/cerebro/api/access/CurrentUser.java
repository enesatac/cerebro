package com.cerebro.api.access;

import com.cerebro.api.shared.error.UnauthenticatedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

/**
 * Who is calling: the authenticated identity (corporate SSO, or the dev account locally) mapped to
 * an active Cerebro account by email. Having an SSO identity is not enough — the person needs an
 * active account with roles.
 */
@Component
public class CurrentUser {

  private final AccountRepository accounts;

  public CurrentUser(AccountRepository accounts) {
    this.accounts = accounts;
  }

  public SessionUser require() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null || !authentication.isAuthenticated()) {
      throw new UnauthenticatedException();
    }
    String email =
        authentication.getPrincipal() instanceof OidcUser oidc
            ? oidc.getEmail()
            : authentication.getName();
    return accounts.findActiveByEmail(email).orElseThrow(UnauthenticatedException::new);
  }
}
