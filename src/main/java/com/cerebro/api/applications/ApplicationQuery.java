package com.cerebro.api.applications;

import java.util.List;

/** Filters, sort and page of the application register ({@code ApplicationListQuery}). */
public record ApplicationQuery(
    String search,
    List<String> lifecycles,
    List<String> criticalities,
    Long teamId,
    Long technologyId,
    Long businessUnitId,
    int page,
    int pageSize,
    String sort,
    String direction) {}
