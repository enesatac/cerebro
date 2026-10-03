package com.cerebro.api.planning;

import com.cerebro.api.shared.error.ValidationException;
import java.util.Arrays;
import java.util.List;

/**
 * Optional id filters sent as {@code ?personIds=1,2}: absent means "everyone", present but empty
 * means "nobody".
 */
final class IdList {

  private IdList() {}

  static List<Long> parse(String value, String field) {
    if (value == null) {
      return null;
    }
    if (value.isBlank()) {
      return List.of();
    }
    try {
      return Arrays.stream(value.split(",")).map(String::trim).map(Long::valueOf).toList();
    } catch (NumberFormatException e) {
      throw new ValidationException("Geçersiz kimlik listesi.", field);
    }
  }
}
