package com.cerebro.api.access;

import java.time.OffsetDateTime;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Optional;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

/** Reads accounts with their roles and privileges ({@code user_accounts} → {@code user_roles}). */
@Repository
public class AccountRepository {

  private final JdbcClient jdbc;

  public AccountRepository(JdbcClient jdbc) {
    this.jdbc = jdbc;
  }

  /** The active account for a sign-in email (case-insensitive), with its resolved privileges. */
  public Optional<SessionUser> findActiveByEmail(String email) {
    return jdbc.sql(
            """
            SELECT id, display_name, email, person_id, active, last_sign_in_at
            FROM user_accounts
            WHERE lower(email) = lower(:email) AND active
            """)
        .param("email", email)
        .query(
            (rs, row) ->
                new Account(
                    rs.getLong("id"),
                    rs.getString("display_name"),
                    rs.getString("email"),
                    (Long) rs.getObject("person_id"),
                    rs.getBoolean("active"),
                    rs.getObject("last_sign_in_at", OffsetDateTime.class)))
        .optional()
        .map(this::resolve);
  }

  private SessionUser resolve(Account account) {
    List<RoleRow> roles =
        jdbc.sql(
                """
                SELECT r.id, r.name FROM user_roles ur JOIN roles r ON r.id = ur.role_id
                WHERE ur.user_account_id = :id ORDER BY r.name
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
                ORDER BY rp.privilege_code
                """)
            .param("id", account.id())
            .query(String.class)
            .list();
    return new SessionUser(
        account.id(),
        account.displayName(),
        account.email(),
        roles.stream().map(RoleRow::id).toList(),
        account.personId(),
        account.active(),
        account.lastSignInAt(),
        roles.stream().map(RoleRow::name).toList(),
        new LinkedHashSet<>(privileges));
  }

  private record Account(
      long id,
      String displayName,
      String email,
      Long personId,
      boolean active,
      OffsetDateTime lastSignInAt) {}

  private record RoleRow(long id, String name) {}
}
