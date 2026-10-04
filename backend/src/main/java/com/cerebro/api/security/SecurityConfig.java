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
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter.ReferrerPolicy;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

/**
 * One origin serves the web app and the API. Sessions live server-side (in the database, Spring
 * Session) behind an httpOnly cookie — no tokens in the browser. Corporate SSO (OIDC, Oracle Access
 * Manager) in every environment except the demo profiles ({@code local}, {@code h2}), where the
 * demo sign-in picks an account. The web app's files are public; every {@code /api} call except
 * sign-in needs a session, and screen privileges are checked in the services ({@code Access}).
 */
@Configuration
public class SecurityConfig {

  private static final String[] PUBLIC_API = {
    "/api/auth/**", "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
  };

  /**
   * The SPA loads only its own files; styles may be inline (the design system sets some), images
   * may be data URLs, nothing may frame the app.
   */
  private static final String CONTENT_SECURITY_POLICY =
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';"
          + " img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self';"
          + " object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";

  @Bean
  SecurityContextRepository securityContextRepository() {
    return new HttpSessionSecurityContextRepository();
  }

  @Bean
  @Profile("!local & !h2")
  SecurityFilterChain ssoChain(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return common(http, contexts)
        .oauth2Login(login -> login.defaultSuccessUrl("/", true))
        .build();
  }

  @Bean
  @Profile("local | h2")
  SecurityFilterChain demoChain(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return common(http, contexts).build();
  }

  private static HttpSecurity common(HttpSecurity http, SecurityContextRepository contexts)
      throws Exception {
    return http.authorizeHttpRequests(
            auth ->
                auth.requestMatchers(PUBLIC_API)
                    .permitAll()
                    .requestMatchers("/api/**", "/actuator/**")
                    .authenticated()
                    // The web app (index.html, assets, client-side routes) is public; its data is not.
                    .anyRequest()
                    .permitAll())
        .securityContext(context -> context.securityContextRepository(contexts))
        // The SPA reads the XSRF-TOKEN cookie and sends it back as a header on writes.
        .csrf(csrf -> csrf.spa())
        .headers(
            headers ->
                headers
                    .contentSecurityPolicy(csp -> csp.policyDirectives(CONTENT_SECURITY_POLICY))
                    .referrerPolicy(referrer -> referrer.policy(ReferrerPolicy.SAME_ORIGIN)))
        // API calls get 401 instead of a redirect to the identity provider.
        .exceptionHandling(
            errors ->
                errors.defaultAuthenticationEntryPointFor(
                    new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED),
                    PathPatternRequestMatcher.withDefaults().matcher("/api/**")));
  }
}
