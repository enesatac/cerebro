package com.cerebro.api.security;

import java.util.Arrays;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/** Refuses to start when the demo sign-in would be active in production. */
@Configuration
class LocalProfileGuard {

  LocalProfileGuard(Environment environment, SecurityProperties properties) {
    boolean production = Arrays.asList(environment.getActiveProfiles()).contains("prod");
    if (production && (properties.demoSignIn() || isLocal(environment))) {
      throw new IllegalStateException(
          "The demo sign-in and the 'local' profile must not be used with 'prod'");
    }
  }

  private static boolean isLocal(Environment environment) {
    return Arrays.asList(environment.getActiveProfiles()).contains("local");
  }
}
