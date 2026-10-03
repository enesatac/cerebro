package com.cerebro.api.system;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cerebro.api.access.PrivilegeModule;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * Real PostgreSQL: the migrations apply, the system role holds every privilege, the bootstrap
 * administrator is created and the session endpoint resolves privileges from the database. Needs
 * Docker (CI has it); skipped on machines without it.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@Testcontainers(disabledWithoutDocker = true)
class MigrationAndSessionIntegrationTest {

  @Container @ServiceConnection
  static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:17");

  @Autowired JdbcClient jdbc;
  @Autowired MockMvc mvc;

  @Test
  void migratesAndSeedsTheCatalogue() {
    assertThat(jdbc.sql("SELECT count(*) FROM privileges").query(Integer.class).single())
        .isEqualTo(PrivilegeModule.allPrivileges().size());
    assertThat(
            jdbc.sql(
                    "SELECT count(*) FROM role_privileges rp JOIN roles r ON r.id = rp.role_id"
                        + " WHERE r.system")
                .query(Integer.class)
                .single())
        .isEqualTo(PrivilegeModule.allPrivileges().size());
    assertThat(
            jdbc.sql("SELECT count(DISTINCT list_key) FROM master_data_items")
                .query(Integer.class)
                .single())
        .isGreaterThan(30);
  }

  @Test
  void signsTheDevAccountInAsSystemAdministrator() throws Exception {
    mvc.perform(get("/api/session"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.email").value("gelistirici@cerebro.local"))
        .andExpect(jsonPath("$.roleNames[0]").value("Sistem yöneticisi"))
        .andExpect(jsonPath("$.privileges.length()").value(PrivilegeModule.allPrivileges().size()));
  }
}
