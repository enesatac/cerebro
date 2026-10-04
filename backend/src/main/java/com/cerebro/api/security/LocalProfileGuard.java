package com.cerebro.api.security;

import java.util.Arrays;
import java.util.List;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;

/** Refuses to start when the demo sign-in or a demo profile would be active in production. */
@Configuration
class LocalProfileGuard {

  LocalProfileGuard(Environment environment, SecurityProperties properties) {
    List<String> profiles = Arrays.asList(environment.getActiveProfiles());
    boolean demo = properties.demoSignIn() || profiles.contains("local") || profiles.contains("h2");
    if (profiles.contains("prod") && demo) {
      throw new IllegalStateException(
          "The demo sign-in and the 'local' / 'h2' profiles must not be used with 'prod'");
    }
  }
}
