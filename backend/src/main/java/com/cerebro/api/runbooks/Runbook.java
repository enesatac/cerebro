package com.cerebro.api.runbooks;

import com.cerebro.api.shared.Audit;
import java.util.List;

/**
 * The incident playbook of one application: what to do first, where to look, whom to call, and
 * fixes for known problems. Never credentials.
 */
public record Runbook(
    long id,
    long applicationId,
    String summary,
    List<Step> firstResponse,
    List<Link> links,
    List<Contact> contacts,
    List<Scenario> scenarios,
    String lastVerifiedOn,
    Audit audit) {

  public record Step(Long id, String text) {}

  public record Link(Long id, String type, String label, String url, String note) {}

  public record Contact(
      Long id, String label, Long personId, Long teamId, String channel, String when) {}

  public record Scenario(Long id, String title, String symptoms, List<Step> steps) {

    public Scenario {
      steps = steps == null ? List.of() : steps;
    }
  }

  public record Input(
      long applicationId,
      String summary,
      List<Step> firstResponse,
      List<Link> links,
      List<Contact> contacts,
      List<Scenario> scenarios,
      String lastVerifiedOn) {

    public Input {
      summary = summary == null ? "" : summary;
      firstResponse = firstResponse == null ? List.of() : firstResponse;
      links = links == null ? List.of() : links;
      contacts = contacts == null ? List.of() : contacts;
      scenarios = scenarios == null ? List.of() : scenarios;
    }
  }
}
