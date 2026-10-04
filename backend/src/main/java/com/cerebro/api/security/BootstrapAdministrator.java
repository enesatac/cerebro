package com.cerebro.api.security;

import com.cerebro.api.shared.Sql;
import java.util.Locale;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

/**
 * First deployment: nobody can sign in to grant roles yet. If no active account holds the system
 * role, the configured email gets one (created if missing). Does nothing once an administrator
 * exists, so the setting can stay in place.
 */
@Component
class BootstrapAdministrator implements ApplicationRunner {

  private static final Logger log = LoggerFactory.getLogger(BootstrapAdministrator.class);

  private final JdbcClient jdbc;
  private final SecurityProperties properties;

  BootstrapAdministrator(JdbcClient jdbc, SecurityProperties properties) {
    this.jdbc = jdbc;
    this.properties = properties;
  }

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    String email = properties.bootstrapAdminEmail();
    if (!StringUtils.hasText(email)) {
      return;
    }
    boolean administered =
        Sql.exists(
            jdbc,
            """
            SELECT 1 FROM user_accounts u
            JOIN user_roles ur ON ur.user_account_id = u.id
            JOIN roles r ON r.id = ur.role_id
            WHERE u.active = 1 AND r.system_role = 1
            """,
            Map.of());
    if (administered) {
      return;
    }
    String address = email.trim().toLowerCase(Locale.ROOT);
    Long existing =
        jdbc.sql("SELECT id FROM user_accounts WHERE lower(email) = :email")
            .param("email", address)
            .query(Long.class)
            .optional()
            .orElse(null);
    long accountId;
    if (existing == null) {
      accountId =
          Sql.insert(
              jdbc.sql("INSERT INTO user_accounts (display_name, email) VALUES (:email, :email)")
                  .param("email", address));
    } else {
      accountId = existing;
      jdbc.sql("UPDATE user_accounts SET active = 1 WHERE id = :id").param("id", accountId).update();
    }
    boolean holds =
        Sql.exists(
            jdbc,
            "SELECT 1 FROM user_roles ur JOIN roles r ON r.id = ur.role_id"
                + " WHERE ur.user_account_id = :account AND r.system_role = 1",
            Map.of("account", accountId));
    if (!holds) {
      jdbc.sql(
              "INSERT INTO user_roles (user_account_id, role_id) SELECT :account, id FROM roles"
                  + " WHERE system_role = 1")
          .param("account", accountId)
          .update();
    }
    log.warn("Granted the system administrator role to {} (bootstrap)", email);
  }
}
