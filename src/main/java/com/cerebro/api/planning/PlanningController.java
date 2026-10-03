package com.cerebro.api.planning;

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

/** {@code LeaveRepository} and {@code AllocationRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "İzinler ve kaynak planı")
public class PlanningController {

  private final PlanningService service;

  public PlanningController(PlanningService service) {
    this.service = service;
  }

  @GetMapping("/leaves")
  public List<LeaveRecord> leaves(
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
      @RequestParam(required = false) String personIds) {
    return service.leaves(from, to, IdList.parse(personIds, "personIds"));
  }

  @GetMapping("/leaves/{id}")
  public LeaveRecord leave(@PathVariable long id) {
    return service.leave(id);
  }

  @PostMapping("/leaves")
  @ResponseStatus(HttpStatus.CREATED)
  public LeaveRecord createLeave(@RequestBody LeaveRecord.Input input) {
    return service.createLeave(input);
  }

  @PutMapping("/leaves/{id}")
  public LeaveRecord updateLeave(@PathVariable long id, @RequestBody LeaveRecord.Input input) {
    return service.updateLeave(id, input);
  }

  @DeleteMapping("/leaves/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteLeave(@PathVariable long id) {
    service.removeLeave(id);
  }

  @GetMapping("/leaves/{id}/deletion-impact")
  public DeletionImpact leaveDeletionImpact(@PathVariable long id) {
    return service.leaveDeletionImpact(id);
  }

  @GetMapping("/allocations")
  public List<Allocation> allocations(
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate from,
      @RequestParam @DateTimeFormat(iso = ISO.DATE) LocalDate to,
      @RequestParam(required = false) String personIds,
      @RequestParam(required = false) String projectIds) {
    return service.allocations(
        from, to, IdList.parse(personIds, "personIds"), IdList.parse(projectIds, "projectIds"));
  }

  @GetMapping("/allocations/{id}")
  public Allocation allocation(@PathVariable long id) {
    return service.allocation(id);
  }

  @PostMapping("/allocations")
  @ResponseStatus(HttpStatus.CREATED)
  public Allocation createAllocation(@RequestBody Allocation.Input input) {
    return service.createAllocation(input);
  }

  @PutMapping("/allocations/{id}")
  public Allocation updateAllocation(@PathVariable long id, @RequestBody Allocation.Input input) {
    return service.updateAllocation(id, input);
  }

  @DeleteMapping("/allocations/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteAllocation(@PathVariable long id) {
    service.removeAllocation(id);
  }

  @GetMapping("/allocations/{id}/deletion-impact")
  public DeletionImpact allocationDeletionImpact(@PathVariable long id) {
    return service.allocationDeletionImpact(id);
  }
}
