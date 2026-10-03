package com.cerebro.api.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * @param demoSignIn local development and demos only: the sign-in screen lists the active accounts
 *     and anyone can continue as one of them (no identity provider). Refused in production.
 * @param bootstrapAdminEmail when no active user holds the system role, this email gets an account
 *     with it on startup (first deployment); ignored afterwards
 * @param singleSignOnPath where the browser starts the corporate SSO login
 */
@ConfigurationProperties("cerebro.security")
public record SecurityProperties(
    boolean demoSignIn, String bootstrapAdminEmail, String singleSignOnPath) {

  public SecurityProperties {
    if (singleSignOnPath == null || singleSignOnPath.isBlank()) {
      singleSignOnPath = "/oauth2/authorization/corporate";
    }
  }
}
