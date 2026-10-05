package com.cerebro.api.procurement;

import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code ProcurementRepository}. */
@RestController
@RequestMapping("/api/procurement")
@Tag(name = "Satın alma takibi")
public class ProcurementController {

  private final ProcurementService service;

  public ProcurementController(ProcurementService service) {
    this.service = service;
  }

  @GetMapping
  public List<Procurement.Summary> list() {
    return service.list();
  }

  @GetMapping("/{contractId}")
  public Procurement.Process get(@PathVariable long contractId) {
    return service.get(contractId);
  }

  @PutMapping("/{contractId}/steps")
  public Procurement.Process saveSteps(
      @PathVariable long contractId, @RequestBody List<Procurement.Step> steps) {
    return service.saveSteps(contractId, steps);
  }

  @PostMapping("/{contractId}/notes")
  @ResponseStatus(HttpStatus.CREATED)
  public Procurement.Note addNote(
      @PathVariable long contractId, @RequestBody Procurement.NoteInput input) {
    return service.addNote(contractId, input);
  }

  @DeleteMapping("/notes/{noteId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void removeNote(@PathVariable long noteId) {
    service.removeNote(noteId);
  }
}
