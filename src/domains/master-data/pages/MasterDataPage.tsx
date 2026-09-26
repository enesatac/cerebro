import { Field, Input } from '@takeoff-ui/react-spar';
import { SearchIconOutlinedRounded } from '@takeoff-icons/react/search';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { paths } from '@/app/router/paths';
import { PageHeader } from '@/components/layout/PageHeader';
import { BusinessUnitsEditor } from '@/domains/business-units/components/BusinessUnitsEditor';
import { PeopleEditor } from '@/domains/people/components/PeopleEditor';
import { MASTER_DATA_GROUPS, MASTER_DATA_LISTS } from '../catalog';
import { ValueListEditor } from '../components/ValueListEditor';
import { useMasterData } from '../context';
import { MASTER_DATA_LIST_KEYS, type MasterDataListKey } from '../types';

/** Record tables managed on this page next to the value lists. */
const RECORD_SECTIONS = [
  { id: 'business-units', label: 'İş birimleri', hint: 'Organizasyon birimleri' },
  { id: 'people', label: 'Kişiler', hint: 'Rol ve ekip atamaları' },
] as const;
type RecordSectionId = (typeof RECORD_SECTIONS)[number]['id'];
type Section = RecordSectionId | MasterDataListKey;

const DEFAULT_SECTION: Section = 'business-units';

function parseSection(value: string | null): Section {
  if (RECORD_SECTIONS.some((section) => section.id === value)) return value as RecordSectionId;
  if ((MASTER_DATA_LIST_KEYS as readonly (string | null)[]).includes(value)) {
    return value as MasterDataListKey;
  }
  return DEFAULT_SECTION;
}

const normalise = (value: string) => value.toLocaleLowerCase('tr-TR');

function SectionLink({
  section,
  active,
  label,
  meta,
}: {
  section: Section;
  active: boolean;
  label: string;
  meta: string;
}) {
  return (
    <li>
      <Link
        to={paths.admin.masterData(section)}
        className="c-md-nav__link"
        aria-current={active ? 'page' : undefined}
        replace
      >
        <span>{label}</span>
        <span className="c-md-nav__meta">{meta}</span>
      </Link>
    </li>
  );
}

/**
 * One place for administrators to maintain every value offered in forms and shown across the site:
 * business units, people and all value lists (statuses, types, categories, scales…).
 */
export default function MasterDataPage() {
  const [params] = useSearchParams();
  const section = parseSection(params.get('section'));
  const masterData = useMasterData();
  const [filter, setFilter] = useState('');
  const term = normalise(filter.trim());

  const lists = MASTER_DATA_LISTS.filter(
    (list) =>
      !term ||
      normalise(list.label).includes(term) ||
      masterData.items(list.key).some((item) => normalise(item.label).includes(term)),
  );
  const records = RECORD_SECTIONS.filter(
    (record) => !term || normalise(record.label).includes(term),
  );

  return (
    <div className="c-stack">
      <PageHeader
        breadcrumbs={[{ label: 'Yönetim' }, { label: 'Ana veriler' }]}
        title="Ana veriler"
        subtitle="Formlarda seçilen ve sitede gösterilen tüm değerler. Burada yapılan değişiklikler tüm ekranlara anında yansır."
      />
      <div className="c-md-layout">
        <nav className="c-md-nav" aria-label="Ana veri listeleri">
          <Field className="c-md-nav__search">
            <Field.Label>Liste veya değer ara</Field.Label>
            <Input size="small">
              <Input.LeadingIcon>
                <SearchIconOutlinedRounded aria-hidden="true" />
              </Input.LeadingIcon>
              <Input.Field
                type="search"
                placeholder="ör. durum, kategori, Kafka"
                value={filter}
                onChange={(event) => setFilter(event.target.value)}
              />
            </Input>
          </Field>

          {records.length > 0 && (
            <div className="c-md-nav__group">
              <p className="c-md-nav__heading">Organizasyon</p>
              <ul className="c-md-nav__list">
                {records.map((record) => (
                  <SectionLink
                    key={record.id}
                    section={record.id}
                    active={section === record.id}
                    label={record.label}
                    meta={record.hint}
                  />
                ))}
              </ul>
            </div>
          )}

          {MASTER_DATA_GROUPS.map((group) => {
            const groupLists = lists.filter((list) => list.group === group.id);
            if (groupLists.length === 0) return null;
            return (
              <div className="c-md-nav__group" key={group.id}>
                <p className="c-md-nav__heading">{group.label}</p>
                <ul className="c-md-nav__list">
                  {groupLists.map((list) => {
                    const items = masterData.items(list.key);
                    const inactive = items.filter((item) => !item.active).length;
                    return (
                      <SectionLink
                        key={list.key}
                        section={list.key}
                        active={section === list.key}
                        label={list.label}
                        meta={`${items.length} değer${inactive ? ` · ${inactive} pasif` : ''}`}
                      />
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {records.length === 0 && lists.length === 0 && (
            <p className="c-muted c-md-nav__empty">“{filter}” ile eşleşen liste yok.</p>
          )}
        </nav>

        <div className="c-md-content">
          {section === 'business-units' ? (
            <BusinessUnitsEditor />
          ) : section === 'people' ? (
            <PeopleEditor />
          ) : (
            <ValueListEditor key={section} listKey={section} />
          )}
        </div>
      </div>
    </div>
  );
}
