package com.cerebro.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

/**
 * Sessions live server-side behind an httpOnly cookie on the same origin as the frontend (no
 * tokens in the browser). Corporate SSO (OIDC) in every environment except {@code local}, where a
 * fixed development account is used. Authorisation is by screen privilege, checked in the API
 * ({@code Access}), never only in the frontend.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

  private static final String[] PUBLIC = {
    "/actuator/health/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html"
  };

  @Bean
  @Profile("!local")
  SecurityFilterChain ssoChain(HttpSecurity http) throws Exception {
    return common(http).oauth2Login(Customizer.withDefaults()).build();
  }

  @Bean
  @Profile("local")
  SecurityFilterChain localChain(HttpSecurity http, SecurityProperties properties)
      throws Exception {
    return common(http)
        .addFilterBefore(
            new DevAccountFilter(properties.devAccountEmail()),
            UsernamePasswordAuthenticationFilter.class)
        .build();
  }

  private static HttpSecurity common(HttpSecurity http) throws Exception {
    return http.authorizeHttpRequests(
            auth -> auth.requestMatchers(PUBLIC).permitAll().anyRequest().authenticated())
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
