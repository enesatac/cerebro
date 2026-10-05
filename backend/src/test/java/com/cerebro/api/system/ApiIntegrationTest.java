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
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ActiveProfilesResolver;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.DockerClientFactory;
import org.testcontainers.containers.OracleContainer;

/**
 * The API end to end with the demo data: migrations, sign-in, privileges, CSRF, validation and a
 * write round trip. The database, in order of preference:
 *
 * <ul>
 *   <li>an Oracle schema given in {@code CEREBRO_TEST_DB_URL} (+ {@code _USER}, {@code _PASSWORD})
 *       — e.g. a CI schema on the corporate database; it must be empty;
 *   <li>Oracle Database XE 21 in Docker (Testcontainers) when Docker is available;
 *   <li>otherwise H2 in Oracle compatibility mode (profile {@code h2}), so the test always runs.
 * </ul>
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles(resolver = ApiIntegrationTest.Database.class)
class ApiIntegrationTest {

  private static final String EXTERNAL = System.getenv("CEREBRO_TEST_DB_URL");
  private static OracleContainer oracle;

  /** {@code local} (demo data and sign-in) on Oracle, {@code h2} without one. */
  static class Database implements ActiveProfilesResolver {
    @Override
    public String[] resolve(Class<?> testClass) {
      return new String[] {onOracle() ? "local" : "h2"};
    }
  }

  static boolean onOracle() {
    return EXTERNAL != null || DockerClientFactory.instance().isDockerAvailable();
  }

  @DynamicPropertySource
  static void database(DynamicPropertyRegistry registry) {
    if (EXTERNAL != null) {
      registry.add("spring.datasource.url", () -> EXTERNAL);
      registry.add("spring.datasource.username", () -> System.getenv("CEREBRO_TEST_DB_USER"));
      registry.add("spring.datasource.password", () -> System.getenv("CEREBRO_TEST_DB_PASSWORD"));
      return;
    }
    if (!onOracle()) {
      // A database of its own, so other test contexts cannot leave data behind.
      registry.add(
          "spring.datasource.url",
          () -> "jdbc:h2:mem:api-test;MODE=Oracle;DEFAULT_NULL_ORDERING=HIGH;DB_CLOSE_DELAY=-1");
      return;
    }
    if (oracle == null) {
      oracle = new OracleContainer("gvenzl/oracle-xe:21-slim-faststart");
      oracle.start();
    }
    registry.add("spring.datasource.url", oracle::getJdbcUrl);
    registry.add("spring.datasource.username", oracle::getUsername);
    registry.add("spring.datasource.password", oracle::getPassword);
  }

  @Autowired JdbcClient jdbc;
  @Autowired MockMvc mvc;

  /** Signs in like the browser does and returns the session cookie (sessions live in the DB). */
  private Cookie signIn(long accountId) throws Exception {
    var response =
        mvc.perform(
                post("/api/auth/sign-in")
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"accountId\":" + accountId + "}"))
            .andExpect(status().isOk())
            .andReturn()
            .getResponse();
    Cookie session = response.getCookie("SESSION");
    assertThat(session).isNotNull();
    assertThat(response.getHeaders("Set-Cookie"))
        .anySatisfy(header -> assertThat(header).startsWith("SESSION=").contains("HttpOnly"));
    return session;
  }

  @Test
  void migratesAndSeeds() {
    assertThat(jdbc.sql("SELECT count(*) FROM access_privileges").query(Integer.class).single())
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
    Cookie admin = signIn(1);
    mvc.perform(get("/api/auth/session").cookie(admin))
        .andExpect(jsonPath("$.roleNames[0]").value("Sistem yöneticisi"))
        .andExpect(jsonPath("$.privileges.length()").value(PrivilegeModule.allPrivileges().size()));
    mvc.perform(get("/api/applications?page=0&pageSize=5&sort=name").cookie(admin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.items.length()").value(5))
        .andExpect(jsonPath("$.pageSize").value(5));
    mvc.perform(get("/api/governance/overview").cookie(admin)).andExpect(status().isOk());

    // Elif (business unit + employee roles) has no contract privileges and cannot edit projects.
    Cookie elif = signIn(3);
    mvc.perform(get("/api/contracts").cookie(elif))
        .andExpect(status().isForbidden())
        .andExpect(jsonPath("$.code").value("forbidden"));
    mvc.perform(delete("/api/projects/1").cookie(elif).with(csrf()))
        .andExpect(status().isForbidden());
  }

  @Test
  void refusesWritesWithoutTheCsrfToken() throws Exception {
    Cookie admin = signIn(1);
    mvc.perform(
            post("/api/business-units")
                .cookie(admin)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"code\":\"X\",\"name\":\"X\",\"description\":\"\"}"))
        .andExpect(status().isForbidden());
  }

  @Test
  void writesAndValidates() throws Exception {
    Cookie admin = signIn(1);
    String body =
        "{\"name\":\"Entegrasyon Test Ekibi\",\"description\":\"\",\"managerId\":1,"
            + "\"memberIds\":[1,2],\"contactEmail\":null,\"chatChannel\":null,"
            + "\"responsibilities\":[]}";
    String created =
        mvc.perform(
                post("/api/teams")
                    .cookie(admin)
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
                .cookie(admin)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("Entegrasyon Test Ekibi", "ENTEGRASYON TEST EKİBİ")))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.field").value("name"));

    mvc.perform(
            put("/api/teams/" + id)
                .cookie(admin)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(body.replace("[1,2]", "[3]")))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.memberIds[0]").value(3));

    mvc.perform(delete("/api/teams/" + id).cookie(admin).with(csrf()))
        .andExpect(status().isNoContent());
    mvc.perform(get("/api/teams/" + id).cookie(admin))
        .andExpect(status().isNotFound())
        .andExpect(jsonPath("$.code").value("not-found"));
  }

  @Test
  void opensTheProcurementTrackerToBusinessUnitsReadOnly() throws Exception {
    // Elif (business unit): reads the process without internal notes, cannot change it.
    Cookie elif = signIn(3);
    mvc.perform(get("/api/procurement").cookie(elif))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$[4].code").value("SZL-0005"))
        .andExpect(jsonPath("$[4].totalValue").doesNotExist());
    mvc.perform(get("/api/procurement/5").cookie(elif))
        .andExpect(jsonPath("$.notes[?(@.internal == true)]").isEmpty());
    mvc.perform(
            put("/api/procurement/2/steps")
                .cookie(elif)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("[]"))
        .andExpect(status().isForbidden());

    // Zeynep (portfolio office): sees internal notes, writes steps and notes.
    Cookie zeynep = signIn(6);
    mvc.perform(get("/api/procurement/5").cookie(zeynep))
        .andExpect(jsonPath("$.notes[?(@.internal == true)]").isNotEmpty());
    String step =
        "{\"id\":null,\"type\":\"rfq\",\"status\":\"in-progress\",\"ownerId\":6,"
            + "\"plannedStart\":\"2026-10-01\",\"plannedEnd\":\"2026-10-20\","
            + "\"actualStart\":%s,\"actualEnd\":null,\"note\":\"\"}";
    mvc.perform(
            put("/api/procurement/2/steps")
                .cookie(zeynep)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("[" + step.formatted("null") + "]"))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.field").value("steps.0.actualStart"));
    mvc.perform(
            put("/api/procurement/2/steps")
                .cookie(zeynep)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("[" + step.formatted("\"2026-10-02\"") + "]"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.steps[0].type").value("rfq"))
        .andExpect(jsonPath("$.steps[0].actualStart").value("2026-10-02"));
    String note =
        mvc.perform(
                post("/api/procurement/2/notes")
                    .cookie(zeynep)
                    .with(csrf())
                    .contentType(MediaType.APPLICATION_JSON)
                    .content("{\"text\":\"Teklifler açıldı.\",\"internal\":true}"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.authorId").isNumber())
            .andReturn()
            .getResponse()
            .getContentAsString();
    long noteId = Long.parseLong(note.replaceAll("^\\{\"id\":(\\d+).*$", "$1"));
    mvc.perform(delete("/api/procurement/notes/" + noteId).cookie(zeynep).with(csrf()))
        .andExpect(status().isNoContent());
  }
}
