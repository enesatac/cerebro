package com.cerebro.api.releases;

import com.cerebro.api.shared.DeletionImpact;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.format.annotation.DateTimeFormat.ISO;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code ReleaseRepository}. */
@RestController
@RequestMapping("/api/releases")
@Tag(name = "Canlı geçişler")
public class ReleaseController {

  private final ReleaseService service;

  public ReleaseController(ReleaseService service) {
    this.service = service;
  }

  @GetMapping
  public List<Release> list(
      @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate from,
      @RequestParam(required = false) @DateTimeFormat(iso = ISO.DATE) LocalDate to,
      @RequestParam(required = false) Long applicationId,
      @RequestParam(required = false) Long projectId) {
    return service.list(from, to, applicationId, projectId);
  }

  @GetMapping("/{id}")
  public Release get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Release create(@RequestBody Release.Input input) {
    return service.create(input);
  }

  @PutMapping("/{id}")
  public Release update(@PathVariable long id, @RequestBody Release.Input input) {
    return service.update(id, input);
  }

  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.remove(id);
  }

  @GetMapping("/{id}/deletion-impact")
  public DeletionImpact deletionImpact(@PathVariable long id) {
    return service.deletionImpact(id);
  }
}
