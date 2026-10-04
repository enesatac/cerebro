package com.cerebro.api.runbooks;

import com.cerebro.api.access.Access;
import com.cerebro.api.access.SessionUser;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.runbooks.Runbook.Contact;
import com.cerebro.api.runbooks.Runbook.Link;
import com.cerebro.api.runbooks.Runbook.Scenario;
import com.cerebro.api.runbooks.Runbook.Step;
import com.cerebro.api.shared.Audit;
import com.cerebro.api.shared.AuditStamp;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.ChildRows;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.Sql;
import com.cerebro.api.shared.Texts;
import com.cerebro.api.shared.Times;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Stream;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * One runbook per application. Readable by every signed-in user (anyone may be the one handling
 * an incident); writes follow the application's privileges.
 */
@Service
@Transactional
public class RunbookService {

  private static final String ENTITY = "Müdahale rehberi";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;
  private final AuditStamp stamp;

  public RunbookService(
      JdbcClient jdbc, Access access, Checks checks, MasterCodes codes, AuditStamp stamp) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
    this.stamp = stamp;
  }

  /** The application's runbook, or empty when none has been written yet. */
  @Transactional(readOnly = true)
  public Optional<Runbook> byApplication(long applicationId) {
    access.current();
    return load("WHERE application_id = :id", Map.of("id", applicationId)).stream().findFirst();
  }

  public Runbook create(Runbook.Input input) {
    SessionUser user = access.require("applications:edit");
    validate(input, null);
    Audit audit = stamp.created(user);
    long id =
        Sql.insert(
        Sql.audit(
                jdbc.sql(
                    "INSERT INTO application_runbooks (application_id, summary, last_verified_on, "
                        + Sql.AUDIT_COLUMNS
                        + ") VALUES (:application, :summary, :verified, "
                        + Sql.AUDIT_VALUES
                        + ")"),
                audit)
            .param("application", input.applicationId())
            .param("summary", input.summary().trim())
            .param("verified", Times.parseDate(input.lastVerifiedOn())));
    saveChildren(id, input);
    return find(id);
  }

  public Runbook update(long id, Runbook.Input input) {
    SessionUser user = access.require("applications:edit");
    Runbook current = find(id);
    validate(input, current);
    Sql.audit(
            jdbc.sql(
                "UPDATE application_runbooks SET application_id = :application, summary ="
                    + " :summary, last_verified_on = :verified, "
                    + Sql.AUDIT_UPDATE
                    + " WHERE id = :id"),
            stamp.touched(current.audit(), user))
        .param("application", input.applicationId())
        .param("summary", input.summary().trim())
        .param("verified", Times.parseDate(input.lastVerifiedOn()))
        .param("id", id)
        .update();
    saveChildren(id, input);
    return find(id);
  }

  public void remove(long id) {
    access.require("applications:delete");
    find(id);
    jdbc.sql("DELETE FROM application_runbooks WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return DeletionImpact.NONE;
  }

  private void validate(Runbook.Input input, Runbook current) {
    checks.assertRefs(List.of(input.applicationId()), "applications", "uygulama", "applicationId");
    boolean taken =
        jdbc.sql(
                "SELECT CASE WHEN EXISTS (SELECT 1 FROM application_runbooks WHERE application_id = :app"
                    + " AND id <> :id) THEN 1 ELSE 0 END FROM dual")
            .param("app", input.applicationId())
            .param("id", current == null ? -1L : current.id())
            .query(Boolean.class)
            .single();
    if (taken) {
      throw new ValidationException(
          "Bu uygulamanın zaten bir müdahale rehberi var.", "applicationId");
    }
    checks.assertRefs(
        input.contacts().stream().map(Contact::personId).toList(), "people", "kişi", "contacts");
    checks.assertRefs(
        input.contacts().stream().map(Contact::teamId).toList(), "teams", "ekip", "contacts");
    codes.assertAll(
        List.of(linkTypes(input.links())),
        current == null ? List.of() : List.of(linkTypes(current.links())));
    for (int index = 0; index < input.links().size(); index++) {
      if (!Texts.isHttpUrl(input.links().get(index).url())) {
        throw new ValidationException(
            "Tam bir http(s) adresi girin.", "links." + index + ".url");
      }
    }
    for (int index = 0; index < input.contacts().size(); index++) {
      Contact contact = input.contacts().get(index);
      if (contact.personId() == null
          && contact.teamId() == null
          && (contact.channel() == null || contact.channel().isBlank())) {
        throw new ValidationException(
            "Bir kişi, ekip veya iletişim kanalı girin.", "contacts." + index + ".channel");
      }
    }
    if (texts(input).anyMatch(Texts::looksLikeSecret)) {
      throw new ValidationException(Texts.NO_SECRETS_MESSAGE, "summary");
    }
  }

  private static Check linkTypes(List<Link> links) {
    return new Check("runbookLinkTypes", links.stream().map(Link::type).toList(), "links");
  }

  /** Every free-text value, for the "no credentials" check. */
  private static Stream<String> texts(Runbook.Input input) {
    List<String> texts = new ArrayList<>();
    texts.add(input.summary());
    input.firstResponse().forEach(step -> texts.add(step.text()));
    input.links().forEach(l -> texts.addAll(List.of(n(l.label()), n(l.url()), n(l.note()))));
    input.contacts().forEach(c -> texts.addAll(List.of(n(c.label()), n(c.channel()), n(c.when()))));
    input
        .scenarios()
        .forEach(
            s -> {
              texts.add(n(s.title()));
              texts.add(n(s.symptoms()));
              s.steps().forEach(step -> texts.add(n(step.text())));
            });
    return texts.stream();
  }

  private static String n(String value) {
    return value == null ? "" : value;
  }

  /**
   * Replaces the child rows. Stored rows keep their ids (refused if they belong to another
   * runbook); empty steps are dropped.
   */
  private void saveChildren(long runbookId, Runbook.Input input) {
    Map<String, Object> owner = Map.of("id", runbookId);
    List<Long> ownedSteps = ids("runbook_steps", owner);
    List<Long> ownedScenarios = ids("runbook_scenarios", owner);
    List<Long> ownedLinks = ids("runbook_links", owner);
    List<Long> ownedContacts = ids("runbook_contacts", owner);
    List<Step> firstResponse = trimSteps(input.firstResponse());
    List<List<Step>> scenarioSteps =
        input.scenarios().stream().map(s -> trimSteps(s.steps())).toList();
    Checks.assertOwned(
        Stream.concat(firstResponse.stream(), scenarioSteps.stream().flatMap(List::stream))
            .map(Step::id)
            .toList(),
        ownedSteps);
    Checks.assertOwned(input.scenarios().stream().map(Scenario::id).toList(), ownedScenarios);
    Checks.assertOwned(input.links().stream().map(Link::id).toList(), ownedLinks);
    Checks.assertOwned(input.contacts().stream().map(Contact::id).toList(), ownedContacts);

    for (String table :
        List.of("runbook_steps", "runbook_scenarios", "runbook_links", "runbook_contacts")) {
      jdbc.sql("DELETE FROM " + table + " WHERE runbook_id = :id").params(owner).update();
    }
    insertSteps(runbookId, null, firstResponse);
    for (int index = 0; index < input.scenarios().size(); index++) {
      Scenario scenario = input.scenarios().get(index);
      var insert =
          ChildRows.insert(
                  jdbc,
                  "runbook_scenarios",
                  "runbook_id, sort_order, title, symptoms",
                  ":runbook, :position, :title, :symptoms",
                  scenario.id())
              .param("runbook", runbookId)
              .param("position", index)
              .param("title", n(scenario.title()).trim())
              .param("symptoms", n(scenario.symptoms()).trim());
      long scenarioId;
      if (scenario.id() == null) {
        scenarioId = Sql.insert(insert);
      } else {
        insert.update();
        scenarioId = scenario.id();
      }
      insertSteps(runbookId, scenarioId, scenarioSteps.get(index));
    }
    for (int index = 0; index < input.links().size(); index++) {
      Link link = input.links().get(index);
      ChildRows.insert(
              jdbc,
              "runbook_links",
              "runbook_id, sort_order, type, label, url, note",
              ":runbook, :position, :type, :label, :url, :note",
              link.id())
          .param("runbook", runbookId)
          .param("position", index)
          .param("type", link.type())
          .param("label", n(link.label()).trim())
          .param("url", n(link.url()).trim())
          .param("note", n(link.note()).trim())
          .update();
    }
    for (int index = 0; index < input.contacts().size(); index++) {
      Contact contact = input.contacts().get(index);
      ChildRows.insert(
              jdbc,
              "runbook_contacts",
              "runbook_id, sort_order, label, person_id, team_id, channel, when_to_call",
              ":runbook, :position, :label, :person, :team, :channel, :whenToCall",
              contact.id())
          .param("runbook", runbookId)
          .param("position", index)
          .param("label", n(contact.label()).trim())
          .param("person", contact.personId())
          .param("team", contact.teamId())
          .param("channel", n(contact.channel()).trim())
          .param("whenToCall", n(contact.when()).trim())
          .update();
    }
  }

  private static List<Step> trimSteps(List<Step> steps) {
    return steps.stream()
        .map(step -> new Step(step.id(), n(step.text()).trim()))
        .filter(step -> !step.text().isEmpty())
        .toList();
  }

  private void insertSteps(long runbookId, Long scenarioId, List<Step> steps) {
    for (int index = 0; index < steps.size(); index++) {
      Step step = steps.get(index);
      ChildRows.insert(
              jdbc,
              "runbook_steps",
              "runbook_id, scenario_id, sort_order, step_text",
              ":runbook, :scenario, :position, :text",
              step.id())
          .param("runbook", runbookId)
          .param("scenario", scenarioId)
          .param("position", index)
          .param("text", step.text())
          .update();
    }
  }

  private List<Long> ids(String table, Map<String, Object> owner) {
    return jdbc.sql("SELECT id FROM " + table + " WHERE runbook_id = :id")
        .params(owner)
        .query(Long.class)
        .list();
  }

  private Runbook find(long id) {
    return load("WHERE id = :id", Map.of("id", id)).stream()
        .findFirst()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private List<Runbook> load(String where, Map<String, Object> params) {
    String filter = " WHERE runbook_id IN (SELECT id FROM application_runbooks " + where + ")";
    Map<Long, List<Step>> firstResponse = new HashMap<>();
    Map<Long, List<Step>> scenarioSteps = new HashMap<>();
    jdbc.sql("SELECT * FROM runbook_steps" + filter + " ORDER BY sort_order, id")
        .params(params)
        .query(
            rs -> {
              Step step = new Step(rs.getLong("id"), Sql.text(rs, "step_text"));
              Long scenario = Sql.longOrNull(rs, "scenario_id");
              if (scenario == null) {
                firstResponse.computeIfAbsent(rs.getLong("runbook_id"), k -> new ArrayList<>()).add(step);
              } else {
                scenarioSteps.computeIfAbsent(scenario, k -> new ArrayList<>()).add(step);
              }
            });
    Map<Long, List<Scenario>> scenarios = new HashMap<>();
    jdbc.sql("SELECT * FROM runbook_scenarios" + filter + " ORDER BY sort_order, id")
        .params(params)
        .query(
            rs -> {
              long id = rs.getLong("id");
              scenarios
                  .computeIfAbsent(rs.getLong("runbook_id"), k -> new ArrayList<>())
                  .add(
                      new Scenario(
                          id,
                          rs.getString("title"),
                          Sql.text(rs, "symptoms"),
                          scenarioSteps.getOrDefault(id, List.of())));
            });
    Map<Long, List<Link>> links = new HashMap<>();
    jdbc.sql("SELECT * FROM runbook_links" + filter + " ORDER BY sort_order, id")
        .params(params)
        .query(
            rs -> {
              links
                  .computeIfAbsent(rs.getLong("runbook_id"), k -> new ArrayList<>())
                  .add(
                      new Link(
                          rs.getLong("id"),
                          rs.getString("type"),
                          rs.getString("label"),
                          rs.getString("url"),
                          Sql.text(rs, "note")));
            });
    Map<Long, List<Contact>> contacts = new HashMap<>();
    jdbc.sql("SELECT * FROM runbook_contacts" + filter + " ORDER BY sort_order, id")
        .params(params)
        .query(
            rs -> {
              contacts
                  .computeIfAbsent(rs.getLong("runbook_id"), k -> new ArrayList<>())
                  .add(
                      new Contact(
                          rs.getLong("id"),
                          rs.getString("label"),
                          Sql.longOrNull(rs, "person_id"),
                          Sql.longOrNull(rs, "team_id"),
                          Sql.text(rs, "channel"),
                          Sql.text(rs, "when_to_call")));
            });
    return jdbc.sql("SELECT * FROM application_runbooks " + where + " ORDER BY id")
        .params(params)
        .query(
            (rs, row) -> {
              long id = rs.getLong("id");
              return new Runbook(
                  id,
                  rs.getLong("application_id"),
                  Sql.text(rs, "summary"),
                  firstResponse.getOrDefault(id, List.of()),
                  links.getOrDefault(id, List.of()),
                  contacts.getOrDefault(id, List.of()),
                  scenarios.getOrDefault(id, List.of()),
                  Sql.date(rs, "last_verified_on"),
                  Sql.audit(rs));
            })
        .list();
  }
}
