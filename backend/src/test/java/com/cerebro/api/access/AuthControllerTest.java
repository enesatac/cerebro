package com.cerebro.api.access;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cerebro.api.security.SecurityProperties;
import com.cerebro.api.shared.error.ApiExceptionHandler;
import java.time.Clock;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class AuthControllerTest {

  private static final SessionUser ELIF =
      new SessionUser(
          3,
          "Elif Kaya",
          "elif.kaya@corp.example",
          List.of(4L, 5L),
          2L,
          true,
          null,
          null,
          List.of("İş birimi kullanıcısı", "Çalışan"),
          List.of("demands:view", "demands:edit"));

  private final CurrentUser currentUser = mock(CurrentUser.class);
  private final AccountRepository accounts = mock(AccountRepository.class);

  private MockMvc mvc(boolean demoSignIn) {
    return MockMvcBuilders.standaloneSetup(
            new AuthController(
                currentUser,
                accounts,
                new SecurityProperties(demoSignIn, null, null, null),
                new HttpSessionSecurityContextRepository(),
                Clock.systemUTC()))
        .setControllerAdvice(new ApiExceptionHandler())
        .build();
  }

  @Test
  void returnsTheSessionInTheFrontendsShape() throws Exception {
    when(currentUser.find()).thenReturn(Optional.of(ELIF));
    mvc(true)
        .perform(get("/api/auth/session"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Elif Kaya"))
        .andExpect(jsonPath("$.roleIds.length()").value(2))
        .andExpect(jsonPath("$.privileges[1]").value("demands:edit"));
  }

  @Test
  void answersNoContentWhenSignedOut() throws Exception {
    when(currentUser.find()).thenReturn(Optional.empty());
    mvc(true).perform(get("/api/auth/session")).andExpect(status().isNoContent());
  }

  @Test
  void offersTheAccountsOnlyForTheDemoSignIn() throws Exception {
    when(accounts.listActive()).thenReturn(List.of(ELIF));
    mvc(true)
        .perform(get("/api/auth/sign-in-options"))
        .andExpect(jsonPath("$.accounts[0].email").value("elif.kaya@corp.example"))
        .andExpect(jsonPath("$.singleSignOnUrl").doesNotExist());
    mvc(false)
        .perform(get("/api/auth/sign-in-options"))
        .andExpect(jsonPath("$.accounts.length()").value(0))
        .andExpect(jsonPath("$.singleSignOnUrl").value("/oauth2/authorization/corporate"));
  }

  @Test
  void refusesTheDemoSignInWithSso() throws Exception {
    mvc(false)
        .perform(
            post("/api/auth/sign-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountId\":3}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("validation"));
  }

  @Test
  void refusesInactiveAccounts() throws Exception {
    when(accounts.findById(5)).thenReturn(Optional.empty());
    mvc(true)
        .perform(
            post("/api/auth/sign-in")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountId\":5}"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.detail").value("Bu hesap giriş yapamaz."));
  }
}
