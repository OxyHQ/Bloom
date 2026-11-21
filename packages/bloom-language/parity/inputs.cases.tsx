import { Button } from '@oxy.so/bloom/button';
import { Checkbox } from '@oxy.so/bloom/checkbox';
import { Field } from '@oxy.so/bloom/field';
import { RiMailLine, RiMicLine, RiSearchLine } from '@oxy.so/bloom/icons';
import { Label } from '@oxy.so/bloom/label';
import { RadioGroup } from '@oxy.so/bloom/radio';
import { Search } from '@oxy.so/bloom/search';
import {
  SegmentedControl,
  SegmentedControlItem,
  SegmentedControlItemText,
} from '@oxy.so/bloom/segmented-control';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectIcon,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@oxy.so/bloom/select';
import { tokens } from '@oxy.so/bloom/styles';
import { Switch } from '@oxy.so/bloom/switch';
import {
  TextField,
  TextFieldGhost,
  TextFieldIcon,
  TextFieldInput,
  TextFieldPrefix,
  TextFieldSuffix,
} from '@oxy.so/bloom/text-field';
import { Textarea } from '@oxy.so/bloom/textarea';

import type { Binding } from '../src/binding';
import * as L from '../src/controls/inputs';
import * as P from '../src/primitives';
import { ENUMS } from '../src/generated/spec.generated';
import { toElement } from '../src/render';
import { type ParityCase, Themed } from './support/cases';

const set = () => {};
const on: Binding<boolean> = [true, set];
const off: Binding<boolean> = [false, set];
const text: Binding<string> = ['Ada Lovelace', set];
const empty: Binding<string> = ['', set];
const { space } = tokens;

// ── Toggle (Switch) ──────────────────────────────────────────────

const toggles: ParityCase[] = [
  {
    name: 'Toggle on',
    language: () => toElement(L.Toggle(on).label('Wi-Fi')),
    bloom: () => <Switch checked onCheckedChange={set} accessibilityLabel="Wi-Fi" />,
  },
  {
    name: 'Toggle off',
    language: () => toElement(L.Toggle(off).label('Wi-Fi')),
    bloom: () => <Switch checked={false} onCheckedChange={set} accessibilityLabel="Wi-Fi" />,
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `Toggle size ${size}`,
    language: () => toElement(L.Toggle(on).size(size).label('Wi-Fi')),
    bloom: () => <Switch checked onCheckedChange={set} size={size} accessibilityLabel="Wi-Fi" />,
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `Toggle tint ${tone}`,
    language: () => toElement(L.Toggle(on).tint(tone).label('Wi-Fi')),
    bloom: () => <Switch checked onCheckedChange={set} tone={tone} accessibilityLabel="Wi-Fi" />,
  })),
  {
    name: 'Toggle disabled',
    language: () => toElement(L.Toggle(on).disabled().label('Wi-Fi').testID('wifi')),
    bloom: () => (
      <Switch checked onCheckedChange={set} disabled accessibilityLabel="Wi-Fi" testID="wifi" />
    ),
  },
  {
    name: 'Toggle with padding',
    language: () => toElement(L.Toggle(off).padding('md').label('Wi-Fi')),
    bloom: () => (
      <Switch
        checked={false}
        onCheckedChange={set}
        style={{
          paddingTop: space.md,
          paddingBottom: space.md,
          paddingStart: space.md,
          paddingEnd: space.md,
        }}
        accessibilityLabel="Wi-Fi"
      />
    ),
  },
];

// ── Checkbox ─────────────────────────────────────────────────────

