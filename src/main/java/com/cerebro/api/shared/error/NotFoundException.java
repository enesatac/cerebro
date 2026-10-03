package com.cerebro.api.shared.error;

public class NotFoundException extends RuntimeException {

  /** {@code entityLabel} is Turkish and user-facing, e.g. "Proje". */
  public NotFoundException(String entityLabel, Object id) {
    super(entityLabel + " \"" + id + "\" bulunamadı.");
  }
}
