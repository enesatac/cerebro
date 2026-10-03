package com.cerebro.api.shared;

import com.cerebro.api.access.SessionUser;
import java.time.Clock;
import org.springframework.stereotype.Component;

/**
 * Stamps writes. Saving a record through its form counts as a review — the editor has just looked
 * at every field — which keeps the staleness indicator meaningful.
 */
@Component
public class AuditStamp {

  private final Clock clock;

  public AuditStamp(Clock clock) {
    this.clock = clock;
  }

  public String now() {
    return Times.timestamp(clock.instant());
  }

  public Audit created(SessionUser user) {
    String at = now();
    Long by = user.personId();
    return new Audit(at, by, at, by, at, by);
  }

  public Audit touched(Audit current, SessionUser user) {
    String at = now();
    Long by = user.personId();
    return new Audit(current.createdAt(), current.createdBy(), at, by, at, by);
  }
}
