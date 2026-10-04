package com.cerebro.api.organisation;

import com.cerebro.api.shared.DeletionImpact;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import java.util.List;
import org.springframework.format.annotation.DateTimeFormat;
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

/** {@code BusinessUnitRepository}, {@code PersonRepository} and {@code TeamRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Organizasyon")
public class OrganisationController {

  private final BusinessUnitService businessUnits;
  private final PersonService people;
  private final TeamService teams;

  public OrganisationController(
      BusinessUnitService businessUnits, PersonService people, TeamService teams) {
    this.businessUnits = businessUnits;
    this.people = people;
    this.teams = teams;
  }

  // Business units

  @GetMapping("/business-units")
  public List<BusinessUnit> businessUnits() {
    return businessUnits.list();
  }

  @PostMapping("/business-units")
  @ResponseStatus(HttpStatus.CREATED)
  public BusinessUnit createBusinessUnit(@RequestBody BusinessUnit.Input input) {
    return businessUnits.create(input);
  }

  @PutMapping("/business-units/{id}")
  public BusinessUnit updateBusinessUnit(
      @PathVariable long id, @RequestBody BusinessUnit.Input input) {
    return businessUnits.update(id, input);
  }

  @DeleteMapping("/business-units/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteBusinessUnit(@PathVariable long id) {
    businessUnits.remove(id);
  }

  @GetMapping("/business-units/{id}/deletion-impact")
  public DeletionImpact businessUnitDeletionImpact(@PathVariable long id) {
    return businessUnits.deletionImpact(id);
  }

  // People

  @GetMapping("/people")
  public List<Person> people() {
    return people.list();
  }

  @GetMapping("/people/{id}")
  public Person person(@PathVariable long id) {
    return people.get(id);
  }

  @GetMapping("/people/{id}/workload")
  public PersonWorkload workload(
      @PathVariable long id,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate today) {
    return people.workload(id, today);
  }

  @PostMapping("/people")
  @ResponseStatus(HttpStatus.CREATED)
  public Person createPerson(@RequestBody Person.Input input) {
    return people.create(input);
  }

  @PutMapping("/people/{id}")
  public Person updatePerson(@PathVariable long id, @RequestBody Person.Input input) {
    return people.update(id, input);
  }

  @DeleteMapping("/people/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deletePerson(@PathVariable long id) {
    people.remove(id);
  }

  @GetMapping("/people/{id}/deletion-impact")
  public DeletionImpact personDeletionImpact(@PathVariable long id) {
    return people.deletionImpact(id);
  }

  // Teams

  @GetMapping("/teams")
  public List<Team> teams() {
    return teams.list();
  }

  @GetMapping("/teams/summaries")
  public List<Team.ListItem> teamSummaries() {
    return teams.summaries();
  }

  @GetMapping("/teams/{id}")
  public Team team(@PathVariable long id) {
    return teams.get(id);
  }

  @PostMapping("/teams")
  @ResponseStatus(HttpStatus.CREATED)
  public Team createTeam(@RequestBody Team.Input input) {
    return teams.create(input);
  }

  @PutMapping("/teams/{id}")
  public Team updateTeam(@PathVariable long id, @RequestBody Team.Input input) {
    return teams.update(id, input);
  }

  @DeleteMapping("/teams/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteTeam(@PathVariable long id) {
    teams.remove(id);
  }

  @GetMapping("/teams/{id}/deletion-impact")
  public DeletionImpact teamDeletionImpact(@PathVariable long id) {
    return teams.deletionImpact(id);
  }
}
