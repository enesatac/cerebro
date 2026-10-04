package com.cerebro.api.runbooks;

import com.cerebro.api.shared.DeletionImpact;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code RunbookRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Müdahale rehberleri")
public class RunbookController {

  private final RunbookService service;

  public RunbookController(RunbookService service) {
    this.service = service;
  }

  /** The application's runbook, or 204 when none has been written yet. */
  @GetMapping("/applications/{applicationId}/runbook")
  public ResponseEntity<Runbook> byApplication(@PathVariable long applicationId) {
    return service
        .byApplication(applicationId)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.noContent().build());
  }

  @PostMapping("/runbooks")
  @ResponseStatus(HttpStatus.CREATED)
  public Runbook create(@RequestBody Runbook.Input input) {
    return service.create(input);
  }

  @PutMapping("/runbooks/{id}")
  public Runbook update(@PathVariable long id, @RequestBody Runbook.Input input) {
    return service.update(id, input);
  }

  @DeleteMapping("/runbooks/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.remove(id);
  }

  @GetMapping("/runbooks/{id}/deletion-impact")
  public DeletionImpact deletionImpact(@PathVariable long id) {
    return service.deletionImpact(id);
  }
}
