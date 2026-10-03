package com.cerebro.api.access;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cerebro.api.shared.error.ApiExceptionHandler;
import com.cerebro.api.shared.error.UnauthenticatedException;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SessionControllerTest {

  private final CurrentUser currentUser = mock(CurrentUser.class);
  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new SessionController(currentUser))
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  @Test
  void returnsTheSessionInTheFrontendsShape() throws Exception {
    when(currentUser.require())
        .thenReturn(
            new SessionUser(
                3,
                "Elif Kaya",
                "elif.kaya@corp.example",
                List.of(4L, 5L),
                2L,
                true,
                null,
                List.of("Çalışan", "İş birimi kullanıcısı"),
                Set.of("demands:view", "demands:edit")));

    mvc.perform(get("/api/session"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.displayName").value("Elif Kaya"))
        .andExpect(jsonPath("$.roleIds.length()").value(2))
        .andExpect(jsonPath("$.roleNames[0]").value("Çalışan"))
        .andExpect(jsonPath("$.privileges.length()").value(2));
  }

  @Test
  void answers401WhenTheIdentityHasNoCerebroAccount() throws Exception {
    when(currentUser.require()).thenThrow(new UnauthenticatedException());
    mvc.perform(get("/api/session")).andExpect(status().isUnauthorized());
  }
}
