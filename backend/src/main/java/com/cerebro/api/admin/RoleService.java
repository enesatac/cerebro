package com.cerebro.api.admin;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.Privileges;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Roles and their privileges. Reading needs {@code roles:view} or {@code users:view} (to assign
 * roles); changes need {@code roles:edit}. The system role cannot be changed or deleted, and roles
 * still held by users cannot be deleted.
 */
@Service
@Transactional
public class RoleService {

  private static final String ENTITY = "Rol";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final AuditStamp stamp;

  public RoleService(JdbcClient jdbc, Access access, Checks checks, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.stamp = stamp;
  }

  @Transactional(readOnly = true)
  public List<Role> list() {
    access.requireAny("roles:view", "users:view");
    return load("", Map.of());
  }

  @Transactional(readOnly = true)
  public Role get(long id) {
    access.requireAny("roles:view", "users:view");
    return find(id);
  }

  public Role create(Role.Input input) {
    SessionUser actor = access.require("roles:edit");
    validate(input, null);
    Audit audit = stamp.created(actor);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO roles (name, description, system_role, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:name, :description, 0, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .param("name", input.name().trim())
            .param("description", input.description().trim()));
    savePrivileges(id, input.privileges());
    return find(id);
  }

  public Role update(long id, Role.Input input) {
    SessionUser actor = access.require("roles:edit");
    Role current = find(id);
    if (current.system()) {
      throw new ValidationException("Sistem yöneticisi rolü değiştirilemez.");
    }
    validate(input, id);
    Sql.audit(
            jdbc.sql(
                "UPDATE roles SET name = :name, description = :description, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), actor))
        .param("name", input.name().trim())
        .param("description", input.description().trim())
        .param("id", id)
        .update();
    jdbc.sql("DELETE FROM role_privileges WHERE role_id = :id").param("id", id).update();
    savePrivileges(id, input.privileges());
    return find(id);
  }

  public void remove(long id) {
    access.require("roles:edit");
    DeletionImpact impact = impact(find(id));
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM roles WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.require("roles:view");
    return impact(find(id));
  }

  private DeletionImpact impact(Role role) {
    int holders = role.userCount();
    return DeletionImpact.of(
        role.system()
            ? "Sistem yöneticisi rolü silinemez."
            : holders > 0 ? "Bu rol kullanıcılara atanmış. Önce kullanıcılardan kaldırın." : null,
        DeletionImpact.ref("kullanıcı", holders));
  }

  private void validate(Role.Input input, Long excludeId) {
    String name = input.name() == null ? "" : input.name();
    String description = input.description() == null ? "" : input.description();
    if (name.isBlank()) {
      throw new ValidationException("Rol adı zorunludur.", "name");
    }
    if (name.length() > 80) {
      throw new ValidationException("Rol adı en fazla 80 karakter olabilir.", "name");
    }
    if (description.length() > 300) {
      throw new ValidationException("Açıklama en fazla 300 karakter olabilir.", "description");
    }
    checks.assertUnique(
        "roles",
        "name",
        name,
        excludeId,
        "\"" + name.trim() + "\" adında bir rol zaten var.",
        "name");
  }

  /** Unknown codes are dropped and implied levels added (delete ⇒ edit ⇒ view). */
  private void savePrivileges(long roleId, List<String> privileges) {
    for (String code : Privileges.normalize(privileges == null ? List.of() : privileges)) {
      jdbc.sql("INSERT INTO role_privileges (role_id, privilege_code) VALUES (:role, :code)")
          .param("role", roleId)
          .param("code", code)
          .update();
    }
  }

  private Role find(long id) {
    return load("WHERE r.id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private List<Role> load(String where, Map<String, Object> params) {
    Map<Long, List<String>> privileges = new HashMap<>();
    jdbc.sql("SELECT role_id, privilege_code FROM role_privileges")
        .query(
            rs -> {
              privileges
                  .computeIfAbsent(rs.getLong("role_id"), key -> new ArrayList<>())
                  .add(rs.getString("privilege_code"));
            });
    return jdbc.sql(
            "SELECT r.*, (SELECT count(*) FROM user_roles ur WHERE ur.role_id = r.id) AS holders"
                + " FROM roles r "
                + where
                + " ORDER BY r.id")
        .params(params)
        .query(
            (rs, row) ->
                new Role(
                    rs.getLong("id"),
                    rs.getString("name"),
                    Sql.text(rs, "description"),
                    Privileges.normalize(privileges.getOrDefault(rs.getLong("id"), List.of())),
                    rs.getInt("system_role") == 1,
                    rs.getInt("holders"),
                    Sql.audit(rs)))
        .list();
  }
}
