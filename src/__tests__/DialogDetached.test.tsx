import type React from 'react';
import { useState } from 'react';
import { Text, TextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { Dialog, useDialogFrame } from '../dialog';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

jest.mock('react-native-safe-area-context', () => ({
  ...jest.requireActual('../../__mocks__/react-native-safe-area-context'),
  useSafeAreaInsets: () => ({ top: 24, bottom: 12, left: 0, right: 0 }),
}));

const wrapper = ({ children }: React.PropsWithChildren) => (
  <BloomThemeProvider fonts={false}>{children}</BloomThemeProvider>
);
const panel = (tree: unknown) =>
  resolvedStyle(
    hostNodes(tree).find((node) => {
      const style = resolvedStyle(node.props.style);
      return style.position === 'absolute' && style.maxWidth === 540;
    })?.props.style,
  );

it('keeps the flush default inset and gives detached dialogs one safe-area gap', () => {
  const draw = (detached?: boolean) => (
    <Dialog open placement="bottom" detached={detached} panelStyle={{ maxWidth: 540 }}>
      <Text>Payment</Text>
    </Dialog>
  );
  const view = render(draw(), { wrapper });
  expect(view.getByTestId('dialog-sheet-safe-area')).toBeTruthy();
  expect(panel(view.toJSON()).marginBottom).toBe(0);
  view.rerender(draw(true));
  expect(view.queryByTestId('dialog-sheet-safe-area')).toBeNull();
  expect(panel(view.toJSON())).toMatchObject({ marginBottom: 28, borderRadius: 28 });
});

function Frame({ step }: { step: string }) {
  useDialogFrame({ key: step, direction: 'forward' });
  const [draft, setDraft] = useState('');
  return (
    <>
      <Text>{step}</Text>
      <TextInput testID="draft" value={draft} onChangeText={setDraft} />
    </>
  );
}

it('retains the detached surface and input while the public frame changes', () => {
  const draw = (step: string) => (
    <Dialog open placement="bottom" detached panelStyle={{ maxWidth: 540 }}>
      <Frame step={step} />
    </Dialog>
  );
  const view = render(draw('review'), { wrapper });
  fireEvent.changeText(view.getByTestId('draft'), 'Keep me');
  view.rerender(draw('method'));
  expect(view.getByText('method')).toBeTruthy();
  expect(view.getByTestId('draft').props.value).toBe('Keep me');
  expect(view.getByTestId('bloom-dialog-frame-content')).toBeTruthy();
  expect(panel(view.toJSON()).marginBottom).toBe(28);
});

it.each(['bottom', 'center', 'left'] as const)(
  'keeps a fixed footer outside the %s scroll body',
  (placement) => {
    const view = render(
      <Dialog open placement={placement} detached footer={<Text>Fixed footer</Text>}>
        <Text>Scrolling body</Text>
      </Dialog>,
      { wrapper },
    );
    let ancestor = view.getByText('Fixed footer').parent;
    while (ancestor) {
      expect(ancestor.type).not.toBe('Animated.ScrollView');
      ancestor = ancestor.parent;
    }
    expect(view.getByText('Scrolling body')).toBeTruthy();
  },
);

it('clips the header to the detached surface corners without clipping the shadow host', () => {
  const view = render(
    <Dialog
      open
      placement="bottom"
      detached
      header={{ title: 'Payment', largeTitle: false }}
      panelStyle={{ maxWidth: 540 }}
    >
      <Text>Body</Text>
    </Dialog>,
    { wrapper },
  );
  const clip = view.getByTestId('bloom-sheet-header-clip');
  expect(resolvedStyle(clip.props.style)).toMatchObject({
    position: 'absolute',
    overflow: 'hidden',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  });
  expect(clip.props.pointerEvents).toBe('box-none');
  expect(panel(view.toJSON()).overflow).not.toBe('hidden');
});
