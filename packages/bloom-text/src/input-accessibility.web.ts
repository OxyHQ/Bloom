import { type RefObject, useLayoutEffect } from 'react';
import type { View } from 'react-native';
import type { InputAccessibility } from './input-accessibility';

/** The upstream web input does not forward View accessibility props to its editor. */
export function useInputAccessibility(
  ref: RefObject<View | null>,
  props: InputAccessibility,
): void {
  const {
    accessibilityLabel,
    'aria-controls': controls,
    'aria-activedescendant': active,
    'aria-expanded': expanded,
    'aria-autocomplete': autocomplete,
  } = props;
  useLayoutEffect(() => {
    const wrapper = ref.current as unknown as HTMLElement | null;
    if (!wrapper?.querySelector) return;
    const apply = () => {
      const input = wrapper.querySelector('[contenteditable]');
      if (!input) return;
      const attributes = {
        role: expanded === undefined ? 'textbox' : 'combobox',
        'aria-label': accessibilityLabel,
        'aria-controls': controls,
        'aria-activedescendant': active,
        'aria-expanded': expanded === undefined ? undefined : String(expanded),
        'aria-autocomplete': autocomplete,
        'aria-haspopup': expanded === undefined ? undefined : 'listbox',
      };
      for (const [name, value] of Object.entries(attributes)) {
        if (value === undefined) input.removeAttribute(name);
        else input.setAttribute(name, value);
      }
    };
    apply();
    // The editing engine mounts its contenteditable asynchronously and may
    // replace it. Attribute writes do not retrigger this child-only observer.
    const observer = new MutationObserver(apply);
    observer.observe(wrapper, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [ref, accessibilityLabel, controls, active, expanded, autocomplete]);
}
