package com.cerebro.api.projects;

import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.PagedResult;
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

/** {@code ProjectRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Projeler")
public class ProjectController {

  private final ProjectService service;

  public ProjectController(ProjectService service) {
    this.service = service;
  }

  @GetMapping("/projects")
  public PagedResult<Project.ListItem> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) List<String> statuses,
      @RequestParam(required = false) List<String> healths,
      @RequestParam(required = false) Long businessUnitId,
      @RequestParam(required = false) Long teamId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int pageSize,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction) {
    return service.list(
        new ProjectService.Query(
            search, statuses, healths, businessUnitId, teamId, page, pageSize, sort, direction));
  }

  @GetMapping("/projects/refs")
  public List<Project.Ref> refs() {
    return service.refs();
  }

  @GetMapping("/projects/{id}")
  public Project get(@PathVariable long id) {
    return service.get(id);
  }

  @GetMapping("/applications/{applicationId}/projects")
  public List<Project.ApplicationLink> byApplication(@PathVariable long applicationId) {
    return service.listByApplication(applicationId);
  }

  @PostMapping("/projects")
  @ResponseStatus(HttpStatus.CREATED)
  public Project create(@RequestBody Project.Input input) {
    return service.create(input);
  }

  @PutMapping("/projects/{id}")
  public Project update(@PathVariable long id, @RequestBody Project.Input input) {
    return service.update(id, input);
  }

  @DeleteMapping("/projects/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void delete(@PathVariable long id) {
    service.remove(id);
  }

  @GetMapping("/projects/{id}/deletion-impact")
  public DeletionImpact deletionImpact(@PathVariable long id) {
    return service.deletionImpact(id);
  }
}
