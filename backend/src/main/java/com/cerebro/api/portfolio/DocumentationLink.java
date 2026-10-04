package com.cerebro.api.portfolio;

import com.fasterxml.jackson.annotation.JsonInclude;

public record DocumentationLink(
    Long id,
    String type,
    String title,
    String url,
    @JsonInclude(JsonInclude.Include.NON_NULL) String description) {}
