import { createContext, useContext, useEffect, type ReactNode } from 'react';
import type { BloomIconComponent } from '../icons/icon-component';

/** One action of a settings page, drawn in the page header's button group (Save, Cancel…). */
export interface SettingsPageAction {
  /** Stable identity of the action within the page. */
  key: string;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Draw only this icon; `label` then names it for assistive technology. */
  icon?: BloomIconComponent;
}

export interface SettingsPageActionsState {
  /** The group's accessible name. */
  label: string;
  actions: readonly SettingsPageAction[];
}

type SetPageActions = (state: SettingsPageActionsState | null) => void;

/** How a page hands its actions to the header above it; set by the settings layout around each page. */
export const SettingsPageActionsContext = createContext<SetPageActions | null>(null);

/** How the settings page header is drawn: Bloom's flat `bar`, or the `floating` capsules. */
export type SettingsHeaderPresentation = 'bar' | 'floating';

export const SettingsHeaderPresentationContext = createContext<SettingsHeaderPresentation>('bar');

/**
 * The actions of the page it is rendered in, shown in the page's header beside the close button:
 * a page keeps its save state where it is edited and says what the header offers, so a Save never
 * sits in the body. Renders nothing itself; the actions leave with the page.
 */
export function SettingsPageActions({
  actions,
  label,
}: {
  actions: readonly SettingsPageAction[];
  label: string;
}): ReactNode {
  const set = useContext(SettingsPageActionsContext);
  useEffect(() => {
    set?.({ label, actions });
  }, [set, label, actions]);
  useEffect(() => () => set?.(null), [set]);
  return null;
}
