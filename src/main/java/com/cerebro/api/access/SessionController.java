package com.cerebro.api.access;

import io.swagger.v3.oas.annotations.Operation;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The frontend's {@code AuthRepository.getSession()}. */
@RestController
@RequestMapping("/api/session")
public class SessionController {

  private final CurrentUser currentUser;

  public SessionController(CurrentUser currentUser) {
    this.currentUser = currentUser;
  }

  @GetMapping
  @Operation(summary = "Oturumdaki kullanıcı, rolleri ve yetkileri")
  public SessionUser session() {
    return currentUser.require();
  }
}
