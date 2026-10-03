package com.cerebro.api.operations;

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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** {@code RiskRepository}, {@code EscalationRepository} and {@code DecisionRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Riskler, eskalasyonlar ve kararlar")
public class OperationsController {

  private final OperationsService service;

  public OperationsController(OperationsService service) {
    this.service = service;
  }

  @GetMapping("/risks")
  public List<Risk> risks(
      @RequestParam(required = false) Long applicationId,
      @RequestParam(required = false) Long projectId) {
    return service.risks(applicationId, projectId);
  }

  @GetMapping("/risks/{id}")
  public Risk risk(@PathVariable long id) {
    return service.risk(id);
  }

  @PostMapping("/risks")
  @ResponseStatus(HttpStatus.CREATED)
  public Risk createRisk(@RequestBody Risk.Input input) {
    return service.createRisk(input);
  }

  @PutMapping("/risks/{id}")
  public Risk updateRisk(@PathVariable long id, @RequestBody Risk.Input input) {
    return service.updateRisk(id, input);
  }

  @DeleteMapping("/risks/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteRisk(@PathVariable long id) {
    service.removeRisk(id);
  }

  @GetMapping("/risks/{id}/deletion-impact")
  public DeletionImpact riskDeletionImpact(@PathVariable long id) {
    return service.riskDeletionImpact(id);
  }

  @GetMapping("/escalations")
  public List<Escalation> escalations(
      @RequestParam(required = false) Long applicationId,
      @RequestParam(required = false) Long projectId) {
    return service.escalations(applicationId, projectId);
  }

  @GetMapping("/escalations/{id}")
  public Escalation escalation(@PathVariable long id) {
    return service.escalation(id);
  }

  @PostMapping("/escalations")
  @ResponseStatus(HttpStatus.CREATED)
  public Escalation createEscalation(@RequestBody Escalation.Input input) {
    return service.createEscalation(input);
  }

  @PutMapping("/escalations/{id}")
  public Escalation updateEscalation(@PathVariable long id, @RequestBody Escalation.Input input) {
    return service.updateEscalation(id, input);
  }

  @DeleteMapping("/escalations/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteEscalation(@PathVariable long id) {
    service.removeEscalation(id);
  }

  @GetMapping("/escalations/{id}/deletion-impact")
  public DeletionImpact escalationDeletionImpact(@PathVariable long id) {
    return service.escalationDeletionImpact(id);
  }

  @GetMapping("/decisions")
  public List<Decision> decisions(
      @RequestParam(required = false) Long applicationId,
      @RequestParam(required = false) Long projectId) {
    return service.decisions(applicationId, projectId);
  }

  @GetMapping("/decisions/{id}")
  public Decision decision(@PathVariable long id) {
    return service.decision(id);
  }

  @PostMapping("/decisions")
  @ResponseStatus(HttpStatus.CREATED)
  public Decision createDecision(@RequestBody Decision.Input input) {
    return service.createDecision(input);
  }

  @PutMapping("/decisions/{id}")
  public Decision updateDecision(@PathVariable long id, @RequestBody Decision.Input input) {
    return service.updateDecision(id, input);
  }

  @DeleteMapping("/decisions/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteDecision(@PathVariable long id) {
    service.removeDecision(id);
  }

  @GetMapping("/decisions/{id}/deletion-impact")
  public DeletionImpact decisionDeletionImpact(@PathVariable long id) {
    return service.decisionDeletionImpact(id);
  }
}