const checkboxes: ParityCase[] = [
  {
    name: 'Checkbox with a label',
    language: () => toElement(L.Checkbox(on, 'Remember me')),
    bloom: () => <Checkbox checked onCheckedChange={set} label="Remember me" />,
  },
  {
    name: 'Checkbox off, named',
    language: () => toElement(L.Checkbox(off).label('Select row')),
    bloom: () => <Checkbox checked={false} onCheckedChange={set} accessibilityLabel="Select row" />,
  },
  {
    name: 'Checkbox with a description',
    language: () =>
      toElement(L.Checkbox(off, 'Newsletter').description('One email a week, no more.')),
    bloom: () => (
      <Checkbox
        checked={false}
        onCheckedChange={set}
        label="Newsletter"
        description="One email a week, no more."
      />
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `Checkbox size ${size}`,
    language: () => toElement(L.Checkbox(on, 'Remember me').size(size)),
    bloom: () => <Checkbox checked onCheckedChange={set} label="Remember me" size={size} />,
  })),
  ...ENUMS.tone.map((tone) => ({
    name: `Checkbox tint ${tone}`,
    language: () => toElement(L.Checkbox(on, 'Remember me').tint(tone)),
    bloom: () => <Checkbox checked onCheckedChange={set} label="Remember me" tone={tone} />,
  })),
  {
    name: 'Checkbox disabled',
    language: () => toElement(L.Checkbox(on, 'Remember me').disabled()),
    bloom: () => <Checkbox checked onCheckedChange={set} label="Remember me" disabled />,
  },
  {
    name: 'Checkbox read-only',
    language: () => toElement(L.Checkbox(on, 'Done').readOnly()),
    bloom: () => <Checkbox checked onCheckedChange={set} label="Done" readOnly />,
  },
  {
    name: 'Checkbox indeterminate',
    language: () => toElement(L.Checkbox(off, 'All').indeterminate()),
    bloom: () => <Checkbox checked={false} onCheckedChange={set} label="All" indeterminate />,
  },
];

// ── RadioGroup ───────────────────────────────────────────────────

const PLANS = [
  { value: 'free', label: 'Free' },
  { value: 'pro', label: 'Pro' },
  { value: 'team', label: 'Team' },
] as const;
const plan: Binding<string> = ['pro', set];
const planOptions = () => PLANS.map((p) => L.Option(p.value, p.label));

const radios: ParityCase[] = [
  {
    name: 'RadioGroup',
    language: () => toElement(L.RadioGroup(plan, planOptions()).label('Plan')),
    bloom: () => <RadioGroup label="Plan" value="pro" onValueChange={set} options={PLANS} />,
  },
  ...ENUMS.radioStyle.map((style) => ({
    name: `RadioGroup style ${style}`,
    language: () => toElement(L.RadioGroup(plan, planOptions()).style(style).label('Plan')),
    bloom: () => (
      <RadioGroup label="Plan" value="pro" onValueChange={set} options={PLANS} variant={style} />
    ),
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `RadioGroup size ${size}`,
    language: () => toElement(L.RadioGroup(plan, planOptions()).size(size).label('Plan')),
    bloom: () => (
      <RadioGroup label="Plan" value="pro" onValueChange={set} options={PLANS} size={size} />
    ),
  })),
  {
    name: 'RadioGroup tint success, disabled',
    language: () =>
      toElement(L.RadioGroup(plan, planOptions()).tint('success').disabled().label('Plan')),
    bloom: () => (
      <RadioGroup
        label="Plan"
        value="pro"
        onValueChange={set}
        options={PLANS}
        tone="success"
        disabled
      />
    ),
  },
  {
    name: 'RadioGroup options with descriptions, one disabled',
    language: () =>
      toElement(
        L.RadioGroup(
          plan,
          L.Option('free', 'Free').description('For one person'),
          L.Option('pro', 'Pro').description('For creators'),
          L.Option('team', 'Team').disabled().testID('team'),
        ).label('Plan'),
      ),
    bloom: () => (
      <RadioGroup
        label="Plan"
        value="pro"
        onValueChange={set}
        options={[
          { value: 'free', label: 'Free', description: 'For one person' },
          { value: 'pro', label: 'Pro', description: 'For creators' },
          { value: 'team', label: 'Team', disabled: true, testID: 'team' },
        ]}
      />
    ),
  },
];

// ── Segmented (SegmentedControl) ─────────────────────────────────

