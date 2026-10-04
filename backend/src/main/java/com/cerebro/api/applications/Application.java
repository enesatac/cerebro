package com.cerebro.api.applications;

import com.cerebro.api.portfolio.DocumentationLink;
import com.cerebro.api.portfolio.RoleAssignment;
import com.cerebro.api.portfolio.TeamAssignment;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.EntityRef;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.List;

/**
 * An application in the portfolio with everything recorded about it. Child rows ({@code roles},
 * {@code environments}…) carry their own ids; new ones are sent with {@code id: null}.
 */
public record Application(
    long id,
    String code,
    String name,
    String shortDescription,
    String detailedDescription,
    String businessPurpose,
    String type,
    String lifecycle,
    String criticality,
    String operationalStatus,
    List<String> tags,
    Long businessUnitId,
    List<String> businessProcesses,
    List<String> userGroups,
    Long estimatedUserCount,
    List<RoleAssignment> roles,
    List<TeamAssignment> teams,
    List<TechnologyUsage> technologies,
    List<DataStore> dataStores,
    Hosting hosting,
    List<SourceRepository> repositories,
    List<Environment> environments,
    List<DocumentationLink> documentation,
    Audit audit) {

  /** Lifecycle stages in business order (sorting), as the system codes of the list. */
  public static final List<String> LIFECYCLES =
      List.of("planned", "development", "active", "maintenance", "deprecated", "retired");

  public record Input(
      String code,
      String name,
      String shortDescription,
      String detailedDescription,
      String businessPurpose,
      String type,
      String lifecycle,
      String criticality,
      String operationalStatus,
      List<String> tags,
      Long businessUnitId,
      List<String> businessProcesses,
      List<String> userGroups,
      Long estimatedUserCount,
      List<RoleAssignment> roles,
      List<TeamAssignment> teams,
      List<TechnologyUsage> technologies,
      List<DataStore> dataStores,
      Hosting hosting,
      List<SourceRepository> repositories,
      List<Environment> environments,
      List<DocumentationLink> documentation) {

    /** Missing collections are treated as empty. */
    public Input {
      tags = orEmpty(tags);
      businessProcesses = orEmpty(businessProcesses);
      userGroups = orEmpty(userGroups);
      roles = orEmpty(roles);
      teams = orEmpty(teams);
      technologies = orEmpty(technologies);
      dataStores = orEmpty(dataStores);
      repositories = orEmpty(repositories);
      environments = orEmpty(environments);
      documentation = orEmpty(documentation);
      hosting = hosting == null ? new Hosting("on-premises", null, null) : hosting;
    }

    private static <T> List<T> orEmpty(List<T> values) {
      return values == null ? List.of() : values;
    }
  }

  public record Hosting(
      String model, String cloudProvider, @JsonInclude(Include.NON_NULL) String notes) {}

  public record TechnologyUsage(
      Long id, long technologyId, String layer, @JsonInclude(Include.NON_NULL) String version) {}

  public record DataStore(
      Long id, String name, long technologyId, String purpose, boolean containsPersonalData) {}

  public record SourceRepository(
      Long id,
      String name,
      String type,
      String url,
      String defaultBranch,
      @JsonInclude(Include.NON_NULL) String description) {}

  /** A deployment environment. Never holds credentials — URLs and notes only. */
  public record Environment(
      Long id,
      String type,
      String name,
      String url,
      String status,
      String region,
      @JsonInclude(Include.NON_NULL) String notes) {}

  /** Denormalised row for the register. */
  public record ListItem(
      long id,
      String code,
      String name,
      String shortDescription,
      String lifecycle,
      String criticality,
      String operationalStatus,
      EntityRef businessUnit,
      EntityRef technicalOwner,
      List<TeamRef> teams,
      String updatedAt) {}

  public record TeamRef(long id, String name, String responsibility) {}

  /** Lightweight id → name reference. */
  public record Ref(long id, String name, String code) {}
}
