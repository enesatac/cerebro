package com.cerebro.api.admin;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * User administration: reading needs {@code users:view}, changes {@code users:edit}. Guards keep
 * the system administrable: someone active must always hold the system role, and nobody can lock
 * themselves out.
 */
@Service
@Transactional
public class UserService {

  private static final String ENTITY = "Kullanıcı";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final AuditStamp stamp;

  public UserService(JdbcClient jdbc, Access access, Checks checks, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.stamp = stamp;
  }

  @Transactional(readOnly = true)
  public List<UserAccount> list() {
    access.require("users:view");
    return all().stream().sorted(Collation.by(UserAccount::displayName)).toList();
  }

  @Transactional(readOnly = true)
  public UserAccount get(long id) {
    access.require("users:view");
    return find(id);
  }

  public UserAccount create(UserAccount.Input input) {
    SessionUser actor = access.require("users:edit");
    validate(input, null, actor);
    Audit audit = stamp.created(actor);
    long id =
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO user_accounts (display_name, email, person_id, active, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:displayName, :email, :personId, :active, "
                        + Sql.AUDIT_VALUES
                        + ") RETURNING id"),
                audit)
            .param("displayName", input.displayName())
            .param("email", input.email())
            .param("personId", input.personId())
            .param("active", input.active())
            .query(Long.class)
            .single();
    saveRoles(id, input.roleIds());
    return find(id);
  }

  public UserAccount update(long id, UserAccount.Input input) {
    SessionUser actor = access.require("users:edit");
    UserAccount current = find(id);
    validate(input, current, actor);
    Sql.audit(
            jdbc.sql(
                "UPDATE user_accounts SET display_name = :displayName, email = :email,"
                    + " person_id = :personId, active = :active, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), actor))
        .param("displayName", input.displayName())
        .param("email", input.email())
        .param("personId", input.personId())
        .param("active", input.active())
        .param("id", id)
        .update();
    jdbc.sql("DELETE FROM user_roles WHERE user_account_id = :id").param("id", id).update();
    saveRoles(id, input.roleIds());
    return find(id);
  }

  public void remove(long id) {
    SessionUser actor = access.require("users:edit");
    DeletionImpact impact = impact(find(id), actor);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM user_accounts WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    SessionUser actor = access.require("users:view");
    return impact(find(id), actor);
  }

  private DeletionImpact impact(UserAccount user, SessionUser actor) {
    long otherAdmins = all().stream().filter(u -> u.id() != user.id() && isAdmin(u)).count();
    String blocked =
        user.id() == actor.id()
            ? "Kendi hesabınızı silemezsiniz."
            : isAdmin(user) && otherAdmins == 0
                ? "En az bir aktif sistem yöneticisi gereklidir; sonuncusunun hesabı silinemez."
                : null;
    return new DeletionImpact(List.of(), blocked);
  }

  private void validate(UserAccount.Input input, UserAccount current, SessionUser actor) {
    checks.assertUnique(
        "user_accounts",
        "email",
        input.email(),
        current == null ? null : current.id(),
        input.email() + " adresiyle bir hesap zaten var.",
        "email");
    checks.assertRefs(java.util.Collections.singletonList(input.personId()), "people", "kişi", "personId");
    List<Long> roleIds = input.roleIds() == null ? List.of() : input.roleIds();
    checks.assertRefs(roleIds, "roles", "rol", "roleIds");
    if (roleIds.isEmpty()) {
      throw new ValidationException("En az bir rol seçin.", "roleIds");
    }
    boolean self = current != null && current.id() == actor.id();
    if (self && !input.active()) {
      throw new ValidationException("Kendi hesabınızı devre dışı bırakamazsınız.", "active");
    }
    boolean inputAdmin = input.active() && holdsSystemRole(roleIds);
    if (self && isAdmin(current) && !inputAdmin) {
      throw new ValidationException("Kendi sistem yöneticisi rolünüzü kaldıramazsınız.", "roleIds");
    }
    long otherAdmins =
        all().stream().filter(u -> (current == null || u.id() != current.id()) && isAdmin(u)).count();
    if (current != null && isAdmin(current) && !inputAdmin && otherAdmins == 0) {
      throw new ValidationException("En az bir aktif sistem yöneticisi gereklidir.", "roleIds");
    }
  }

  private boolean isAdmin(UserAccount user) {
    return user.active() && holdsSystemRole(user.roleIds());
  }

  private boolean holdsSystemRole(List<Long> roleIds) {
    Set<Long> system =
        new HashSet<>(jdbc.sql("SELECT id FROM roles WHERE system").query(Long.class).list());
    return roleIds.stream().anyMatch(system::contains);
  }

  private void saveRoles(long userId, List<Long> roleIds) {
    int position = 0;
    for (Long roleId : new LinkedHashSet<>(roleIds)) {
      jdbc.sql(
              "INSERT INTO user_roles (user_account_id, role_id, position) VALUES (:user, :role,"
                  + " :position)")
          .param("user", userId)
          .param("role", roleId)
          .param("position", position++)
          .update();
    }
  }

  UserAccount find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  List<UserAccount> all() {
    return load("", Map.of());
  }

  private List<UserAccount> load(String where, Map<String, Object> params) {
    Map<Long, List<Long>> roles = new java.util.HashMap<>();
    jdbc.sql("SELECT user_account_id, role_id FROM user_roles ORDER BY position, role_id")
        .query(
            rs -> {
              roles
                  .computeIfAbsent(rs.getLong("user_account_id"), key -> new ArrayList<>())
                  .add(rs.getLong("role_id"));
            });
    return jdbc.sql(
            "SELECT id, display_name, email, person_id, active, last_sign_in_at, "
                + Sql.AUDIT_COLUMNS
                + " FROM user_accounts "
                + where
                + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) ->
                new UserAccount(
                    rs.getLong("id"),
                    rs.getString("display_name"),
                    rs.getString("email"),
                    roles.getOrDefault(rs.getLong("id"), List.of()),
                    Sql.longOrNull(rs, "person_id"),
                    rs.getBoolean("active"),
                    Sql.timestamp(rs, "last_sign_in_at"),
                    Sql.audit(rs)))
        .list();
  }
}
