package com.cerebro.api.shared.error;

import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.dao.DataIntegrityViolationException;
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

  /** A database rule the service checks did not catch (a constraint, a concurrent write). */
  @ExceptionHandler(DataIntegrityViolationException.class)
  ProblemDetail integrity(DataIntegrityViolationException error) {
    log.warn("Constraint violation: {}", error.getMostSpecificCause().getMessage());
    return problem(
        HttpStatus.BAD_REQUEST,
        "validation",
        "Kayıt kaydedilemedi: bilgiler başka bir kayıtla çakışıyor veya geçersiz.");
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
