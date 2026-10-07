package com.cerebro.api.shared.error;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.SQLException;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
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
        case "duplicate" ->
            new DataIntegrityViolationException(
                "insert", new SQLException("unique constraint violated", "23505"));
        case "closed-as-duplicate" -> {
          // What H2 reports when a session row is written to a database that has been closed.
          SQLException closed = new SQLException("The database has been closed [90098-240]", "90098");
          SQLException duplicate = new SQLException("Unique index or primary key violation", "23505");
          duplicate.initCause(closed);
          yield new DataIntegrityViolationException("insert", duplicate);
        }
        case "closed" ->
            new DataIntegrityViolationException(
                "select", new SQLException("The database has been closed", "90098"));
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

  @Test
  void tellsConstraintViolationsFromAnUnavailableDatabase() throws Exception {
    mvc.perform(get("/fail/duplicate"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.code").value("validation"));
    mvc.perform(get("/fail/closed-as-duplicate"))
        .andExpect(status().isServiceUnavailable());
    mvc.perform(get("/fail/closed"))
        .andExpect(status().isServiceUnavailable())
        .andExpect(jsonPath("$.detail").value("Veritabanına şu anda ulaşılamıyor. Biraz sonra tekrar deneyin."));
  }
}
