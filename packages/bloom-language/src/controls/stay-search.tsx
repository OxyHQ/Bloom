import {
  type DestinationSuggestion,
  DestinationSuggestions as BloomDestinationSuggestions,
  type DestinationSuggestionsProps,
  type GuestCounts,
  GuestPicker as BloomGuestPicker,
  type GuestPickerProps,
  StaySearchCompact as BloomStaySearchCompact,
  type StaySearchCompactProps,
  StaySearchPanel as BloomStaySearchPanel,
  type StaySearchPanelProps,
  StaySearchStep as BloomStaySearchStep,
  type StaySearchStepProps,
} from '@oxy.so/bloom/stay-search';

import type { Binding } from '../binding';
import { type Child, Node, type ViewModifiers } from '../node';
import type { GuestPickerSize, SpaceToken } from '../tokens';
import type { ControlRenderer } from './draw';
import { product } from './product';

/** A stay search on a narrow screen: its trigger, its steps and their panels. */
export type StaySearchKind =
  | 'staySearchCompact'
  | 'staySearchPanel'
  | 'staySearchStep'
  | 'destinationSuggestions'
  | 'guestPicker';

type Drawn = 'style' | 'testID' | 'accessibilityLabel';

export type StaySearchCompactOptions = Omit<StaySearchCompactProps, Drawn | 'onPress'>;
export type StaySearchPanelOptions = Omit<
  StaySearchPanelProps,
  Drawn | 'children' | 'width' | 'padding'
> & { readonly width?: SpaceToken; readonly padding?: SpaceToken };
export type StaySearchStepOptions = Omit<
  StaySearchStepProps,
  Drawn | 'label' | 'children' | 'onPress'
>;
export type DestinationSuggestionsOptions = Omit<DestinationSuggestionsProps, Drawn | 'items'>;
export type GuestPickerOptions = Omit<
  GuestPickerProps,
  Drawn | 'value' | 'onChange' | 'size' | 'note'
> & { readonly note?: Child };

/** Bloom `StaySearchCompact`: the search's pill; `.onPress()` opens the search. */
export type StaySearchCompactView = ViewModifiers<StaySearchCompactView>;
/** Bloom `StaySearchPanel`: the card a step's content drops into; `.label()` names it a dialog. */
export type StaySearchPanelView = ViewModifiers<StaySearchPanelView>;
/** Bloom `StaySearchStep`: one step of the search; `.onPress()` expands it. */
export type StaySearchStepView = ViewModifiers<StaySearchStepView>;
/** Bloom `DestinationSuggestions`: a listbox of places; `.label()` names it. */
export type DestinationSuggestionsView = ViewModifiers<DestinationSuggestionsView>;
/** Bloom `GuestPicker`: a stepper per kind of guest. */
export interface GuestPickerView extends ViewModifiers<GuestPickerView> {
  /** The steppers' size: `md` (default) or `sm` (a popover). */
  size(value: GuestPickerSize): GuestPickerView;
}

/** Bloom `StaySearchCompact`, its words and filter button as options. */
export function StaySearchCompact(options: StaySearchCompactOptions = {}): StaySearchCompactView {
  return new Node('staySearchCompact', { options }, []);
}
/** Bloom `StaySearchPanel` around `content`. */
export function StaySearchPanel(
  content: Child,
  options: StaySearchPanelOptions = {},
): StaySearchPanelView {
  return new Node('staySearchPanel', { options }, [content]);
}
/** Bloom `StaySearchStep` named `label`: a row while collapsed, `content` in a card while expanded. */
export function StaySearchStep(
  label: string,
  content: Child,
  options: StaySearchStepOptions,
): StaySearchStepView {
  return new Node('staySearchStep', { label, options }, [content]);
}
/** Bloom `DestinationSuggestions` of `items`; its `onSelect` takes the one chosen. */
export function DestinationSuggestions(
  items: readonly DestinationSuggestion[],
  options: DestinationSuggestionsOptions,
): DestinationSuggestionsView {
  return new Node('destinationSuggestions', { items, options }, []);
}
/** Bloom `GuestPicker`, the guests the binding holds (the one-adult rule applied). */
export function GuestPicker(
  guests: Binding<GuestCounts>,
  options: GuestPickerOptions = {},
): GuestPickerView {
  return new Node('guestPicker', { binding: guests, options }, []);
}

export const STAY_SEARCH: Record<StaySearchKind, ControlRenderer> = {
  staySearchCompact: product(BloomStaySearchCompact, { press: true }),
  staySearchPanel: product(BloomStaySearchPanel, { lengths: ['width', 'padding'] }),
  staySearchStep: product(BloomStaySearchStep, { press: true }),
  destinationSuggestions: product(BloomDestinationSuggestions),
  guestPicker: product(BloomGuestPicker, {
    binding: ['value', 'onChange'],
    slots: ['note'],
    own: (d) => ({ size: d.own('size')?.value }),
  }),
};
