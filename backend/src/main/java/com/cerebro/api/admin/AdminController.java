package com.cerebro.api.admin;

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

/** {@code UserRepository} and {@code RoleRepository}. */
@RestController
@RequestMapping("/api")
@Tag(name = "Kullanıcılar ve roller")
public class AdminController {

  private final UserService users;
  private final RoleService roles;

  public AdminController(UserService users, RoleService roles) {
    this.users = users;
    this.roles = roles;
  }

  @GetMapping("/users")
  public List<UserAccount> users() {
    return users.list();
  }

  @GetMapping("/users/{id}")
  public UserAccount user(@PathVariable long id) {
    return users.get(id);
  }

  @PostMapping("/users")
  @ResponseStatus(HttpStatus.CREATED)
  public UserAccount createUser(@RequestBody UserAccount.Input input) {
    return users.create(input);
  }

  @PutMapping("/users/{id}")
  public UserAccount updateUser(@PathVariable long id, @RequestBody UserAccount.Input input) {
    return users.update(id, input);
  }

  @DeleteMapping("/users/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteUser(@PathVariable long id) {
    users.remove(id);
  }

  @GetMapping("/users/{id}/deletion-impact")
  public DeletionImpact userDeletionImpact(@PathVariable long id) {
    return users.deletionImpact(id);
  }

  @GetMapping("/roles")
  public List<Role> roles() {
    return roles.list();
  }

  @GetMapping("/roles/{id}")
  public Role role(@PathVariable long id) {
    return roles.get(id);
  }

  @PostMapping("/roles")
  @ResponseStatus(HttpStatus.CREATED)
  public Role createRole(@RequestBody Role.Input input) {
    return roles.create(input);
  }

  @PutMapping("/roles/{id}")
  public Role updateRole(@PathVariable long id, @RequestBody Role.Input input) {
    return roles.update(id, input);
  }

  @DeleteMapping("/roles/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  public void deleteRole(@PathVariable long id) {
    roles.remove(id);
  }

  @GetMapping("/roles/{id}/deletion-impact")
  public DeletionImpact roleDeletionImpact(@PathVariable long id) {
    return roles.deletionImpact(id);
  }
}
