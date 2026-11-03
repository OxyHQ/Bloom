import { type ComponentRef, useCallback, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { handleRovingKeyDown, useRovingTabIndex } from '../hooks/roving-focus';
import { useNativeRovingGroup } from '../hooks/use-native-roving-group';
import { useDirectionProps, useIsRtl } from '../hooks/use-is-rtl';
import { interactiveWebCss, useInteractiveWebCss } from '../styles/interactive-web-css';
import { IS_WEB } from '../styles/platform';
import { useRingOffsetStyle } from '../styles/surface-levels';
import { DISABLED_OPACITY, space } from '../styles/tokens';
import { webDataSet } from '../styles/web-data';
import type { WebCssStyle } from '../styles/web-view-style';
import { useTheme } from '../theme/use-theme';
import type { ChoiceListProps } from './types';

/**
 * `ChoiceList`: a list of a few choices, one of them chosen, whose choice
 * decides what comes after it — the accounts of a login window, the profiles of
 * a player — each drawn by the caller (`renderContent`), the list owning the
 * keyboard and what a screen reader hears.
 *
 * As a Mac's login window chooses whose password it asks for, the list is ONE
 * keyboard stop, the chosen option: the arrows of its `orientation` (Home, End)
 * move the keyboard focus through the options without choosing, stopping at
 * the ends, and a press of the focused one (Space, Return) chooses it, the
 * chosen one too (`onValueChange` with the value it has: going on with it, as
 * Return on a Mac's chosen account goes to its password). Choosing
 * on every arrow would replace what follows the list under the keyboard at each
 * step (WAI-ARIA's manual activation).
 *
 * Native: a `list` of `listitem`s, the chosen one `selected`, so a screen reader
 * says each once with its place ("Ada, seleccionado, 1 de 3"); on a host that
 * gives Bloom the window's keys the arrows are the platform keyboard's
 * (`hooks/use-native-roving-group.ts`, `activation: 'manual'`). Web: a
 * `listbox` of `option`s, `aria-selected`, the same one stop and arrows
 * (`hooks/roving-focus.ts`); its keyboard focus draws a 2px accent outline 2px
 * off the option.
 */
const OPTION = '[data-bloom-choice-list-option]';
const LIST = '[data-bloom-choice-list]';

const CSS = interactiveWebCss({
  selector: OPTION,
  varPrefix: 'bloom-choice-list',
  reset: 'none',
  transition: 'none',
  disabled: { opacity: null },
});

const isChosen = (element: HTMLElement) => element.getAttribute('aria-selected') === 'true';

export function ChoiceList<Value extends string = string>({
  label,
  value,
  onValueChange,
  options,
  renderContent,
  orientation = 'horizontal',
  disabled = false,
  style,
  optionStyle,
  testID,
}: ChoiceListProps<Value>) {
  const theme = useTheme();
  const rtl = useIsRtl();
  const direction = useDirectionProps();
  const ringOffset = useRingOffsetStyle();
  useInteractiveWebCss('bloom-choice-list-web-css', CSS);
  const listRef = useRef<ComponentRef<typeof View> | null>(null);
  useRovingTabIndex(() => listRef.current as unknown as Element | null, OPTION, isChosen, LIST);
  const roving = useNativeRovingGroup<Value>({
    items: () => options.map((option) => ({ value: option.value, disabled: option.disabled })),
    value,
    select: onValueChange,
    orientation,
    homeEnd: true,
    wrap: false,
    rtl,
    disabled,
    activation: 'manual',
  });
  const onKeyDown = useCallback(
    (event: { key: string; currentTarget: unknown; preventDefault: () => void }) => {
      handleRovingKeyDown(event, {
        selector: OPTION,
        owner: LIST,
        orientation,
        homeEnd: true,
        activate: 'manual',
        wrap: false,
      });
    },
    [orientation],
  );
  const optionLook: WebCssStyle = {
    '--bloom-choice-list-ring': theme.colors.primary,
    ...ringOffset,
  };
  return (
    <View
      ref={listRef}
      {...direction}
      {...webDataSet({ bloomChoiceList: '' })}
      role="list"
      aria-label={label}
      accessibilityLabel={label}
      // On web a listbox of options, which react-native-web renders as written
      // (React Native's roles name no listbox, nor its `aria-orientation`).
      {...(IS_WEB
        ? ({ role: 'listbox', 'aria-orientation': orientation } as Record<string, unknown>)
        : {})}
      aria-disabled={disabled || undefined}
      // Never flattened away from its options (Fabric mounts the children of a
      // view that forms no stacking context in the one above): the list holds
      // its items, and each says its place in it.
      collapsable={false}
      testID={testID}
      style={[
        {
          flexDirection: orientation === 'horizontal' ? 'row' : 'column',
          gap: space.lg,
        },
        style,
      ]}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const optionDisabled = disabled || option.disabled === true;
        return (
          <Pressable
            key={option.value}
            {...roving.itemProps(option.value, optionDisabled)}
            {...webDataSet({ bloomChoiceListOption: '' })}
            role={IS_WEB ? 'option' : 'listitem'}
            accessibilityLabel={option.label}
            accessibilityState={{ selected, disabled: optionDisabled }}
            aria-selected={selected}
            aria-disabled={optionDisabled || undefined}
            disabled={optionDisabled}
            // The chosen one too: going on with it (a login window's Return on
            // the chosen account goes to its password).
            onPress={() => onValueChange(option.value)}
            // react-native-web's DOM key event; React Native's Pressable has none.
            {...(IS_WEB ? ({ onKeyDown } as Record<string, unknown>) : null)}
            testID={option.testID}
            style={[
              { alignItems: 'center', opacity: optionDisabled ? DISABLED_OPACITY : 1 },
              optionLook as object,
              optionStyle,
            ]}
          >
            {renderContent(option, { selected, disabled: optionDisabled })}
          </Pressable>
        );
      })}
    </View>
  );
}
