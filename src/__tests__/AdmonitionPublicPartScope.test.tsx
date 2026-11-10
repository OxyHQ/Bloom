import { render } from '@testing-library/react-native';
import {
  Admonition,
  AdmonitionButton,
  AdmonitionContent,
  AdmonitionIcon,
  AdmonitionRoot,
  AdmonitionRow,
  AdmonitionText,
} from '../admonition';
import { BloomScope } from '../appearance';
import type { BloomSize } from '../appearance';
import { Portal, PortalOutlet, PortalProvider } from '../portal/Portal';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { hostNodes, resolvedStyle } from './support/rendered-style';

const SCOPE_TEXT = 'Scoped text';
const ACTION_TEXT = 'Action';
const NOTICE_TEXT = 'Expanded notice';

function Subject({
  outerSize,
  rootSize,
  nestedSize,
  buttonSize,
}: {
  outerSize?: BloomSize;
  rootSize?: BloomSize;
  nestedSize?: BloomSize;
  buttonSize?: BloomSize;
}) {
  return (
    <BloomThemeProvider>
      <PortalProvider>
        <BloomScope size={outerSize}>
          <AdmonitionRoot size={rootSize}>
            <Portal>
              <AdmonitionRow>
                <AdmonitionIcon testID="icon" />
                <AdmonitionContent>
                  {nestedSize ? (
                    <BloomScope size={nestedSize}>
                      <AdmonitionText>{SCOPE_TEXT}</AdmonitionText>
                      <AdmonitionButton size={buttonSize} testID="action">
                        {ACTION_TEXT}
                      </AdmonitionButton>
                    </BloomScope>
                  ) : (
                    <>
                      <AdmonitionText>{SCOPE_TEXT}</AdmonitionText>
                      <AdmonitionButton size={buttonSize} testID="action">
                        {ACTION_TEXT}
                      </AdmonitionButton>
                    </>
                  )}
                </AdmonitionContent>
              </AdmonitionRow>
            </Portal>
          </AdmonitionRoot>
        </BloomScope>
        <PortalOutlet />
      </PortalProvider>
    </BloomThemeProvider>
  );
}

it.each([
  { name: 'default', props: {}, padding: 16, fontSize: 14, buttonHeight: 36, icon: 20 },
  {
    name: 'nearby xs',
    props: { outerSize: 'xs' as const },
    padding: 8,
    fontSize: 12,
    buttonHeight: 24,
    icon: 16,
  },
  {
    name: 'explicit root sm',
    props: { outerSize: 'lg' as const, rootSize: 'sm' as const },
    padding: 12,
    fontSize: 13,
    buttonHeight: 32,
    icon: 18,
  },
  {
    name: 'nested lg',
    props: { outerSize: 'xs' as const, nestedSize: 'lg' as const },
    padding: 8,
    fontSize: 16,
    buttonHeight: 44,
    icon: 16,
  },
  {
    name: 'explicit button sm inside nested lg',
    props: { outerSize: 'xs' as const, nestedSize: 'lg' as const, buttonSize: 'sm' as const },
    padding: 8,
    fontSize: 16,
    buttonHeight: 32,
    icon: 16,
  },
])(
  'applies $name through public Admonition parts and a portal',
  ({ props, padding, fontSize, buttonHeight, icon }) => {
    const screen = render(<Subject {...props} />);
    const views = hostNodes(screen.toJSON());
    expect(views.some((node) => resolvedStyle(node.props.style).padding === padding)).toBe(true);
    expect(resolvedStyle(screen.getByText(SCOPE_TEXT).props.style).fontSize).toBe(fontSize);
    expect(resolvedStyle(screen.getByTestId('action').props.style).height).toBe(buttonHeight);
    const iconStyle = resolvedStyle(
      screen.getByTestId('icon', { includeHiddenElements: true }).props.style,
    );
    expect(iconStyle.width).toBe(icon);
    expect(iconStyle.height).toBe(icon);
  },
);

it('lets the one-piece Admonition override the surrounding scope', () => {
  const screen = render(
    <BloomThemeProvider>
      <BloomScope size="xs">
        <Admonition size="lg">{NOTICE_TEXT}</Admonition>
      </BloomScope>
    </BloomThemeProvider>,
  );
  const views = hostNodes(screen.toJSON());
  expect(views.some((node) => resolvedStyle(node.props.style).padding === 20)).toBe(true);
  expect(resolvedStyle(screen.getByText(NOTICE_TEXT).props.style).fontSize).toBe(16);
});
