package com.cerebro.api.organisation;

import com.cerebro.api.shared.Sql;
import static com.cerebro.api.shared.DeletionImpact.ref;

import com.cerebro.api.access.Access;
import com.cerebro.api.shared.Checks;
import com.cerebro.api.shared.DeletionImpact;
import com.cerebro.api.shared.error.NotFoundException;
import com.cerebro.api.shared.error.ValidationException;
import java.util.Collections;
import java.util.List;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Business units are master data: changes need {@code masterData:edit}. */
@Service
@Transactional
public class BusinessUnitService {

  private static final String ENTITY = "İş birimi";

  private final JdbcClient jdbc;
  private final Access access;
  private final Checks checks;

  public BusinessUnitService(JdbcClient jdbc, Access access, Checks checks) {
    this.jdbc = jdbc;
    this.access = access;
    this.checks = checks;
  }

  @Transactional(readOnly = true)
  public List<BusinessUnit> list() {
    access.current();
    return jdbc.sql("SELECT * FROM business_units ORDER BY id").query(this::row).list();
  }

  public BusinessUnit create(BusinessUnit.Input input) {
    access.require("masterData:edit");
    validate(input, null);
    long id =
        Sql.insert(
        jdbc.sql(
                "INSERT INTO business_units (code, name, description, head_person_id)"
                    + " VALUES (:code, :name, :description, :head)")
            .param("code", input.code())
            .param("name", input.name())
            .param("description", input.description())
            .param("head", input.headId()));
    return find(id);
  }

  public BusinessUnit update(long id, BusinessUnit.Input input) {
    access.require("masterData:edit");
    find(id);
    validate(input, id);
    jdbc.sql(
            "UPDATE business_units SET code = :code, name = :name, description = :description,"
                + " head_person_id = :head WHERE id = :id")
        .param("code", input.code())
        .param("name", input.name())
        .param("description", input.description())
        .param("head", input.headId())
        .param("id", id)
        .update();
    return find(id);
  }

  /** People of the unit are unassigned (the foreign key sets them to NULL). */
  public void remove(long id) {
    access.require("masterData:edit");
    find(id);
    DeletionImpact impact = impact(id);
    if (impact.blocked()) {
      throw new ValidationException(impact.blockedReason());
    }
    jdbc.sql("DELETE FROM business_units WHERE id = :id").param("id", id).update();
  }

  @Transactional(readOnly = true)
  public DeletionImpact deletionImpact(long id) {
    access.current();
    find(id);
    return impact(id);
  }

  private DeletionImpact impact(long id) {
    long applications = count("applications", id);
    long projects = count("projects", id);
    long demands = count("demands", id);
    return DeletionImpact.of(
        applications + projects + demands > 0
            ? "Bu iş birimi uygulama, proje veya taleplerde kullanılıyor. Önce bu kayıtları başka"
                + " bir birime taşıyın."
            : null,
        ref("uygulama", applications),
        ref("proje", projects),
        ref("talep", demands),
        ref("kişi", count("people", id)));
  }

  private long count(String table, long id) {
    return jdbc.sql("SELECT count(*) FROM " + table + " WHERE business_unit_id = :id")
        .param("id", id)
        .query(Long.class)
        .single();
  }

  private void validate(BusinessUnit.Input input, Long excludeId) {
    checks.assertUnique(
        "business_units",
        "code",
        input.code(),
        excludeId,
        "\"" + input.code() + "\" kodu başka bir iş birimi tarafından kullanılıyor.",
        "code");
    checks.assertUnique(
        "business_units",
        "name",
        input.name(),
        excludeId,
        "\"" + input.name() + "\" adında bir iş birimi zaten var.",
        "name");
    checks.assertRefs(Collections.singletonList(input.headId()), "people", "kişi", "headId");
  }

  private BusinessUnit find(long id) {
    return jdbc.sql("SELECT * FROM business_units WHERE id = :id")
        .param("id", id)
        .query(this::row)
        .optional()
        .orElseThrow(() -> new NotFoundException(ENTITY, id));
  }

  private BusinessUnit row(java.sql.ResultSet rs, int row) throws java.sql.SQLException {
    return new BusinessUnit(
        rs.getLong("id"),
        rs.getString("code"),
        rs.getString("name"),
        Sql.text(rs, "description"),
        com.cerebro.api.shared.Sql.longOrNull(rs, "head_person_id"));
  }
}
