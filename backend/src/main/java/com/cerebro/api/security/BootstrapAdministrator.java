package com.cerebro.api.security;

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
        jdbc.sql(
                """
                SELECT EXISTS (
                  SELECT 1 FROM user_accounts u
                  JOIN user_roles ur ON ur.user_account_id = u.id
                  JOIN roles r ON r.id = ur.role_id
                  WHERE u.active AND r.system)
                """)
            .query(Boolean.class)
            .single();
    if (administered) {
      return;
    }
    long accountId =
        jdbc.sql(
                """
                INSERT INTO user_accounts (display_name, email) VALUES (:email, lower(:email))
                ON CONFLICT (email) DO UPDATE SET active = true
                RETURNING id
                """)
            .param("email", email)
            .query(Long.class)
            .single();
    jdbc.sql(
            """
            INSERT INTO user_roles (user_account_id, role_id)
            SELECT :account, id FROM roles WHERE system
            ON CONFLICT DO NOTHING
            """)
        .param("account", accountId)
        .update();
    log.warn("Granted the system administrator role to {} (bootstrap)", email);
  }
}
