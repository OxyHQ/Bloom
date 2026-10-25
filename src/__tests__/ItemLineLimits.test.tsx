/**
 * An `Item`'s title and subtitle clamp at one and two lines by default, and a
 * caller can lift either (`0` never truncates).
 *
 * Commons' "how it works" rows cut their explanation off mid-sentence ("incluso
 * cuando ...", Pixel 8a, Spanish) with no way to ask for the whole of it.
 */
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { Item } from '../item';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

function lines(props: React.ComponentProps<typeof Item>) {
  const screen = render(
    <BloomThemeProvider mode="light">
      <Item title="Title" subtitle="Subtitle" {...props} />
    </BloomThemeProvider>,
  );
  const of = (text: string) =>
    screen.UNSAFE_getAllByType(Text).find((node) => node.props.children === text)?.props
      .numberOfLines;
  return { title: of('Title'), subtitle: of('Subtitle') };
}

describe('Item line limits', () => {
  it('clamps the title at one line and the subtitle at two by default', () => {
    expect(lines({})).toEqual({ title: 1, subtitle: 2 });
  });

  it('lets a caller set or lift either', () => {
    expect(lines({ titleNumberOfLines: 2, subtitleNumberOfLines: 0 })).toEqual({
      title: 2,
      subtitle: undefined,
    });
  });
});
