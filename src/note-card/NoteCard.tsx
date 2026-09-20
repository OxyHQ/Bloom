import React, { memo, useMemo } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '../card';
import {
  CHECKBOX_GLYPH_CSS,
  CHECKBOX_GLYPH_STYLE_ID,
  CheckboxGlyph,
  resolveCheckboxPaint,
} from '../checkbox/shared';
import { Chip } from '../chip';
import { RiAttachment2 } from '../icons/remix/RiAttachment2';
import { RiFolderLine } from '../icons/remix/RiFolderLine';
import { RiLockLine } from '../icons/remix/RiLockLine';
import { RiPushpinFill } from '../icons/remix/RiPushpinFill';
import { RiTimeLine } from '../icons/remix/RiTimeLine';
import { useInteractionState } from '../hooks/use-interaction-state';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { SurfaceLevelProvider, surfaceFillVars, useRingOffsetStyle, useSurfaceFill } from '../styles/surface-levels';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import { Text } from '../typography';
import { NoteCardSkeleton } from './NoteCardSkeleton';
import {
  composeNoteName,
  NOTE_CARD_GEOMETRY,
  noteCardRadiusPx,
  noteTagVariant,
  resolveNoteCardPaint,
} from './shared';
import type { NoteCardLabels, NoteCardProps } from './types';

/**
 * One note, previewed.
 *
 *                       grid                      row
 *   padding             16                        12
 *   radius              12                        8
 *   title               body-medium, 2 lines      body-medium, 1 line
 *   excerpt             body-2-regular, 4 lines   body-2-regular, 1 line
 *   tags                their own row             folded into the meta line
 *   metadata            last line                 inline after the excerpt
 *   min height          —                         72
 *
 * The two are one component (`density`), not two: everything but the
 * arrangement — which fields show, how the tone is composited, what selection
 * looks like — is the same decision, and a second component is where those
 * drift apart.
 *
 * **A checklist note previews as a checklist.** Flattened to text it reads as a
 * paragraph of fragments, so `checklist` replaces `excerpt` and draws the first
 * few items in `Checkbox`'s own box (`checkbox/shared`, so there is exactly one
 * drawing of a tick in the library). It is READ-ONLY — nothing in a preview
 * takes a press — and each row announces its state, because a tick with no name
 * is a decoration.
 *
 * **The tone is composited, not appended.** `tone` resolves through
 * `resolveAccentColors(..., 'subtle')`, whose tint is translucent; the card
 * flattens it over the surface it landed on and re-measures every quiet rung
 * against the RESULT (`shared.ts`). A rung measured against the page is a
 * contrast the reader never gets.
 *
 * **Selection has two spellings because it is two things.** `selected` alone is
 * "this is the note you are reading" — `aria-current`. With `selectable` the
 * card IS a checkbox: `role="checkbox"`, both spellings of `checked`, a real
 * `Checkbox` in the leading slot, and a press toggles instead of opening. A
 * notes app lives in that second mode whenever it is tidying up.
 *
 * Colour change only on hover and press — no scale. One focus ring, through the
 * shared recipe.
 */

const STYLE_ID = 'bloom-note-card-web-css';
const CARD = '[data-bloom-note-card]';

const NOTE_CARD_CSS = interactiveWebCss({
  selector: CARD,
  varPrefix: 'bloom-note-card',
  // A react-native-web `View` lays out with `display: flex`; the button reset's
  // `inline-flex` would change how the card sits in a grid cell.
  reset: 'none',
  transition: 'background-color 120ms ease, border-color 120ms ease',
  outlineOffset: 2,
});

const DEFAULT_LABELS: Required<NoteCardLabels> = {
  pinned: 'Pinned',
  locked: 'Protected',
  attachments: (count) => `${count} ${count === 1 ? 'attachment' : 'attachments'}`,
  select: 'Select note',
  checklistDone: 'Done',
  checklistTodo: 'To do',
  more: (count) => `${count} more`,
};

/** One entry of the metadata trail: a 14px glyph and its pre-formatted words. */
function MetaEntry({
  icon: Icon,
  label,
  color,
  accessibilityLabel,
}: {
  icon: typeof RiTimeLine;
  label: string;
  color: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 0 }}>
      <Icon width={14} height={14} fill={color} />
      <Text
        variant="caption-1-regular"
        numberOfLines={1}
        accessibilityLabel={accessibilityLabel}
        style={{ color, marginLeft: 4, flexShrink: 1 }}
      >
        {label}
      </Text>
    </View>
  );
}

