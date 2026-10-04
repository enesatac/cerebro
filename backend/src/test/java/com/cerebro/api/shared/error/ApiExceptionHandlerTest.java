package com.cerebro.api.shared.error;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

class ApiExceptionHandlerTest {

  @RestController
  static class Failing {
    @GetMapping("/fail/{kind}")
    String fail(@PathVariable String kind) {
      throw switch (kind) {
        case "validation" -> new ValidationException("Bitiş başlangıçtan önce olamaz.", "endDate");
        case "missing" -> new NotFoundException("Proje", 42);
        case "forbidden" -> new ForbiddenException();
        case "signed-out" -> new UnauthenticatedException();
        default -> new IllegalStateException("database password leaked in stack trace");
      };
    }
  }

  private final MockMvc mvc =
      MockMvcBuilders.standaloneSetup(new Failing())
          .setControllerAdvice(new ApiExceptionHandler())
          .build();

  @Test
  void placesValidationMessagesOnTheirField() throws Exception {
    mvc.perform(get("/fail/validation"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("validation"))
        .andExpect(jsonPath("$.field").value("endDate"))
        .andExpect(jsonPath("$.detail").value("Bitiş başlangıçtan önce olamaz."));
  }

  @Test
  void mapsEachErrorToTheFrontendsErrorKinds() throws Exception {
    mvc.perform(get("/fail/missing"))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("not-found"));
    mvc.perform(get("/fail/forbidden"))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("forbidden"));
    mvc.perform(get("/fail/signed-out"))
        .andExpect(status().isUnauthorized())
        .andExpect(jsonPath("$.code").value("unauthenticated"));
  }

  @Test
  void neverExposesInternals() throws Exception {
    mvc.perform(get("/fail/boom"))
        .andExpect(status().isInternalServerError())
        .andExpect(jsonPath("$.detail").value("Beklenmeyen bir hata oluştu."));
  }
}
