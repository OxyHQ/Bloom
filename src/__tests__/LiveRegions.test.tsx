/**
 * The live-region semantics of the messages Bloom draws, as native receives
 * them (`docs/composition.mdx` §Live regions): an error that answers what the
 * user did is an `alert` on the TEXT that holds it; news is a polite `status`;
 * a callout that is part of the page is not live at all. The source half,
 * which pins every element that may interrupt, is `live-region-census.test.ts`;
 * the web halves sit beside each family's own web tests.
 */
import React from 'react';
import { Text as RNText, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Field } from '../field';
import { TextFieldHint } from '../text-field';
import { Textarea } from '../textarea';
import { TagField } from '../tag-field';
import { NoteEditorHeader } from '../note-editor';
import { AgentThinking } from '../agent-thinking';
import { Admonition } from '../admonition';
import { EmptyState } from '../empty-state';
import { ProjectBoardEmptyState } from '../project-board/ProjectBoardEmptyState';
import { toastLiveness } from '../toast/ToastSwipeHandler';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

type Host = { type: unknown; props: Record<string, unknown> };

/** Every host node carrying a live role or politeness. */
function liveNodes(view: ReturnType<typeof render>): Host[] {
  return view.UNSAFE_root.findAll(
    (node) =>
      typeof node.type === 'string' &&
      (['alert', 'status', 'log'].includes(String(node.props.role ?? '')) ||
        ['alert', 'status', 'log'].includes(String(node.props.accessibilityRole ?? '')) ||
        node.props['aria-live'] !== undefined ||
        node.props.accessibilityLiveRegion !== undefined),
  ) as unknown as Host[];
}

describe('field errors are alerts on their text', () => {
  it('Field: the error is an alert, the description is not', () => {
    const view = renderWithTheme(
      <Field label="Email" description="We never share it">
        <RNText>input</RNText>
      </Field>,
    );
    expect(view.getByText('We never share it').props.accessibilityRole).toBeUndefined();
    view.rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Field label="Email" description="We never share it" error="Enter an email">
          <RNText>input</RNText>
        </Field>
      </BloomThemeProvider>,
    );
    expect(view.getByText('Enter an email').props.accessibilityRole).toBe('alert');
  });

  it('Field: an error replacing the description is a NEW node, so it appears', () => {
    const ui = (error?: string) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <Field label="Email" description="We never share it" error={error}>
          <RNText>input</RNText>
        </Field>
      </BloomThemeProvider>
    );
    const view = render(ui());
    const description = view.getByText('We never share it');
    view.rerender(ui('Enter an email'));
    const error = view.getByText('Enter an email');
    expect(error).not.toBe(description);
  });

  it('TextFieldHint: invalid is an alert and a new node; valid is a plain caption', () => {
    const ui = (invalid: boolean) => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <TextFieldHint invalid={invalid}>{invalid ? 'Too short' : 'At least 8'}</TextFieldHint>
      </BloomThemeProvider>
    );
    const view = render(ui(false));
    const hint = view.getByText('At least 8');
    expect(hint.props.accessibilityRole).toBeUndefined();
    view.rerender(ui(true));
    const error = view.getByText('Too short');
    expect(error.props.accessibilityRole).toBe('alert');
    expect(error).not.toBe(hint);
  });

  it('Textarea: its hint in an invalid field is the alert', () => {
    const view = renderWithTheme(
      <Field error="Say a little more">
        <Textarea value="" onChangeText={() => undefined} hint="Say a little more" />
      </Field>,
    );
    const alerts = view
      .getAllByText('Say a little more')
      .filter((node) => node.props.accessibilityRole === 'alert');
    // The field's own error and the textarea's hint both draw it; each is said once.
    expect(alerts.length).toBeGreaterThan(0);
  });
});

describe('news is a polite status', () => {
  it('TagField: being full is a status, not an alert', () => {
    const view = renderWithTheme(
      <TagField value={['a', 'b']} onChange={() => undefined} max={2} testID="t" />,
    );
    const hint = view.getByTestId('t-hint');
    expect(hint.props.role).toBe('status');
    expect(hint.props.accessibilityRole).toBeUndefined();
  });

  it('NoteEditorHeader: "Not saved" and "Offline" are said; "Saving" and "Saved" are not', () => {
    const ui = (saveState: 'saved' | 'saving' | 'offline' | 'error') => (
      <BloomThemeProvider mode="light" colorPreset="teal">
        <NoteEditorHeader title="Walk" saveState={saveState} wordCount={12} testID="h" />
      </BloomThemeProvider>
    );
    const view = render(ui('saving'));
    expect(liveNodes(view)).toEqual([]);
    view.rerender(ui('saved'));
    expect(liveNodes(view)).toEqual([]);
    view.rerender(ui('error'));
    expect(liveNodes(view).map((node) => node.props.role)).toEqual(['status']);
    view.rerender(ui('offline'));
    expect(liveNodes(view).map((node) => node.props.role)).toEqual(['status']);
  });

  it('AgentThinking: a polite status that native keeps (aria-live beside the role)', () => {
    const view = renderWithTheme(<AgentThinking label="Thinking" testID="t" />);
    const row = view.getByTestId('t');
    expect(row.props.role).toBe('status');
    expect(row.props['aria-live']).toBe('polite');
  });
});

describe('a callout that is part of the page is not live', () => {
  it('Admonition, EmptyState and an empty board column say nothing on their own', () => {
    const view = renderWithTheme(
      <View>
        <Admonition type="error">Payments are paused.</Admonition>
        <EmptyState title="No messages" description="New mail shows up here." />
        <ProjectBoardEmptyState />
      </View>,
    );
    expect(liveNodes(view)).toEqual([]);
  });
});

describe('toastLiveness', () => {
  it('is polite by default, assertive for an error or an important toast', () => {
    expect(toastLiveness(undefined, undefined)).toBe('polite');
    expect(toastLiveness(undefined, 'success')).toBe('polite');
    expect(toastLiveness(undefined, 'warning')).toBe('polite');
    expect(toastLiveness(undefined, 'loading')).toBe('polite');
    expect(toastLiveness(undefined, 'error')).toBe('assertive');
    expect(toastLiveness(true, undefined)).toBe('assertive');
    // The caller's word wins over the variant's.
    expect(toastLiveness(false, 'error')).toBe('polite');
  });
});
