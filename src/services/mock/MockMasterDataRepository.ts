import type { ApplicationInput } from '@/domains/applications/types';
import type { LeaveInput } from '@/domains/leaves/types';
import type { AllocationInput } from '@/domains/resources/types';
import type { ProjectInput } from '@/domains/projects/types';
import type { MasterDataRepository } from '@/domains/master-data/api/MasterDataRepository';
import { getListDefinition } from '@/domains/master-data/catalog';
import {
  MASTER_DATA_VARIANTS,
  type MasterDataItem,
  type MasterDataListKey,
  type MasterDataUsage,
} from '@/domains/master-data/types';
import { ValidationError } from '@/lib/errors';
import type { MockDatabase } from './database';
import { copy, delay } from './query';
import type { WriteKit } from './writeKit';

/** Every stored code of `key` across the database, one entry per use. */
function codesInUse(db: MockDatabase, key: MasterDataListKey): string[] {
  const apps = db.applications;
  const projects = db.projects;
  switch (key) {
    case 'applicationLifecycles':
      return apps.map((a) => a.lifecycle);
    case 'applicationTypes':
      return apps.map((a) => a.type);
    case 'operationalStatuses':
      return apps.map((a) => a.operationalStatus);
    case 'hostingModels':
      return apps.map((a) => a.hosting.model);
    case 'environmentTypes':
      return apps.flatMap((a) => a.environments.map((e) => e.type));
    case 'environmentStatuses':
      return apps.flatMap((a) => a.environments.map((e) => e.status));
    case 'sourceRepositoryTypes':
      return apps.flatMap((a) => a.repositories.map((r) => r.type));
    case 'technologyCategories':
      return [
        ...db.technologies.map((t) => t.category),
        ...apps.flatMap((a) => a.technologies.map((t) => t.layer)),
      ];
    case 'technologyStatuses':
      return db.technologies.map((t) => t.status);
    case 'projectStatuses':
      return projects.map((p) => p.status);
    case 'projectHealths':
      return projects.map((p) => p.health);
    case 'projectTypes':
      return projects.map((p) => p.type);
    case 'projectPhases':
      return projects.map((p) => p.currentPhase);
    case 'milestoneStatuses':
      return projects.flatMap((p) => p.milestones.map((m) => m.status));
    case 'applicationImpactTypes':
      return projects.flatMap((p) => p.applicationImpacts.map((i) => i.impactType));
    case 'confidentialityLevels':
      return projects.map((p) => p.confidentiality);
    case 'currencies':
      return projects.flatMap((p) => (p.financials ? [p.financials.currency] : []));
    case 'criticalities':
      return [
        ...apps.map((a) => a.criticality),
        ...projects.map((p) => p.priority),
        ...db.risks.flatMap((r) => [r.severity, r.probability, r.impact]),
        ...db.escalations.map((e) => e.severity),
        ...db.dependencies.map((d) => d.criticality),
      ];
    case 'stakeholderRoles':
      return [
        ...[...apps, ...projects].flatMap((row) => row.roles.map((r) => r.role)),
        ...db.allocations.map((a) => a.role),
      ];
    case 'teamResponsibilities':
      return [...apps, ...projects].flatMap((row) => row.teams.map((t) => t.responsibility));
    case 'documentationLinkTypes':
      return [...apps, ...projects].flatMap((row) => row.documentation.map((d) => d.type));
    case 'riskCategories':
      return db.risks.map((r) => r.category);
    case 'riskStatuses':
      return db.risks.map((r) => r.status);
    case 'escalationStatuses':
      return db.escalations.map((e) => e.status);
    case 'decisionStatuses':
      return db.decisions.map((d) => d.status);
    case 'dependencyTypes':
      return db.dependencies.map((d) => d.type);
    case 'integrationTypes':
      return db.integrations.map((i) => i.type);
    case 'integrationFrequencies':
      return db.integrations.map((i) => i.frequency);
    case 'leaveTypes':
      return db.leaves.map((l) => l.type);
  }
}

export function masterDataUsage(db: MockDatabase, key: MasterDataListKey): MasterDataUsage {
  const usage: MasterDataUsage = {};
  for (const code of codesInUse(db, key)) usage[code] = (usage[code] ?? 0) + 1;
  return usage;
}

const CODE_PATTERN = /^[A-Za-z0-9]+(?:[-_][A-Za-z0-9]+)*$/;

/**
 * Server-side check used by entity writes: every code must exist in the list. Inactive values are
 * accepted only when the record already had them (`previous`), so old records stay editable.
 */
