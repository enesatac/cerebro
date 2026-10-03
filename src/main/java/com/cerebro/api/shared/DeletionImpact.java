package com.cerebro.api.shared;

import java.util.Arrays;
import java.util.List;

/**
 * What deleting a record would affect, shown in the confirmation dialog. Zero counts are omitted;
 * when {@code blockedReason} is set the deletion is refused with that explanation.
 */
public record DeletionImpact(List<Reference> references, String blockedReason) {

  public static final DeletionImpact NONE = new DeletionImpact(List.of(), null);

  public record Reference(String label, long count) {}

  public static Reference ref(String label, long count) {
    return new Reference(label, count);
  }

  public static DeletionImpact of(String blockedReason, Reference... references) {
    return new DeletionImpact(
        Arrays.stream(references).filter(r -> r.count() > 0).toList(), blockedReason);
  }

  public static DeletionImpact of(Reference... references) {
    return of(null, references);
  }

  public boolean blocked() {
    return blockedReason != null;
  }
}
