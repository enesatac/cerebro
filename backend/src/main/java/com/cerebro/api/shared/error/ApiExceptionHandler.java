package com.cerebro.api.shared.error;

import java.net.URI;
import java.sql.SQLException;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataAccessException;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

/**
 * One error format for the whole API (RFC 9457 problem details). {@code code} matches the
 * frontend's error classes ({@code validation}, {@code not-found}, {@code forbidden},
 * {@code unauthenticated}) and {@code field} places a validation message on its form field.
 * Unexpected errors are logged and answered without internals.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class ApiExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(ApiExceptionHandler.class);

  @ExceptionHandler(ValidationException.class)
  ProblemDetail validation(ValidationException error) {
    ProblemDetail problem = problem(HttpStatus.BAD_REQUEST, "validation", error.getMessage());
    if (error.field() != null) {
      problem.setProperty("field", error.field());
    }
    return problem;
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  ProblemDetail invalidBody(MethodArgumentNotValidException error) {
    var first = error.getBindingResult().getFieldErrors().stream().findFirst();
    ProblemDetail problem =
        problem(
            HttpStatus.BAD_REQUEST,
            "validation",
            first.map(f -> f.getDefaultMessage()).orElse("İstek geçersiz."));
    first.ifPresent(f -> problem.setProperty("field", f.getField()));
    return problem;
  }

  /**
   * A database rule the service checks did not catch (a constraint, a concurrent write). Drivers
   * also report other failures under this type: H2 files a write to a closed database as a key
   * violation whose cause says the database is closed. Only a violation (SQLState class 23) with no
   * connection failure anywhere in its causes is the user's to fix.
   */
  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integrity(DataIntegrityViolationException error) {
    if (!isConstraintViolation(error)) {
      return unavailable(error);
    }
    log.warn("Constraint violation: {}", error.getMostSpecificCause().getMessage());
    return problem(
        HttpStatus.BAD_REQUEST,
        "validation",
        "Kayıt kaydedilemedi: bilgiler başka bir kayıtla çakışıyor veya geçersiz.");
  }

  /** The database cannot be reached or refused the connection: the request may work later. */
  @ExceptionHandler({DataAccessResourceFailureException.class, TransientDataAccessException.class})
  ProblemDetail unavailable(DataAccessException error) {
    log.error("Database unavailable", error);
    return problem(
        HttpStatus.SERVICE_UNAVAILABLE,
        "unexpected",
        "Veritabanına şu anda ulaşılamıyor. Biraz sonra tekrar deneyin.");
  }

  private static final Pattern CONNECTION_LOST =
      Pattern.compile("(database|connection) (has been|is already|is) closed", Pattern.CASE_INSENSITIVE);

  static boolean isConstraintViolation(DataIntegrityViolationException error) {
    boolean violation = error instanceof DuplicateKeyException;
    for (Throwable cause = error.getCause(); cause != null; cause = cause.getCause()) {
      if (cause instanceof SQLException sql && sql.getSQLState() != null) {
        String state = sql.getSQLState();
        if (state.startsWith("08") || state.equals("90098") || state.equals("90121")) {
          return false; // connection exception, H2: database closed
        }
        violation |= state.startsWith("23");
      }
      if (cause.getMessage() != null && CONNECTION_LOST.matcher(cause.getMessage()).find()) {
        return false;
      }
    }
    return violation;
  }

  @ExceptionHandler({
    HttpMessageNotReadableException.class,
    MissingServletRequestParameterException.class,
    MissingServletRequestPartException.class,
    MethodArgumentTypeMismatchException.class
  })
  ProblemDetail unreadable(Exception error) {
    return problem(HttpStatus.BAD_REQUEST, "validation", "İstek okunamadı veya eksik.");
  }

  @ExceptionHandler(MaxUploadSizeExceededException.class)
  ProblemDetail tooLarge(MaxUploadSizeExceededException error) {
    ProblemDetail problem =
        problem(HttpStatus.BAD_REQUEST, "validation", "Dosya en fazla 20 MB olabilir.");
    problem.setProperty("field", "file");
    return problem;
  }

  @ExceptionHandler(NoResourceFoundException.class)
  ProblemDetail noRoute(NoResourceFoundException error) {
    return problem(HttpStatus.NOT_FOUND, "not-found", "Adres bulunamadı.");
  }

  @ExceptionHandler(NotFoundException.class)
  ProblemDetail notFound(NotFoundException error) {
    return problem(HttpStatus.NOT_FOUND, "not-found", error.getMessage());
  }

  @ExceptionHandler({ForbiddenException.class, AccessDeniedException.class})
  ProblemDetail forbidden(RuntimeException error) {
    String message =
        error instanceof ForbiddenException ? error.getMessage() : "Bu işlemi yapma yetkiniz yok.";
    return problem(HttpStatus.FORBIDDEN, "forbidden", message);
  }

  @ExceptionHandler(UnauthenticatedException.class)
  ProblemDetail unauthenticated(UnauthenticatedException error) {
    return problem(HttpStatus.UNAUTHORIZED, "unauthenticated", error.getMessage());
  }

  @ExceptionHandler(Exception.class)
  ProblemDetail unexpected(Exception error) {
    log.error("Unhandled API error", error);
    return problem(
        HttpStatus.INTERNAL_SERVER_ERROR, "unexpected", "Beklenmeyen bir hata oluştu.");
  }

  private static ProblemDetail problem(HttpStatus status, String code, String detail) {
    ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
    problem.setType(URI.create("https://cerebro/errors/" + code));
    problem.setTitle(status.getReasonPhrase());
    problem.setProperty("code", code);
    return problem;
  }
}
