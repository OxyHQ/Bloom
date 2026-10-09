import { forwardRef, useCallback, useContext, useMemo, useRef } from 'react';
import { Platform, type TextInput } from 'react-native';

import { useFieldMembership } from '../field/membership';
import { TextFieldGroupContext } from '../text-field/TextField';
import { mergeRefs } from '../hooks/merge-refs';
import { FieldBox } from '../text-field/FieldBox';
import type { SearchProps } from './types';
import { useDirectionProps } from '../hooks/use-is-rtl';
import { useCommonMessages } from '../locale/common-messages';
import { useMessages } from '../locale/messages';
import { SEARCH_MESSAGES } from './messages';

import { useTheme } from '../theme/use-theme';
import { atoms as a } from '../styles';
import { borderRadius } from '../styles/tokens';
import { GlyphButton } from '../button';
import { TextField, TextFieldIcon, TextFieldInput } from '../text-field';
import { RiSearchLine as MagnifyingGlassIcon } from '../icons/remix/RiSearchLine';
import { RiCloseLine as X } from '../icons/remix/RiCloseLine';

export const Search = forwardRef<TextInput, SearchProps>(
  function Search({ value, label: labelProp, onClearText, onFocus, onPressIn, iconSize, clearButtonProps, disabled, style, fieldClassName, fieldChromeClassName, containerClassName, containerStyle, ...rest }, ref) {
    const theme = useTheme();
    const direction = useDirectionProps();
    const field = useFieldMembership({ disabled });
    const group = useContext(TextFieldGroupContext);
    const isDisabled = field.disabled || group?.disabled === true;
    const common = useCommonMessages();
    const { messages } = useMessages(SEARCH_MESSAGES);
    const label = labelProp ?? common.search;
    const showClear = value != null && value.length > 0;

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
    const inputRef = useRef<TextInput | null>(null);
    const refs = useMemo(() => mergeRefs([inputRef, ref]), [ref]);
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
        onFocus?.(event);
        const pressed = pressedRef.current;
        pressedRef.current = false;
        const length = valueRef.current?.length ?? 0;
        if (pressed && Platform.OS !== 'web' && length > 0) {
          inputRef.current?.setSelection(0, length);
        }
      },
      [onFocus],
    );

    return (
      <FieldBox {...direction} className={containerClassName} style={containerStyle} baseStyle={[a.w_full, a.relative]}>
        <TextField disabled={isDisabled} radius={borderRadius.full} className={fieldClassName} chromeClassName={fieldChromeClassName}>
          <TextFieldIcon icon={MagnifyingGlassIcon} size={iconSize} />
          <TextFieldInput
            inputRef={refs}
            label={label}
            value={value}
            placeholder={label}
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
          />
          {showClear && <GlyphButton
            size={28}
            icon={X}
            glyphSize={16}
            {...clearButtonProps}
            testID="searchTextInputClearBtn"
            onPress={onClearText}
            accessibilityLabel={messages.clearQuery}
            disabled={isDisabled}
            style={{ marginInlineStart: 8 }}
          />}
        </TextField>
      </FieldBox>
    );
  },
);
Search.displayName = 'Search';
