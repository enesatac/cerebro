package com.cerebro.api.shared;

import java.util.Comparator;
import java.util.function.Function;

/** List ordering shared by the read endpoints. */
public final class Sorting {

  private Sorting() {}

  /**
   * Ascending or descending on {@code key}; {@code null} values always sort last regardless of
   * direction. Text compares like JavaScript's {@code localeCompare} closely enough for display.
   */
  public static <T> Comparator<T> by(Function<T, ? extends Comparable<?>> key, boolean ascending) {
    return (a, b) -> {
      Object x = key.apply(a);
      Object y = key.apply(b);
      if (x == null && y == null) {
        return 0;
      }
      if (x == null) {
        return 1;
      }
      if (y == null) {
        return -1;
      }
      int result = compare(x, y);
      return ascending ? result : -result;
    };
  }

  @SuppressWarnings({"unchecked", "rawtypes"})
  private static int compare(Object x, Object y) {
    if (x instanceof String s && y instanceof String t) {
      return Collation.compare(s, t);
    }
    return ((Comparable) x).compareTo(y);
  }
}
