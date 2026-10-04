package com.cerebro.api.governance;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.Test;

class TrendsTest {

  @Test
  void countsWorkingDaysInclusive() {
    // Thursday 1 – Wednesday 7 October 2026: five working days.
    assertThat(Trends.workingDays(LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 7))).isEqualTo(5);
    assertThat(Trends.workingDays(LocalDate.of(2026, 10, 3), LocalDate.of(2026, 10, 4))).isZero();
    assertThat(Trends.workingDays(LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 1))).isZero();
  }
}
