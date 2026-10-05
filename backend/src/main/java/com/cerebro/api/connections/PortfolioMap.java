package com.cerebro.api.connections;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;
import java.util.List;

/**
 * Every application and project with the links between them (frontend: {@code PortfolioMap} in
 * {@code domains/connections/types}). Small by design: ids, names and the codes the map colours by.
 */
public record PortfolioMap(
    List<MapApplication> applications, List<MapProject> projects, List<Link> links) {

  public record MapApplication(
      long id, String code, String name, String lifecycle, String criticality, Long businessUnitId) {}

  public record MapProject(
      long id, String code, String name, String status, String health, Long businessUnitId) {}

  /**
   * {@code dependency} and {@code integration} join two applications, {@code impact} a project and
   * an application; fields of the other kinds are left out of the JSON.
   */
  public record Link(
      String kind,
      long id,
      @JsonInclude(Include.NON_NULL) Long fromApplicationId,
      @JsonInclude(Include.NON_NULL) Long toApplicationId,
      @JsonInclude(Include.NON_NULL) Long projectId,
      @JsonInclude(Include.NON_NULL) Long applicationId,
      String type,
      @JsonInclude(Include.NON_NULL) String criticality,
      @JsonInclude(Include.NON_NULL) String name) {}
}