const VIEWS = [
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
] as const;
const range: Binding<string> = ['week', set];
const segments = () => VIEWS.map((v) => L.Option(v.value, v.label));
const items = () =>
  VIEWS.map((v) => (
    <SegmentedControlItem key={v.value} value={v.value}>
      <SegmentedControlItemText>{v.label}</SegmentedControlItemText>
    </SegmentedControlItem>
  ));

const segmentedCases: ParityCase[] = [
  {
    name: 'Segmented',
    language: () => toElement(L.Segmented(range, segments()).label('Range')),
    bloom: () => (
      <SegmentedControl label="Range" type="radio" value="week" onValueChange={set}>
        {items()}
      </SegmentedControl>
    ),
  },
  {
    name: 'Segmented as tabs',
    language: () => toElement(L.Segmented(range, segments()).tabs().label('Range')),
    bloom: () => (
      <SegmentedControl label="Range" type="tabs" value="week" onValueChange={set}>
        {items()}
      </SegmentedControl>
    ),
  },
  ...ENUMS.segmentedStyle.map((style) => ({
    name: `Segmented style ${style}`,
    language: () => toElement(L.Segmented(range, segments()).style(style).label('Range')),
    bloom: () => (
      <SegmentedControl label="Range" type="radio" value="week" onValueChange={set} variant={style}>
        {items()}
      </SegmentedControl>
    ),
  })),
  ...ENUMS.controlSize.map((size) => ({
    name: `Segmented size ${size}`,
    language: () => toElement(L.Segmented(range, segments()).size(size).label('Range')),
    bloom: () => (
      <SegmentedControl label="Range" type="radio" value="week" onValueChange={set} size={size}>
        {items()}
      </SegmentedControl>
    ),
  })),
  {
    name: 'Segmented disabled, one option disabled',
    language: () =>
      toElement(
        L.Segmented(range, L.Option('day', 'Day'), L.Option('week', 'Week').disabled())
          .disabled()
          .label('Range'),
      ),
    bloom: () => (
      <SegmentedControl label="Range" type="radio" value="week" onValueChange={set} disabled>
        <SegmentedControlItem value="day">
          <SegmentedControlItemText>Day</SegmentedControlItemText>
        </SegmentedControlItem>
        <SegmentedControlItem value="week" disabled>
          <SegmentedControlItemText>Week</SegmentedControlItemText>
        </SegmentedControlItem>
      </SegmentedControl>
    ),
  },
];

// ── Picker (Select) ──────────────────────────────────────────────

const FRUITS = [
  { value: 'apple', label: 'Apple' },
  { value: 'banana', label: 'Banana' },
  { value: 'cherry', label: 'Cherry' },
];
const fruits = () => FRUITS.map((f) => L.Option(f.value, f.label));
const fruitRow = (item: { value: string; label: string }) => (
  <SelectItem value={item.value} label={item.label}>
    <SelectItemIndicator />
    <SelectItemText>{item.label}</SelectItemText>
  </SelectItem>
);
const select = (
  value: string | undefined,
  extra: { size?: (typeof ENUMS.controlSize)[number]; disabled?: boolean } = {},
) => (
  <Select value={value} onValueChange={set} {...extra}>
    <SelectTrigger label="Fruit">
      <SelectValue placeholder="Pick a fruit" />
      <SelectIcon />
    </SelectTrigger>
    <SelectContent label="Fruit" items={FRUITS} renderItem={fruitRow} />
  </Select>
);

const pickers: ParityCase[] = [
  {
    name: 'Picker with nothing chosen',
    language: () =>
      toElement(L.Picker([undefined, set], fruits()).placeholder('Pick a fruit').label('Fruit')),
    bloom: () => select(undefined),
  },
  {
    name: 'Picker with a choice',
    language: () =>
      toElement(L.Picker(['banana', set], fruits()).placeholder('Pick a fruit').label('Fruit')),
    bloom: () => select('banana'),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `Picker size ${size}`,
    language: () =>
      toElement(
        L.Picker(['apple', set], fruits()).placeholder('Pick a fruit').size(size).label('Fruit'),
      ),
    bloom: () => select('apple', { size }),
  })),
  {
    name: 'Picker disabled',
    language: () =>
      toElement(
        L.Picker(['apple', set], fruits()).placeholder('Pick a fruit').disabled().label('Fruit'),
      ),
    bloom: () => select('apple', { disabled: true }),
  },
];

