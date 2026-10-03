package com.cerebro.api.search;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonInclude.Include;

/** A global search hit: title, identifying subtitle and a short description. */
public record SearchResult(
    String kind,
    long id,
    String title,
    String subtitle,
    @JsonInclude(Include.NON_NULL) String description) {}
