import {
  ACCESS_LEVELS,
  PRIVILEGE_MODULES,
  type AccessLevel,
  type Privilege,
  type PrivilegeModule,
  type UserAccount,
} from '../types';

/** Anything that carries resolved privileges: the session user, or a role being edited. */
export type PrivilegeHolder = Pick<UserAccount, 'active'> & { privileges: readonly Privilege[] };

/** UI affordances and server checks share this one rule. */
export function hasPrivilege(
  holder: PrivilegeHolder | null | undefined,
  privilege: Privilege,
): boolean {
  return Boolean(holder?.active && holder.privileges.includes(privilege));
}

const MODULES = new Map<string, (typeof PRIVILEGE_MODULES)[number]>(
  PRIVILEGE_MODULES.map((module) => [module.id, module]),
);

/** The levels a module supports, lowest first. */
export function levelsOf(module: PrivilegeModule): AccessLevel[] {
  const definition = MODULES.get(module);
  return ACCESS_LEVELS.filter((level) => definition && level in definition.levels);
}

export const privilegeOf = (module: PrivilegeModule, level: AccessLevel) =>
  `${module}:${level}` as Privilege;

/** The highest level `privileges` grant on `module`, or `null` for no access. */
export function levelOn(
  privileges: readonly Privilege[],
  module: PrivilegeModule,
): AccessLevel | null {
  const held = levelsOf(module).filter((level) => privileges.includes(privilegeOf(module, level)));
  return held.at(-1) ?? null;
}

/** Privileges for `module` at `level`: the level and every level below it. */
export function privilegesFor(module: PrivilegeModule, level: AccessLevel | null): Privilege[] {
  if (level === null) return [];
  const levels = levelsOf(module);
  return levels.slice(0, levels.indexOf(level) + 1).map((l) => privilegeOf(module, l));
}

/**
 * Adds the implied lower levels (delete ⇒ edit ⇒ view), drops unknown codes, de-duplicates and
 * sorts in catalogue order — the stored form of a role's privileges.
 */
export function normalizePrivileges(privileges: readonly string[]): Privilege[] {
  const granted = new Set<Privilege>();
  for (const module of PRIVILEGE_MODULES) {
    const level = levelOn(privileges as Privilege[], module.id);
    for (const privilege of privilegesFor(module.id, level)) granted.add(privilege);
  }
  return [...granted];
}

/** Union of the privileges of `roles`. */
export function privilegesOfRoles(roles: readonly { privileges: readonly Privilege[] }[]) {
  return normalizePrivileges(roles.flatMap((role) => role.privileges));
}
