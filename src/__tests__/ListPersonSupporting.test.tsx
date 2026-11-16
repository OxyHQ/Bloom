import { render } from '@testing-library/react-native';
import { ListItem } from '../list';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

const hidden = { includeHiddenElements: true } as const;
it.each([1, 2, 3, 'adaptive'] as const)(
  'person supporting retains native text clamp %s without replacing the handle',
  (lines) => {
    const screen = render(
      <BloomThemeProvider>
        <ListItem
          person={{ name: 'Ana', subtitle: '@ana' }}
          supporting="Creative communities"
          supportingLines={lines}
          onPress={() => {}}
          testID="person"
        />
      </BloomThemeProvider>,
    );
    expect(screen.getByText('Ana', hidden).props.numberOfLines).toBe(1);
    expect(screen.getByText('@ana', hidden).props.numberOfLines).toBe(1);
    expect(screen.getByText('Creative communities', hidden).props.numberOfLines).toBe(
      lines === 'adaptive' ? 3 : lines,
    );
    expect(screen.getByTestId('person-link').props.accessibilityLabel).toBe(
      'Ana, @ana, Creative communities',
    );
  },
);
