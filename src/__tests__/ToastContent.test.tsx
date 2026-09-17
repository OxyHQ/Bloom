import React from 'react';
import { Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { ToastContent } from '../toast/ToastContent';
import type { ToastVariant } from '../toast/types';

const renderContent = (
  props: Partial<React.ComponentProps<typeof ToastContent>> = {},
) => {
  const onDismiss = jest.fn();
  const utils = render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <ToastContent
        id={1}
        title="Saved"
        unstyled={false}
        icons={{}}
        onDismiss={onDismiss}
        {...props}
      />
    </BloomThemeProvider>,
  );
  return { ...utils, onDismiss };
};

/**
 * `ReactTestInstance['type']` is `ElementType`, whose string arm is
 * `keyof JSX.IntrinsicElements` — so comparing it to a React Native host name
 * ('Pressable', 'Svg', …) is a type error. Normalise to a plain string instead of
 * asserting the type away.
 */
const hostName = (node: { type: unknown }): string =>
  typeof node.type === 'string' ? node.type : '';

/**
 * `*ByRole` does not resolve through this repo's `react-native` mock (it renders
 * primitives as bare host elements), so button assertions go by component type.
 */
const pressablesOf = ({ UNSAFE_root }: ReturnType<typeof renderContent>) =>
  UNSAFE_root.findAll((node) => hostName(node) === 'Pressable');

/** Bloom icons render as `Svg` hosts. */
const iconsOf = ({ UNSAFE_root }: ReturnType<typeof renderContent>) =>
  UNSAFE_root.findAll((node) => hostName(node) === 'Svg');

const spinnersOf = ({ UNSAFE_root }: ReturnType<typeof renderContent>) =>
  UNSAFE_root.findAll((node) => hostName(node) === 'ActivityIndicator');

