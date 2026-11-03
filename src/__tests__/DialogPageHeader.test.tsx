import { StyleSheet } from 'react-native';
import { act, fireEvent, render, within } from '@testing-library/react-native';
import {
  DialogLargeTitle,
  DialogNavHeader,
  useDialogHeaderController,
} from '../dialog/DialogHeader';
import type { DialogHeaderConfig } from '../dialog/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RiSearchLine } from '../icons/remix/RiSearchLine';
import { TopEdgeProvider, useTopEdgeInset } from '../layout/top-edge';

function Harness({ header, onDismiss }: { header: DialogHeaderConfig; onDismiss: () => void }) {
  const controller = useDialogHeaderController();
  return <DialogNavHeader controller={controller} header={header} onDismiss={onDismiss} />;
}

it('renders grouped actions through PageHeader and preserves close and action callbacks', () => {
  const onDismiss = jest.fn();
  const onPress = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <Harness
        header={{
          title: 'Account',
          actions: [{ icon: RiSearchLine, accessibilityLabel: 'Find', onPress }],
        }}
        onDismiss={onDismiss}
      />
    </BloomThemeProvider>,
  );
  expect(screen.getByTestId('dialog-nav')).toBeTruthy();
  expect(screen.getByTestId('dialog-nav-action-group')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Find'));
  fireEvent.press(screen.getByLabelText('Close'));
  expect(onPress).toHaveBeenCalledTimes(1);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('isolates the dialog header from its enclosing page top edge', () => {
  let pageInset = -1;
  function Probe() {
    pageInset = useTopEdgeInset();
    return null;
  }
  render(
    <BloomThemeProvider>
      <TopEdgeProvider>
        <Harness header={{ title: 'Account' }} onDismiss={() => {}} />
        <Probe />
      </TopEdgeProvider>
    </BloomThemeProvider>,
  );
  expect(pageInset).toBe(0);
});

it('uses the shared floating back island and a material group for close', () => {
  const onBack = jest.fn();
  const onDismiss = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <Harness header={{ title: 'Account', onBack }} onDismiss={onDismiss} />
    </BloomThemeProvider>,
  );
  expect(screen.getByTestId('dialog-nav-back-island')).toBeTruthy();
  expect(screen.getByTestId('dialog-nav-close-group')).toBeTruthy();
  expect(screen.getByTestId('dialog-nav-scrim-gradient')).toBeTruthy();
  fireEvent.press(screen.getByLabelText('Go back'));
  fireEvent.press(screen.getByLabelText('Close'));
  expect(onBack).toHaveBeenCalledTimes(1);
  expect(onDismiss).toHaveBeenCalledTimes(1);
});

it('preserves custom leading content and hides absent navigation affordances', () => {
  const screen = render(
    <BloomThemeProvider>
      <Harness
        header={{ title: 'Account', left: <RiSearchLine />, onBack: jest.fn(), showClose: false }}
        onDismiss={jest.fn()}
      />
    </BloomThemeProvider>,
  );
  expect(screen.queryByTestId('dialog-nav-back-island')).toBeNull();
  expect(screen.queryByTestId('dialog-nav-close-group')).toBeNull();
  screen.rerender(
    <BloomThemeProvider>
      <Harness header={{ title: 'Account' }} onDismiss={jest.fn()} />
    </BloomThemeProvider>,
  );
  expect(screen.queryByTestId('dialog-nav-back-island')).toBeNull();
  expect(screen.getByTestId('dialog-nav-close-group')).toBeTruthy();
});

it('keeps actions and close together beside back and the independent primary action', () => {
  const onDismiss = jest.fn();
  const onBack = jest.fn();
  const onSearch = jest.fn();
  const onSave = jest.fn();
  const screen = render(
    <BloomThemeProvider>
      <Harness
        header={{
          title: 'Followers',
          onBack,
          actions: [
            { icon: RiSearchLine, accessibilityLabel: 'Search followers', onPress: onSearch },
          ],
          primaryAction: { label: 'Save', onPress: onSave },
        }}
        onDismiss={onDismiss}
      />
    </BloomThemeProvider>,
  );
  const group = within(screen.getByTestId('dialog-nav-action-group'));
  fireEvent.press(group.getByLabelText('Search followers'));
  fireEvent.press(group.getByLabelText('Close'));
  expect(group.queryByLabelText('Save')).toBeNull();
  expect(group.queryByLabelText('Go back')).toBeNull();
  fireEvent.press(screen.getByLabelText('Go back'));
  fireEvent.press(screen.getByLabelText('Save'));
  for (const callback of [onDismiss, onBack, onSearch, onSave])
    expect(callback).toHaveBeenCalledTimes(1);
  expect(screen.getAllByLabelText('Close')).toHaveLength(1);
});

it('honors hidden close and custom right while retaining the back island', () => {
  const header = {
    title: 'Followers',
    onBack: jest.fn(),
    showClose: false,
    actions: [{ icon: RiSearchLine, accessibilityLabel: 'Search followers', onPress: jest.fn() }],
  };
  const screen = render(
    <BloomThemeProvider>
      <Harness header={header} onDismiss={jest.fn()} />
    </BloomThemeProvider>,
  );
  expect(screen.queryByLabelText('Close')).toBeNull();
  expect(screen.getByLabelText('Search followers')).toBeTruthy();
  screen.rerender(
    <BloomThemeProvider>
      <Harness
        header={{ ...header, showClose: true, right: <RiSearchLine /> }}
        onDismiss={jest.fn()}
      />
    </BloomThemeProvider>,
  );
  expect(screen.queryByLabelText('Close')).toBeNull();
  expect(screen.queryByTestId('dialog-nav-action-group')).toBeNull();
  expect(screen.getByTestId('dialog-nav-back-island')).toBeTruthy();
});

it('keeps close visible when icon actions overflow', () => {
  const screen = render(
    <BloomThemeProvider>
      <Harness
        header={{
          title: 'Followers',
          actions: Array.from({ length: 4 }, (_, index) => ({
            icon: RiSearchLine,
            accessibilityLabel: `Action ${index}`,
            onPress: jest.fn(),
          })),
        }}
        onDismiss={jest.fn()}
      />
    </BloomThemeProvider>,
  );
  const group = within(screen.getByTestId('dialog-nav-action-group'));
  expect(group.getByLabelText('Close')).toBeTruthy();
  expect(group.getByLabelText('More')).toBeTruthy();
  expect(group.queryByLabelText('Action 3')).toBeNull();
});

it('starts a custom hero with its navigation title and scrim hidden', () => {
  const screen = render(
    <BloomThemeProvider>
      <Harness header={{ title: 'Offer', titleLayout: 'hero' }} onDismiss={jest.fn()} />
    </BloomThemeProvider>,
  );
  const title = screen.getByTestId('dialog-nav-title-block', { includeHiddenElements: true });
  expect(StyleSheet.flatten(title.props.style).opacity).toBe(0);
  expect(StyleSheet.flatten(screen.getByTestId('dialog-nav-scrim').props.style).opacity).toBe(0);
});

it('reveals the opted-in nav title only after the measured heading leaves and hides it again at the top', () => {
  let controller: ReturnType<typeof useDialogHeaderController> | undefined;
  const header: DialogHeaderConfig = {
    title: 'Payment methods',
    largeTitleAlign: 'center',
    largeTitleVariant: 'title-2-semibold',
    titleReveal: 'afterTitle',
    largeTitle: true,
  };
  function Measured() {
    controller = useDialogHeaderController();
    return (
      <>
        <DialogNavHeader controller={controller} header={header} onDismiss={() => {}} />
        <DialogLargeTitle controller={controller} header={header} />
      </>
    );
  }
  const draw = () => (
    <BloomThemeProvider>
      <Measured />
    </BloomThemeProvider>
  );
  const screen = render(draw());
  expect(StyleSheet.flatten(screen.getByText('Payment methods').props.style)).toMatchObject({
    textAlign: 'center',
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '600',
  });
  const opacity = () =>
    StyleSheet.flatten(
      screen.getByTestId('dialog-nav-title-block', { includeHiddenElements: true }).props.style,
    ).opacity;
  expect(opacity()).toBe(0);
  fireEvent(screen.getByTestId('dialog-large-title'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 76, width: 300, height: 150 } },
  });
  fireEvent(screen.getByTestId('dialog-heading-anchor'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 76 } },
  });
  // The heading is two lines. Subtitle/extras below it must not delay reveal.
  for (const [scroll, expected] of [
    [151, 0],
    [153, 1],
    [0, 0],
  ]) {
    act(() => {
      if (controller) controller.scrollY.value = scroll as number;
    });
    screen.rerender(draw());
    expect(opacity()).toBe(expected);
  }
  // A new, taller measured heading moves the threshold without a guessed offset.
  fireEvent(screen.getByTestId('dialog-heading-anchor'), 'layout', {
    nativeEvent: { layout: { x: 0, y: 0, width: 300, height: 114 } },
  });
  act(() => {
    if (controller) controller.scrollY.value = 153;
  });
  screen.rerender(draw());
  expect(opacity()).toBe(0);
});
