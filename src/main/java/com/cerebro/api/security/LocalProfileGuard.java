package com.cerebro.api.security;

import java.util.Arrays;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;

/** Refuses to start when the development login would be active in production. */
@Configuration
@Profile("local")
class LocalProfileGuard {

  LocalProfileGuard(Environment environment) {
    if (Arrays.asList(environment.getActiveProfiles()).contains("prod")) {
      throw new IllegalStateException("The 'local' and 'prod' profiles must not be combined");
    }
  }
}