describe('ToastContent', () => {
  it('renders the title', () => {
    const { getByText } = renderContent();
    expect(getByText('Saved')).toBeTruthy();
  });

  it('renders a description only when one is given', () => {
    expect(renderContent().queryByText('Details')).toBeNull();
    expect(
      renderContent({ description: 'Details' }).getByText('Details'),
    ).toBeTruthy();
  });

  it('renders an action button and calls onClick', () => {
    const onClick = jest.fn();
    const { getByText } = renderContent({
      action: { label: 'Undo', onClick },
    });

    fireEvent.press(getByText('Undo'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders an action supplied as a node instead of a label/onClick pair', () => {
    const { getByText } = renderContent({
      action: <Text>Custom action</Text>,
    });
    expect(getByText('Custom action')).toBeTruthy();
  });

  it('dismisses after running the cancel handler', () => {
    const onClick = jest.fn();
    const { getByText, onDismiss } = renderContent({
      cancel: { label: 'Dismiss', onClick },
    });

    fireEvent.press(getByText('Dismiss'));
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledWith(1);
  });

  it('shows no button row when there is neither action nor cancel', () => {
    expect(pressablesOf(renderContent())).toHaveLength(0);
  });

  it('renders the close button only when asked, and it dismisses', () => {
    expect(pressablesOf(renderContent({ dismissible: true }))).toHaveLength(0);

    const rendered = renderContent({ dismissible: true, closeButton: true });
    const [closeButton] = pressablesOf(rendered);
    expect(closeButton).toBeDefined();
    if (closeButton) {
      fireEvent.press(closeButton);
    }
    expect(rendered.onDismiss).toHaveBeenCalledWith(1);
  });

  it('never renders a close button on a non-dismissible toast', () => {
    expect(
      pressablesOf(renderContent({ dismissible: false, closeButton: true })),
    ).toHaveLength(0);
  });

  it('prefers a caller-supplied close node over the default button', () => {
    const { getByText } = renderContent({
      dismissible: true,
      closeButton: true,
      close: <Text>Bye</Text>,
    });
    expect(getByText('Bye')).toBeTruthy();
  });

  it('renders a variant icon, and none for a variant-less toast', () => {
    // A neutral toast has no leading icon at all.
    expect(iconsOf(renderContent({ variant: 'success' })).length).toBeGreaterThan(
      iconsOf(renderContent()).length,
    );
  });

  it.each<ToastVariant>(['success', 'error', 'warning', 'info'])(
    'renders an icon for the %s variant',
    (variant) => {
      expect(iconsOf(renderContent({ variant })).length).toBeGreaterThan(0);
    },
  );

  it('uses a spinner instead of an icon while a promise is pending', () => {
    const rendered = renderContent({
      promiseOptions: {
        promise: Promise.resolve('done'),
        loading: 'Saving…',
        error: 'Failed',
      },
    });
    expect(spinnersOf(rendered)).toHaveLength(1);
    expect(iconsOf(rendered)).toHaveLength(0);
  });

  it('lets the outlet override the loading indicator', () => {
    const { getByText } = renderContent({
      variant: 'loading',
      icons: { loading: <Text>spinning</Text> },
    });
    expect(getByText('spinning')).toBeTruthy();
  });

  it('lets the outlet override a variant icon', () => {
    const { getByText } = renderContent({
      variant: 'success',
      icons: { success: <Text>yay</Text> },
    });
    expect(getByText('yay')).toBeTruthy();
  });

  it('prefers a per-toast icon over the variant icon', () => {
    const { getByText } = renderContent({
      variant: 'success',
      icon: <Text>mine</Text>,
      icons: { success: <Text>yay</Text> },
    });
    expect(getByText('mine')).toBeTruthy();
  });

  it('applies caller style overrides to the title', () => {
    const { getByText } = renderContent({
      styles: { title: { fontSize: 99 } },
    });
    expect(getByText('Saved').props.style).toEqual(
      expect.arrayContaining([{ fontSize: 99 }]),
    );
  });

  describe('the notification card', () => {
    const flat = (style: unknown): Record<string, unknown> =>
      Array.isArray(style)
        ? Object.assign({}, ...style.map(flat))
        : style && typeof style === 'object'
          ? (style as Record<string, unknown>)
          : {};

    const discsOf = ({ UNSAFE_root }: ReturnType<typeof renderContent>) =>
      UNSAFE_root.findAll((n) => hostName(n) === 'View' && flat(n.props.style).width === 40);

    it('puts a variant glyph in a 40px status disc, and a plain toast has none', () => {
      expect(discsOf(renderContent({ variant: 'success' }))).toHaveLength(1);
      expect(discsOf(renderContent())).toHaveLength(0);
    });

    it('keeps the disc for the spinner and for a caller icon', () => {
      expect(discsOf(renderContent({ variant: 'loading' }))).toHaveLength(1);
      expect(discsOf(renderContent({ icon: <Text>mine</Text> }))).toHaveLength(1);
    });

    it('opens the 44px close lane only when the close button renders', () => {
      const surface = (r: ReturnType<typeof renderContent>) =>
        flat(
          r.UNSAFE_root.findAll((n) => hostName(n) === 'View' && flat(n.props.style).borderRadius === 16)[0]
            ?.props.style,
        );
      expect(surface(renderContent())).toMatchObject({ paddingLeft: 16, paddingRight: 16, borderWidth: 1 });
      expect(surface(renderContent({ dismissible: true, closeButton: true }))).toMatchObject({ paddingRight: 44 });
    });

    it('places the close button at top 12 / right 12 of the card', () => {
      const [close] = pressablesOf(
        renderContent({ dismissible: true, closeButton: true, description: 'More detail' }),
      );
      // Offsets are from the row, which sits inside the card's 16 / 44 padding.
      expect(flat(close?.props.style)).toMatchObject({ position: 'absolute', top: -4, right: -32, width: 20 });
    });

    it('centres a title-only toast: no empty band under the title, ✕ on the row centre', () => {
      const [close] = pressablesOf(renderContent({ dismissible: true, closeButton: true }));
      // No leading visual: the row is the title's 20px line, so the ✕ sits at 0.
      expect(flat(close?.props.style)).toMatchObject({ top: 0 });
      const [withIcon] = pressablesOf(
        renderContent({ dismissible: true, closeButton: true, variant: 'success' }),
      );
      // With the 40px disc: (40 − 20) / 2.
      expect(flat(withIcon?.props.style)).toMatchObject({ top: 10 });
    });
  });

  it('drops its own surface and text styling when unstyled', () => {
    const { getByText } = renderContent({ unstyled: true });
    // Only the (absent) override slot remains, so nothing carries a colour.
    expect(getByText('Saved').props.style).toEqual([
      undefined,
      undefined,
      undefined,
    ]);
  });
});
