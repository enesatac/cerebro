package com.cerebro.api.applications;

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

/** {@code ApplicationRepository}. */
@RestController
@RequestMapping("/api/applications")
@Tag(name = "Uygulamalar")
public class ApplicationController {

  private final ApplicationService service;

  public ApplicationController(ApplicationService service) {
    this.service = service;
  }

  @GetMapping
  public PagedResult<Application.ListItem> list(
      @RequestParam(required = false) String search,
      @RequestParam(required = false) List<String> lifecycles,
      @RequestParam(required = false) List<String> criticalities,
      @RequestParam(required = false) Long teamId,
      @RequestParam(required = false) Long technologyId,
      @RequestParam(required = false) Long businessUnitId,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "25") int pageSize,
      @RequestParam(required = false) String sort,
      @RequestParam(required = false) String direction) {
    return service.list(
        new ApplicationQuery(
            search,
            lifecycles,
            criticalities,
            teamId,
            technologyId,
            businessUnitId,
            page,
            pageSize,
            sort,
            direction));
  }

  @GetMapping("/refs")
  public List<Application.Ref> refs() {
    return service.refs();
  }

  @GetMapping("/{id}")
  public Application get(@PathVariable long id) {
    return service.get(id);
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public Application create(@RequestBody Application.Input input) {
    return service.create(input);
  }

  @PutMapping("/{id}")
  public Application update(@PathVariable long id, @RequestBody Application.Input input) {
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
