/**
 * Generates the backend's seed data from the frontend sources, so both sides share one definition:
 * the privilege catalogue (V2), the shipped master data (V3), the demo organisation
 * (demo/demo-data.json) and the master data list rules (master-data-catalog.json).
 *
 *   npm run generate:backend-seed
 *
 * V2 and V3 are migrations: once released, change master data with a new migration instead of
 * regenerating them.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { it } from 'vitest';
import { ACCESS_LEVELS, PRIVILEGE_MODULES } from '@/domains/auth/types';
import { MASTER_DATA_LISTS } from '@/domains/master-data/catalog';
import { createMockDatabase } from '@/services/mock/database';
import { seedAttachmentContent } from '@/services/mock/data/attachments';
import { masterData } from '@/services/mock/data/masterData';

const RES = fileURLToPath(new URL('../../backend/src/main/resources', import.meta.url));

const sql = (value: string | number | null) =>
  value === null || value === ''
    ? 'NULL'
    : typeof value === 'number'
      ? String(value)
      : `'${value.replace(/'/g, "''")}'`;

type Cell = string | number | null | { $date: string } | { $ts: string } | { $base64: string };
type Row = Record<string, Cell>;

const d = (value: string | null): Cell => (value === null ? null : { $date: value });
const ts = (value: string | null): Cell => (value === null ? null : { $ts: value });
const b = (value: boolean): Cell => (value ? 1 : 0);
const json = (value: readonly string[]): Cell => JSON.stringify(value);
const t = (value: string | null | undefined): Cell =>
  value === undefined || value === '' ? null : value;

const audit = (a: {
  createdAt: string;
  createdBy: number | null;
  updatedAt: string;
  updatedBy: number | null;
  lastReviewedAt: string | null;
  lastReviewedBy: number | null;
}): Row => ({
  created_at: ts(a.createdAt),
  created_by_person_id: a.createdBy,
  updated_at: ts(a.updatedAt),
  updated_by_person_id: a.updatedBy,
  last_reviewed_at: ts(a.lastReviewedAt),
  last_reviewed_by_person_id: a.lastReviewedBy,
});

it('generates the backend seeds', async () => {
  mkdirSync(`${RES}/db/migration`, { recursive: true });
  mkdirSync(`${RES}/demo`, { recursive: true });

  // V2: privilege catalogue and the system role
  const v2: string[] = [
    '-- Privilege catalogue and the locked system administrator role. Generated from the frontend',
    '-- catalogue (frontend/src/domains/auth/types PRIVILEGE_MODULES). `PrivilegeModule` (Java) and this',
    '-- list are kept in step by PrivilegeCatalogTest.',
    '',
  ];
  for (const module of PRIVILEGE_MODULES) {
    for (const level of ACCESS_LEVELS) {
      const description = (module.levels as Partial<Record<string, string>>)[level];
      if (!description) continue;
      v2.push(
        `INSERT INTO access_privileges (code, module, access_level, description) VALUES (${sql(`${module.id}:${level}`)}, ${sql(module.id)}, ${sql(level)}, ${sql(description)});`,
      );
    }
  }
  v2.push(
    '',
    "INSERT INTO roles (name, description, system_role) VALUES ('Sistem yöneticisi',",
    "  'Her ekranda tam yetki; kullanıcıları, rolleri ve ana verileri yönetir. Değiştirilemez.', 1);",
    '',
    'INSERT INTO role_privileges (role_id, privilege_code)',
    '  SELECT r.id, p.code FROM roles r CROSS JOIN access_privileges p WHERE r.system_role = 1;',
    '',
  );
  writeFileSync(`${RES}/db/migration/V2__privileges_and_system_role.sql`, v2.join('\n'));

  // V3: master data as shipped
  const v3: string[] = [
    '-- Master data values (labels, colours, order) as shipped. Generated from the frontend seed',
    '-- (frontend/src/services/mock/data/masterData.ts). Administrators edit them in the app afterwards,',
    '-- system codes (the ones the logic relies on) must not be deleted.',
    '',
  ];
  for (const list of masterData) {
    list.items.forEach((item, index) => {
      v3.push(
        `INSERT INTO master_data_items (list_key, code, label, description, variant, active, sort_order) VALUES (${sql(list.key)}, ${sql(item.code)}, ${sql(item.label)}, ${sql(item.description)}, ${sql(item.variant)}, 1, ${index + 1});`,
      );
    });
  }
  writeFileSync(`${RES}/db/migration/V3__master_data.sql`, v3.join('\n') + '\n');

  // Demo data
  const db = createMockDatabase();
  const tables: { table: string; rows: Row[] }[] = [];
  const add = (table: string, rows: Row[]) => rows.length > 0 && tables.push({ table, rows });

  add(
    'business_units',
    db.businessUnits.map((u) => ({
      id: u.id,
      code: u.code,
      name: u.name,
      description: t(u.description),
      head_person_id: null,
    })),
  );
  add(
    'people',
    db.people.map((p) => ({
      id: p.id,
      full_name: p.fullName,
      job_title: t(p.jobTitle),
      email: p.email,
      business_unit_id: p.businessUnitId,
      location: t(p.location),
    })),
  );
  const system = db.roles.find((r) => r.system);
  add(
    'roles',
    db.roles
      .filter((r) => !r.system)
      .map((r) => ({
        id: r.id,
        name: r.name,
        description: t(r.description),
        system_role: 0,
        ...audit(r.audit),
      })),
  );
  add(
    'role_privileges',
    db.roles
      .filter((r) => !r.system)
      .flatMap((r) => r.privileges.map((p) => ({ role_id: r.id, privilege_code: p }))),
  );
  add(
    'user_accounts',
    db.users.map((u) => ({
      id: u.id,
      display_name: u.displayName,
      email: u.email,
      person_id: u.personId,
      active: b(u.active),
      last_sign_in_at: ts(u.lastSignInAt),
      ...audit(u.audit),
    })),
  );
  add(
    'user_roles',
    db.users.flatMap((u) =>
      u.roleIds.map((roleId, i) => ({ user_account_id: u.id, role_id: roleId, sort_order: i })),
    ),
  );
  add(
    'teams',
    db.teams.map((x) => ({
      id: x.id,
      name: x.name,
      description: t(x.description),
      manager_person_id: x.managerId,
      contact_email: t(x.contactEmail),
      chat_channel: t(x.chatChannel),
      responsibilities: json(x.responsibilities),
      ...audit(x.audit),
    })),
  );
  add(
    'team_members',
    db.teams.flatMap((x) => x.memberIds.map((p) => ({ team_id: x.id, person_id: p }))),
  );
  add(
    'technologies',
    db.technologies.map((x) => ({
      id: x.id,
      name: x.name,
      description: t(x.description),
      category: x.category,
      status: x.status,
    })),
  );
  add(
    'applications',
    db.applications.map((a) => ({
      id: a.id,
      code: a.code,
      name: a.name,
      short_description: t(a.shortDescription),
      detailed_description: t(a.detailedDescription),
      business_purpose: t(a.businessPurpose),
      type: a.type,
      lifecycle: a.lifecycle,
      criticality: a.criticality,
      operational_status: a.operationalStatus,
      tags: json(a.tags),
      business_unit_id: a.businessUnitId,
      business_processes: json(a.businessProcesses),
      user_groups: json(a.userGroups),
      estimated_user_count: a.estimatedUserCount,
      hosting_model: a.hosting.model,
      cloud_provider: t(a.hosting.cloudProvider),
      hosting_notes: t(a.hosting.notes),
      ...audit(a.audit),
    })),
  );
  add(
    'technology_usages',
    db.applications.flatMap((a) =>
      a.technologies.map((x) => ({
        id: x.id,
        application_id: a.id,
        technology_id: x.technologyId,
        layer: x.layer,
        version: t(x.version),
      })),
    ),
  );
  add(
    'data_stores',
    db.applications.flatMap((a) =>
      a.dataStores.map((x) => ({
        id: x.id,
        application_id: a.id,
        name: x.name,
        technology_id: x.technologyId,
        purpose: t(x.purpose),
        contains_personal_data: b(x.containsPersonalData),
      })),
    ),
  );
  add(
    'source_repositories',
    db.applications.flatMap((a) =>
      a.repositories.map((x) => ({
        id: x.id,
        application_id: a.id,
        name: x.name,
        type: x.type,
        url: x.url,
        default_branch: x.defaultBranch,
        description: t(x.description),
      })),
    ),
  );
  add(
    'environments',
    db.applications.flatMap((a) =>
      a.environments.map((x) => ({
        id: x.id,
        application_id: a.id,
        type: x.type,
        name: x.name,
        url: t(x.url),
        status: x.status,
        region: t(x.region),
        notes: t(x.notes),
      })),
    ),
  );
  add(
    'projects',
    db.projects.map((p) => ({
      id: p.id,
      code: p.code,
      name: p.name,
      short_name: t(p.shortName),
      description: t(p.description),
      objective: t(p.objective),
      scope: t(p.scope),
      out_of_scope: t(p.outOfScope),
      type: p.type,
      priority: p.priority,
      status: p.status,
      health: p.health,
      confidentiality: p.confidentiality,
      tags: json(p.tags),
      business_unit_id: p.businessUnitId,
      planned_start_date: d(p.timeline.plannedStartDate),
      actual_start_date: d(p.timeline.actualStartDate),
      planned_end_date: d(p.timeline.plannedEndDate),
      actual_end_date: d(p.timeline.actualEndDate),
      progress_percentage: p.progressPercentage,
      current_phase: p.currentPhase,
      latest_status_summary: t(p.latestStatusSummary),
      next_steps: t(p.nextSteps),
      currency: p.financials?.currency ?? null,
      budget: p.financials?.budget ?? null,
      actual_cost: p.financials?.actualCost ?? null,
      forecast_cost: p.financials?.forecastCost ?? null,
      ...audit(p.audit),
    })),
  );
  add(
    'milestones',
    db.projects.flatMap((p) =>
      p.milestones.map((m) => ({
        id: m.id,
        project_id: p.id,
        title: m.title,
        due_date: d(m.dueDate),
        completed_date: d(m.completedDate),
        status: m.status,
      })),
    ),
  );
  add(
    'application_impacts',
    db.projects.flatMap((p) =>
      p.applicationImpacts.map((i) => ({
        id: i.id,
        project_id: p.id,
        application_id: i.applicationId,
        impact_type: i.impactType,
        description: t(i.description),
      })),
    ),
  );
  const owners = [
    ...db.applications.map((row) => ({ row, application_id: row.id, project_id: null })),
    ...db.projects.map((row) => ({ row, application_id: null, project_id: row.id })),
  ];
  add(
    'role_assignments',
    owners.flatMap(({ row, application_id, project_id }) =>
      row.roles.map((r, i) => ({
        id: r.id,
        application_id,
        project_id,
        person_id: r.personId,
        role: r.role,
        sort_order: i,
      })),
    ),
  );
  add(
    'team_assignments',
    owners.flatMap(({ row, application_id, project_id }) =>
      row.teams.map((x) => ({
        id: x.id,
        application_id,
        project_id,
        team_id: x.teamId,
        responsibility: x.responsibility,
      })),
    ),
  );
  add(
    'documentation_links',
    owners.flatMap(({ row, application_id, project_id }) =>
      row.documentation.map((x) => ({
        id: x.id,
        application_id,
        project_id,
        type: x.type,
        title: x.title,
        url: x.url,
        description: t(x.description),
      })),
    ),
  );
  add(
    'dependencies',
    db.dependencies.map((x) => ({
      id: x.id,
      source_application_id: x.sourceApplicationId,
      target_application_id: x.targetApplicationId,
      type: x.type,
      criticality: x.criticality,
      description: t(x.description),
      ...audit(x.audit),
    })),
  );
  add(
    'integrations',
    db.integrations.map((x) => ({
      id: x.id,
      name: x.name,
      type: x.type,
      from_application_id: x.fromApplicationId,
      to_application_id: x.toApplicationId,
      external_party_name: t(x.externalPartyName),
      frequency: x.frequency,
      data_exchanged: t(x.dataExchanged),
      description: t(x.description),
      ...audit(x.audit),
    })),
  );
  add(
    'risks',
    db.risks.map((r) => ({
      id: r.id,
      title: r.title,
      description: t(r.description),
      category: r.category,
      probability: r.probability,
      impact: r.impact,
      severity: r.severity,
      status: r.status,
      owner_person_id: r.ownerId,
      mitigation_plan: t(r.mitigationPlan),
      due_date: d(r.dueDate),
      ...audit(r.audit),
    })),
  );
  add(
    'escalations',
    db.escalations.map((e) => ({
      id: e.id,
      title: e.title,
      description: t(e.description),
      severity: e.severity,
      status: e.status,
      owner_person_id: e.ownerId,
      responsible_team_id: e.responsibleTeamId,
      raised_by_person_id: e.raisedById,
      raised_at: ts(e.raisedAt),
      target_resolution_date: d(e.targetResolutionDate),
      resolution: t(e.resolution),
      resolved_on: d(e.resolvedOn),
      ...audit(e.audit),
    })),
  );
  add(
    'decisions',
    db.decisions.map((x) => ({
      id: x.id,
      title: x.title,
      context: t(x.context),
      decision: t(x.decision),
      rationale: t(x.rationale),
      alternatives: json(x.alternatives),
      consequences: t(x.consequences),
      decision_date: d(x.decisionDate),
      status: x.status,
      ...audit(x.audit),
    })),
  );
  add(
    'decision_makers',
    db.decisions.flatMap((x) => x.decidedByIds.map((p) => ({ decision_id: x.id, person_id: p }))),
  );
  for (const [kind, rows] of [
    ['risk', db.risks],
    ['escalation', db.escalations],
    ['decision', db.decisions],
  ] as const) {
    add(
      `${kind}_applications`,
      rows.flatMap((r) =>
        r.relatedApplicationIds.map((a) => ({ [`${kind}_id`]: r.id, application_id: a })),
      ),
    );
    add(
      `${kind}_projects`,
      rows.flatMap((r) =>
        r.relatedProjectIds.map((p) => ({ [`${kind}_id`]: r.id, project_id: p })),
      ),
    );
  }
  add(
    'application_runbooks',
    db.runbooks.map((r) => ({
      id: r.id,
      application_id: r.applicationId,
      summary: t(r.summary),
      last_verified_on: d(r.lastVerifiedOn),
      ...audit(r.audit),
    })),
  );
  add(
    'runbook_scenarios',
    db.runbooks.flatMap((r) =>
      r.scenarios.map((s, i) => ({
        id: s.id,
        runbook_id: r.id,
        sort_order: i,
        title: s.title,
        symptoms: t(s.symptoms),
      })),
    ),
  );
  add(
    'runbook_steps',
    db.runbooks.flatMap((r) => [
      ...r.firstResponse.map((s, i) => ({
        id: s.id,
        runbook_id: r.id,
        scenario_id: null,
        sort_order: i,
        step_text: s.text,
      })),
      ...r.scenarios.flatMap((sc) =>
        sc.steps.map((s, i) => ({
          id: s.id,
          runbook_id: r.id,
          scenario_id: sc.id,
          sort_order: i,
          step_text: s.text,
        })),
      ),
    ]),
  );
  add(
    'runbook_links',
    db.runbooks.flatMap((r) =>
      r.links.map((l, i) => ({
        id: l.id,
        runbook_id: r.id,
        sort_order: i,
        type: l.type,
        label: l.label,
        url: l.url,
        note: t(l.note),
      })),
    ),
  );
  add(
    'runbook_contacts',
    db.runbooks.flatMap((r) =>
      r.contacts.map((c, i) => ({
        id: c.id,
        runbook_id: r.id,
        sort_order: i,
        label: c.label,
        person_id: c.personId,
        team_id: c.teamId,
        channel: t(c.channel),
        when_to_call: t(c.when),
      })),
    ),
  );
  add(
    'leave_records',
    db.leaves.map((l) => ({
      id: l.id,
      person_id: l.personId,
      type: l.type,
      start_date: d(l.startDate),
      end_date: d(l.endDate),
      note: t(l.note),
      ...audit(l.audit),
    })),
  );
  add(
    'resource_allocations',
    db.allocations.map((a) => ({
      id: a.id,
      person_id: a.personId,
      project_id: a.projectId,
      role: a.role,
      start_date: d(a.startDate),
      end_date: d(a.endDate),
      percent: a.percent,
      note: t(a.note),
      ...audit(a.audit),
    })),
  );
  add(
    'demands',
    db.demands.map((x) => ({
      id: x.id,
      title: x.title,
      type: x.type,
      business_unit_id: x.businessUnitId,
      requester_person_id: x.requesterId,
      sponsor_person_id: x.sponsorId,
      problem: x.problem,
      proposed_solution: t(x.proposedSolution),
      expected_benefits: x.expectedBenefits,
      urgency: x.urgency,
      desired_date: d(x.desiredDate),
      deadline_reason: t(x.deadlineReason),
      regulatory: b(x.regulatory),
      affected_users: x.affectedUsers,
      estimated_budget: x.estimatedBudget,
      currency: x.currency,
      status: x.status,
      submitted_at: ts(x.submittedAt),
      business_value: x.assessment.businessValue,
      strategic_fit: x.assessment.strategicFit,
      time_criticality: x.assessment.timeCriticality,
      risk_reduction: x.assessment.riskReduction,
      effort: x.assessment.effort,
      priority: x.assessment.priority,
      assessor_person_id: x.assessment.assessorId,
      planned_start: d(x.assessment.plannedStart),
      planned_end: d(x.assessment.plannedEnd),
      decision_note: t(x.assessment.decisionNote),
      project_id: x.assessment.projectId,
      ...audit(x.audit),
    })),
  );
  add(
    'demand_benefit_types',
    db.demands.flatMap((x) =>
      x.benefitTypes.map((code, i) => ({ demand_id: x.id, code, sort_order: i })),
    ),
  );
  add(
    'demand_applications',
    db.demands.flatMap((x) =>
      x.relatedApplicationIds.map((a, i) => ({
        demand_id: x.id,
        application_id: a,
        sort_order: i,
      })),
    ),
  );
  add(
    'demand_events',
    db.demands.flatMap((x) =>
      x.history.map((e) => ({
        id: e.id,
        demand_id: x.id,
        occurred_at: ts(e.at),
        by_person_id: e.byId,
        status: e.status,
        note: t(e.note),
      })),
    ),
  );
  add(
    'vendors',
    db.vendors.map((v) => ({
      id: v.id,
      name: v.name,
      tax_number: t(v.taxNumber),
      contact_name: t(v.contactName),
      contact_email: t(v.contactEmail),
      contact_phone: t(v.contactPhone),
      website: t(v.website),
      notes: t(v.notes),
      ...audit(v.audit),
    })),
  );
  add(
    'contracts',
    db.contracts.map((c) => ({
      id: c.id,
      title: c.title,
      project_id: c.projectId,
      vendor_id: c.vendorId,
      type: c.type,
      status: c.status,
      description: t(c.description),
      owner_person_id: c.ownerId,
      purchase_order_number: t(c.purchaseOrderNumber),
      signed_date: d(c.signedDate),
      start_date: d(c.startDate),
      end_date: d(c.endDate),
      notice_period_days: c.noticePeriodDays,
      auto_renewal: b(c.autoRenewal),
      total_value: c.totalValue,
      currency: c.currency,
      billing_frequency: c.billingFrequency,
      ...audit(c.audit),
    })),
  );
  add(
    'contract_applications',
    db.contracts.flatMap((c) =>
      c.relatedApplicationIds.map((a, i) => ({
        contract_id: c.id,
        application_id: a,
        sort_order: i,
      })),
    ),
  );
  add(
    'contract_payments',
    db.contracts.flatMap((c) =>
      c.payments.map((p) => ({
        id: p.id,
        contract_id: c.id,
        description: t(p.description),
        due_date: d(p.dueDate),
        amount: p.amount,
        status: p.status,
        invoice_number: t(p.invoiceNumber),
        paid_date: d(p.paidDate),
      })),
    ),
  );
  add(
    'attachments',
    db.attachments.map((a) => ({
      id: a.id,
      [`${a.owner.type}_id`]: a.owner.id,
      document_type: a.documentType,
      file_name: a.fileName,
      content_type: a.contentType,
      size_bytes: a.sizeBytes,
      description: t(a.description),
      uploaded_at: ts(a.uploadedAt),
      uploaded_by_person_id: a.uploadedBy,
      ...audit(a.audit),
    })),
  );
  const contents: Row[] = [];
  for (const a of db.attachments) {
    const bytes = new Uint8Array(await seedAttachmentContent(a).arrayBuffer());
    contents.push({
      attachment_id: a.id,
      content: { $base64: Buffer.from(bytes).toString('base64') },
    });
  }
  add('attachment_contents', contents);

  writeFileSync(
    `${RES}/demo/demo-data.json`,
    JSON.stringify(
      {
        description:
          'Demo organisation (fictional) for local development and demos, the same data as the frontend mock. Generated — do not edit by hand.',
        businessUnitHeads: db.businessUnits
          .filter((u) => u.headId !== null)
          .map((u) => ({ id: u.id, headId: u.headId })),
        systemRole: system
          ? { name: system.name, description: system.description, ...audit(system.audit) }
          : null,
        tables,
      },
      null,
      1,
    ) + '\n',
  );

  writeFileSync(
    `${RES}/master-data-catalog.json`,
    JSON.stringify(
      MASTER_DATA_LISTS.map((l) => ({
        key: l.key,
        label: l.label,
        systemCodes: l.systemCodes,
        extensible: l.extensible,
        colored: l.colored,
      })),
      null,
      2,
    ) + '\n',
  );
});
