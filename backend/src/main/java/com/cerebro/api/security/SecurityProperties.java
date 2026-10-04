package com.cerebro.api.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param demoSignIn demo profiles only: the sign-in screen lists the active accounts and anyone can
 *     continue as one of them (no identity provider). Refused in production.
 * @param bootstrapAdminEmail when no active user holds the system role, this email gets an account
 *     with it on startup (first deployment); ignored afterwards
 * @param singleSignOnPath where the browser starts the corporate SSO login
 * @param userClaim the OIDC claim that identifies the person; matched against the account email
 *     (Oracle Access Manager sends {@code email} when the scope is granted; some setups only have
 *     {@code sub} or {@code preferred_username})
 */
@ConfigurationProperties("cerebro.security")
public record SecurityProperties(
    boolean demoSignIn, String bootstrapAdminEmail, String singleSignOnPath, String userClaim) {

  public SecurityProperties {
    if (singleSignOnPath == null || singleSignOnPath.isBlank()) {
      singleSignOnPath = "/oauth2/authorization/corporate";
    }
    if (userClaim == null || userClaim.isBlank()) {
      userClaim = "email";
    }
  }
}
