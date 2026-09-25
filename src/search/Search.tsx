import { forwardRef, useCallback, useMemo, useRef } from 'react';
import { Platform, type TextInput, View } from 'react-native';

import { mergeRefs } from '../hooks/merge-refs';

import { useTheme } from '../theme/use-theme';
import { atoms as a } from '../styles';
import { borderRadius } from '../styles/tokens';
import { GlyphButton } from '../button';
import { TextField, TextFieldIcon, TextFieldInput, type TextFieldInputProps } from '../text-field';
import { RiSearchLine as MagnifyingGlassIcon } from '../icons/remix/RiSearchLine';
import { RiCloseLine as X } from '../icons/remix/RiCloseLine';

type SearchProps = Omit<TextFieldInputProps, 'label'> & {
  label?: TextFieldInputProps['label'];
  /**
   * Called when the user presses the clear (X) button.
   */
  onClearText?: () => void;
};

export const Search = forwardRef<TextInput, SearchProps>(
  function Search({ value, label = 'Search', onClearText, onFocus, onPressIn, ...rest }, ref) {
    const theme = useTheme();
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
      <View style={[a.w_full, a.relative]}>
        <TextField radius={borderRadius.full}>
          <TextFieldIcon icon={MagnifyingGlassIcon} />
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
            style={showClear ? { paddingRight: 24 } : undefined}
            {...rest}
            onPressIn={handlePressIn}
            onFocus={handleFocus}
          />
        </TextField>

        {showClear && (
          <View
            style={[
              a.absolute,
              a.z_20,
              a.my_auto,
              a.inset_0,
              a.justify_center,
              a.pr_sm,
              { left: 'auto' },
            ]}>
            {/* Neutral and transparent. `variant="ghost"` painted an accent
                wash inside the field, which read as a state the field was not
                in. */}
            <GlyphButton
              testID="searchTextInputClearBtn"
              onPress={onClearText}
              accessibilityLabel="Clear search query"
              size={28}
              icon={X}
              glyphSize={16}
            />
          </View>
        )}
      </View>
    );
  },
);
Search.displayName = 'Search';
