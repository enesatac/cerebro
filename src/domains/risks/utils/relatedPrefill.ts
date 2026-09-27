import type { EntityId } from '@/domains/shared/types';
import { parseId } from '@/lib/urlParams';

/** Reads `?application=` / `?project=` so "Add risk" on a detail page pre-links the record. */
export function readRelatedPrefill(params: URLSearchParams) {
  // Form values hold ids as text; only well-formed ids are taken over from the URL.
  const application = parseId(params.get('application'));
  const project = parseId(params.get('project'));
  return {
    relatedApplicationIds: application !== null ? [String(application)] : [],
    relatedProjectIds: project !== null ? [String(project)] : [],
  };
}

/** Where to go after saving: back to the record the form was opened from, if any. */
export function relatedReturnPath(
  params: URLSearchParams,
  paths: { application: (id: EntityId) => string; project: (id: EntityId) => string },
  fallback: string,
): string {
  const application = parseId(params.get('application'));
  const project = parseId(params.get('project'));
  if (application !== null) return paths.application(application);
  if (project !== null) return paths.project(project);
  return fallback;
}