// ── TextField, SecureField ───────────────────────────────────────

const fields: ParityCase[] = [
  {
    name: 'TextField, as a bare TextFieldInput',
    language: () => toElement(L.TextField(text, 'Name')),
    bloom: () => <TextFieldInput label="Name" value="Ada Lovelace" onValueChange={set} />,
  },
  {
    name: 'TextField with a placeholder',
    language: () => toElement(L.TextField(empty, 'Name').placeholder('Your name')),
    bloom: () => (
      <TextFieldInput label="Name" value="" onValueChange={set} placeholder="Your name" />
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `TextField size ${size}`,
    language: () => toElement(L.TextField(text, 'Name').size(size)),
    bloom: () => (
      <TextField size={size}>
        <TextFieldInput label="Name" value="Ada Lovelace" onValueChange={set} />
      </TextField>
    ),
  })),
  {
    name: 'TextField invalid',
    language: () => toElement(L.TextField(text, 'Name').invalid()),
    bloom: () => <TextFieldInput label="Name" value="Ada Lovelace" onValueChange={set} invalid />,
  },
  {
    name: 'TextField disabled',
    language: () => toElement(L.TextField(text, 'Name').disabled()),
    bloom: () => <TextFieldInput label="Name" value="Ada Lovelace" onValueChange={set} disabled />,
  },
  {
    name: 'TextField with a floating label',
    language: () => toElement(L.TextField(empty, 'Email').floatingLabel()),
    bloom: () => <TextFieldInput label="Email" value="" onValueChange={set} floatingLabel />,
  },
  {
    name: 'TextField with an icon',
    language: () => toElement(L.TextField(empty, 'Email').icon(RiMailLine)),
    bloom: () => (
      <TextField>
        <TextFieldIcon icon={RiMailLine} />
        <TextFieldInput label="Email" value="" onValueChange={set} />
      </TextField>
    ),
  },
  {
    name: 'TextField with a prefix and a suffix',
    language: () => toElement(L.TextField(['12', set], 'Price').prefix('€').suffix('per month')),
    bloom: () => (
      <TextField>
        <TextFieldPrefix label="€">€</TextFieldPrefix>
        <TextFieldInput label="Price" value="12" onValueChange={set} />
        <TextFieldSuffix label="per month">per month</TextFieldSuffix>
      </TextField>
    ),
  },
  {
    name: 'TextField for an email',
    language: () =>
      toElement(
        L.TextField(empty, 'Email')
          .keyboard('email-address')
          .autocapitalize('none')
          .autocorrect(false)
          .contentType('email')
          .submitLabel('next')
          .onSubmit(set)
          .maxLength(120)
          .testID('email'),
      ),
    bloom: () => (
      <TextFieldInput
        label="Email"
        value=""
        onValueChange={set}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        returnKeyType="next"
        onSubmitEditing={set}
        maxLength={120}
        testID="email"
      />
    ),
  },
  {
    name: 'SecureField, revealable',
    language: () => toElement(L.SecureField(['hunter2', set], 'Password').revealable()),
    bloom: () => (
      <TextFieldInput
        label="Password"
        value="hunter2"
        onValueChange={set}
        secureTextEntry
        revealable
      />
    ),
  },
  {
    name: 'TextField with a frame',
    language: () => toElement(L.TextField(text, 'Name').frame({ width: '5xl' })),
    bloom: () => (
      <TextField style={{ width: space._5xl }}>
        <TextFieldInput label="Name" value="Ada Lovelace" onValueChange={set} />
      </TextField>
    ),
  },
];

// ── TextEditor (Textarea) ────────────────────────────────────────

