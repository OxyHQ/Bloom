import { render } from '@testing-library/react-native';
import { BloomScope } from '../appearance';
import { AvatarGroup } from '../avatar-group';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const items = [
  { id: 'ada', name: 'Ada', initials: 'A' },
  { id: 'grace', name: 'Grace', initials: 'G' },
];

it.each(['stack', 'row', 'cluster'] as const)(
  'keeps %s numeric avatar geometry independent of BloomScope',
  (layout) => {
    for (const scope of [undefined, 'xs', 'lg'] as const) {
      const group = (
        <AvatarGroup
          testID="group"
          items={items}
          layout={layout}
          size={layout === 'cluster' ? 64 : 48}
          showInitials
        />
      );
      const tree = render(
        <BloomThemeProvider fonts={false}>
          {scope ? <BloomScope size={scope}>{group}</BloomScope> : group}
        </BloomThemeProvider>,
      );
      const expected = layout === 'cluster' ? 64 : 48;
      const measured = tree
        .getByTestId('group')
        .findAll(
          (node) =>
            resolvedStyle(node.props.style).width === expected &&
            resolvedStyle(node.props.style).height === expected,
        );
      expect(measured.length).toBeGreaterThan(0);
      tree.unmount();
    }
  },
);
