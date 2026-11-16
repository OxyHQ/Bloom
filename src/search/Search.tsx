import { SearchTransition } from './SearchTransition';
import { useBloomAppearance } from '../appearance/context';
import {
  resolveButtonGeometry,
  BUTTON_TOUCH_TARGET,
  buttonTouchVisualInset,
} from '../button/shared';
import { RiArrowLeftLine } from '../icons/remix/RiArrowLeftLine';
import { useTouchInput } from '../styles/pointer';
import { useSearchPresentation } from './use-search-presentation';
import { StyledView } from '../styles/styled-primitives';
import {
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ComponentRef,
} from 'react';
import { Platform, StyleSheet, type TextInput } from 'react-native';

import { useFieldMembership } from '../field/membership';
import { TextFieldGroupContext } from '../text-field/TextField';
import { mergeRefs } from '../hooks/merge-refs';
import { FieldBox } from '../text-field/FieldBox';
import type { SearchProps } from './types';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { SEARCH_MESSAGES } from './messages';
import { SearchTokens } from './SearchTokens';
import { IS_WEB } from '../styles/platform';

import { useTheme } from '../theme/use-theme';
import { atoms as a } from '../styles';
import { borderRadius } from '../styles/tokens';
import { Button } from '../button';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { RiSearchLine as MagnifyingGlassIcon } from '../icons/remix/RiSearchLine';
import { RiCloseLine as X } from '../icons/remix/RiCloseLine';
import type { RefComponent } from '../styles/native-refs';

export const Search: RefComponent<SearchProps, ComponentRef<typeof TextInput>> = forwardRef<
  ComponentRef<typeof TextInput>,
  SearchProps
