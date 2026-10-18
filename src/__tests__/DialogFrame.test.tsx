import React, { useEffect } from 'react';
import { Text, StyleSheet } from 'react-native';
import { Text as BloomText } from '../typography';
import { useDialogFrame } from '../dialog/DialogMorph';
import { act, render } from '@testing-library/react-native';
import { Dialog, useDialogControl } from '../dialog';
import { useTheme } from '../theme/use-theme';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import type { DialogScreenFrame } from '../dialog/types';
import { DialogFrameContent } from '../dialog/DialogFrameContent';
import { DialogMorphContent, useDialogMorph } from '../dialog/DialogMorph';

it('activates the shared header from a frame and preserves content state on navigation', () => {
  let control: ReturnType<typeof useDialogControl>;
  let mounts = 0;
  function Body() {
    useEffect(() => {
      mounts += 1;
    }, []);
    return <Text>Stateful body</Text>;
  }
  function Harness({ frame }: { frame: DialogScreenFrame }) {
    control = useDialogControl();
    return (
      <BloomThemeProvider mode="light">
        <Dialog control={control} placement="bottom" frame={frame}>
          <Body />
        </Dialog>
      </BloomThemeProvider>
    );
  }
  const draw = render(<Harness frame={{ key: 'first', header: { title: 'First screen' } }} />);
  act(() => control.open());
  expect(draw.getAllByText('First screen').length).toBeGreaterThan(0);
  const initialMounts = mounts;
  draw.rerender(<Harness frame={{ key: 'second', header: { title: 'Second screen' } }} />);
  expect(draw.getAllByText('Second screen').length).toBeGreaterThan(0);
  expect(draw.queryByText('First screen')).toBeNull();
  expect(mounts).toBe(initialMounts);
});

it('declares frame changes to the morph channel without changing the React host', () => {
  let channel: ReturnType<typeof useDialogMorph>['channel'];
  function Harness({ frame }: { frame: DialogScreenFrame }) {
    const morph = useDialogMorph({ enabled: true, measurable: true, maxHeight: 800 });
    channel = morph.channel;
    return (
      <DialogMorphContent morph={morph}>
        <DialogFrameContent frame={frame}>
          <Text>Body</Text>
        </DialogFrameContent>
      </DialogMorphContent>
    );
  }
  const draw = render(<Harness frame={{ key: 'first' }} />);
  const setFrame = jest.spyOn(channel!, 'setFrame');
  draw.rerender(<Harness frame={{ key: 'second', size: { height: 400, maxWidth: 600 } }} />);
  expect(setFrame).toHaveBeenCalledWith({
    key: 'second',
    morph: undefined,
    size: { height: 400, maxWidth: 600 },
  });
  setFrame.mockClear();
  draw.rerender(<Harness frame={{ key: 'second', size: { height: 400, maxWidth: 600 } }} />);
  expect(setFrame).not.toHaveBeenCalled();
});

it('scopes the whole dialog to the active frame palette and restores it without remounting', () => {
  let control: ReturnType<typeof useDialogControl>;
  let mounts = 0;
  let observed = '';
  function Body() {
    const theme = useTheme();
    observed = theme.colors.primary;
    useEffect(() => {
      mounts += 1;
    }, []);
    return <Text>Body</Text>;
  }
  function Harness({ frame }: { frame: DialogScreenFrame }) {
    control = useDialogControl();
    return (
      <BloomThemeProvider colorPreset="purple">
        <Dialog control={control} placement="bottom" frame={frame}>
          <Body />
        </Dialog>
      </BloomThemeProvider>
    );
  }
  const screen = render(<Harness frame={{ key: 'root', header: { title: 'Root' } }} />);
  act(() => control.open());
  const original = observed;
  const originalMounts = mounts;
  screen.rerender(
    <Harness
      frame={{ key: 'offer', colorPreset: 'blue', header: { title: 'Offer', titleLayout: 'hero' } }}
    />,
  );
  expect(observed).not.toBe(original);
  expect(screen.queryByTestId('dialog-large-title-inset')).toBeNull();
  expect(screen.queryByTestId('dialog-large-title')).toBeNull();
  screen.rerender(<Harness frame={{ key: 'root', header: { title: 'Root' } }} />);
  expect(observed).toBe(original);
  expect(mounts).toBe(originalMounts);
});

it('applies runtime frame appearance to body and header, restores it, and keeps state mounted', () => {
  let control: ReturnType<typeof useDialogControl>;
  let mounts = 0;
  function Body({ offer }: { offer: boolean }) {
    useDialogFrame({
      key: offer ? 'offer' : 'root',
      colorPreset: offer ? 'blue' : undefined,
      typography: offer ? 'system' : undefined,
    });
    useEffect(() => {
      mounts += 1;
    }, []);
    return <BloomText testID="appearance-body">Content</BloomText>;
  }
  function Harness({ offer }: { offer: boolean }) {
    control = useDialogControl();
    return (
      <BloomThemeProvider colorPreset="purple">
        <Dialog control={control} placement="bottom" header={{ title: 'Panel', largeTitle: false }}>
          <Body offer={offer} />
        </Dialog>
      </BloomThemeProvider>
    );
  }
  const screen = render(<Harness offer={false} />);
  act(() => control.open());
  const bodyBefore = StyleSheet.flatten(screen.getByTestId('appearance-body').props.style);
  const headerBefore = StyleSheet.flatten(screen.getByTestId('dialog-nav-title').props.style);
  const initialMounts = mounts;
  screen.rerender(<Harness offer />);
  const body = StyleSheet.flatten(screen.getByTestId('appearance-body').props.style);
  const header = StyleSheet.flatten(screen.getByTestId('dialog-nav-title').props.style);
  expect(body.fontFamily).not.toBe(bodyBefore.fontFamily);
  expect(header.fontFamily).toBe(body.fontFamily);
  expect(body.color).not.toBe(bodyBefore.color);
  expect(header.color).not.toBe(headerBefore.color);
  screen.rerender(<Harness offer={false} />);
  expect(StyleSheet.flatten(screen.getByTestId('appearance-body').props.style).fontFamily).toBe(
    bodyBefore.fontFamily,
  );
  expect(StyleSheet.flatten(screen.getByTestId('dialog-nav-title').props.style).color).toBe(
    headerBefore.color,
  );
  expect(mounts).toBe(initialMounts);
});