const editors: ParityCase[] = [
  {
    name: 'TextEditor',
    language: () => toElement(L.TextEditor(text)),
    bloom: () => <Textarea value="Ada Lovelace" onValueChange={set} />,
  },
  {
    name: 'TextEditor with a label, a placeholder and a description',
    language: () =>
      toElement(
        L.TextEditor(empty, 'Bio')
          .placeholder('A line about you')
          .description('Shown on your profile'),
      ),
    bloom: () => (
      <Textarea
        label="Bio"
        value=""
        onValueChange={set}
        placeholder="A line about you"
        hint="Shown on your profile"
      />
    ),
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `TextEditor size ${size}`,
    language: () => toElement(L.TextEditor(text, 'Bio').size(size)),
    bloom: () => <Textarea label="Bio" value="Ada Lovelace" onValueChange={set} size={size} />,
  })),
  {
    name: 'TextEditor rows, resize, counted',
    language: () =>
      toElement(L.TextEditor(text, 'Bio').rows(6).resize('vertical').maxLength(280).showCount()),
    bloom: () => (
      <Textarea
        label="Bio"
        value="Ada Lovelace"
        onValueChange={set}
        rows={6}
        resize="vertical"
        maxLength={280}
        showCount
      />
    ),
  },
  {
    name: 'TextEditor growing to 8 rows',
    language: () => toElement(L.TextEditor(text, 'Bio').autoResize(8)),
    bloom: () => (
      <Textarea label="Bio" value="Ada Lovelace" onValueChange={set} autoResize maxRows={8} />
    ),
  },
  {
    name: 'TextEditor invalid, required, disabled',
    language: () => toElement(L.TextEditor(text, 'Bio').invalid().required().disabled()),
    bloom: () => (
      <Textarea label="Bio" value="Ada Lovelace" onValueChange={set} invalid required disabled />
    ),
  },
];

// ── Field, Label ─────────────────────────────────────────────────

const forms: ParityCase[] = [
  {
    name: 'Field around a TextField',
    language: () =>
      toElement(L.Field('Email', L.TextField(empty, 'Email')).description('We never share it')),
    bloom: () => (
      <Field label="Email" description="We never share it">
        <TextFieldInput label="Email" value="" onValueChange={set} />
      </Field>
    ),
  },
  {
    name: 'Field with an error, required',
    language: () =>
      toElement(L.Field('Email', L.TextField(empty, 'Email')).error('Enter an email').required()),
    bloom: () => (
      <Field label="Email" error="Enter an email" required>
        <TextFieldInput label="Email" value="" onValueChange={set} />
      </Field>
    ),
  },
  {
    name: 'Field disabled, around a Toggle',
    language: () => toElement(L.Field('Wi-Fi', L.Toggle(on)).disabled()),
    bloom: () => (
      <Field label="Wi-Fi" disabled>
        <Switch checked onCheckedChange={set} />
      </Field>
    ),
  },
  {
    name: 'Label',
    language: () => toElement(L.Label('Display name')),
    bloom: () => <Label>Display name</Label>,
  },
  ...ENUMS.labelSize.map((size) => ({
    name: `Label size ${size}`,
    language: () => toElement(L.Label('Display name').size(size)),
    bloom: () => <Label size={size}>Display name</Label>,
  })),
  {
    name: 'Label required, disabled',
    language: () => toElement(L.Label('Display name').required().disabled()),
    bloom: () => (
      <Label required disabled>
        Display name
      </Label>
    ),
  },
];

// ── Search ───────────────────────────────────────────────────────

const TOKENS = [
  { key: 'pdf', label: 'PDF' },
  { key: 'mine', label: 'Mine', icon: RiSearchLine },
];

