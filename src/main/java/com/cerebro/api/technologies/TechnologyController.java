package com.cerebro.api.technologies;

import com.cerebro.api.shared.DeletionImpact;
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

/** {@code TechnologyRepository}. */
@RestController
@RequestMapping("/api/technologies")
@Tag(name = "Teknolojiler")
public class TechnologyController {

  private final TechnologyService service;

  public TechnologyController(TechnologyService service) {
    this.service = service;
  }

  @GetMapping
  public List<Technology> list() {
    return service.list();
  }

  @GetMapping("/summaries")
  public List<Technology.ListItem> summaries() {
    return service.summaries();
  }

  @GetMapping("/{id}")
  public Technology get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Technology create(@RequestBody Technology.Input input) {
    return service.create(input);
  }

  @PutMapping("/{id}")
  public Technology update(@PathVariable long id, @RequestBody Technology.Input input) {
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
