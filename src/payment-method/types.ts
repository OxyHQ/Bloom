import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import type { BloomIconComponent } from '../icons/icon-component';

/**
 * WHAT KIND OF THING PAYS — data, not four components.
 *
 * It chooses the default glyph on the mark and nothing else: a card, a bank
 * account the charge is drawn from, a stored balance, or money handed over at
 * the door. An app whose kinds are not these four passes `icon`.
 */
export type PaymentMethodKind = 'card' | 'account' | 'wallet' | 'cash';

/**
 * Whether the method can still be used.
 *
 * `ok` is the ordinary case. `expired` and `declined` are the two an app has to
 * be able to draw, and they are STATES rather than tones: the row picks the
 * warning/error paint itself so two screens cannot disagree about which colour
 * a declined card is.
 */
export type PaymentMethodState = 'ok' | 'expired' | 'declined';

export type PaymentMethodDensity = 'comfortable' | 'compact';

/**
 * `list` is a set of saved methods a reader is managing; `picker` is a set they
 * are choosing ONE of. The difference is the announced tree — a `radiogroup` of
 * `radio`s against a `list` of `listitem`s — which is why it is a variant and
 * not a styling prop.
 */
export type PaymentMethodListVariant = 'list' | 'picker';

/**
 * The brand mark.
 *
 * **Bloom never draws a brand's logo.** The mark is a neutral glyph on a plate
 * the shape of a card, and the scheme's NAME as text beside it. An app that has
 * the rights to a logo passes it as `image`, which replaces the glyph — the
 * plate, the geometry and the name stay Bloom's.
 */
export interface PaymentMethodMarkProps {
  /**
   * The scheme's name, spelled by the APP — Bloom ships no list of schemes.
   * Drawn as text beside the plate. Omit it for the plate alone, which is what
   * `PaymentMethodRow` does: the row already draws the name in its title.
   */
  scheme?: string;
  /** Chooses the default glyph. Default `card`. */
  kind?: PaymentMethodKind;
  /** The glyph, overriding whatever `kind` would have chosen. */
  icon?: BloomIconComponent;
  /**
   * An image the app has the rights to, drawn inside the plate instead of the
   * glyph. Read for PRESENCE, so `image={null}` is an empty plate rather than
   * the glyph.
   */
  image?: ReactNode;
  /** Paints the plate in the state's tone. Default `ok`. */
  state?: PaymentMethodState;
  /** Default `comfortable`. */
  density?: PaymentMethodDensity;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export interface PaymentMethodRowProps {
  /** The scheme's name, spelled by the app — "Aurora", "Meridian". */
  scheme?: string;
  /**
   * The MASKED identifier — `"•••• 4417"`, `"ES•• •••• 8842"`, `"nil@example"`.
   *
   * The app masks it. Nothing in this family unmasks, parses, stores or
   * transmits anything, and a full number should never reach this prop.
   */
  masked?: string;
  /**
   * Pre-formatted by the app: `"09/29"`, `"Expires 09/29"`. Bloom never reads a
   * clock, so whether that date is in the past is the app's finding, reported
   * through `state`.
   */
  expiry?: string;
  /** Chooses the default glyph on the mark. Default `card`. */
  kind?: PaymentMethodKind;
  /** The glyph, overriding whatever `kind` would have chosen. */
  icon?: BloomIconComponent;
  /** An image the app has the rights to, drawn inside the plate. */
  image?: ReactNode;
  /**
   * An arbitrary leading node instead of the mark. Read for PRESENCE:
   * `leading={null}` draws no media at all.
   */
  leading?: ReactNode;
  /** Marks this as the one that will be charged. Draws a `Badge`. */
  isDefault?: boolean;
  /** The default badge's word. Default `"Default"`. */
  defaultLabel?: string;
  /** Default `ok`. */
  state?: PaymentMethodState;
  /**
   * The words under the row when `state` is not `ok` — "Declined by your bank",
   * "This card expired in June". Without it the row draws the state's own
   * label.
   */
  stateMessage?: string;
  /**
   * Draws the radio dot in the trailing slot and announces the row as a
   * `radio`. `PaymentMethodList variant="picker"` sets it; set it yourself only
   * for a row inside a `radiogroup` of your own.
   */
  selectable?: boolean;
  /** Whether this is the chosen one. Announced as `aria-checked` on a `radio`. */
  selected?: boolean;
  /**
   * A trailing control — a `GlyphButton` with the row's menu, a `Button`.
   *
   * A PRESSABLE row cannot nest one: on web the row is a real `<button>`, so
   * the action is drawn beside the row instead of inside it. See `AddressRow`,
   * where the same rule is measured.
   */
  action?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  /** Default `comfortable`. */
  density?: PaymentMethodDensity;
  /**
   * What the row IS in the tree around it. `PaymentMethodList` passes this; a
   * row on its own leaves it alone and gets a plain pressable row.
   */
  role?: 'radio' | 'option' | 'listitem';
  /**
   * The announced name. Defaults to the scheme, the masked identifier, the
   * default mark and the state, joined — the row's own text in reading order.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

/** One saved method, as data. */
export interface PaymentMethodEntry
  extends Omit<PaymentMethodRowProps, 'onPress' | 'selected' | 'selectable' | 'role'> {
  /** Identifies the entry to `onSelect` and `selectedId`. */
  id: string;
}

export interface PaymentMethodListProps {
  /** The saved methods, in the order they should be read. */
  methods: readonly PaymentMethodEntry[];
  /** The chosen entry's `id`. Only meaningful for `variant="picker"`. */
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** Default `list`. */
  variant?: PaymentMethodListVariant;
  /** Default `comfortable`. */
  density?: PaymentMethodDensity;
  /**
   * Disables every row. Combined with an enclosing `Field`'s `disabled` with
   * `||`, never replaced — a row inside a disabled field cannot re-enable
   * itself.
   */
  disabled?: boolean;
  /** Draws the "add a method" row under the list. Without it no row is drawn. */
  onAdd?: () => void;
  /** Default `"Add a payment method"`. */
  addLabel?: string;
  /** The glyph on the add row. Default a plus. */
  addIcon?: BloomIconComponent;
  /** Draws placeholder rows instead of the methods. */
  loading?: boolean;
  /** How many placeholder rows. Default 3. */
  loadingRows?: number;
  /** Replaces the whole empty block. The add row is still drawn under it. */
  empty?: ReactNode;
  /** Default `"No saved payment methods"`. */
  emptyTitle?: string;
  emptyDescription?: string;
  /** The glyph above the empty text. Default a card. */
  emptyIcon?: BloomIconComponent;
  /**
   * Names the list — and, for a picker, the `radiogroup`.
   *
   * Inside a `Field` the field's label supplies it; this wins when both are
   * given. `"Payment methods"` is the last resort.
   */
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}