export function assertMasterCodes(
  db: MockDatabase,
  key: MasterDataListKey,
  codes: readonly string[],
  field: string,
  previous: readonly string[] = [],
) {
  const items = new Map(
    db.masterData.find((list) => list.key === key)?.items.map((i) => [i.code, i]),
  );
  const invalid = codes.filter((code) => {
    const item = items.get(code);
    return !item || (!item.active && !previous.includes(code));
  });
  if (invalid.length > 0) {
    const { label } = getListDefinition(key);
    throw new ValidationError(
      `Geçersiz veya pasif değer (${label}): ${[...new Set(invalid)].join(', ')}.`,
      field,
    );
  }
}

function validateItems(db: MockDatabase, key: MasterDataListKey, items: MasterDataItem[]) {
  const definition = getListDefinition(key);
  const codes = new Set<string>();
  const labels = new Set<string>();

  items.forEach((item, index) => {
    const row = `${index + 1}. satır`;
    if (!CODE_PATTERN.test(item.code)) {
      throw new ValidationError(
        `${row}: kod yalnızca harf, rakam, kısa çizgi ve alt çizgi içerebilir.`,
        `items.${index}.code`,
      );
    }
    if (codes.has(item.code)) {
      throw new ValidationError(
        `${row}: "${item.code}" kodu listede birden fazla kez var.`,
        `items.${index}.code`,
      );
    }
    codes.add(item.code);
    const label = item.label.trim();
    if (!label) throw new ValidationError(`${row}: ad zorunludur.`, `items.${index}.label`);
    if (labels.has(label.toLocaleLowerCase('tr-TR'))) {
      throw new ValidationError(
        `${row}: "${label}" adı listede zaten var.`,
        `items.${index}.label`,
      );
    }
    labels.add(label.toLocaleLowerCase('tr-TR'));
    if (definition.colored && !MASTER_DATA_VARIANTS.includes(item.variant ?? ('' as never))) {
      throw new ValidationError(`${row}: bir renk seçin.`, `items.${index}.variant`);
    }
    if (definition.systemCodes.includes(item.code) && !item.active) {
      throw new ValidationError(
        `${row}: "${label}" sistem değeridir ve pasife alınamaz.`,
        `items.${index}.active`,
      );
    }
  });

  const missingSystem = definition.systemCodes.filter((code) => !codes.has(code));
  if (missingSystem.length > 0) {
    throw new ValidationError(`Sistem değerleri silinemez: ${missingSystem.join(', ')}.`);
  }
  if (!definition.extensible) {
    const added = [...codes].filter((code) => !definition.systemCodes.includes(code));
    if (added.length > 0) throw new ValidationError('Bu listeye yeni değer eklenemez.');
  }

  const usage = masterDataUsage(db, key);
  const current = db.masterData.find((list) => list.key === key)?.items ?? [];
  const first = current.find((item) => !codes.has(item.code) && (usage[item.code] ?? 0) > 0);
  if (first) {
    throw new ValidationError(
      `"${first.label}" ${usage[first.code]} kayıtta kullanılıyor; silmek yerine pasife alın.`,
    );
  }
}

export function createMockMasterDataRepository(
  db: MockDatabase,
  latencyMs: number,
  kit: WriteKit,
): MasterDataRepository {
  return {
    listAll: async () => (await delay(latencyMs), copy(db.masterData)),
    getUsage: async (key) => (await delay(latencyMs), masterDataUsage(db, key)),
    async update(key, items) {
      await kit.begin('masterData:manage');
      const owned = new Set(
        (db.masterData.find((list) => list.key === key)?.items ?? []).map((item) => item.id),
      );
      const foreign = items.find((item) => item.id !== null && !owned.has(item.id));
      if (foreign) throw new ValidationError(`Geçersiz değer kimliği: ${foreign.id}.`);
      const next: MasterDataItem[] = items.map((item) => ({
        // New values take the next id of the `master_data_items` sequence.
        id: item.id ?? kit.nextId('masterDataItems'),
        code: item.code.trim(),
        label: item.label.trim(),
        description: item.description.trim(),
        variant: getListDefinition(key).colored ? item.variant : null,
        active: item.active,
      }));
      validateItems(db, key, next);
      const list = { key, items: next };
      const index = db.masterData.findIndex((row) => row.key === key);
      if (index === -1) db.masterData.push(list);
      else db.masterData[index] = list;
      return copy(list);
    },
  };
}

interface CodeCheck {
  list: MasterDataListKey;
  codes: string[];
  field: string;
}

type Portfolio = Pick<ApplicationInput, 'roles' | 'teams' | 'documentation'>;

const portfolioChecks = (row: Portfolio): CodeCheck[] => [
  { list: 'stakeholderRoles', codes: row.roles.map((r) => r.role), field: 'roles' },
  { list: 'teamResponsibilities', codes: row.teams.map((t) => t.responsibility), field: 'teams' },
  {
    list: 'documentationLinkTypes',
    codes: row.documentation.map((d) => d.type),
    field: 'documentation',
  },
];

