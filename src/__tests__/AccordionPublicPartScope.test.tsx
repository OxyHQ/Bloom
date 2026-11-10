import { render } from '@testing-library/react-native';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../accordion';
import { BloomScope } from '../appearance';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Text } from '../typography';
import { resolvedStyle } from './support/rendered-style';

function Subject({
  size,
  outerSize,
  nested,
}: {
  size?: 'xs' | 'sm' | 'lg';
  outerSize?: 'xs' | 'lg';
  nested?: boolean;
}) {
  const accordion = (
    <Accordion size={size} value="details" onValueChange={() => {}}>
      <AccordionItem value="details">
        {/* biome-ignore lint/correctness/noReactNativeRawText: AccordionTrigger wraps string children in Bloom Text. */}
        <AccordionTrigger>Details</AccordionTrigger>
        <AccordionContent>
          <Text>Body</Text>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
  return (
    <BloomThemeProvider>
      {nested ? (
        <BloomScope size="xs">
          <BloomScope size="lg">{accordion}</BloomScope>
        </BloomScope>
      ) : outerSize ? (
        <BloomScope size={outerSize}>{accordion}</BloomScope>
      ) : (
        accordion
      )}
    </BloomThemeProvider>
  );
}

it('maps inherited and explicit size onto the trigger and measured content on the native route', () => {
  const screen = render(<Subject />);
  const measure = () => {
    const trigger = screen.UNSAFE_root.find((node) => node.props.accessibilityRole === 'button');
    const label = screen.getByText('Details');
    const content = screen.UNSAFE_root.find(
      (node) =>
        typeof node.type === 'string' &&
        resolvedStyle(node.props.style).paddingBottom !== undefined &&
        resolvedStyle(node.props.style).paddingLeft === 4,
    );
    return {
      trigger: resolvedStyle(trigger.props.style),
      label: resolvedStyle(label.props.style),
      content: resolvedStyle(content.props.style),
    };
  };

  expect(measure()).toMatchObject({
    trigger: { paddingVertical: 12, gap: 8, minHeight: 44 },
    label: { fontSize: 15 },
    content: { paddingBottom: 12, paddingLeft: 4, paddingRight: 4 },
  });
  screen.rerender(<Subject outerSize="xs" />);
  expect(measure()).toMatchObject({
    trigger: { paddingVertical: 8, gap: 6, minHeight: 44 },
    label: { fontSize: 12 },
    content: { paddingBottom: 8 },
  });
  screen.rerender(<Subject outerSize="lg" size="sm" />);
  expect(measure()).toMatchObject({
    trigger: { paddingVertical: 10, gap: 8, minHeight: 44 },
    label: { fontSize: 13 },
    content: { paddingBottom: 10 },
  });
  screen.rerender(<Subject nested />);
  expect(measure()).toMatchObject({
    trigger: { paddingVertical: 14, gap: 10, minHeight: 44 },
    label: { fontSize: 17 },
    content: { paddingBottom: 14 },
  });
  screen.unmount();
});
