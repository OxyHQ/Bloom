import React, { type ComponentRef, useCallback, useEffect, useId, useRef, useState } from 'react';
import { Pressable, type TextInput, View, type TextInputKeyPressEvent } from 'react-native';

import { useBloomAppearance } from '../appearance';
import { Button } from '../button';
import { useFieldMembership } from '../field/membership';
import { DEFAULT_SIDE_OFFSET } from '../floating/constants';
import { useMenuPalette } from '../floating/menu-palette';
import { RiMapPin2Line } from '../icons/remix/RiMapPin2Line';
import { Loading } from '../loading';
import { useMessages } from '../locale/messages';
import { IS_WEB } from '../styles/platform';
import type { WebCssStyle } from '../styles/web-view-style';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { TEXT_FIELD_STACK_GAP } from '../text-field/shared';
import { Text } from '../typography';
import {
  PLACE_PICKER_ICON_SIZE,
  PLACE_PICKER_LIST_GAP,
  PLACE_PICKER_LIST_PADDING,
  PLACE_PICKER_LIST_RADIUS,
  PLACE_PICKER_MIN_QUERY_LENGTH,
  PLACE_PICKER_OPTION_GAP,
  PLACE_PICKER_OPTION_MIN_HEIGHT,
  PLACE_PICKER_OPTION_PADDING_X,
  PLACE_PICKER_OPTION_PADDING_Y,
  PLACE_PICKER_OPTION_RADIUS,
} from './constants';
import { PLACE_PICKER_MESSAGES } from './messages';
import { formatPlaceCoordinate, placePickerView } from './shared';
import type { PlacePickerLabels, PlacePickerOption, PlacePickerProps } from './types';

/**
 * Choosing a real place by typing its name or address: a text field, the
 * places that match underneath it, and — once one is chosen — that place with
 * its coordinate and a way back to searching.
 *
 * **It knows no geocoder.** The app owns the text (`query`), runs the search
 * however it fetches (a React Query hook over GoWay's `geocode.forward`, a
 * saved-address book, anything) and hands the answer back as `results` with a
 * `status`. Bloom has no data layer and no network dependency, and a picker
 * that called a provider itself would tie every app to that provider.
 *
 * **It draws no map.** Bloom ships no map (`docs/map-marker.mdx`); the chosen
 * place shows its coordinate so a person can check it, and an app with a map
 * puts the pin on its own.
 *
 * **A combobox on web, a list of buttons on native.** The input carries
 * `role="combobox"`, `aria-expanded`, `aria-controls` and
 * `aria-activedescendant`; the arrows move one highlight and Enter chooses,
 * while focus never leaves the text being typed. Native has no
 * active-descendant, so each row is its own pressable option. The status line
 * (searching, how many, none, failed) is a polite live region on both, because
 * results arriving under a field are otherwise silent to a screen reader.
 *
 * **It is a `Field` member** through `TextFieldInput`: the name defers to the
 * field, `disabled` and `invalid` combine with it, the field's id and
 * description reach the input (`docs/composition.mdx` §Field).
 */

/** A DOM keyboard event as react-native-web hands it to `onKeyPress`. */
type WebKeyEvent = TextInputKeyPressEvent['nativeEvent'] & { isComposing?: boolean };

/**
 * React Native's `Role` union has no `listbox`; react-native-web passes the DOM
 * `role` straight through, so it travels as a web-only prop and native takes
 * the nearest thing it has.
 */
const LIST_ROLE: Record<string, unknown> = IS_WEB
  ? { role: 'listbox' }
  : { accessibilityRole: 'list' };

/** A live region on both platforms: `aria-live` for the web, the RN prop for Android. */
const LIVE: Record<string, unknown> = IS_WEB
  ? { role: 'status', 'aria-live': 'polite' }
  : { accessibilityLiveRegion: 'polite' };