/** Master data codes stored on each kind of record, for server-side validation of writes. */
export const codeChecks = {
  application: (a: ApplicationInput): CodeCheck[] => [
    { list: 'applicationTypes', codes: [a.type], field: 'type' },
    { list: 'applicationLifecycles', codes: [a.lifecycle], field: 'lifecycle' },
    { list: 'criticalities', codes: [a.criticality], field: 'criticality' },
    { list: 'operationalStatuses', codes: [a.operationalStatus], field: 'operationalStatus' },
    { list: 'hostingModels', codes: [a.hosting.model], field: 'hostingModel' },
    { list: 'environmentTypes', codes: a.environments.map((e) => e.type), field: 'environments' },
    {
      list: 'environmentStatuses',
      codes: a.environments.map((e) => e.status),
      field: 'environments',
    },
    {
      list: 'sourceRepositoryTypes',
      codes: a.repositories.map((r) => r.type),
      field: 'repositories',
    },
    {
      list: 'technologyCategories',
      codes: a.technologies.map((t) => t.layer),
      field: 'technologies',
    },
    ...portfolioChecks(a),
  ],
  project: (p: ProjectInput): CodeCheck[] => [
    { list: 'projectTypes', codes: [p.type], field: 'type' },
    { list: 'projectStatuses', codes: [p.status], field: 'status' },
    { list: 'projectHealths', codes: [p.health], field: 'health' },
    { list: 'criticalities', codes: [p.priority], field: 'priority' },
    { list: 'confidentialityLevels', codes: [p.confidentiality], field: 'confidentiality' },
    { list: 'projectPhases', codes: [p.currentPhase], field: 'currentPhase' },
    { list: 'currencies', codes: p.financials ? [p.financials.currency] : [], field: 'currency' },
    {
      list: 'applicationImpactTypes',
      codes: p.applicationImpacts.map((i) => i.impactType),
      field: 'applicationImpacts',
    },
    { list: 'milestoneStatuses', codes: p.milestones.map((m) => m.status), field: 'milestones' },
    ...portfolioChecks(p),
  ],
  technology: (t: Omit<MockDatabase['technologies'][number], 'id'>): CodeCheck[] => [
    { list: 'technologyCategories', codes: [t.category], field: 'category' },
    { list: 'technologyStatuses', codes: [t.status], field: 'status' },
  ],
  risk: (r: Omit<MockDatabase['risks'][number], 'id' | 'audit'>): CodeCheck[] => [
    { list: 'riskCategories', codes: [r.category], field: 'category' },
    { list: 'riskStatuses', codes: [r.status], field: 'status' },
    { list: 'criticalities', codes: [r.probability, r.impact, r.severity], field: 'severity' },
  ],
  escalation: (e: Omit<MockDatabase['escalations'][number], 'id' | 'audit'>): CodeCheck[] => [
    { list: 'escalationStatuses', codes: [e.status], field: 'status' },
    { list: 'criticalities', codes: [e.severity], field: 'severity' },
  ],
  decision: (d: Omit<MockDatabase['decisions'][number], 'id' | 'audit'>): CodeCheck[] => [
    { list: 'decisionStatuses', codes: [d.status], field: 'status' },
  ],
  dependency: (d: Omit<MockDatabase['dependencies'][number], 'id' | 'audit'>): CodeCheck[] => [
    { list: 'dependencyTypes', codes: [d.type], field: 'type' },
    { list: 'criticalities', codes: [d.criticality], field: 'criticality' },
  ],
  allocation: (a: Pick<AllocationInput, 'role'>): CodeCheck[] => [
    { list: 'stakeholderRoles', codes: [a.role], field: 'role' },
  ],
  leave: (l: Pick<LeaveInput, 'type'>): CodeCheck[] => [
    { list: 'leaveTypes', codes: [l.type], field: 'type' },
  ],
  integration: (i: Omit<MockDatabase['integrations'][number], 'id' | 'audit'>): CodeCheck[] => [
    { list: 'integrationTypes', codes: [i.type], field: 'type' },
    { list: 'integrationFrequencies', codes: [i.frequency], field: 'frequency' },
  ],
};

/** Runs `assertMasterCodes` for every check; `previous` holds the record's stored checks on update. */
export function assertCodeChecks(
  db: MockDatabase,
  checks: CodeCheck[],
  previous: CodeCheck[] = [],
) {
  for (const check of checks) {
    const before = previous.filter((p) => p.list === check.list).flatMap((p) => p.codes);
    assertMasterCodes(db, check.list, check.codes, check.field, before);
  }
}
