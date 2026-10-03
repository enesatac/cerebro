package com.cerebro.api.shared;

import java.time.Instant;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Pattern;

/**
 * Dates travel as ISO-8601 text, exactly as the frontend writes them: calendar dates as {@code
 * 2026-03-14} and timestamps as UTC with milliseconds ({@code 2026-03-14T09:30:00.000Z}, the form of
 * JavaScript's {@code toISOString()}), so they compare correctly as strings on both sides.
 */
public final class Times {

  private static final Pattern ISO_DATE = Pattern.compile("^\\d{4}-\\d{2}-\\d{2}$");
  private static final DateTimeFormatter TIMESTAMP =
      DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'").withZone(ZoneOffset.UTC);

  private Times() {}

  public static String timestamp(Instant instant) {
    return instant == null ? null : TIMESTAMP.format(instant);
  }

  public static String timestamp(OffsetDateTime value) {
    return value == null ? null : timestamp(value.toInstant());
  }

  /** Parses a timestamp sent by a client or stored in a record; {@code null} stays {@code null}. */
  public static OffsetDateTime parseTimestamp(String value) {
    return value == null ? null : OffsetDateTime.parse(value);
  }

  public static String date(LocalDate value) {
    return value == null ? null : value.toString();
  }

  /** True for a well-formed {@code yyyy-MM-dd} that is a real calendar day. */
  public static boolean isIsoDate(String value) {
    if (value == null || !ISO_DATE.matcher(value).matches()) {
      return false;
    }
    try {
      LocalDate.parse(value);
      return true;
    } catch (DateTimeParseException e) {
      return false;
    }
  }

  public static LocalDate parseDate(String value) {
    return value == null ? null : LocalDate.parse(value);
  }
}
