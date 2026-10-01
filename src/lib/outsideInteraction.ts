/**
 * Takeoff portals dialogs, select lists, date pickers and popovers to `<body>`. A layer that
 * closes on outside interaction would otherwise treat a click inside a *nested* layer as an
 * outside click — closing (and unmounting) it mid-click. Pass these as `onInteractOutside`.
 */
const ignoreInside = (selector: string) => (event: PointerEvent | FocusEvent) => {
  if (event.target instanceof Element && event.target.closest(selector)) {
    event.preventDefault();
  }
};

/** For dialogs: keep open while the user picks from a select, date picker or popover. */
export const keepOpenForFloatingLayers = ignoreInside(
  '.tk-select-content, .tk-popover-content, .tk-dropdown-content',
);

/** For popovers: keep open while a dialog opened from them (e.g. a delete confirmation) is used. */
export const keepOpenForDialogs = ignoreInside('.tk-dialog-panel, .tk-dialog-overlay');
