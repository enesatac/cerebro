package com.cerebro.api.system;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cerebro.api.access.PrivilegeModule;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.postgresql.PostgreSQLContainer;

/**
 * The API end to end on a real PostgreSQL with the demo data: migrations, sign-in, privileges,
 * CSRF, validation and a write round trip. Runs on PostgreSQL in Docker (CI), or against an
 * already migrated database given in {@code CEREBRO_TEST_DB_URL}; skipped without either.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("local")
@EnabledIf("databaseAvailable")
class ApiIntegrationTest {

  private static final String EXTERNAL = System.getenv("CEREBRO_TEST_DB_URL");
  private static PostgreSQLContainer postgres;

  static boolean databaseAvailable() {
    return EXTERNAL != null || DockerClientFactory.instance().isDockerAvailable();
  }

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry registry) {
    if (EXTERNAL != null) {
      registry.add("spring.datasource.url", () -> EXTERNAL);
      registry.add("spring.datasource.username", () -> "postgres");
      registry.add("spring.datasource.password", () -> "postgres");
      registry.add("spring.datasource.hikari.maximum-pool-size", () -> "1");
      registry.add("spring.flyway.enabled", () -> "false");
      return;
    }
    if (postgres == null) {
      postgres = new PostgreSQLContainer("postgres:17");
      postgres.start();
    }
    registry.add("spring.datasource.url", postgres::getJdbcUrl);
    registry.add("spring.datasource.username", postgres::getUsername);
    registry.add("spring.datasource.password", postgres::getPassword);
  }

  @Autowired JdbcClient jdbc;
  @Autowired MockMvc mvc;

  private MockHttpSession signIn(long accountId) throws Exception {
    MockHttpSession session = new MockHttpSession();
    mvc.perform(
            post("/api/auth/sign-in")
                .session(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"accountId\":" + accountId + "}"))
        .andExpect(status().isOk());
    return session;
  }

  @Test
  void migratesAndSeeds() {
    assertThat(jdbc.sql("SELECT count(*) FROM privileges").query(Integer.class).single())
        .isEqualTo(PrivilegeModule.allPrivileges().size());
    assertThat(jdbc.sql("SELECT count(*) FROM applications").query(Integer.class).single())
        .isGreaterThan(10);
  }

  @Test
  void needsASignedInAccount() throws Exception {
    mvc.perform(get("/api/applications/refs")).andExpect(status().isUnauthorized());
    mvc.perform(get("/api/auth/session")).andExpect(status().isNoContent());
    mvc.perform(get("/api/auth/sign-in-options"))
        .andExpect(jsonPath("$.accounts[0].displayName").value("Can Öztürk"));
  }

  @Test
  void signsInAndReadsWithTheRolesPrivileges() throws Exception {
    MockHttpSession admin = signIn(1);
    mvc.perform(get("/api/auth/session").session(admin))
        .andExpect(jsonPath("$.roleNames[0]").value("Sistem yöneticisi"))
        .andExpect(jsonPath("$.privileges.length()").value(PrivilegeModule.allPrivileges().size()));
    mvc.perform(get("/api/applications?page=0&pageSize=5&sort=name").session(admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(5))
        .andExpect(jsonPath("$.pageSize").value(5));
    mvc.perform(get("/api/governance/overview").session(admin)).andExpect(status().isOk());

    // Elif (business unit + employee roles) has no contract privileges and cannot edit projects.
    MockHttpSession elif = signIn(3);
    mvc.perform(get("/api/contracts").session(elif))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("forbidden"));
    mvc.perform(delete("/api/projects/1").session(elif).with(csrf()))
        .andExpect(status().isForbidden());
  }

  @Test
  void refusesWritesWithoutTheCsrfToken() throws Exception {
    MockHttpSession admin = signIn(1);
    mvc.perform(
            post("/api/business-units")
                .session(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"X\",\"name\":\"X\",\"description\":\"\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void writesAndValidates() throws Exception {
    MockHttpSession admin = signIn(1);
    String body =
        "{\"name\":\"Entegrasyon Test Ekibi\",\"description\":\"\",\"managerId\":1,"
            + "\"memberIds\":[1,2],\"contactEmail\":null,\"chatChannel\":null,"
            + "\"responsibilities\":[]}";
    String created =
        mvc.perform(
                post("/api/teams")
                    .session(admin)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.memberIds.length()").value(2))
            .andExpect(jsonPath("$.audit.createdBy").value(1))
            .andReturn()
            .getResponse()
            .getContentAsString();
    long id = Long.parseLong(created.replaceAll("^\\{\"id\":(\\d+).*$", "$1"));

    mvc.perform(
            post("/api/teams")
                .session(admin)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("Entegrasyon Test Ekibi", "ENTEGRASYON TEST EKİBİ")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.field").value("name"));

    mvc.perform(
            put("/api/teams/" + id)
                .session(admin)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("[1,2]", "[3]")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.memberIds[0]").value(3));

    mvc.perform(delete("/api/teams/" + id).session(admin).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/teams/" + id).session(admin))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("not-found"));
  }
}
