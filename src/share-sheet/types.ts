import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { PersonSummary } from '../chat-people/types';
import type { BloomIconComponent } from '../icons/icon-component';

/** Somewhere other than a person to send the thing: copy the link, another app, the system sheet. */
export interface ShareSheetTarget {
  /** Stable identity within the row. */
  key: string;
  /** Drawn under the circle and announced as the button's name. */
  label: string;
  icon: BloomIconComponent;
  onPress: () => void;
  testID?: string;
}

export interface ShareSheetProps {
  /** The heading. Defaults to "Share" in the sheet's locale; `null` draws none. */
  title?: string | null;
  /** A search field above the people, built on Bloom's `Search` (the `DialogHeader` shape). */
  search?: {
    value: string;
    onValueChange: (text: string) => void;
    placeholder?: string;
    onSubmit?: () => void;
  };
  /**
   * The people offered, in order: recent ones before anything is typed, the
   * matches after. Absent hides the people section (a signed-out reader has no
   * one to send to); empty shows `peopleEmpty`.
   */
  people?: readonly PersonSummary[];
  /** Pressing a person. The consumer decides what sending to them means. */
  onPersonPress?: (id: string) => void;
  /** People are on their way: placeholders stand in while the list is empty. */
  peopleLoading?: boolean;
  /** Drawn when `people` is empty and not loading. Defaults to one quiet line. */
  peopleEmpty?: ReactNode;
  /** The row of other destinations under the people, scrolled sideways when it overflows. */
  targets?: readonly ShareSheetTarget[];
  /** Overrides the size inherited from `BloomScope`. */
  size?: 'sm' | 'md' | 'lg';
  /** Locale for the fixed strings. Defaults to the nearest `LocaleProvider`. */
  locale?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
