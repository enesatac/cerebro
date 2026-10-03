package com.cerebro.api.shared.error;

/** No session, or the SSO identity has no active Cerebro account. */
public class UnauthenticatedException extends RuntimeException {

  public UnauthenticatedException() {
    super("Oturumunuz sona erdi. Devam etmek için tekrar giriş yapın.");
  }
}
