package com.cerebro.api.access;

import com.cerebro.api.security.SecurityProperties;
import com.cerebro.api.shared.error.ValidationException;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The frontend's {@code AuthRepository}: session, sign-in options, sign-in and sign-out. */
@RestController
@RequestMapping("/api/auth")
@Tag(name = "Oturum")
public class AuthController {

  private final CurrentUser currentUser;
  private final AccountRepository accounts;
  private final SecurityProperties properties;
  private final SecurityContextRepository contexts;
  private final Clock clock;

  public AuthController(
      CurrentUser currentUser,
      AccountRepository accounts,
      SecurityProperties properties,
      SecurityContextRepository contexts,
      Clock clock) {
    this.currentUser = currentUser;
    this.accounts = accounts;
    this.properties = properties;
    this.contexts = contexts;
    this.clock = clock;
  }

  /** The signed-in account, or 204 when nobody is signed in. */
  @GetMapping("/session")
  @Operation(summary = "Oturumdaki kullanıcı, rolleri ve yetkileri")
  public ResponseEntity<SessionUser> session() {
    return currentUser.find().map(ResponseEntity::ok).orElse(ResponseEntity.noContent().build());
  }

  /**
   * How to sign in here: the demo account list (local development), or the corporate SSO address.
   */
  @GetMapping("/sign-in-options")
  @Operation(summary = "Giriş seçenekleri")
  public SignInOptions signInOptions() {
    return properties.demoSignIn()
        ? new SignInOptions(accounts.listActive(), null)
        : new SignInOptions(List.of(), properties.singleSignOnPath());
  }

  @PostMapping("/sign-in")
  @Operation(summary = "Demo girişi: seçilen hesapla oturum açar (yalnızca yerel geliştirme)")
  public SessionUser signIn(
      @RequestBody SignInRequest body, HttpServletRequest request, HttpServletResponse response) {
    if (!properties.demoSignIn()) {
      throw new ValidationException("Bu ortamda kurumsal hesabınızla giriş yapın.");
    }
    SessionUser account =
        accounts
            .findById(body.accountId())
            .filter(SessionUser::active)
            .orElseThrow(() -> new ValidationException("Bu hesap giriş yapamaz."));
    accounts.recordSignIn(account.id(), OffsetDateTime.now(clock));
    // A fresh session id on sign-in (session fixation).
    if (request.getSession(false) != null) {
      request.changeSessionId();
    } else {
      request.getSession(true);
    }
    SecurityContext context = SecurityContextHolder.createEmptyContext();
    context.setAuthentication(
        UsernamePasswordAuthenticationToken.authenticated(account.email(), null, List.of()));
    SecurityContextHolder.setContext(context);
    contexts.saveContext(context, request, response);
    currentUser.forget();
    return currentUser.require();
  }

  @PostMapping("/sign-out")
  @Operation(summary = "Oturumu kapatır")
  public ResponseEntity<Void> signOut(HttpServletRequest request) {
    HttpSession session = request.getSession(false);
    if (session != null) {
      session.invalidate();
    }
    SecurityContextHolder.clearContext();
    currentUser.forget();
    return ResponseEntity.noContent().build();
  }

  public record SignInRequest(long accountId) {}

  /**
   * @param accounts active accounts to continue as (demo sign-in), empty with SSO
   * @param singleSignOnUrl where the browser starts the corporate login, {@code null} for demo
   */
  public record SignInOptions(List<SessionUser> accounts, String singleSignOnUrl) {}
}
