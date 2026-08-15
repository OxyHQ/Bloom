import React from 'react';
import { Image, Linking } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { LinkPreviewCard } from '../link-preview';
import { pressHost } from './support/press-host';
import { classNamesOn, resolvedStyle } from './support/rendered-style';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('LinkPreviewCard', () => {
  it('renders the site name, title and description', () => {
    const { getByText } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com/article"
        siteName="Example"
        title="A great article"
        description="The summary of the article."
      />,
    );
    expect(getByText('Example')).toBeTruthy();
    expect(getByText('A great article')).toBeTruthy();
    expect(getByText('The summary of the article.')).toBeTruthy();
  });

  it('falls back to the URL hostname for the title and site name', () => {
    const { getAllByText } = renderWithTheme(
      <LinkPreviewCard url="https://www.example.com/path" />,
    );
    // `www.` is stripped; the bare hostname is used for both the site name line
    // and the title fallback.
    expect(getAllByText('example.com').length).toBe(2);
  });

  it('calls the supplied onPress handler', () => {
    const onPress = jest.fn();
    const { getByLabelText } = renderWithTheme(
      <LinkPreviewCard url="https://example.com" title="Pressable" onPress={onPress} />,
    );
    // Through `pressHost`: a bare `fireEvent.press` walks up past the card to
    // `<LinkPreviewCard onPress={…}>` in this file's own JSX, so the call it
    // reports says nothing about what the component wired.
    pressHost(getByLabelText('Pressable'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('opens the URL via Linking when no onPress is supplied', () => {
    const openURL = jest
      .spyOn(Linking, 'openURL')
      .mockResolvedValue(undefined);
    const { getByLabelText } = renderWithTheme(
      <LinkPreviewCard url="https://example.com/open" title="Open me" />,
    );
    fireEvent.press(getByLabelText('Open me'));
    expect(openURL).toHaveBeenCalledWith('https://example.com/open');
    openURL.mockRestore();
  });

  it('gives the cover image a fixed height by default (coverFill omitted)', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com"
        title="Fixed"
        image="https://cdn.example.com/og.png"
      />,
    );
    // Flattened: the cover goes through `styled()`, so its `style` arrives as
    // an array with the class descriptor merged in rather than one object.
    const imageStyle = resolvedStyle(UNSAFE_getByType(Image).props.style);
    expect(imageStyle.height).toBe(160);
    expect(imageStyle.flex).toBeUndefined();
  });

  it('flexes the cover image (no fixed height) when coverFill is true', () => {
    const { UNSAFE_getByType } = renderWithTheme(
      <LinkPreviewCard
        url="https://example.com"
        title="Fill"
        image="https://cdn.example.com/og.png"
        coverFill
        style={{ height: 180 }}
      />,
    );
    // Flattened: the cover goes through `styled()`, so its `style` arrives as
    // an array with the class descriptor merged in rather than one object.
    const imageStyle = resolvedStyle(UNSAFE_getByType(Image).props.style);
    expect(imageStyle.flex).toBe(1);
    expect(imageStyle.height).toBeUndefined();
  });

  /**
   * The text block's geometry and type are INLINE, never a class string.
   *
   * This is the one half of the "className layout is inert on web" hazard a jest
   * suite can gate. It cannot tell whether a class resolves to CSS — but it can
   * tell that no class is being relied on in the first place, and that every
   * value the card needs actually reaches the node. The card shipped with the
   * whole block as classes (`p-3`, `text-xs`, `mt-1`, `text-muted-foreground`),
   * which rendered as three identical unstyled lines flush against the border in
   * any consumer without a Tailwind pipeline — Storybook included.
   */
  describe('the text block resolves its own type and spacing', () => {
    /**
     * The `View` the three lines sit in. RN's `Text` is a `forwardRef`
     * composite, so its host parent is one level further up than `.parent`
     * suggests — asserting on the composite reads `undefined` for every style
     * key and would pass whatever the block is padded with.
     */
    function contentBlock(text: { parent: { parent: { props: Record<string, unknown> } | null } | null }) {
      const block = text.parent?.parent;
      if (!block || block.props.style === undefined) {
        throw new Error('no host content block above the site-name line');
      }
      return block;
    }

    function renderCard() {
      return renderWithTheme(
        <LinkPreviewCard
          url="https://example.com/article"
          siteName="Example"
          title="A great article"
          description="The summary of the article."
        />,
      );
    }

    it('pads the content block on all four sides', () => {
      const { getByText } = renderCard();
      expect(resolvedStyle(contentBlock(getByText('Example')).props.style).padding).toBe(12);
    });

    it('sets the site name to 12/16 medium uppercase in the secondary colour', () => {
      const { getByText } = renderCard();
      const style = resolvedStyle(getByText('Example').props.style);
      expect(style.fontSize).toBe(12);
      expect(style.lineHeight).toBe(16);
      expect(style.fontWeight).toBe('500');
      expect(style.textTransform).toBe('uppercase');
      expect(style.letterSpacing).toBeCloseTo(0.3, 5);
    });

    it('sets the title to 15/22 semibold with a 4px gap above it', () => {
      const { getByText } = renderCard();
      const style = resolvedStyle(getByText('A great article').props.style);
      expect(style.fontSize).toBe(15);
      expect(style.lineHeight).toBe(22);
      expect(style.fontWeight).toBe('600');
      expect(style.marginTop).toBe(4);
    });

    it('sets the description to 13/18 with a 4px gap above it', () => {
      const { getByText } = renderCard();
      const style = resolvedStyle(getByText('The summary of the article.').props.style);
      expect(style.fontSize).toBe(13);
      expect(style.lineHeight).toBe(18);
      expect(style.marginTop).toBe(4);
    });

    it('gives the title the primary colour and the other two the secondary one', () => {
      const { getByText } = renderCard();
      const siteName = resolvedStyle(getByText('Example').props.style).color;
      const title = resolvedStyle(getByText('A great article').props.style).color;
      const description = resolvedStyle(
        getByText('The summary of the article.').props.style,
      ).color;

      expect(typeof siteName).toBe('string');
      expect(typeof title).toBe('string');
      expect(siteName).toBe(description);
      expect(title).not.toBe(siteName);
    });

    it('relies on no class token for any of it', () => {
      const { getByText } = renderCard();
      for (const label of ['Example', 'A great article', 'The summary of the article.']) {
        const node = getByText(label);
        expect(classNamesOn(node.props.style)).toEqual([]);
        expect(classNamesOn(node.parent?.props.style)).toEqual([]);
      }
    });
  });
});
