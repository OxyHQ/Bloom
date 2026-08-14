import { forwardRef } from 'react';
import { Platform, type TextInput, View } from 'react-native';

import { useTheme } from '../theme/use-theme';
import { atoms as a } from '../styles';
import { borderRadius } from '../styles/tokens';
import { Button } from '../button';
import { TextField, TextFieldIcon, TextFieldInput, type TextFieldInputProps } from '../text-field';
import { MagnifyingGlass_Stroke2_Corner0_Rounded as MagnifyingGlassIcon } from '../icons/MagnifyingGlass';
import { TimesLarge_Stroke2_Corner0_Rounded as X } from '../icons/Times';

type SearchProps = Omit<TextFieldInputProps, 'label'> & {
  label?: TextFieldInputProps['label'];
  /**
   * Called when the user presses the clear (X) button.
   */
  onClearText?: () => void;
};

export const Search = forwardRef<TextInput, SearchProps>(
  function Search({ value, label = 'Search', onClearText, ...rest }, ref) {
    const theme = useTheme();
    const showClear = value != null && value.length > 0;

    return (
      <View style={[a.w_full, a.relative]}>
        <TextField radius={borderRadius.full}>
          <TextFieldIcon icon={MagnifyingGlassIcon} />
          <TextFieldInput
            inputRef={ref}
            label={label}
            value={value}
            placeholder={label}
            returnKeyType="search"
            keyboardAppearance={theme.mode === 'light' ? 'light' : 'dark'}
            selectTextOnFocus={Platform.OS !== 'web'}
            autoFocus={false}
            accessibilityRole="search"
            autoCorrect={false}
            autoComplete="off"
            autoCapitalize="none"
            style={showClear ? { paddingRight: 24 } : undefined}
            {...rest}
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
            <Button
              testID="searchTextInputClearBtn"
              onPress={onClearText}
              accessibilityLabel="Clear search query"
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              variant="ghost"
              size="small"
              icon={<X fill={theme.colors.textSecondary} size="xs" />}
              style={{ padding: 4, minHeight: 0 }}
            />
          </View>
        )}
      </View>
    );
  },
);
Search.displayName = 'Search';
