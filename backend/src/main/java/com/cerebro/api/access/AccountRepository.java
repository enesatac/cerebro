package com.cerebro.api.access;

import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.Sql;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Reads accounts with their roles and privileges ({@code user_accounts} → {@code user_roles}). */
@Repository
public class AccountRepository {

  private static final String SELECT =
      "SELECT id, display_name, email, person_id, active, last_sign_in_at, "
          + Sql.AUDIT_COLUMNS
          + " FROM user_accounts ";

  private final JdbcClient jdbc;

  public AccountRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  /** The active account for a sign-in email (case-insensitive), with its resolved privileges. */
  public Optional<SessionUser> findActiveByEmail(String email) {
    return jdbc.sql(SELECT + "WHERE lower(email) = lower(:email) AND active")
        .param("email", email)
        .query(this::account)
        .optional()
        .map(this::resolve);
  }

  public Optional<SessionUser> findById(long id) {
    return jdbc.sql(SELECT + "WHERE id = :id")
        .param("id", id)
        .query(this::account)
        .optional()
        .map(this::resolve);
  }

  /** Active accounts with their roles (the demo sign-in list). */
  public List<SessionUser> listActive() {
    return jdbc.sql(SELECT + "WHERE active ORDER BY id")
        .query(this::account)
        .list()
        .stream()
        .map(this::resolve)
        .toList();
  }

  public void recordSignIn(long id, java.time.OffsetDateTime at) {
    jdbc.sql("UPDATE user_accounts SET last_sign_in_at = :at WHERE id = :id")
        .param("at", at)
        .param("id", id)
        .update();
  }

  private Account account(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new Account(
        rs.getLong("id"),
        rs.getString("display_name"),
        rs.getString("email"),
        Sql.longOrNull(rs, "person_id"),
        rs.getBoolean("active"),
        Sql.timestamp(rs, "last_sign_in_at"),
        Sql.audit(rs));
  }

  private SessionUser resolve(Account account) {
    List<RoleRow> roles =
        jdbc.sql(
                """
                SELECT r.id, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_account_id = :id ORDER BY ur.position, r.id
                """)
            .param("id", account.id())
            .query((rs, row) -> new RoleRow(rs.getLong("id"), rs.getString("name")))
            .list();
    List<String> privileges =
        jdbc.sql(
                """
                SELECT DISTINCT rp.privilege_code FROM user_roles ur
                JOIN role_privileges rp ON rp.role_id = ur.role_id
                WHERE ur.user_account_id = :id
                """)
            .param("id", account.id())
            .query(String.class)
            .list();
    return new SessionUser(
        account.id(),
        account.displayName(),
        account.email(),
        new ArrayList<>(roles.stream().map(RoleRow::id).toList()),
        account.personId(),
        account.active(),
        account.lastSignInAt(),
        account.audit(),
        roles.stream().map(RoleRow::name).toList(),
        Privileges.normalize(privileges));
  }

  private record Account(
      long id,
      String displayName,
      String email,
      Long personId,
      boolean active,
      String lastSignInAt,
      Audit audit) {}

  private record RoleRow(long id, String name) {}
}
