/** Reads `?application=` / `?project=` so "Add risk" on a detail page pre-links the record. */
export function readRelatedPrefill(params: URLSearchParams) {
  const application = params.get('application');
  const project = params.get('project');
  return {
    relatedApplicationIds: application ? [application] : [],
    relatedProjectIds: project ? [project] : [],
  };
}

/** Where to go after saving: back to the record the form was opened from, if any. */
export function relatedReturnPath(
  params: URLSearchParams,
  paths: { application: (id: string) => string; project: (id: string) => string },
  fallback: string,
): string {
  const application = params.get('application');
  const project = params.get('project');
  if (application) return paths.application(application);
  if (project) return paths.project(project);
  return fallback;
}
