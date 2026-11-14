import { fireEvent, render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  Select,
  SelectContent,
  SelectField,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectLabel,
  SelectSeparator,
  SelectItemText,
  SelectScrollDownButton,
  SelectScrollProvider,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
} from '../select';
import { SelectChevron } from '../select/shared';
import { borderRadius } from '../styles/tokens';
import { resolvedStyle } from './support/rendered-style';

const OPTION_GROUP_LABEL = 'Options';

function SelectSubject({
  outerScope,
  scope,
  explicit,
  portalled = false,
}: {
  outerScope?: 'xs' | 'sm' | 'md' | 'lg';
  scope?: 'xs' | 'sm' | 'md' | 'lg';
  explicit?: 'xs' | 'sm' | 'md' | 'lg';
  portalled?: boolean;
}) {
  const select = (
    <Select size={explicit}>
      <SelectTrigger label="Choose" testID="trigger">
        <SelectValue placeholder="Choose" />
        <SelectIcon />
      </SelectTrigger>
    </Select>
  );
  return (
    <BloomThemeProvider>
      <PortalProvider>
        {outerScope ? (
          <BloomScope size={outerScope}>
            {scope ? (
              <BloomScope size={scope}>{portalled ? <Portal>{select}</Portal> : select}</BloomScope>
            ) : portalled ? (
              <Portal>{select}</Portal>
            ) : (
              select
            )}
          </BloomScope>
        ) : scope ? (
          <BloomScope size={scope}>{portalled ? <Portal>{select}</Portal> : select}</BloomScope>
        ) : portalled ? (
          <Portal>{select}</Portal>
        ) : (
          select
        )}
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

function geometry(tree: ReturnType<typeof render>) {
  const trigger = tree.getByTestId('trigger');
  const field = trigger.findAll(
    (candidate) =>
      typeof candidate.type === 'string' &&
      resolvedStyle(candidate.props.style).borderRadius === borderRadius.full,
  )[0];
  if (!field) throw new Error('Select trigger field did not render');
  return {
    minHeight: resolvedStyle(field.props.style).minHeight,
    paddingTop: resolvedStyle(field.props.style).paddingTop,
    valueFontSize: resolvedStyle(tree.getByText('Choose').props.style).fontSize,
    iconSize: tree.UNSAFE_getByType(SelectChevron).props.size,
  };
}

it.each([
  {
    name: 'unscoped default',
    expected: { minHeight: 44, paddingTop: 7, valueFontSize: 14, iconSize: 18 },
  },
  {
    name: 'nearest xs through wrappers',
    scope: 'xs',
    expected: { minHeight: 44, paddingTop: 5, valueFontSize: 12, iconSize: 14 },
  },
  {
    name: 'nearest sm',
    scope: 'sm',
    expected: { minHeight: 44, paddingTop: 6, valueFontSize: 13, iconSize: 16 },
  },
  {
    name: 'nearest md',
    scope: 'md',
    expected: { minHeight: 44, paddingTop: 7, valueFontSize: 14, iconSize: 18 },
  },
  {
    name: 'nearest lg',
    scope: 'lg',
    expected: { minHeight: 44, paddingTop: 10, valueFontSize: 16, iconSize: 20 },
  },
  {
    name: 'nested lg over xs',
    outerScope: 'xs',
    scope: 'lg',
    expected: { minHeight: 44, paddingTop: 10, valueFontSize: 16, iconSize: 20 },
  },
  {
    name: 'actual portal with wrappers',
    scope: 'sm',
    portalled: true,
    expected: { minHeight: 44, paddingTop: 6, valueFontSize: 13, iconSize: 16 },
  },
  {
    name: 'explicit lg overrides xs',
    scope: 'xs',
    explicit: 'lg',
    expected: { minHeight: 44, paddingTop: 10, valueFontSize: 16, iconSize: 20 },
  },
] as const)(
  '$name resolves Select trigger size on native',
  ({ outerScope, scope, explicit, portalled, expected }) => {
    const tree = render(
      <SelectSubject
        outerScope={outerScope}
        scope={scope}
        explicit={explicit}
        portalled={portalled}
      />,
    );
    expect(geometry(tree)).toEqual(expected);
    tree.unmount();
  },
);

it('keeps SelectContent option density independent from the trigger size on native', () => {
  const tree = render(
    <BloomThemeProvider>
      <BloomScope size="xs">
        <Select size="lg" value="one">
          <SelectTrigger label="Choose" testID="content-trigger">
            <SelectValue placeholder="Choose" />
          </SelectTrigger>
          <SelectContent
            size="sm"
            items={[{ value: 'one', label: 'One' }]}
            renderItem={(item) => (
              <>
                <SelectGroup>
                  <SelectLabel>{OPTION_GROUP_LABEL}</SelectLabel>
                </SelectGroup>
                <SelectItem value={item.value} label={item.label}>
                  <SelectItemIndicator />
                  <SelectItemText>{item.label}</SelectItemText>
                </SelectItem>
                <SelectSeparator />
              </>
            )}
          />
        </Select>
      </BloomScope>
    </BloomThemeProvider>,
  );
  fireEvent.press(tree.getByLabelText('Choose'));
  expect(tree.getAllByText('One').map((text) => resolvedStyle(text.props.style).fontSize)).toEqual([
    16, 13,
  ]);
  expect(resolvedStyle(tree.getByText('Options').props.style).fontSize).toBe(12);
  expect(tree.UNSAFE_getByProps({ role: 'group' })).toBeTruthy();
  expect(tree.UNSAFE_getByType(SelectSeparator)).toBeTruthy();
  tree.unmount();
});

it('keeps custom Select scroll affordances fixed under compact and large scopes on native', () => {
  const draw = (size: 'xs' | 'lg') =>
    render(
      <BloomThemeProvider>
        <BloomScope size={size}>
          <SelectScrollProvider
            value={{ canScrollUp: true, canScrollDown: true, scrollBy: () => {} }}
          >
            <SelectScrollUpButton />
            <SelectScrollDownButton />
          </SelectScrollProvider>
        </BloomScope>
      </BloomThemeProvider>,
    );
  const read = (tree: ReturnType<typeof render>) =>
    ['Scroll up', 'Scroll down'].map(
      (label) =>
        tree
          .getByLabelText(label)
          .findAll((node) => node.props.width === 16 && node.props.height === 16).length,
    );
  const compact = draw('xs');
  const compactSizes = read(compact);
  compact.unmount();
  const large = draw('lg');
  expect(read(large)).toEqual(compactSizes);
  expect(compactSizes.every((size) => size > 0)).toBe(true);
  large.unmount();
});

it('delegates SelectField size to the Select trigger on native', () => {
  const tree = render(
    <BloomThemeProvider>
      <SelectField
        label="Mode"
        placeholder="Choose"
        size="xs"
        testID="field-trigger"
        items={[{ value: 'light', label: 'Light' }]}
      />
    </BloomThemeProvider>,
  );
  const trigger = tree.getByTestId('field-trigger');
  const field = trigger.findAll(
    (candidate) =>
      typeof candidate.type === 'string' &&
      resolvedStyle(candidate.props.style).borderRadius === borderRadius.full,
  )[0];
  if (!field) throw new Error('SelectField trigger field did not render');
  expect(resolvedStyle(field.props.style)).toMatchObject({ minHeight: 44, paddingTop: 5 });
  expect(resolvedStyle(tree.getByText('Choose').props.style).fontSize).toBe(12);
  tree.unmount();
});
