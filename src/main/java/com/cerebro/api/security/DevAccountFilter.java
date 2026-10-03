package com.cerebro.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Local development only (registered by the {@code local} profile): authenticates every request as
 * the configured account so the API can be used without an identity provider. Privileges still
 * come from that account's roles in the database.
 */
class DevAccountFilter extends OncePerRequestFilter {

  private final String email;

  DevAccountFilter(String email) {
    if (!StringUtils.hasText(email)) {
      throw new IllegalStateException("cerebro.security.dev-account-email is required locally");
    }
    this.email = email;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain chain)
      throws ServletException, IOException {
    var authentication = new UsernamePasswordAuthenticationToken(email, null, List.of());
    SecurityContextHolder.getContext().setAuthentication(authentication);
    chain.doFilter(request, response);
  }
}
