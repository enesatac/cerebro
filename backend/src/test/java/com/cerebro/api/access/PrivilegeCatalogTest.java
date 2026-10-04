package com.cerebro.api.access;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

class PrivilegeCatalogTest {

  private static final Pattern CODE = Pattern.compile("\\('([A-Za-z]+:(?:view|edit|delete))'");

  @Test
  void javaCatalogueMatchesTheSeededPrivileges() throws IOException {
    String sql =
        new ClassPathResource("db/migration/V2__privileges_and_system_role.sql")
            .getContentAsString(StandardCharsets.UTF_8);
    List<String> seeded = CODE.matcher(sql).results().map(match -> match.group(1)).toList();

    assertThat(PrivilegeModule.allPrivileges()).containsExactlyElementsOf(seeded);
  }

  @Test
  void buildsCodesOnlyForSupportedLevels() {
    assertThat(PrivilegeModule.PROJECTS.privilege(AccessLevel.DELETE)).isEqualTo("projects:delete");
    assertThat(PrivilegeModule.byId("demandManagement")).contains(PrivilegeModule.DEMAND_MANAGEMENT);
    assertThatThrownBy(() -> PrivilegeModule.DASHBOARD.privilege(AccessLevel.EDIT))
        .isInstanceOf(IllegalArgumentException.class);
  }

  @Test
  void inactiveAccountsHoldNothing() {
    SessionUser user =
        new SessionUser(
            1, "A", "a@x", List.of(), null, false, null, null, List.of(), List.of("projects:view"));
    assertThat(user.has("projects:view")).isFalse();
  }

  @Test
  void normalisesPrivilegesWithImpliedLevelsInCatalogueOrder() {
    assertThat(Privileges.normalize(List.of("roles:edit", "projects:delete", "nope:view")))
        .containsExactly(
            "projects:view", "projects:edit", "projects:delete", "roles:view", "roles:edit");
  }
}
