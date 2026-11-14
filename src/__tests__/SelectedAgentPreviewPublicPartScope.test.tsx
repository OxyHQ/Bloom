import { render } from '@testing-library/react-native';
import { useAvatarFlights } from '../avatar-flight';
import { BloomScope } from '../appearance';
import {
  previewAvatarGeometry,
  SelectedAgentPreview,
} from '../multi-agent-chat/SelectedAgentPreview';
import type { Agent } from '../multi-agent-chat/data';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const AGENTS: Agent[] = Array.from({ length: 4 }, (_, index) => ({
  id: `agent-${index}`,
  name: `Agent ${index}`,
  label: 'Research',
  description: '',
  avatar: { preset: 'blue_beret' },
  color: 'teal',
}));

function Subject({ count, size, nested }: { count: number; size?: 'xs' | 'lg'; nested: boolean }) {
  const flights = useAvatarFlights();
  const preview = (
    <SelectedAgentPreview agents={AGENTS.slice(0, count)} flights={flights} anchor="scope" />
  );
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{preview}</BloomScope>
        </BloomScope>
      ) : size ? (
        <BloomScope size={size}>{preview}</BloomScope>
      ) : (
        preview
      )}
    </BloomThemeProvider>
  );
}

it('keeps the preview artwork and footprint count-based, independent of nested BloomScope size', () => {
  for (const count of [1, 2, 3, 4]) {
    const screen = render(<Subject count={count} nested={false} />);
    const measure = () => {
      const image = screen.UNSAFE_root.find((node) => node.props?.role === 'img');
      const wrappers = screen.UNSAFE_root.findAll(
        (node) =>
          typeof node.type === 'string' &&
          node.props?.pointerEvents === 'none' &&
          resolvedStyle(node.props.style).position === 'absolute' &&
          [48, 62, 80].includes(resolvedStyle(node.props.style).width as number),
      );
      return {
        footprint: resolvedStyle(image.props.style),
        avatars: wrappers.map((node) => resolvedStyle(node.props.style).width).sort(),
      };
    };
    const defaultScope = measure();
    expect(defaultScope.footprint).toMatchObject({ width: 160, height: 112 });
    expect(defaultScope.avatars).toHaveLength(count);
    expect(defaultScope.avatars).toEqual(
      AGENTS.slice(0, count)
        .map((_, index) => previewAvatarGeometry(count, index).size)
        .sort(),
    );
    screen.rerender(<Subject count={count} size="xs" nested={false} />);
    expect(measure()).toEqual(defaultScope);
    screen.rerender(<Subject count={count} nested />);
    expect(measure()).toEqual(defaultScope);
    screen.unmount();
  }
});
