import React from 'react';
import { DISABLED_OPACITY } from '../styles/tokens';
import { act, fireEvent, render, within } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import {
  COMPOSER_PANEL_PERMISSIONS,
  ComposerAttachments,
  ComposerPanel,
  ComposerPanelStatusTab,
  ComposerPill,
  ComposerStatusBar,
  ModelPicker,
} from '../composer-panel';
import type { ComposerPanelAttachment, ModelPickerProvider } from '../composer-panel';
import { resolveComposerPalette } from '../composer-panel/shared';
import { buildTheme } from '../theme/build-theme';
import { SendButton } from '../composer-panel/ComposerControls';
import { RiArrowUpLine } from '../icons';
import { pressHost } from './support/press-host';
import { resolvedStyle } from './support/rendered-style';

const PROVIDERS: ModelPickerProvider[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: [
      { id: 'openai/gpt-5.6-mini', name: 'GPT-5.6 Mini' },
      { id: 'openai/gpt-5.5', name: 'GPT-5.5' },
    ],
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    models: [
      { id: 'anthropic/opus-5', name: 'Opus 5' },
      { id: 'anthropic/sonnet-5', name: 'Sonnet 5' },
    ],
  },
];

function renderIn(ui: React.ReactElement, mode: 'light' | 'dark' = 'light') {
  return render(
    <BloomThemeProvider mode={mode} colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('ComposerPanel', () => {
  it('keeps the card: radius 24, padding 10, the card surface; send is 36 round', () => {
    const { getByTestId, getByLabelText } = renderIn(<ComposerPanel testID="composer" />);
    const theme = buildTheme('teal', 'light');
    const card = getByTestId('composer').children[0] as unknown as { props: { style: unknown } };
    expect(resolvedStyle(card.props.style)).toMatchObject({
      borderRadius: 24,
      padding: 10,
      backgroundColor: theme.colors.card,
    });
    expect(resolvedStyle(getByLabelText('Send message').props.style)).toMatchObject({
      width: 36,
      height: 36,
      opacity: 1,
    });
  });

  it('paints the card with the canonical card role in dark mode', () => {
    const { getByTestId } = renderIn(<ComposerPanel testID="composer" />, 'dark');
    const { colors } = buildTheme('teal', 'dark');
    const card = getByTestId('composer').children[0] as unknown as { props: { style: unknown } };
    expect(resolvedStyle(card.props.style).backgroundColor).toBe(colors.card);
  });

  it('submits the draft from send and clears it when uncontrolled', () => {
    const onSubmit = jest.fn();
    const { getByTestId, getByLabelText } = renderIn(<ComposerPanel testID="composer" onSubmit={onSubmit} />);
    fireEvent.changeText(getByTestId('composer-input'), 'Draft the update');
    pressHost(getByLabelText('Send message'));
    expect(onSubmit).toHaveBeenCalledWith('Draft the update');
    expect(getByTestId('composer-input').props.value).toBe('');
  });

  it('greys send to the disabled opacity and ignores it while disabled', () => {
    const onSubmit = jest.fn();
    const { getByLabelText } = renderIn(<ComposerPanel disabled onSubmit={onSubmit} />);
    const send = getByLabelText('Send message');
    expect(send.props['aria-disabled']).toBe(true);
    expect(resolvedStyle(send.props.style).opacity).toBe(DISABLED_OPACITY);
    fireEvent.press(send);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('turns send into stop while busy, and keeps stop live under `disabled`', () => {
    const onStop = jest.fn();
    const onSubmit = jest.fn();
    const { getByLabelText, queryByLabelText } = renderIn(
      <ComposerPanel testID="composer" busy disabled onStop={onStop} onSubmit={onSubmit} />,
    );
    expect(queryByLabelText('Send message')).toBeNull();
    const stop = getByLabelText('Stop generating');
    expect(stop.props['aria-disabled']).toBeUndefined();
    pressHost(stop);
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('draws no stop without a handler, and refuses to submit while busy', () => {
    const onSubmit = jest.fn();
    const { getByLabelText, queryByLabelText } = renderIn(<ComposerPanel busy defaultValue="hi" onSubmit={onSubmit} />);
    expect(queryByLabelText('Stop generating')).toBeNull();
    pressHost(getByLabelText('Send message'));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('opens the permission panel and picks a mode as a named radio', () => {
    const onPermissionChange = jest.fn();
    const onLearnMore = jest.fn();
    const { getByTestId, queryByTestId, getByLabelText } = renderIn(
      <ComposerPanel testID="composer" onPermissionChange={onPermissionChange} onLearnMore={onLearnMore} />,
    );
    const trigger = getByTestId('composer-permission');
    expect(trigger.props.accessibilityLabel).toBe('Permission: Auto');
    expect(trigger.props['aria-expanded']).toBe(false);
    expect(queryByTestId('composer-permission-panel')).toBeNull();

    pressHost(trigger);
    const panel = within(getByTestId('composer-permission-panel'));
    expect(panel.getByText('Always ask before making a change')).toBeTruthy();
    expect(panel.getByLabelText('Auto').props['aria-checked']).toBe(true);
    expect(panel.getByLabelText('Manual').props['aria-checked']).toBe(false);

    pressHost(panel.getByLabelText('Learn more'));
    expect(onLearnMore).toHaveBeenCalledTimes(1);

    pressHost(panel.getByLabelText('Plan mode'));
    expect(onPermissionChange).toHaveBeenCalledWith('plan');
    expect(getByLabelText('Permission: Plan mode')).toBeTruthy();
  });

  it('lists the add menu groups and reports the chosen row', () => {
    const onAddMenuSelect = jest.fn();
    const { getByTestId } = renderIn(<ComposerPanel testID="composer" onAddMenuSelect={onAddMenuSelect} />);
    pressHost(getByTestId('composer-add'));
    const panel = within(getByTestId('composer-add-panel'));
    expect(panel.getByText('Add')).toBeTruthy();
    expect(panel.getByText('Plugins')).toBeTruthy();
    pressHost(panel.getByLabelText('Goal Set a goal for faster results'));
    expect(onAddMenuSelect).toHaveBeenCalledWith('goal');
  });

  /**
   * A menu row that is a SWITCH says which way it is set.
   *
   * The add menu could only describe actions — id, label, icon — so a host
   * with toggles in it (web search on, deep research off) had rows that
   * changed something and then looked identical either way. A row without
   * `checked` is still an action and draws nothing extra, which is what keeps
   * every existing menu unchanged.
   */
  it('ticks a menu row that is on, and leaves an action row plain', () => {
    const { getByTestId } = renderIn(
      <ComposerPanel
        testID="composer"
        addMenu={[
          {
            label: 'Capabilities',
            rows: [
              { id: 'search', label: 'Web search', checked: true },
              { id: 'research', label: 'Deep research', checked: false },
              { id: 'canvas', label: 'Canvas' },
            ],
          },
        ]}
      />,
    );
    pressHost(getByTestId('composer-add'));
    const panel = within(getByTestId('composer-add-panel'));

    // On draws the tick; off reserves the same space without one; the action
    // row is not a switch and says nothing either way.
    expect(panel.queryByTestId('bloom-row-checked-search')).toBeTruthy();
    expect(panel.queryByTestId('bloom-row-checked-research')).toBeNull();
    expect(panel.queryByTestId('bloom-row-checked-canvas')).toBeNull();
  });

  it('hides the add button for an empty menu and the picker without providers', () => {
    const { queryByLabelText } = renderIn(<ComposerPanel addMenu={[]} />);
    expect(queryByLabelText('Add attachment')).toBeNull();
    expect(queryByLabelText(/^Models/)).toBeNull();
  });

  it('toggles voice input with both pressed spellings', () => {
    const onListeningChange = jest.fn();
    const { getByLabelText } = renderIn(<ComposerPanel onListeningChange={onListeningChange} />);
    const mic = getByLabelText('Voice input');
    expect(mic.props['aria-pressed']).toBe(false);
    pressHost(mic);
    expect(onListeningChange).toHaveBeenCalledWith(true);
    expect(getByLabelText('Voice input').props['aria-pressed']).toBe(true);
  });

  it('shows the dismiss only on landed tiles', () => {
    const onRemove = jest.fn();
    const files: ComposerPanelAttachment[] = [
      { id: 'a', name: 'Brief.docx', kind: 'document' },
      { id: 'b', name: 'Deck.key', kind: 'presentation', progress: 40 },
    ];
    const { getByLabelText, getByText, queryByLabelText } = renderIn(<ComposerPanel attachments={files} onRemoveAttachment={onRemove} />);
    expect(getByText('40%', { includeHiddenElements: true })).toBeTruthy();
    const landed = getByLabelText('Remove Brief.docx');
    expect(resolvedStyle(landed.props.style).opacity).toBe(1);
    // In flight: invisible AND out of the accessibility tree.
    expect(queryByLabelText('Remove Deck.key')).toBeNull();
    const pending = getByLabelText('Remove Deck.key', { includeHiddenElements: true });
    expect(resolvedStyle(pending.props.style).opacity).toBe(0);
    pressHost(landed);
    expect(onRemove).toHaveBeenCalledWith('a');
  });

  it('draws a failed tile: its message, no ring or percentage, and the dismiss back', () => {
    const onRemove = jest.fn();
    const files: ComposerPanelAttachment[] = [
      { id: 'a', name: 'Deck.key', kind: 'presentation', progress: 40, error: 'Too large' },
    ];
    const { getByLabelText, getByText, queryByText, queryByLabelText } = renderIn(
      <ComposerPanel attachments={files} onRemoveAttachment={onRemove} />,
    );
    expect(getByText('Too large')).toBeTruthy();
    expect(getByLabelText('Deck.key: Too large')).toBeTruthy();
    // `progress` is ignored once failed: no percentage in flight.
    expect(queryByText('40%', { includeHiddenElements: true })).toBeNull();
    const dismiss = getByLabelText('Remove Deck.key');
    expect(resolvedStyle(dismiss.props.style).opacity).toBe(1);
    pressHost(dismiss);
    expect(onRemove).toHaveBeenCalledWith('a');
    // No retry handler, no retry button.
    expect(queryByLabelText('Retry Deck.key')).toBeNull();
  });

  it('puts a retry on failed tiles only, when `onAttachmentRetry` is given', () => {
    const onRetry = jest.fn();
    const files: ComposerPanelAttachment[] = [
      { id: 'a', name: 'Brief.docx', kind: 'document' },
      { id: 'b', name: 'Photo.png', kind: 'image', src: 'x.png', error: 'Network error' },
    ];
    const { getByLabelText, queryByLabelText } = renderIn(
      <ComposerPanel attachments={files} onAttachmentRetry={onRetry} labels={{ retry: 'Try again' }} />,
    );
    expect(queryByLabelText('Try again Brief.docx')).toBeNull();
    pressHost(getByLabelText('Try again Photo.png'));
    expect(onRetry).toHaveBeenCalledWith('b');
  });

  it('exports the four permission modes', () => {
    expect(COMPOSER_PANEL_PERMISSIONS.map((mode) => mode.id)).toEqual(['auto', 'manual', 'plan', 'bypass']);
  });
});

describe('ComposerPanelStatusTab', () => {
  it('hangs a 34px tab inset 28 with top corners only, and reads out the context', () => {
    const { getByTestId, getByText, getByLabelText } = renderIn(
      <ComposerPanelStatusTab testID="tab" branch="Main" project="project-sea" context={57} />,
    );
    expect(resolvedStyle(getByTestId('tab').props.style)).toMatchObject({
      height: 34,
      marginLeft: 28,
      marginRight: 28,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
    });
    expect(getByText('Main')).toBeTruthy();
    expect(getByText('project-sea')).toBeTruthy();
    expect(getByLabelText('Context 57%')).toBeTruthy();
  });
});

describe('ModelPicker', () => {
  it('names the chosen model and browses lineups from the provider rail', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderIn(<ModelPicker testID="picker" providers={PROVIDERS} onValueChange={onValueChange} />);
    const trigger = getByTestId('picker');
    expect(trigger.props.accessibilityLabel).toBe('Models: GPT-5.6 Mini');

    pressHost(trigger);
    const panel = within(getByTestId('picker-panel'));
    const openai = panel.getByLabelText('OpenAI');
    expect(openai.props['aria-selected']).toBe(true);
    expect(panel.getByLabelText('OpenAI GPT-5.6 Mini').props['aria-checked']).toBe(true);
    expect(panel.queryByLabelText('Anthropic Opus 5')).toBeNull();

    pressHost(panel.getByLabelText('Anthropic'));
    expect(panel.getByLabelText('Anthropic').props['aria-selected']).toBe(true);
    pressHost(panel.getByLabelText('Anthropic Sonnet 5'));
    expect(onValueChange).toHaveBeenCalledWith('anthropic/sonnet-5');
    expect(getByTestId('picker').props.accessibilityLabel).toBe('Models: Sonnet 5');
  });

  it('drops the effort axis when the model has no stops', () => {
    const { getByTestId, queryByLabelText } = renderIn(
      <ModelPicker testID="picker" providers={PROVIDERS} effortLevels={[]} />,
    );
    pressHost(getByTestId('picker'));
    expect(queryByLabelText('OpenAI GPT-5.6 Mini')).toBeTruthy();
    expect(queryByLabelText(/^Effort/)).toBeNull();
  });

  it('reads "no stop chosen" as Auto and commits a stop from there', () => {
    const onEffortChange = jest.fn();
    const { getByTestId, getByLabelText, getAllByLabelText } = renderIn(
      <ModelPicker testID="picker" providers={PROVIDERS} effort={null} onEffortChange={onEffortChange} />,
    );
    pressHost(getByTestId('picker'));
    pressHost(getByLabelText('Effort: Auto'));
    const slider = getAllByLabelText('Effort').find((node) => node.props.accessibilityRole === 'adjustable')!;
    // No value is reported at all — the absence is not the first stop.
    expect(slider.props['aria-valuenow']).toBeUndefined();
    expect(slider.props['aria-valuetext']).toBe('Auto');
    act(() => {
      slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    });
    expect(onEffortChange).toHaveBeenCalledWith(0);
  });

  it('filters every lineup from Quick Search, naming each match’s provider', () => {
    const { getByTestId } = renderIn(<ModelPicker testID="picker" providers={PROVIDERS} />);
    pressHost(getByTestId('picker'));
    const panel = within(getByTestId('picker-panel'));
    pressHost(panel.getByLabelText('Quick Search'));
    fireEvent.changeText(panel.getByLabelText('Search models'), 'o');
    expect(panel.getByLabelText('Anthropic Opus 5')).toBeTruthy();
    expect(panel.getByLabelText('Anthropic Sonnet 5')).toBeTruthy();
    fireEvent.changeText(panel.getByLabelText('Search models'), 'zzz');
    expect(panel.getByText('No models match')).toBeTruthy();
  });

  it('opens the effort panel from the selected row and steps the slider', () => {
    const onEffortChange = jest.fn();
    const { getByTestId, getByLabelText, getAllByLabelText } = renderIn(
      <ModelPicker testID="picker" providers={PROVIDERS} onEffortChange={onEffortChange} />,
    );
    pressHost(getByTestId('picker'));
    const chip = getByLabelText('Effort: Medium');
    pressHost(chip);
    const slider = getAllByLabelText('Effort').find((node) => node.props.accessibilityRole === 'adjustable')!;
    expect(slider.props.accessibilityRole).toBe('adjustable');
    expect(slider.props['aria-valuemin']).toBe(0);
    expect(slider.props['aria-valuemax']).toBe(5);
    expect(slider.props['aria-valuenow']).toBe(1);
    act(() => {
      slider.props.onAccessibilityAction({ nativeEvent: { actionName: 'increment' } });
    });
    expect(onEffortChange).toHaveBeenCalledWith(2);
    expect(getByLabelText('Effort: Balanced')).toBeTruthy();
  });
});

describe('ComposerAttachments', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('lands queued files one at a time, then reports the queue empty', () => {
    const onUploadComplete = jest.fn();
    const onAllUploaded = jest.fn();
    const files: ComposerPanelAttachment[] = [
      { id: 'a', name: 'One.docx', kind: 'document', progress: 0 },
      { id: 'b', name: 'Two.docx', kind: 'document', progress: 0 },
    ];
    const { queryByLabelText } = renderIn(
      <ComposerAttachments
        attachments={files}
        uploadDuration={200}
        uploadGap={10}
        onUploadComplete={onUploadComplete}
        onAllUploaded={onAllUploaded}
      />,
    );
    // Only the file in flight is on the strip.
    expect(queryByLabelText('One.docx')).toBeTruthy();
    expect(queryByLabelText('Two.docx')).toBeNull();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onUploadComplete).toHaveBeenCalledTimes(1);
    expect(onUploadComplete.mock.calls[0][0]).toMatchObject({ id: 'a', progress: undefined });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onUploadComplete).toHaveBeenCalledTimes(2);
    expect(onAllUploaded).toHaveBeenCalledTimes(1);
    expect(queryByLabelText('Two.docx')).toBeTruthy();
  });

  it('skips a failed file: it is done with, not queued', () => {
    const onUploadComplete = jest.fn();
    const files: ComposerPanelAttachment[] = [
      { id: 'a', name: 'One.docx', kind: 'document', progress: 0, error: 'Too large' },
      { id: 'b', name: 'Two.docx', kind: 'document', progress: 0 },
    ];
    const { queryByLabelText } = renderIn(
      <ComposerAttachments attachments={files} uploadDuration={200} uploadGap={10} onUploadComplete={onUploadComplete} />,
    );
    expect(queryByLabelText('One.docx: Too large')).toBeTruthy();
    expect(queryByLabelText('Two.docx')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onUploadComplete).toHaveBeenCalledTimes(1);
    expect(onUploadComplete.mock.calls[0][0]).toMatchObject({ id: 'b' });
  });
});

describe('ComposerPill', () => {
  it('draws the 52px pill with the surface and shadow, and drops both inside a loader', () => {
    const { getByTestId, rerender } = renderIn(<ComposerPill testID="pill" />);
    expect(resolvedStyle(getByTestId('pill').props.style)).toMatchObject({ height: 52, borderRadius: 9999, padding: 8, gap: 10 });
    expect(resolvedStyle(getByTestId('pill').props.style).boxShadow).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ComposerPill testID="pill" surface={false} />
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(getByTestId('pill').props.style)).toMatchObject({ backgroundColor: 'transparent' });
  });

  it('submits the text from send, and greys send out while disabled', () => {
    const onSubmit = jest.fn();
    const { getByLabelText, rerender } = renderIn(<ComposerPill defaultValue="hi" onSubmit={onSubmit} />);
    pressHost(getByLabelText('Send message'));
    expect(onSubmit).toHaveBeenCalledWith('hi');
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <ComposerPill defaultValue="hi" onSubmit={onSubmit} disabled />
      </BloomThemeProvider>,
    );
    expect(getByLabelText('Send message').props['aria-disabled']).toBe(true);
  });

  /**
   * The pill holds a paragraph.
   *
   * It was a fixed 52px box around a 20px field with no `multiline` — under
   * react-native-web an `<input>`, which cannot hold a newline and cannot
   * grow. A composer for an assistant that cannot take a paragraph is not a
   * composer, and the Enter handler made it worse: it had no `shiftKey`
   * clause, so the one key people use to break a line sent the half-written
   * message. `ComposerPanelBase` has always had that clause; the two
   * composers disagreeing about it was a difference nobody chose.
   *
   * The `shiftKey` half is a DOM keydown and `IS_WEB` is false under this
   * preset, so it is pinned in `ComposerPillWeb.test.tsx`, which renders into
   * a real document the way `ChatComposer.test.tsx` does.
   */
  it('grows with the draft and stops at maxLines', () => {
    const { getByLabelText, getByTestId } = renderIn(<ComposerPill testID="pill" maxLines={3} />);
    const field = getByLabelText('Message');

    const heightAtRest = Number(resolvedStyle(getByTestId('pill').props.style).height);

    act(() => {
      fireEvent(field, 'contentSizeChange', { nativeEvent: { contentSize: { height: 40 } } });
    });
    const heightAtTwo = Number(resolvedStyle(getByTestId('pill').props.style).height);
    expect(heightAtTwo).toBeGreaterThan(heightAtRest);

    // Past the cap the box stops and the field scrolls instead.
    act(() => {
      fireEvent(field, 'contentSizeChange', { nativeEvent: { contentSize: { height: 400 } } });
    });
    const heightAtCap = Number(resolvedStyle(getByTestId('pill').props.style).height);

    act(() => {
      fireEvent(field, 'contentSizeChange', { nativeEvent: { contentSize: { height: 4000 } } });
    });
    expect(Number(resolvedStyle(getByTestId('pill').props.style).height)).toBe(heightAtCap);
  });

  it('shows the model button only with models, and picks a model from its panel', () => {
    const onModelChange = jest.fn();
    const none = renderIn(<ComposerPill />);
    expect(none.queryByLabelText('Fable 5')).toBeNull();
    const { getByLabelText, getByText } = renderIn(
      <ComposerPill models={['Composer 2.5', 'Fable 5']} defaultModel="Fable 5" onModelChange={onModelChange} />,
    );
    const trigger = getByLabelText('Fable 5');
    fireEvent.press(trigger);
    expect(getByText('Models')).toBeTruthy();
    expect(getByLabelText('Composer 2.5').props['aria-checked']).toBe(false);
    fireEvent.press(getByLabelText('Composer 2.5'));
    expect(onModelChange).toHaveBeenCalledWith('Composer 2.5');
  });

  it('keys, matches and reports the model id, drawing only the name', () => {
    const onModelChange = jest.fn();
    const { getByLabelText, queryByLabelText } = renderIn(
      <ComposerPill
        models={[
          { id: 'vibl/composer-2.5', name: 'Composer 2.5' },
          { id: 'oxy/fable-5', name: 'Fable 5' },
        ]}
        defaultModel="oxy/fable-5"
        onModelChange={onModelChange}
      />,
    );
    // The trigger names the model, never the routing id.
    const trigger = getByLabelText('Fable 5');
    expect(queryByLabelText('oxy/fable-5')).toBeNull();
    fireEvent.press(trigger);
    fireEvent.press(getByLabelText('Composer 2.5'));
    expect(onModelChange).toHaveBeenCalledWith('vibl/composer-2.5');
  });

  it('drops the effort half of the menu without stops', () => {
    const { getByLabelText, queryByText } = renderIn(<ComposerPill models={['Fable 5']} effortLevels={[]} />);
    fireEvent.press(getByLabelText('Fable 5'));
    expect(queryByText('Models')).toBeTruthy();
    expect(queryByText(/^Effort/)).toBeNull();
  });

  it('turns send into stop while busy, and keeps stop live under `disabled`', () => {
    const onStop = jest.fn();
    const { getByLabelText, queryByLabelText } = renderIn(<ComposerPill busy disabled onStop={onStop} />);
    expect(queryByLabelText('Send message')).toBeNull();
    pressHost(getByLabelText('Stop generating'));
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it('toggles voice input on the mic', () => {
    const onListeningChange = jest.fn();
    const { getByLabelText } = renderIn(<ComposerPill onListeningChange={onListeningChange} />);
    pressHost(getByLabelText('Voice input'));
    expect(onListeningChange).toHaveBeenCalledWith(true);
  });
});

describe('ComposerStatusBar', () => {
  const FOLDERS = [
    { prefix: 'users/me/', name: 'project-sea' },
    { prefix: 'users/desktop/', name: 'vibl' },
  ];

  it('shows the branch, folder, mode and context meter', () => {
    const { getByText, getByLabelText } = renderIn(
      <ComposerStatusBar branch="Main" folders={FOLDERS} mode="Agent" context={57} />,
    );
    expect(getByText('Main')).toBeTruthy();
    expect(getByText('project-sea')).toBeTruthy();
    expect(getByText('Agent')).toBeTruthy();
    expect(getByText('57%')).toBeTruthy();
    expect(getByLabelText('Context 57%')).toBeTruthy();
  });

  it('switches folders from the Local Folders panel', () => {
    const onFolderChange = jest.fn();
    const { getByLabelText, getByText } = renderIn(
      <ComposerStatusBar folders={FOLDERS} onFolderChange={onFolderChange} testID="status" />,
    );
    const trigger = getByLabelText('project-sea');
    expect(trigger.props['aria-expanded']).toBe(false);
    fireEvent.press(trigger);
    expect(getByText('Local Folders')).toBeTruthy();
    fireEvent.press(getByLabelText('users/desktop/vibl'));
    expect(onFolderChange).toHaveBeenCalledWith('vibl');
  });
});


it.each(['light', 'dark'] as const)('composer reads canonical foreground and surface roles in %s mode', (mode) => {
  const theme = buildTheme('teal', mode);
  const c = theme.colors;
  expect(resolveComposerPalette(theme)).toMatchObject({
    surface: c.card, secondary: c.backgroundSecondary, tertiary: c.backgroundTertiary,
    border: c.borderLight, textSecondary: c.textSecondary, textTertiary: c.textTertiary,
    iconSecondary: c.textSecondary, iconTertiary: c.textTertiary, focusRing: c.primary,
    accent500: c.primarySubtleForeground,
    errorSurface: c.errorSubtle, errorText: c.errorSubtleForeground,
  });
});

 it('pairs the send arrow with each action paint state', () => {
  const palette = resolveComposerPalette(buildTheme('teal', 'light'));
  const { getByLabelText, UNSAFE_getByType, rerender } = renderIn(<SendButton disabled={false} onPress={() => {}} label="Send" palette={palette} />);
  const arrow = () => UNSAFE_getByType(RiArrowUpLine).props.fill;
  expect(arrow()).toBe(palette.send.rest.foreground);
  fireEvent(getByLabelText('Send'), 'hoverIn');
  expect(arrow()).toBe(palette.send.hover.foreground);
  fireEvent(getByLabelText('Send'), 'pressIn');
  expect(arrow()).toBe(palette.send.active.foreground);
  rerender(<BloomThemeProvider mode="light" colorPreset="teal"><SendButton disabled onPress={() => {}} label="Send" palette={palette} /></BloomThemeProvider>);
  expect(arrow()).toBe(palette.send.disabled.foreground);
});

describe('emptyAction', () => {
  const call = <SendButton disabled={false} onPress={() => {}} label="Voice mode" palette={resolveComposerPalette(buildTheme('teal', 'light'))} />;

  it("draws the host's empty action in place of send while there is nothing to send", () => {
    const { queryByLabelText } = renderIn(<ComposerPanel emptyAction={call} />);
    expect(queryByLabelText('Voice mode')).not.toBeNull();
    expect(queryByLabelText('Send message')).toBeNull();
  });

  it('gives the slot back to send once there is a draft', () => {
    const { queryByLabelText } = renderIn(<ComposerPanel defaultValue="hi" emptyAction={call} />);
    expect(queryByLabelText('Voice mode')).toBeNull();
    expect(queryByLabelText('Send message')).not.toBeNull();
  });

  it('gives the slot back to send for a lone attachment', () => {
    const { queryByLabelText } = renderIn(
      <ComposerPanel attachments={[{ id: 'a', name: 'a.png', kind: 'image' }]} emptyAction={call} />,
    );
    expect(queryByLabelText('Voice mode')).toBeNull();
    expect(queryByLabelText('Send message')).not.toBeNull();
  });

  it('lets a stop win over the empty action', () => {
    const { queryByLabelText } = renderIn(<ComposerPanel busy onStop={() => {}} emptyAction={call} />);
    expect(queryByLabelText('Voice mode')).toBeNull();
    expect(queryByLabelText('Stop generating')).not.toBeNull();
  });
});
