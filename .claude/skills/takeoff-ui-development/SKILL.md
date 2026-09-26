---
name: takeoff-ui-development
description: Rules and workflow for building Cerebro UI with Takeoff UI v2 (@takeoff-ui/react-spar) — MCP-first component discovery, verified props only, accessibility, spacing/typography tokens, form/dialog/table patterns, loading/empty/error states and destructive-action confirmation. Activate for ANY UI work: new pages, components, forms, tables, dialogs, styling or layout changes.
---

# Takeoff UI Development

## 1. Discovery workflow (every substantial UI change)

1. **List the UI patterns** the feature needs (button, table, tabs, select, dialog, badge, …).
2. **Search Takeoff UI MCP** (`takeoff-ui-mcp`):
   - `get-components-list` → confirm the component exists.
   - `get-components-info` with `["table", "tabs", …]` → props, parts, examples.
   - `get-framework-integration` (`react`, topic `forms`/`routing`/`accessibility`) when relevant.
3. **If MCP is unavailable or incomplete**, use the installed package — it is authoritative:
   - Types: `node_modules/@takeoff-ui/react-spar/dist/index.d.ts` (grep `interface <Name>Props`).
   - Docs for the installed version: `https://takeoff-v2.app.turkishtechlab.com/docs/components/<name>.md`.
   - Component index + house rules: `AGENTS.md`.
4. **Use documented props only.** If MCP and installed types disagree, follow the installed types
   and mention the discrepancy in your summary.
5. **Create a custom component only when Takeoff has none** (e.g. `DetailList`, `PageHeader`,
   `EmptyState`). Build it from Takeoff parts + tokens; never re-implement an existing component.

Never rely on memory for Takeoff APIs. `npm run typecheck` must pass — it is the final proof.

## 2. Core API model (v2)

- Compound components: state on the root, structure in parts (`Tabs` → `Tabs.List`,
  `Tabs.Trigger`, `Tabs.Content`). Keep documented parts in place — they carry ARIA wiring.
- React vocabulary: `value` / `defaultValue` / `onValueChange` / `open` / `onOpenChange`.
- Visual vocabulary: `variant`, `appearance`, `size`.
- Polymorphic parts via `as`: `<Breadcrumb.Link as={Link} to={…}>`, `<Dialog.Trigger as={Button}>`.
- **Navigation styled as a button → `components/actions/ButtonLink`**, never `<Button as={Link}>`
  directly: Takeoff 0.6.0 puts `role="button"` on the anchor (see `docs/decisions.md` D-008).
- App-wide defaults (e.g. `Table` density) go in `TakeoffSparProvider components`
  (`app/providers/AppProviders.tsx`), not in wrappers.
- Styling layers only: `className`, `classNames={{ slot }}`, `slotProps={{ slot }}`, provider
  `components`. Internal DOM is not a contract; only documented `data-*` attributes are.
- Icons: `@takeoff-icons/react/<icon>` e.g. `import { AddIconOutlinedRounded } from '@takeoff-icons/react/add'`.
  Decorative by default; pass `title`/`aria-label` when meaningful. Use `OutlinedRounded` style
  consistently.

## 3. Cerebro component map

| Need                              | Use                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------- |
| Page title + breadcrumb + actions | `components/layout/PageHeader` (Takeoff `Breadcrumb` + `Button` inside)                |
| Status / lifecycle / criticality  | `Badge` via domain `*Presentation.ts` mapping (text always visible)                    |
| Tabular lists                     | `Table` in `manual` mode, controlled `sorting` + `pagination`, `emptyState`, `loading` |
| Filters                           | `Input` (search) + `Select` in a `Toolbar`; state in URL search params                 |
| Detail sections                   | `Card` + `components/data-display/DetailList`                                          |
| Detail navigation                 | `Tabs` (`appearance="basic"`), tab value synced to `?tab=`                             |
| Secondary actions                 | `Dropdown` (`Dropdown.Trigger as={Button}`)                                            |
| Inline persistent feedback        | `Alert`                                                                                |
| Transient feedback                | `Toaster` / toast controller                                                           |
| First-load placeholder            | `Skeleton`; in-place refresh → `Spinner` / Table `loading`                             |
| Modal confirmation                | `Dialog`                                                                               |
| Side panel editing                | `Drawer`                                                                               |
| Tags / filter tokens              | `Chip` (removable) — `Badge` for non-interactive labels                                |
| Form field wrapper                | `Field` + `Field.Label` + control + `Field.Description` + `Field.ErrorMessage`         |

## 4. Layout, spacing, typography

- Tokens only: `--spacing-*` (4xl = 16px, xl = 12px, m-base = 8px), `--size-*` (sm 14, base 16,
  lg 18, xl 20, 2xl 24), `--weight-*`, `--text-darkest|dark|base`, `--border-light`,
  `--background-lightest`, `--static-light`, `--radius-m-base`.
- Desktop-first, dense but calm: 14px body in tables/detail, 24px page titles, 16–24px section gaps.
- No gradients, no decorative animation, no oversized radii, no emoji.
- Custom CSS lives in `src/styles/global.css` (layout primitives) or a co-located `*.css` for a
  component; class names are `c-` prefixed BEM-ish (`c-page-header__title`).

## 5. Accessibility

- Every page has exactly one `h1` (PageHeader). Section titles use the next heading level.
- Icon-only buttons need `aria-label`. Links navigate; buttons act.
- Never convey meaning by colour alone — badges always contain text.
- Keep focus visible; do not remove Takeoff focus styles.
- Tables: use Takeoff `Table` (native `<table>`, `aria-sort`, labelled pagination).
- Forms: `Field` wires label/description/error; error messages render only when `invalid`.

## 6. Forms (use the existing building blocks)

- Page: `components/forms/FormPage` (summary, sticky actions, unsaved guard, server errors).
- Fields: `TextField` (incl. `rows` → textarea), `SelectField` (`emptyLabel` for optional
  references), `ChipsField` (`Input.Chips`), `MultiSelectField` (Select + removable `Chip`s),
  `SwitchField`, `DateField` (`useDatePicker` + `Popover` + `Calendar`), `RepeatableList` for
  `useFieldArray` rows.
- Controlled Takeoff list inputs echo their value back: never forward an identical array to
  `field.onChange` (see `ChipsField`) or React will loop.

- React Hook Form + Zod (`zodResolver`). Schema in `domains/<d>/schemas`.
- Wire controls with `Controller` for Takeoff controls; pass `invalid` to `Field` from
  `fieldState.invalid` and the message to `Field.ErrorMessage`.
- Submit button uses `loading` while pending; disable double-submit.
- Large forms are split into sections (`Card` per section) or a `Stepper` for true sequences.
- Cancel returns to the previous page; warn on unsaved changes when the form is dirty.

## 7. Async states (required for every async view)

| State           | Pattern                                                                                |
| --------------- | -------------------------------------------------------------------------------------- |
| Loading (first) | `LoadingState` (Skeleton rows) or Table `loading`                                      |
| Empty           | `EmptyState` with specific copy + relevant action ("No repositories have been added…") |
| Error           | `ErrorState` (Alert `danger`) with retry                                               |
| Not found       | `NotFound` page-level state                                                            |

## 8. Destructive actions

- Never perform on a single click. Open a `Dialog` confirmation naming the entity.
- Show impact: "This application is referenced by 3 projects and 5 dependencies."
- Destructive button uses `variant="danger"`; default focus on Cancel.
- Report the outcome with a toast; keep errors inline in the dialog.
