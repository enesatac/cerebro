package com.cerebro.api.technologies;

import com.cerebro.api.shared.Sql;
import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.masterdata.MasterCodes;
import com.cerebro.api.masterdata.MasterCodes.Check;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.Collation;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * The technology catalogue: readable by every signed-in user; changes need {@code
 * technologies:edit}. Technologies in use cannot be deleted — retire them instead.
 */
@Service
@Transactional
public class TechnologyService {

  private static final String ENTITY = "Teknoloji";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;
  private final MasterCodes codes;

  public TechnologyService(JdbcClient jdbc, Access access, Checks checks, MasterCodes codes) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
    this.codes = codes;
  }

  @Transactional(readOnly = true)
  public List<Technology> list() {
    access.current();
    return jdbc.sql("SELECT * FROM technologies ORDER BY id").query(this::row).list();
  }

  @Transactional(readOnly = true)
  public Technology get(long id) {
    access.current();
    return find(id);
  }

  @Transactional(readOnly = true)
  public List<Technology.ListItem> summaries() {
    access.current();
    return jdbc.sql(
            """
            SELECT t.*,
              (SELECT count(DISTINCT u.application_id) FROM technology_usages u
                WHERE u.technology_id = t.id) AS used,
              (SELECT count(DISTINCT u.application_id) FROM technology_usages u
                JOIN applications a ON a.id = u.application_id
                WHERE u.technology_id = t.id AND a.lifecycle <> 'retired') AS active_count
            FROM technologies t ORDER BY t.id
            """)
        .query(
            (rs, row) ->
                new Technology.ListItem(
                    rs.getLong("id"),
                    rs.getString("name"),
                    rs.getString("category"),
                    Sql.text(rs, "description"),
                    rs.getString("status"),
                    rs.getInt("used"),
                    rs.getInt("active_count")))
        .list()
        .stream()
        .sorted(Collation.by(Technology.ListItem::name))
        .toList();
  }

  public Technology create(Technology.Input input) {
    access.require("technologies:edit");
    codes.assertAll(checks(input), List.of());
    unique(input, null);
    long id =
        Sql.insert(
        jdbc.sql(
                "INSERT INTO technologies (name, category, description, status)"
                    + " VALUES (:name, :category, :description, :status)")
            .param("name", input.name())
            .param("category", input.category())
            .param("description", input.description() == null ? "" : input.description())
            .param("status", input.status()));
    return find(id);
  }

  public Technology update(long id, Technology.Input input) {
    access.require("technologies:edit");
    Technology current = find(id);
    codes.assertAll(
        checks(input),
        checks(
            new Technology.Input(
                current.name(), current.category(), current.description(), current.status())));
    unique(input, id);
    jdbc.sql(
            "UPDATE technologies SET name = :name, category = :category, description ="
                + " :description, status = :status WHERE id = :id")
        .param("name", input.name())
        .param("category", input.category())
        .param("description", input.description() == null ? "" : input.description())
        .param("status", input.status())
        .param("id", id)
        .update();
    return find(id);
  }

  public void remove(long id) {
    access.require("technologies:delete");
    find(id);
    DeletionImpact impact = impact(id);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM technologies WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return impact(id);
  }

  private DeletionImpact impact(long id) {
    long applications =
        jdbc.sql(
                """
                SELECT count(*) FROM applications a WHERE
                  EXISTS (SELECT 1 FROM technology_usages u WHERE u.application_id = a.id
                    AND u.technology_id = :id)
                  OR EXISTS (SELECT 1 FROM data_stores d WHERE d.application_id = a.id
                    AND d.technology_id = :id)
                """)
            .param("id", id)
            .query(Long.class)
            .single();
    long files =
        jdbc.sql("SELECT count(*) FROM attachments WHERE technology_id = :id")
            .param("id", id)
            .query(Long.class)
            .single();
    return DeletionImpact.of(
        applications > 0
            ? applications
                + " uygulama tarafından kullanılıyor. Bunun yerine durumunu Emekli yapın ya da önce"
                + " bu uygulamalardan kaldırın."
            : null,
        ref("uygulama", applications),
        ref("ek dosya (silinir)", files));
  }

  private void unique(Technology.Input input, Long excludeId) {
    checks.assertUnique(
        "technologies",
        "name",
        input.name(),
        excludeId,
        "\"" + input.name() + "\" zaten katalogda.",
        "name");
  }

  private static List<Check> checks(Technology.Input input) {
    return List.of(
        Check.of("technologyCategories", input.category(), "category"),
        Check.of("technologyStatuses", input.status(), "status"));
  }

  private Technology find(long id) {
    return jdbc.sql("SELECT * FROM technologies WHERE id = :id")
        .param("id", id)
        .query(this::row)
        .optional()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private Technology row(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new Technology(
        rs.getLong("id"),
        rs.getString("name"),
        rs.getString("category"),
        Sql.text(rs, "description"),
        rs.getString("status"));
  }
}