const searches: ParityCase[] = [
  {
    name: 'Search',
    language: () => toElement(L.Search(empty).placeholder('Search posts')),
    bloom: () => <Search value="" onValueChange={set} placeholder="Search posts" />,
  },
  {
    name: 'Search with text, named',
    language: () => toElement(L.Search(['bloom', set]).label('Search people')),
    bloom: () => <Search value="bloom" onValueChange={set} label="Search people" />,
  },
  ...ENUMS.controlSize.map((size) => ({
    name: `Search size ${size}`,
    language: () => toElement(L.Search(empty).size(size)),
    bloom: () => <Search value="" onValueChange={set} size={size} />,
  })),
  {
    name: 'Search disabled',
    language: () => toElement(L.Search(empty).disabled()),
    bloom: () => <Search value="" onValueChange={set} disabled />,
  },
  {
    name: 'Search collapsible, closed',
    language: () => toElement(L.Search(empty).collapsible().presented([false, set])),
    bloom: () => (
      <Search
        value=""
        onValueChange={set}
        presentation="collapsible"
        open={false}
        onOpenChange={set}
      />
    ),
  },
  {
    name: 'Search collapsing where there is no room',
    language: () => toElement(L.Search(empty).collapsible('auto')),
    bloom: () => <Search value="" onValueChange={set} presentation="auto" />,
  },
  {
    name: 'Search with tokens',
    language: () => toElement(L.Search(empty).tokens([TOKENS, set])),
    bloom: () => <Search value="" onValueChange={set} tokens={TOKENS} onRemoveToken={set} />,
  },
  {
    name: 'Search submitting',
    language: () => toElement(L.Search(empty).submitLabel('search').onSubmit(set)),
    bloom: () => (
      <Search value="" onValueChange={set} returnKeyType="search" onSubmitEditing={set} />
    ),
  },
];

// ── Wave 2's remaining inputs ────────────────────────────────────

const SWATCHES = [
  { value: 'primary', label: 'Blue' },
  { value: 'success', label: 'Green' },
  { value: 'warning', label: 'Amber' },
  { value: 'error', label: 'Red' },
] as const;

const GROCERIES = [
  { value: 'apple', label: 'Apple', group: 'Fruit' },
  { value: 'pear', label: 'Pear', group: 'Fruit' },
  { value: 'leek', label: 'Leek', group: 'Vegetable' },
];