>(function Search(
  {
    value: valueProp,
    defaultValue,
    onValueChange,
    onChangeText,
    presentation = 'field',
    expandedMinWidth,
    open,
    defaultOpen,
    onOpenChange,
    clearOnClose,
    closeLabel,
    triggerProps,
    trailing,
    fieldStyle,
    label: labelProp,
    placeholder: placeholderProp,
    onClearText,
    tokens,
    onRemoveToken,
    onFocus,
    onBlur,
    onPressIn,
    onKeyPress,
    onSelectionChange,
    iconSize,
    clearButtonProps,
    disabled,
    style,
    fieldClassName,
    fieldChromeClassName,
    containerClassName,
    containerStyle,
    ...rest
  },
  ref,
) {
  const theme = useTheme();
  const touch = useTouchInput();
  const scope = useBloomAppearance(
    { size: typeof triggerProps?.size === 'number' ? undefined : triggerProps?.size },
    { size: 'md', tone: 'neutral' },
  );
  const triggerStyle = StyleSheet.flatten(triggerProps?.style);
  const triggerHeight = resolveButtonGeometry(
    typeof triggerProps?.size === 'number' ? triggerProps.size : scope.size,
  ).height;
  const visualHeight = Math.max(36, triggerHeight);
  const visualInset = buttonTouchVisualInset(visualHeight, touch);
  const height = Math.max(visualHeight + 2 * visualInset, touch ? BUTTON_TOUCH_TARGET : 0);
  const collapsedWidth =
    triggerStyle?.width === '100%'
      ? '100%'
      : Math.max(
          typeof triggerStyle?.width === 'number' ? triggerStyle.width : triggerHeight,
          touch ? BUTTON_TOUCH_TARGET : 0,
        );
  const [draft, setDraft] = useState(defaultValue);
  const value = valueProp ?? draft;
  const setValue = (next: string) => {
    setDraft(next);
    (onValueChange ?? onChangeText)?.(next);
  };
  const direction = useDirectionProps();
  const field = useFieldMembership({ disabled });
  const group = useContext(TextFieldGroupContext);
  const isDisabled = field.disabled || group?.disabled === true;
  const common = useCommonMessages();
  const { messages } = useMessages(SEARCH_MESSAGES);
  const label = labelProp ?? common.search;
  const hasTokens = tokens != null && tokens.length > 0;
  const showClear = (value != null && value.length > 0) || hasTokens;
  // A field with tokens shows no placeholder, as a Mac's does not: the tokens
  // already say what is being searched.
  const placeholder = hasTokens ? null : placeholderProp === undefined ? label : placeholderProp;

  // Select-on-focus, done here rather than through RN's `selectTextOnFocus`.
  // On Android that prop does not select on focus: it arms a one-shot flag and
  // calls `selectAll()` on the input's NEXT layout while focused. An
  // autofocused search lays out nothing after focusing until the first
  // keystroke mounts the clear button and pads the input for it — and that
  // layout selects everything, so the SECOND keystroke replaced the query.
  // Typing "mention" in one burst left "on" (OxyHQ/Mention#1126). Now a
  // press-driven focus selects the current query once, immediately, and a
  // programmatic focus (autoFocus, `ref.focus()`) selects nothing. Web never
  // selected on focus and still does not.
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const refs = useMemo(() => mergeRefs([inputRef, ref]), [ref]);
  const display = useSearchPresentation(
    {
      presentation,
      expandedMinWidth,
      open,
      defaultOpen,
      onOpenChange,
      value,
      tokens,
      clearOnClose,
      onClearText,
    },
    inputRef,
  );
  const pressedRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;
  const handlePressIn = useCallback<NonNullable<SearchProps['onPressIn']>>(
    (event) => {
      pressedRef.current = true;
      onPressIn?.(event);
    },
    [onPressIn],
  );
  const handleFocus = useCallback<NonNullable<SearchProps['onFocus']>>(
    (event) => {
      display.focus();
      onFocus?.(event);
      const pressed = pressedRef.current;
      pressedRef.current = false;
      const length = valueRef.current?.length ?? 0;
      if (pressed && Platform.OS !== 'web' && length > 0) {
        inputRef.current?.setSelection(0, length);
      }
    },
    [onFocus, display.focus],
  );

  // Backspace with the caret at the start of the text and nothing selected
  // removes the last token, as a Mac's search field does. Native reports the
  // selection only through `onSelectionChange`; the web reads it off the input
  // at the key itself. Never during an input method's composition: that
  // Backspace edits the composition.
  const selectionRef = useRef<{ start: number; end: number } | null>(null);
  const handleSelectionChange = useCallback<NonNullable<SearchProps['onSelectionChange']>>(
    (event) => {
      selectionRef.current = event.nativeEvent.selection;
      onSelectionChange?.(event);
    },
    [onSelectionChange],
  );
  const tokensRef = useRef(tokens);
  tokensRef.current = tokens;
  const handleKeyPress = useCallback<NonNullable<SearchProps['onKeyPress']>>(
    (event) => {
      onKeyPress?.(event);
      if (event.defaultPrevented) return;
      if (
        event.nativeEvent.key === 'Escape' &&
        display.collapsible &&
        !(event.nativeEvent as { isComposing?: boolean }).isComposing
      ) {
        event.preventDefault?.();
        event.stopPropagation?.();
        display.close();
        return;
      }
      const current = tokensRef.current;
      const last = current?.[current.length - 1];
      if (!last || !onRemoveToken) return;
      if (event.nativeEvent.key !== 'Backspace') return;
      if (caretAtStart(event, valueRef.current, selectionRef.current)) {
        onRemoveToken(last.key);
      }
    },
    [onKeyPress, onRemoveToken, display.collapsible, display.close],
  );

  const fieldContent = (
    <FieldBox
      {...direction}
      className={presentation === 'field' ? containerClassName : undefined}
      style={[presentation === 'field' ? containerStyle : undefined]}
      baseStyle={[a.w_full, a.relative]}
      onFocusCapture={presentation === 'field' ? undefined : display.focus}
      onBlurCapture={
        presentation === 'field'
          ? undefined
          : (event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) display.blur();
            }
      }
    >
      <TextField
        disabled={isDisabled}
        chromeInset={visualInset}
        style={
          StyleSheet.flatten([
            presentation !== 'field' && { height },
            touch && { minHeight: 44 },
            fieldStyle,
          ]) ?? undefined
        }
        radius={borderRadius.full}
        className={fieldClassName}
        chromeClassName={fieldChromeClassName}
        leadingAddon={
          display.collapsible ? (
            <Button
              appearance="plain"
              tone="neutral"
              icon={RiArrowLeftLine}
              size={28}
              accessibilityLabel={closeLabel ?? common.close}
              disabled={isDisabled}
              onPress={display.close}
              onFocus={display.focus}
              onBlur={IS_WEB ? undefined : display.blur}
            />
          ) : undefined
        }
      >
        {!display.collapsible && <TextFieldIcon icon={MagnifyingGlassIcon} size={iconSize} />}
        {hasTokens ? (
          <SearchTokens tokens={tokens} onRemoveToken={onRemoveToken} disabled={isDisabled} />
        ) : null}
        <TextFieldInput
          inputRef={refs}
          label={label}
          value={valueProp}
          defaultValue={defaultValue}
          onValueChange={setValue}
          placeholder={placeholder}
          returnKeyType="search"
          keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
          autoFocus={false}
          accessibilityRole="search"
          autoCorrect={false}
          autoComplete="off"
          autoCapitalize="none"
          {...rest}
          disabled={isDisabled}
          style={style}
          onPressIn={handlePressIn}
          onFocus={handleFocus}
          onBlur={(event) => {
            if (!IS_WEB) display.blur();
            onBlur?.(event);
          }}
          onKeyPress={
            tokens === undefined && presentation === 'field' ? onKeyPress : handleKeyPress
          }
          onSelectionChange={tokens === undefined ? onSelectionChange : handleSelectionChange}
        />
        {showClear && (
          <Button
            appearance="plain"
            tone="neutral"
            iconOnly
            size={28}
            icon={X}
            iconSize={16}
            {...clearButtonProps}
            testID="searchTextInputClearBtn"
            onPress={() => {
              onClearText?.();
              inputRef.current?.focus();
            }}
            onFocus={display.focus}
            onBlur={IS_WEB ? undefined : display.blur}
            accessibilityLabel={messages.clearQuery}
            disabled={isDisabled}
            style={{ marginInlineStart: 8 }}
          />
        )}
        {trailing}
      </TextField>
    </FieldBox>
  );
  if (presentation === 'field') return fieldContent;
  return (
    <StyledView
      className={containerClassName}
      style={[{ width: '100%', minWidth: 0 }, containerStyle]}
    >
      <SearchTransition
        expanded={display.expanded}
        collapsedWidth={collapsedWidth}
        height={height}
        align={triggerStyle?.alignSelf}
        onLayout={display.onLayout}
        trigger={
          <Button
            appearance="outline"
            tone="neutral"
            {...triggerProps}
            ref={display.trigger}
            icon={MagnifyingGlassIcon}
            accessibilityLabel={label}
            aria-expanded={display.expanded}
            disabled={isDisabled}
            onPress={display.show}
            style={[
              triggerProps?.style,
              {
                width: IS_WEB ? (triggerStyle?.width ?? triggerHeight) : '100%',
                height: IS_WEB ? visualHeight : height,
                justifyContent: 'flex-start',
                paddingLeft: Math.max(0, (height - (iconSize ?? 20)) / 2),
                paddingRight: Math.max(0, (height - (iconSize ?? 20)) / 2),
              },
            ]}
          />
        }
      >
        {fieldContent}
      </SearchTransition>
    </StyledView>
  );
});
Search.displayName = 'Search';

/**
 * Whether a Backspace finds the caret at the start of the text with nothing
 * selected. The web's key event is the DOM's: an input method's composition
 * (`isComposing`, or the 229 a browser gives the key that ends one) is never a
 * removal, and the input itself says where its caret is. Native has the
 * controlled text and the last `onSelectionChange`: empty text is the start,
 * and no selection reported yet is the caret at the end, where a field's text
 * puts it.
 */
function caretAtStart(
  event: Parameters<NonNullable<SearchProps['onKeyPress']>>[0],
  text: string | undefined,
  selection: { start: number; end: number } | null,
): boolean {
  const key = event.nativeEvent as { isComposing?: boolean; keyCode?: number };
  if (key.isComposing === true || key.keyCode === 229) return false;
  const input = (event as { target?: unknown }).target as
    | { selectionStart?: number | null; selectionEnd?: number | null }
    | undefined;
  if (IS_WEB && typeof input?.selectionStart === 'number') {
    return input.selectionStart === 0 && input.selectionEnd === 0;
  }
  if (text === '') return true;
  return selection != null && selection.start === 0 && selection.end === 0;
}
