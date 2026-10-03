package com.cerebro.api.access;

import com.cerebro.api.shared.error.UnauthenticatedException;
import java.util.Optional;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

/**
 * Who is calling: the authenticated identity (corporate SSO, or the demo sign-in locally) mapped to
 * an active Cerebro account by email. Having an SSO identity is not enough — the person needs an
 * active account with roles. Resolved once per request.
 */
@Component
public class CurrentUser {

  private static final String CACHE = CurrentUser.class.getName();

  private final AccountRepository accounts;

  public CurrentUser(AccountRepository accounts) {
    this.accounts = accounts;
  }

  public SessionUser require() {
    return find().orElseThrow(UnauthenticatedException::new);
  }

  /** The signed-in account, or empty for anonymous callers and identities without an account. */
  public Optional<SessionUser> find() {
    RequestAttributes request = RequestContextHolder.getRequestAttributes();
    if (request != null
        && request.getAttribute(CACHE, RequestAttributes.SCOPE_REQUEST) instanceof SessionUser user) {
      return Optional.of(user);
    }
    Optional<SessionUser> user = resolve();
    if (request != null) {
      user.ifPresent(found -> request.setAttribute(CACHE, found, RequestAttributes.SCOPE_REQUEST));
    }
    return user;
  }

  /** Drops the cached account (after sign-in or a change to the caller's own roles). */
  public void forget() {
    RequestAttributes request = RequestContextHolder.getRequestAttributes();
    if (request != null) {
      request.removeAttribute(CACHE, RequestAttributes.SCOPE_REQUEST);
    }
  }

  private Optional<SessionUser> resolve() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null
        || !authentication.isAuthenticated()
        || authentication instanceof AnonymousAuthenticationToken) {
      return Optional.empty();
    }
    String email =
        authentication.getPrincipal() instanceof OidcUser oidc
            ? oidc.getEmail()
            : authentication.getName();
    return email == null ? Optional.empty() : accounts.findActiveByEmail(email);
  }
}
