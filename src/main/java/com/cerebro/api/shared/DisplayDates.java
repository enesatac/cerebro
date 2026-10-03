package com.cerebro.api.shared;

import java.time.LocalDate;
import java.util.List;

/** Dates in messages, formatted as the frontend shows them ({@code lib/dates.ts}, Turkish). */
public final class DisplayDates {

  private static final List<String> MONTHS =
      List.of("Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara");

  private DisplayDates() {}

  /** {@code 14 Mar 2026}. */
  public static String date(LocalDate date) {
    return date.getDayOfMonth() + " " + month(date) + " " + date.getYear();
  }

  /**
   * {@code 1–5 Eki 2026}, {@code 28 Eyl – 3 Eki 2026} or {@code 29 Ara 2026 – 2 Oca 2027}
   * (inclusive range).
   */
  public static String range(LocalDate from, LocalDate to) {
    if (from.equals(to)) {
      return date(from);
    }
    if (from.getYear() != to.getYear()) {
      return date(from) + " – " + date(to);
    }
    if (from.getMonth() != to.getMonth()) {
      return from.getDayOfMonth() + " " + month(from) + " – " + date(to);
    }
    return from.getDayOfMonth() + "–" + date(to);
  }

  private static String month(LocalDate date) {
    return MONTHS.get(date.getMonthValue() - 1);
  }
}