const NoteCardComponent: React.FC<NoteCardProps> = ({
  title,
  excerpt,
  checklist,
  checklistTotal,
  tags,
  maxTags,
  meta,
  pinned = false,
  tone,
  density = 'grid',
  selected = false,
  selectable = false,
  onSelectedChange,
  onPress,
  onLongPress,
  loading = false,
  accessibilityLabel,
  labels: labelsProp,
  style,
  testID,
}) => {
  const theme = useTheme();
  const parent = useSurfaceFill();
  useInteractiveWebCss(STYLE_ID, NOTE_CARD_CSS);
  useInteractiveWebCss(CHECKBOX_GLYPH_STYLE_ID, CHECKBOX_GLYPH_CSS);
  const paint = useMemo(() => resolveNoteCardPaint(theme, parent, tone), [theme, parent, tone]);
  const checkboxPaint = useMemo(() => resolveCheckboxPaint(theme), [theme]);
  const ringOffset = useRingOffsetStyle();
  const { state: hovered, onIn: onHoverIn, onOut: onHoverOut } = useInteractionState();
  const labels = { ...DEFAULT_LABELS, ...labelsProp };
  const geo = NOTE_CARD_GEOMETRY[density];
  const row = density === 'row';

  if (loading) {
    return <NoteCardSkeleton density={density} style={style} testID={testID} />;
  }

  const shownTags = tags?.slice(0, maxTags ?? geo.maxTags) ?? [];
  const hiddenTags = (tags?.length ?? 0) - shownTags.length;
  const shownItems = checklist?.slice(0, geo.checklistRows) ?? [];
  const totalItems = checklistTotal ?? checklist?.length ?? 0;
  const hiddenItems = totalItems - shownItems.length;

  const name =
    accessibilityLabel ??
    composeNoteName([
      title,
      pinned && labels.pinned,
      meta?.locked === true && labels.locked,
      checklist ? `${checklist.filter((item) => item.done).length}/${totalItems}` : excerpt,
      meta?.notebook,
      meta?.attachments ? labels.attachments(meta.attachments) : undefined,
      meta?.edited,
    ]);

  // The card is a checkbox while the list is in selection mode, and the note
  // itself otherwise. Both spellings of the state: web reads only `aria-*`,
  // native only `accessibilityState`.
  const toggle = () => onSelectedChange?.(!selected);
  const press = selectable ? toggle : onPress;
  // A card with no handler and no selection mode is a PREVIEW, not a control:
  // giving it `role="button"` would put a focusable node that does nothing in
  // the tab order, which is worse than no semantics at all.
  const interactive = selectable || onPress !== undefined || onLongPress !== undefined;
  const semantics = selectable
    ? {
        role: 'checkbox' as const,
        'aria-checked': selected,
        accessibilityState: { checked: selected },
      }
    : {
        role: 'button' as const,
        'aria-current': selected ? ('true' as const) : undefined,
        accessibilityState: { selected },
      };

  const background = selected ? paint.selectedBackground : paint.background;
  const cardStyle: WebCssStyle = {
    backgroundColor: hovered && !selected ? paint.selectedBackground : background,
    borderColor: selected ? paint.selectedBorder : paint.border,
    borderWidth: selected ? 2 : 1,
    // A 2px selected border must not move the content — the padding gives the
    // pixel back rather than a negative margin taking it.
    padding: selected ? geo.padding - 1 : geo.padding,
    minHeight: geo.minHeight,
    flexDirection: row ? 'row' : 'column',
    alignItems: row ? 'flex-start' : 'stretch',
    ...surfaceFillVars(background),
  };

  const pin = pinned ? (
    <View
      role="img"
      accessibilityLabel={labels.pinned}
      style={{ marginLeft: 8, marginTop: 1 }}
      testID={testID ? `${testID}-pin` : undefined}
    >
      <RiPushpinFill width={14} height={14} fill={paint.accent} />
    </View>
  ) : null;

  const checkbox = selectable ? (
    <View
      // The card carries the checkbox role and the press; the box inside it is
      // the drawing of that state, not a second control to tab to.
      aria-hidden
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ marginRight: 10, marginTop: row ? 2 : 1 }}
      testID={testID ? `${testID}-checkbox` : undefined}
    >
      <CheckboxGlyph
        size="medium"
        checked={selected}
        indeterminate={false}
        disabled={false}
        highlighted={hovered}
        paint={checkboxPaint}
      />
    </View>
  ) : null;

  const excerptBlock =
    checklist === undefined ? (
      excerpt ? (
        <Text
          variant="body-2-regular"
          numberOfLines={geo.excerptLines}
          style={{ color: paint.textSecondary, marginTop: geo.gap, flexShrink: 1 }}
          testID={testID ? `${testID}-excerpt` : undefined}
        >
          {excerpt}
        </Text>
      ) : null
    ) : (
      <View style={{ marginTop: geo.gap, gap: row ? 2 : 6 }} testID={testID ? `${testID}-checklist` : undefined}>
        {shownItems.map((item) => (
          <View
            key={item.id}
            role="checkbox"
            aria-checked={item.done === true}
            aria-disabled
            accessibilityState={{ checked: item.done === true, disabled: true }}
            accessibilityLabel={`${item.done === true ? labels.checklistDone : labels.checklistTodo}, ${item.label}`}
            style={{ flexDirection: 'row', alignItems: 'flex-start', minWidth: 0 }}
          >
            <CheckboxGlyph
              size="small"
              checked={item.done === true}
              indeterminate={false}
              disabled={false}
              highlighted={false}
              paint={checkboxPaint}
              marginTop={2}
            />
            <Text
              variant="body-2-regular"
              numberOfLines={1}
              style={{
                color: item.done === true ? paint.textTertiary : paint.textSecondary,
                marginLeft: 8,
                flexShrink: 1,
                textDecorationLine: item.done === true ? 'line-through' : 'none',
              }}
            >
              {item.label}
            </Text>
          </View>
        ))}
        {hiddenItems > 0 ? (
          <Text variant="caption-1-regular" style={{ color: paint.textTertiary, marginLeft: 22 }}>
            {labels.more(hiddenItems)}
          </Text>
        ) : null}
      </View>
    );

  const tagVariant = noteTagVariant(tone);
  const tagChips =
    shownTags.length > 0 || hiddenTags > 0 ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: row ? 'nowrap' : 'wrap',
          gap: 6,
          minWidth: 0,
          marginTop: row ? 0 : geo.gap,
        }}
        testID={testID ? `${testID}-tags` : undefined}
      >
        {shownTags.map((tag) => (
          <Chip key={tag} size="small" variant={tagVariant} color={tone ?? 'default'} surface={background}>
            {tag}
          </Chip>
        ))}
        {hiddenTags > 0 ? (
          <Chip size="small" variant={tagVariant} color="default" surface={background}>
            {`+${hiddenTags}`}
          </Chip>
        ) : null}
      </View>
    ) : null;

  const metaEntries = [
    meta?.edited !== undefined ? (
      <MetaEntry key="edited" icon={RiTimeLine} label={meta.edited} color={paint.textTertiary} />
    ) : null,
    meta?.notebook !== undefined ? (
      <MetaEntry key="notebook" icon={RiFolderLine} label={meta.notebook} color={paint.textTertiary} />
    ) : null,
    meta?.attachments ? (
      <MetaEntry
        key="attachments"
        icon={RiAttachment2}
        label={String(meta.attachments)}
        accessibilityLabel={labels.attachments(meta.attachments)}
        color={paint.textTertiary}
      />
    ) : null,
    meta?.locked === true ? (
      <MetaEntry key="locked" icon={RiLockLine} label={labels.locked} color={paint.textTertiary} />
    ) : null,
  ].filter(Boolean);

  const metaRow =
    metaEntries.length > 0 || (row && tagChips !== null) ? (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 10,
          marginTop: geo.gap,
          minWidth: 0,
        }}
        testID={testID ? `${testID}-meta` : undefined}
      >
        {metaEntries}
        {row ? tagChips : null}
      </View>
    ) : null;

  const body = (
    <Card variant="outlined" radius={geo.radius} style={cardStyle}>
      <SurfaceLevelProvider level={1} fill={background}>
        {checkbox}
        <View style={{ flex: 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', minWidth: 0 }}>
            <Text
              variant="body-medium"
              numberOfLines={geo.titleLines}
              style={{ color: paint.text, flex: 1, minWidth: 0 }}
              testID={testID ? `${testID}-title` : undefined}
            >
              {title}
            </Text>
            {pin}
          </View>
          {excerptBlock}
          {row ? null : tagChips}
          {metaRow}
        </View>
      </SurfaceLevelProvider>
    </Card>
  );

  const rootStyle = [
    { borderRadius: noteCardRadiusPx(density) },
    ringOffset as WebCssStyle,
    { '--bloom-note-card-ring': theme.colors.primary } as WebCssStyle,
    style,
  ];

  // A preview is a `View`, not a `Pressable` with its handlers left off: a
  // pressable with no press still lands in the tab order and still announces a
  // role, and neither is true of the thing on screen.
  if (!interactive) {
    return (
      <View accessibilityLabel={name} style={rootStyle} testID={testID}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      {...webDataSet({ bloomNoteCard: '' })}
      {...semantics}
      accessibilityLabel={name}
      onPress={press}
      onLongPress={onLongPress}
      onHoverIn={onHoverIn}
      onHoverOut={onHoverOut}
      style={rootStyle}
      testID={testID}
    >
      {body}
    </Pressable>
  );
};

export const NoteCard = memo(NoteCardComponent);
NoteCard.displayName = 'NoteCard';