export function PlacePicker<Option extends PlacePickerOption = PlacePickerOption>({
  value,
  onValueChange,
  query,
  onQueryChange,
  results,
  status = 'ready',
  onRetry,
  minQueryLength = PLACE_PICKER_MIN_QUERY_LENGTH,
  label,
  placeholder,
  size: sizeProp,
  disabled = false,
  invalid = false,
  accessibilityLabel,
  nativeID,
  labels: labelsProp,
  style,
  testID,
}: PlacePickerProps<Option>) {
  const { size } = useBloomAppearance({ size: sizeProp }, { size: 'md', tone: 'neutral' });
  const menu = useMenuPalette();
  const { messages } = useMessages(PLACE_PICKER_MESSAGES);
  const labels: Required<PlacePickerLabels> = { ...messages, ...labelsProp };
  const field = useFieldMembership({ accessibilityLabel, label, disabled, invalid, nativeID });
  const inputRef = useRef<ComponentRef<typeof TextInput> | null>(null);
  const reactId = useId();
  const baseId = field.nativeID ?? `bloom-place-picker-${reactId.replace(/:/g, '')}`;
  const listId = `${baseId}-results`;
  const [activeIndex, setActiveIndex] = useState(-1);
  // "Change" swaps the summary back for the field; the caret belongs in it once
  // it has mounted again, not on whatever the summary's button left focused.
  const refocus = useRef(false);
  useEffect(() => {
    if (value !== null || !refocus.current) return;
    refocus.current = false;
    inputRef.current?.focus();
  }, [value]);

  const view = placePickerView(query, status, results.length, minQueryLength);
  const listOpen = value === null && view === 'results';
  const trimmed = query.trim();

  const choose = useCallback(
    (option: Option) => {
      setActiveIndex(-1);
      onValueChange(option);
    },
    [onValueChange],
  );

  const changeText = useCallback(
    (next: string) => {
      setActiveIndex(-1);
      onQueryChange(next);
    },
    [onQueryChange],
  );

  const handleKeyPress = useCallback(
    (event: TextInputKeyPressEvent) => {
      if (!IS_WEB || !listOpen) return;
      const native = event.nativeEvent as WebKeyEvent;
      // An IME candidate window owns Enter and the arrows while it is open.
      if (native.isComposing === true) return;
      if (native.key === 'ArrowDown' || native.key === 'ArrowUp') {
        event.preventDefault();
        const step = native.key === 'ArrowDown' ? 1 : -1;
        const from = activeIndex < 0 ? (step > 0 ? -1 : 0) : activeIndex;
        setActiveIndex((from + step + results.length) % results.length);
        return;
      }
      if (native.key === 'Escape') {
        event.preventDefault();
        setActiveIndex(-1);
        return;
      }
      if (native.key === 'Enter' && activeIndex >= 0) {
        const option = results[activeIndex];
        if (!option) return;
        event.preventDefault();
        choose(option);
      }
    },
    [listOpen, activeIndex, results, choose],
  );

  const statusText =
    view === 'loading' || (view === 'results' && status === 'loading')
      ? labels.searching
      : view === 'error'
        ? labels.failed
        : view === 'empty'
          ? labels.noResults(trimmed)
          : view === 'results'
            ? labels.resultCount(results.length)
            : null;

  const panel: WebCssStyle = {
    marginTop: DEFAULT_SIDE_OFFSET,
    padding: PLACE_PICKER_LIST_PADDING,
    gap: PLACE_PICKER_LIST_GAP,
    borderRadius: PLACE_PICKER_LIST_RADIUS,
    borderWidth: 1,
    borderColor: menu.border,
    backgroundColor: menu.surface,
    boxShadow: menu.shadow,
    overflow: 'hidden',
  };

  if (value !== null) {
    return (
      <View style={style} testID={testID}>
        <View
          style={[
            panel,
            {
              marginTop: 0,
              flexDirection: 'row',
              alignItems: 'center',
              gap: PLACE_PICKER_OPTION_GAP,
              padding: PLACE_PICKER_OPTION_PADDING_X,
            },
          ]}
          accessibilityLabel={[field.accessibilityLabel, value.title, value.subtitle]
            .filter(Boolean)
            .join(', ')}
          testID={testID ? `${testID}-selected` : undefined}
        >
          <RiMapPin2Line
            width={PLACE_PICKER_ICON_SIZE}
            height={PLACE_PICKER_ICON_SIZE}
            fill={menu.textSecondary}
          />
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text variant="body-medium" numberOfLines={2} style={{ color: menu.text }}>
              {value.title}
            </Text>
            {value.subtitle ? (
              <Text
                variant="body-2-regular"
                numberOfLines={2}
                style={{ color: menu.textSecondary }}
              >
                {value.subtitle}
              </Text>
            ) : null}
            <Text variant="caption-1-regular" style={{ color: menu.textSecondary }}>
              {formatPlaceCoordinate(value.coordinate)}
            </Text>
          </View>
          <Button
            appearance="outline"
            tone="neutral"
            size="sm"
            disabled={field.disabled}
            onPress={() => {
              refocus.current = true;
              onValueChange(null);
            }}
            testID={testID ? `${testID}-change` : undefined}
          >
            {labels.change}
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={style} testID={testID}>
      <TextField size={size} invalid={field.invalid} disabled={field.disabled}>
        <TextFieldIcon icon={RiMapPin2Line} />
        <TextFieldInput
          inputRef={inputRef}
          label={label}
          placeholder={placeholder}
          value={query}
          onValueChange={changeText}
          onKeyPress={handleKeyPress}
          onBlur={() => setActiveIndex(-1)}
          disabled={field.disabled}
          invalid={invalid}
          nativeID={field.nativeID}
          accessibilityLabel={field.accessibilityLabel}
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="search"
          role="combobox"
          aria-expanded={listOpen}
          aria-controls={listOpen ? listId : undefined}
          aria-activedescendant={
            listOpen && activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          testID={testID ? `${testID}-input` : undefined}
        />
      </TextField>

      {statusText !== null ? (
        <View
          {...LIVE}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 8,
            marginTop: TEXT_FIELD_STACK_GAP,
          }}
          testID={testID ? `${testID}-status` : undefined}
        >
          {status === 'loading' ? <Loading variant="spinner" size="xs" /> : null}
          <Text variant="caption-1-regular" style={{ color: menu.textSecondary, flexShrink: 1 }}>
            {statusText}
          </Text>
          {view === 'error' && onRetry ? (
            <Button
              appearance="plain"
              tone="neutral"
              size="xs"
              onPress={onRetry}
              testID={testID ? `${testID}-retry` : undefined}
            >
              {labels.retry}
            </Button>
          ) : null}
        </View>
      ) : null}

      {listOpen ? (
        <View
          nativeID={listId}
          {...LIST_ROLE}
          accessibilityLabel={labels.results}
          style={panel}
          testID={testID ? `${testID}-results` : undefined}
        >
          {results.map((option, index) => {
            const active = index === activeIndex;
            const row: WebCssStyle = {
              flexDirection: 'row',
              alignItems: 'center',
              gap: PLACE_PICKER_OPTION_GAP,
              minHeight: PLACE_PICKER_OPTION_MIN_HEIGHT,
              paddingHorizontal: PLACE_PICKER_OPTION_PADDING_X,
              paddingVertical: PLACE_PICKER_OPTION_PADDING_Y,
              borderRadius: PLACE_PICKER_OPTION_RADIUS,
              backgroundColor: active ? menu.rowHighlight : 'transparent',
              cursor: 'pointer',
            };
            return (
              <Pressable
                key={option.id}
                nativeID={`${listId}-${index}`}
                {...(IS_WEB
                  ? ({
                      // The combobox keeps focus and points at the active row
                      // with `aria-activedescendant`, so a row is not a tab
                      // stop; and a mousedown must not blur the caret
                      // (`TagField` measured why in Chrome).
                      tabIndex: -1,
                      onMouseDown: (event: { preventDefault: () => void }) =>
                        event.preventDefault(),
                    } as Record<string, unknown>)
                  : null)}
                role="option"
                aria-selected={active}
                accessibilityState={{ selected: active }}
                accessibilityLabel={[option.title, option.subtitle].filter(Boolean).join(', ')}
                disabled={field.disabled}
                onPress={() => choose(option)}
                onHoverIn={() => setActiveIndex(index)}
                style={row}
                testID={testID ? `${testID}-result-${option.id}` : undefined}
              >
                <RiMapPin2Line
                  width={PLACE_PICKER_ICON_SIZE}
                  height={PLACE_PICKER_ICON_SIZE}
                  fill={menu.textSecondary}
                />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text variant="body-medium" numberOfLines={1} style={{ color: menu.text }}>
                    {option.title}
                  </Text>
                  {option.subtitle ? (
                    <Text
                      variant="body-2-regular"
                      numberOfLines={1}
                      style={{ color: menu.textSecondary }}
                    >
                      {option.subtitle}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}
PlacePicker.displayName = 'PlacePicker';
