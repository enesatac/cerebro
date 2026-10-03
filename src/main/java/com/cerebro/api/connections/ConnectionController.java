package com.cerebro.api.connections;

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

/** {@code ConnectionRepository} with its dependency and integration repositories. */
@RestController
@RequestMapping("/api")
@Tag(name = "Bağlantılar")
public class ConnectionController {

  private final ConnectionService service;

  public ConnectionController(ConnectionService service) {
    this.service = service;
  }

  @GetMapping("/applications/{id}/dependencies")
  public Dependency.OfApplication dependenciesOf(@PathVariable long id) {
    return service.dependenciesOf(id);
  }

  @GetMapping("/applications/{id}/integrations")
  public Integration.OfApplication integrationsOf(@PathVariable long id) {
    return service.integrationsOf(id);
  }

  @GetMapping("/dependencies")
  public List<Dependency> dependencies() {
    return service.dependencies();
  }

  @GetMapping("/dependencies/{id}")
  public Dependency dependency(@PathVariable long id) {
    return service.dependency(id);
  }

  @PostMapping("/dependencies")
  @ResponseStatus(HttpStatus.CREATED)
  public Dependency createDependency(@RequestBody Dependency.Input input) {
    return service.createDependency(input);
  }

  @PutMapping("/dependencies/{id}")
  public Dependency updateDependency(@PathVariable long id, @RequestBody Dependency.Input input) {
    return service.updateDependency(id, input);
  }

  @DeleteMapping("/dependencies/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteDependency(@PathVariable long id) {
    service.removeDependency(id);
  }

  @GetMapping("/dependencies/{id}/deletion-impact")
  public DeletionImpact dependencyDeletionImpact(@PathVariable long id) {
    return service.dependencyDeletionImpact(id);
  }

  @GetMapping("/integrations")
  public List<Integration> integrations() {
    return service.integrations();
  }

  @GetMapping("/integrations/{id}")
  public Integration integration(@PathVariable long id) {
    return service.integration(id);
  }

  @PostMapping("/integrations")
  @ResponseStatus(HttpStatus.CREATED)
  public Integration createIntegration(@RequestBody Integration.Input input) {
    return service.createIntegration(input);
  }

  @PutMapping("/integrations/{id}")
  public Integration updateIntegration(
      @PathVariable long id, @RequestBody Integration.Input input) {
    return service.updateIntegration(id, input);
  }

  @DeleteMapping("/integrations/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteIntegration(@PathVariable long id) {
    service.removeIntegration(id);
  }

  @GetMapping("/integrations/{id}/deletion-impact")
  public DeletionImpact integrationDeletionImpact(@PathVariable long id) {
    return service.integrationDeletionImpact(id);
  }
}
