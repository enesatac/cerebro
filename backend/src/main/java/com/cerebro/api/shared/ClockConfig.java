package com.cerebro.api.shared;

import java.time.Clock;
import java.time.ZoneId;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * The organisation's clock. "Today" (overdue milestones, upcoming leaves, review intervals) is the
 * calendar day in the organisation's time zone, as the users see it.
 */
@Configuration
class ClockConfig {

  @Bean
  Clock clock(@Value("${cerebro.time-zone:Europe/Istanbul}") String zone) {
    return Clock.system(ZoneId.of(zone));
  }
}
