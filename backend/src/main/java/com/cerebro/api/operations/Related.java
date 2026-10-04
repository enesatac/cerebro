package com.cerebro.api.operations;

import java.util.List;

/** Risks, escalations and decisions are linked to at least one application or project. */
public interface Related {

  List<Long> relatedProjectIds();

  List<Long> relatedApplicationIds();
}
