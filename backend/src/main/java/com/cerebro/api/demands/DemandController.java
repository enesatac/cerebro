package com.cerebro.api.demands;

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

/** {@code DemandRepository}. */
@RestController
@RequestMapping("/api/demands")
@Tag(name = "Talepler")
public class DemandController {

  private final DemandService service;

  public DemandController(DemandService service) {
    this.service = service;
  }

  @GetMapping
  public List<Demand> list() {
    return service.list();
  }

  @GetMapping("/{id}")
  public Demand get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Demand create(@RequestBody Demand.Input input) {
    return service.create(input);
  }

  @PutMapping("/{id}")
  public Demand update(@PathVariable long id, @RequestBody Demand.Input input) {
    return service.update(id, input);
  }

  @PostMapping("/{id}/assessment")
  public Demand assess(@PathVariable long id, @RequestBody Demand.AssessmentInput input) {
    return service.assess(id, input);
  }

  @PostMapping("/{id}/withdrawal")
  public Demand withdraw(@PathVariable long id, @RequestBody Demand.Withdrawal body) {
    return service.withdraw(id, body.note());
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
