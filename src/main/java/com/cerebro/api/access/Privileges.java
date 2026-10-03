package com.cerebro.api.access;

import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/** Privilege set arithmetic, as {@code utils/permissions.ts}. */
public final class Privileges {

  private Privileges() {}

  /**
   * Adds the implied lower levels (delete ⇒ edit ⇒ view), drops unknown codes, de-duplicates and
   * sorts in catalogue order — the stored form of a role's privileges.
   */
  public static List<String> normalize(Collection<String> privileges) {
    Set<String> held = Set.copyOf(privileges);
    Set<String> granted = new LinkedHashSet<>();
    for (PrivilegeModule module : PrivilegeModule.values()) {
      List<AccessLevel> levels = module.levels();
      int highest = -1;
      for (int i = 0; i < levels.size(); i++) {
        if (held.contains(module.privilege(levels.get(i)))) {
          highest = i;
        }
      }
      for (int i = 0; i <= highest; i++) {
        granted.add(module.privilege(levels.get(i)));
      }
    }
    return List.copyOf(granted);
  }
}
