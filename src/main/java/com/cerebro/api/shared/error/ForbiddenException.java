package com.cerebro.api.shared.error;

public class ForbiddenException extends RuntimeException {

  public ForbiddenException() {
    this("Bu işlemi yapma yetkiniz yok.");
  }

  public ForbiddenException(String message) {
    super(message);
  }
}