const more: ParityCase[] = [
  {
    name: 'TextField with a trailing icon',
    language: () => toElement(L.TextField(text, 'Email').trailingIcon(RiMailLine)),
    bloom: () => (
      <TextField>
        <TextFieldInput label="Email" value="Ada Lovelace" onValueChange={set} />
        <TextFieldIcon icon={RiMailLine} position="trailing" />
      </TextField>
    ),
  },
  {
    name: 'TextField with an icon, a suffix and a trailing icon',
    language: () =>
      toElement(
        L.TextField(['ada', set], 'Handle')
          .icon(RiSearchLine)
          .suffix('.oxy.so')
          .trailingIcon(RiMailLine),
      ),
    bloom: () => (
      <TextField>
        <TextFieldIcon icon={RiSearchLine} />
        <TextFieldInput label="Handle" value="ada" onValueChange={set} />
        <TextFieldSuffix label=".oxy.so">.oxy.so</TextFieldSuffix>
        <TextFieldIcon icon={RiMailLine} position="trailing" />
      </TextField>
    ),
  },
  {
    name: 'TextField with a completion',
    language: () => toElement(L.TextField(['acme.', set], 'Workspace').completion('oxy.so')),
    bloom: () => (
      <TextField>
        <TextFieldGhost value="oxy.so">acme.</TextFieldGhost>
        <TextFieldInput label="Workspace" value="acme." onValueChange={set} />
      </TextField>
    ),
  },
  {
    name: 'TextField with its focus bound',
    language: () => toElement(L.TextField(text, 'Name').focused(off)),
    bloom: () => (
      <TextField>
        <TextFieldInput
          label="Name"
          value="Ada Lovelace"
          onValueChange={set}
          onFocus={set}
          onBlur={set}
        />
      </TextField>
    ),
  },
  {
    name: 'TextEditor with its focus bound',
    language: () => toElement(L.TextEditor(text, 'Bio').focused(off)),
    bloom: () => (
      <Textarea label="Bio" value="Ada Lovelace" onValueChange={set} onFocus={set} onBlur={set} />
    ),
  },
  {
    name: 'Search with its focus bound',
    language: () => toElement(L.Search(empty).focused(off)),
    bloom: () => <Search value="" onValueChange={set} onFocus={set} onBlur={set} />,
  },
  {
    name: 'Search with trailing content',
    language: () =>
      toElement(
        L.Search(empty).trailing(
          P.Button(P.Icon(RiMicLine)).style('plain').shape('circle').label('Voice'),
        ),
      ),
    bloom: () => (
      <Search
        value=""
        onValueChange={set}
        trailing={
          <Button appearance="plain" icon={RiMicLine} iconOnly accessibilityLabel="Voice" />
        }
      />
    ),
  },
  {
    name: 'Search collapsible, its trigger subtle and small',
    language: () =>
      toElement(
        L.Search(empty)
          .collapsible()
          .presented([false, set])
          .trigger(P.Button().style('subtle').tint('accent').size('sm').testID('find')),
      ),
    bloom: () => (
      <Search
        value=""
        onValueChange={set}
        presentation="collapsible"
        open={false}
        onOpenChange={set}
        triggerProps={{ appearance: 'subtle', tone: 'accent', size: 'sm', testID: 'find' }}
      />
    ),
  },
  {
    name: 'Search with padding and a width, as its container',
    language: () => toElement(L.Search(empty).padding('sm').frame({ width: '320' })),
    bloom: () => (
      <Search
        value=""
        onValueChange={set}
        containerStyle={{
          paddingTop: space.sm,
          paddingBottom: space.sm,
          paddingStart: space.sm,
          paddingEnd: space.sm,
          width: 320,
        }}
      />
    ),
  },
  {
    name: 'RadioGroup of swatches',
    language: () =>
      toElement(
        L.RadioGroup(
          ['success', set],
          SWATCHES.map((swatch) => L.Option(swatch.value, swatch.label).tint(swatch.value)),
        )
          .style('swatch')
          .label('Colour'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <RadioGroup
            variant="swatch"
            label="Colour"
            value="success"
            onValueChange={set}
            options={SWATCHES.map((swatch) => ({
              value: swatch.value,
              label: swatch.label,
              color: c[swatch.value],
            }))}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'RadioGroup of swatches, a dot of its own and the accent',
    language: () =>
      toElement(
        L.RadioGroup(
          ['warning', set],
          L.Option('warning', 'Amber').tint('warning').foreground('black'),
          L.Option('accent', 'Accent'),
        )
          .style('swatch')
          .label('Colour'),
      ),
    bloom: () => (
      <Themed>
        {(c) => (
          <RadioGroup
            variant="swatch"
            label="Colour"
            value="warning"
            onValueChange={set}
            options={[
              { value: 'warning', label: 'Amber', color: c.warning, foreground: c.black },
              { value: 'accent', label: 'Accent' },
            ]}
          />
        )}
      </Themed>
    ),
  },
  {
    name: 'Picker with groups',
    language: () =>
      toElement(
        L.Picker(
          ['pear', set],
          L.OptionGroup('Fruit', L.Option('apple', 'Apple'), L.Option('pear', 'Pear')),
          L.OptionGroup('Vegetable', L.Option('leek', 'Leek')),
        )
          .placeholder('Pick one')
          .label('Groceries'),
      ),
    bloom: () => (
      <Select value="pear" onValueChange={set}>
        <SelectTrigger label="Groceries">
          <SelectValue placeholder="Pick one" />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent
          label="Groceries"
          items={GROCERIES}
          renderItem={(item, index) => {
            const row = (
              <SelectItem value={item.value} label={item.label}>
                <SelectItemIndicator />
                <SelectItemText>{item.label}</SelectItemText>
              </SelectItem>
            );
            return GROCERIES[index - 1]?.group === item.group ? (
              row
            ) : (
              <SelectGroup>
                <SelectLabel>{item.group}</SelectLabel>
                {row}
              </SelectGroup>
            );
          }}
        />
      </Select>
    ),
  },
  {
    name: 'Picker whose rows carry a mark, the chosen one in its trigger',
    language: () =>
      toElement(
        L.Picker(
          ['apple', set],
          L.Option('apple', 'Apple').leadingView(P.Icon(RiMailLine).size('md')),
          L.Option('pear', 'Pear'),
        ).label('Fruit'),
      ),
    bloom: () => (
      <Themed>
        {(c) => {
          const mark = <RiMailLine size="md" fill={c.text} />;
          const items = [
            { value: 'apple', label: 'Apple', leading: mark },
            { value: 'pear', label: 'Pear', leading: undefined },
          ];
          return (
            <Select value="apple" onValueChange={set}>
              <SelectTrigger label="Fruit">
                <SelectValue
                  leading={(item) => (item as (typeof items)[number] | undefined)?.leading ?? null}
                />
                <SelectIcon />
              </SelectTrigger>
              <SelectContent
                label="Fruit"
                items={items}
                renderItem={(item) => (
                  <SelectItem value={item.value} label={item.label} leading={item.leading}>
                    <SelectItemIndicator />
                    <SelectItemText>{item.label}</SelectItemText>
                  </SelectItem>
                )}
              />
            </Select>
          );
        }}
      </Themed>
    ),
  },
];

const groupedRow = (item: (typeof GROCERIES)[number], index: number) => {
  const row = (
    <SelectItem value={item.value} label={item.label}>
      <SelectItemIndicator />
      <SelectItemText>{item.label}</SelectItemText>
    </SelectItem>
  );
  return GROCERIES[index - 1]?.group === item.group ? (
    row
  ) : (
    <SelectGroup>
      <SelectLabel>{item.group}</SelectLabel>
      {row}
    </SelectGroup>
  );
};

const openPickers: ParityCase[] = [
  {
    name: 'Picker open, its groups heading their rows',
    language: () =>
      toElement(
        L.Picker(
          ['pear', set],
          L.OptionGroup('Fruit', L.Option('apple', 'Apple'), L.Option('pear', 'Pear')),
          L.OptionGroup('Vegetable', L.Option('leek', 'Leek')),
        )
          .presented(on)
          .label('Groceries'),
      ),
    bloom: () => (
      <Select value="pear" onValueChange={set} open onOpenChange={set}>
        <SelectTrigger label="Groceries">
          <SelectValue />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent label="Groceries" items={GROCERIES} renderItem={groupedRow} />
      </Select>
    ),
  },
  {
    name: 'Picker closed through its binding',
    language: () => toElement(L.Picker(['apple', set], fruits()).presented(off).label('Fruit')),
    bloom: () => (
      <Select value="apple" onValueChange={set} open={false} onOpenChange={set}>
        <SelectTrigger label="Fruit">
          <SelectValue />
          <SelectIcon />
        </SelectTrigger>
        <SelectContent label="Fruit" items={FRUITS} renderItem={fruitRow} />
      </Select>
    ),
  },
];

export const INPUT_CASES: ParityCase[] = [
  ...toggles,
  ...checkboxes,
  ...radios,
  ...segmentedCases,
  ...pickers,
  ...fields,
  ...editors,
  ...forms,
  ...searches,
  ...more,
  ...openPickers,
];

/**
 * A field that takes the focus as it appears (an open collapsible search's,
 * an `autoFocus` one), and a page has one focus: two
 * side by side (the story's pairs) cannot both draw it. Compared by the Jest
 * suites, where nothing takes focus, and left out of the story.
 */
export const INPUT_CASES_FOCUSED: ParityCase[] = [
  {
    name: 'TextField focused as it appears',
    language: () => toElement(L.TextField(empty, 'Email').autoFocus()),
    bloom: () => <TextFieldInput label="Email" value="" onValueChange={set} autoFocus />,
  },
  {
    name: 'Search collapsible, open',
    language: () => toElement(L.Search(empty).collapsible().presented([true, set])),
    bloom: () => (
      <Search value="" onValueChange={set} presentation="collapsible" open onOpenChange={set} />
    ),
  },
];
