package com.cerebro.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

/**
 * Sessions live server-side behind an httpOnly cookie on the same origin as the frontend (no
 * tokens in the browser). Corporate SSO (OIDC) in every environment except {@code local}, where
 * the demo sign-in picks an account. Authorisation is by screen privilege, checked in the API
 * ({@code Access}), never only in the frontend.
 */
@Configuration
public class SecurityConfig {

  private static final String[] PUBLIC = {
    "/actuator/health/**",
    "/v3/api-docs/**",
    "/swagger-ui/**",
    "/swagger-ui.html",
    "/api/auth/**"
  };

  @Bean
  SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  @Profile("!local")
  SecurityFilterChain ssoChain(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return common(http, contexts)
        .oauth2Login(login -> login.defaultSuccessUrl("/", true))
        .build();
  }

  @Bean
  @Profile("local")
  SecurityFilterChain localChain(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return common(http, contexts).build();
  }

  private static HttpSecurity common(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return http.authorizeHttpRequests(
            auth -> auth.requestMatchers(PUBLIC).permitAll().anyRequest().authenticated())
        .securityContext(context -> context.securityContextRepository(contexts))
        // The SPA reads the XSRF-TOKEN cookie and sends it back as a header on writes.
        .csrf(csrf -> csrf.spa())
        // API calls get 401 instead of a redirect to the identity provider.
        .exceptionHandling(
            errors ->
                errors.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    PathPatternRequestMatcher.withDefaults().matcher("/api/**")));
  }
}
