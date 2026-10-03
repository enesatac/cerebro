package com.cerebro.api.shared.error;

/**
 * A rule the request breaks. {@code field} names the form field it belongs to (the frontend shows
 * the message next to it), e.g. {@code "endDate"} or {@code "payments.0.paidDate"}.
 */
public class ValidationException extends RuntimeException {

  private final String field;

  public ValidationException(String message) {
    this(message, null);
  }

  public ValidationException(String message, String field) {
    super(message);
    this.field = field;
  }

  public String field() {
    return field;
  }
}
