/**
 * `aria-describedby` on NATIVE: the texts it names are the control's hint.
 *
 * React Native drops `aria-describedby` before it reaches the platform, so a
 * field's description and its error were never said with the field on iOS,
 * Android or OxyOS. `hooks/use-described-by-hint.ts` resolves the id list to
 * the texts of the Bloom `Text`s carrying those ids and joins them into
 * `accessibilityHint`, which every native screen reader says after a control.
 *
 * `FieldMembership.test.tsx` asserts the hint on every Field member; this file
 * asserts the rules of the join itself (the caller's hint first, the list's
 * order, the name and repeats left out, kept in step), the families that build
 * their own id list (`TagField`, `Select`, a card form box) and the tooltip
 * that is its trigger's help. This suite runs as iOS; the web half is
 * `DescribedByHint.web.test.tsx`.
 */
import type React from 'react';
import { Pressable, TextInput } from 'react-native';
import { act, render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';
import { Text } from '../typography';
import { Button } from '../button';
import { TextField, TextFieldInput } from '../text-field';
import { TagField } from '../tag-field';
import { CardFormNumber } from '../card-form';
import { Select, SelectTrigger, SelectValue } from '../select';
import { Tooltip, TooltipTextBubble, TooltipTrigger } from '../tooltip';
import { joinDescription, useDescribedByHint } from '../hooks/use-described-by-hint';

function wrap(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

function Described({
  describedBy,
  hint,
  name,
}: {
  describedBy?: string;
  hint?: string;
  name?: string;
}) {
  const resolved = useDescribedByHint({ describedBy, hint, name });
  return <Pressable testID="control" accessibilityLabel={name} accessibilityHint={resolved} />;
}

const hintOf = (screen: ReturnType<typeof wrap>, testID = 'control') =>
  screen.getByTestId(testID).props.accessibilityHint as string | undefined;

describe('joinDescription', () => {
  it('joins with a space, in order, without the empty parts', () => {
    expect(joinDescription(['Opens it', undefined, '  Two words  minimum ', '', null])).toBe(
      'Opens it Two words minimum',
    );
  });

  it('leaves out the name and a text already said, whatever their case', () => {
    expect(joinDescription(['Dropsea', 'Too short', 'too short'], 'dropsea')).toBe('Too short');
    expect(joinDescription(['Dropsea'], 'Dropsea')).toBeUndefined();
  });
});

describe('a control described by Bloom texts', () => {
  it('says the texts its list names, in the LIST order, not the order on screen', () => {
    const screen = wrap(
      <>
        <Text nativeID="b">Second</Text>
        <Described describedBy="a b" name="Field" />
        <Text nativeID="a">First</Text>
      </>,
    );
    expect(hintOf(screen)).toBe('First Second');
  });

  it("says the caller's own hint FIRST, then the descriptions", () => {
    const screen = wrap(
      <>
        <Described describedBy="d" hint="Opens the picker" name="Date" />
        <Text nativeID="d">Format: day, month, year</Text>
      </>,
    );
    expect(hintOf(screen)).toBe('Opens the picker Format: day, month, year');
  });

  it('says a nested text as one, as a native text node reads its runs', () => {
    const screen = wrap(
      <>
        <Described describedBy="d" />
        <Text nativeID="d">
          At least <Text>8</Text> characters
        </Text>
      </>,
    );
    expect(hintOf(screen)).toBe('At least 8 characters');
  });

  it('keeps in step: a text that changes, appears or goes is said as it now is', () => {
    function Probe({ text, shown }: { text: string; shown: boolean }) {
      return (
        <>
          <Described describedBy="d" />
          {shown ? <Text nativeID="d">{text}</Text> : null}
        </>
      );
    }
    const screen = wrap(<Probe text="Too short" shown={false} />);
    expect(hintOf(screen)).toBeUndefined();
    const again = (ui: React.ReactElement) =>
      screen.rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          {ui}
        </BloomThemeProvider>,
      );
    again(<Probe text="Too short" shown />);
    expect(hintOf(screen)).toBe('Too short');
    again(<Probe text="Already taken" shown />);
    expect(hintOf(screen)).toBe('Already taken');
    again(<Probe text="Already taken" shown={false} />);
    expect(hintOf(screen)).toBeUndefined();
  });

  it('says nothing for an id no text carries, and an id the list stops naming is let go', () => {
    const screen = wrap(
      <>
        <Described describedBy="missing" />
        <Text nativeID="kept">Kept</Text>
      </>,
    );
    expect(hintOf(screen)).toBeUndefined();
    act(() => {
      screen.rerender(
        <BloomThemeProvider mode="light" colorPreset="teal">
          <Described describedBy="kept" />
          <Text nativeID="kept">Kept</Text>
        </BloomThemeProvider>,
      );
    });
    expect(hintOf(screen)).toBe('Kept');
  });
});

describe('the families that build their own id list', () => {
  it("TextField: a caller's own described text, then the field's error", () => {
    const screen = wrap(
      <>
        <Text nativeID="own">Letters and digits</Text>
        <Field label="User name" error="Already taken">
          <TextField>
            <TextFieldInput
              label="User name"
              aria-describedby="own"
              accessibilityHint="Your public name"
            />
          </TextField>
        </Field>
      </>,
    );
    // The caller's id list wins over the field's on `TextFieldInput` (its id
    // rule); the hint follows the list it carries, after the caller's hint.
    expect(screen.UNSAFE_getByType(TextInput).props.accessibilityHint).toBe(
      'Your public name Letters and digits',
    );
  });

  it("TagField: the field's description, then its own hint as the list orders them", () => {
    const screen = wrap(
      <Field label="Tags" description="Up to two">
        <TagField testID="tags" value={['a', 'b']} onChange={() => {}} max={2} />
      </Field>,
    );
    const hint = screen.UNSAFE_getByType(TextInput).props.accessibilityHint as string;
    expect(hint.startsWith('Up to two ')).toBe(true);
    expect(hint).toBe(`Up to two ${screen.getByTestId('tags-hint').props.children as string}`);
  });

  it("a card form box: its own message, then the field's", () => {
    const screen = wrap(
      <Field label="Card" error="Payment declined">
        <CardFormNumber error="Number too short" />
      </Field>,
    );
    expect(screen.UNSAFE_getByType(TextInput).props.accessibilityHint).toBe(
      'Number too short Payment declined',
    );
  });

  it('Select: the field\'s description, then "required", as its web id list', () => {
    const screen = wrap(
      <Field label="Country" description="Where you live" required>
        <Select value="es" onValueChange={() => {}}>
          <SelectTrigger>
            <SelectValue placeholder="Pick" />
          </SelectTrigger>
        </Select>
      </Field>,
    );
    expect(screen.getByLabelText('Country').props.accessibilityHint).toBe(
      'Where you live required',
    );
  });
});

describe('a tooltip is its trigger’s help', () => {
  function Tipped({ name, tip }: { name: string; tip: string }) {
    return (
      <Tooltip visible={false} onVisibleChange={() => {}}>
        <TooltipTrigger>
          <Button testID="control" accessibilityLabel={name} accessibilityHint="Press Up Arrow">
            {name}
          </Button>
        </TooltipTrigger>
        <TooltipTextBubble>{tip}</TooltipTextBubble>
      </Tooltip>
    );
  }

  it("says the tooltip after the button's own hint, while the tooltip is hidden", () => {
    const screen = wrap(<Tipped name="Back" tip="Shows the previous folder" />);
    expect(hintOf(screen)).toBe('Press Up Arrow Shows the previous folder');
  });

  it('never says a tooltip that is the button’s name twice (a dock icon’s)', () => {
    const screen = wrap(<Tipped name="Dropsea" tip="Dropsea" />);
    expect(hintOf(screen)).toBe('Press Up Arrow');
  });

  it("compares with the button's text when it carries no label", () => {
    const screen = wrap(
      <Tooltip visible={false} onVisibleChange={() => {}}>
        <TooltipTrigger>
          <Button testID="control">Save</Button>
        </TooltipTrigger>
        <TooltipTextBubble>Save</TooltipTextBubble>
      </Tooltip>,
    );
    expect(hintOf(screen)).toBeUndefined();
  });
});
