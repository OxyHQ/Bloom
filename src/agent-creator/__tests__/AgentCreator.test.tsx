import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { CharacterAvatar } from '../../agent-avatar/CharacterAvatar';
import {
  legacyCharacterRecipe,
  legacyRecipe,
} from '../../agent-avatar/legacy-recipe';
import { Select } from '../../select';
import { CHARACTER_OPTIONS } from '../constants';
import { ShapeArc } from '../ShapeArc';
import { CustomColorPicker } from '../CustomColorPicker';
import { GlossArt } from '../GlossArt';
import { avatarHex, hexAppearance } from '../shared';
import { EmotionPicker } from '../EmotionPicker';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator';
import type { AgentCreatorAgent } from '../types';

const agent: AgentCreatorAgent = {
  id: 'design',
  name: 'Designer',
  label: 'Design',
  description: 'Helpful designer',
  avatar: { ...FOLD_CONFIG },
  preferences: {
    voice: 'local',
    speed: 1.25,
    language: 'en',
    notifications: false,
  },
};
function editor(onChange = jest.fn(), extra = {}) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <AgentCreator agent={agent} onChange={onChange} {...extra} />
    </BloomThemeProvider>,
  );
}

describe('controlled agent creator', () => {
  beforeEach(() => {
    global.requestAnimationFrame = jest.fn(() => 1);
    global.cancelAnimationFrame = jest.fn();
  });
  it('edits each profile field while retaining the agent identity, avatar and preferences', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.changeText(view.getByLabelText('Agent name'), 'Architect');
    expect(onChange).toHaveBeenLastCalledWith({ ...agent, name: 'Architect' });
    fireEvent.changeText(view.getByLabelText('Agent label'), 'Architecture');
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      label: 'Architecture',
    });
    fireEvent.changeText(
      view.getByLabelText('Agent description'),
      'Builds better systems',
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      description: 'Builds better systems',
    });
  });
  it('preserves the other avatar controls when choosing a color or expression', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.press(view.getByLabelText('Blue avatar'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: {
        ...agent.avatar,
        hue: 220,
        saturation: 85,
        lightness: undefined,
        lightEyes: false,
        lookAt: 'wander',
      },
    });
    fireEvent.press(view.getByLabelText('Happy'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: { ...agent.avatar, eyes: 'happy', lookAt: 'wander' },
    });
  });
  it('edits notifications without discarding language, voice or speed', () => {
    const onChange = jest.fn();
    const view = editor(onChange);
    fireEvent.press(view.getByLabelText('Notify when this agent finishes'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      preferences: { ...agent.preferences, notifications: true },
    });
  });
  it('previews a host speech provider with saved voice preferences', () => {
    const onPreviewVoice = jest.fn();
    const view = editor(jest.fn(), {
      voices: [{ id: 'local', name: 'Local English', language: 'en-US' }],
      onPreviewVoice,
    });
    fireEvent.press(view.getByLabelText('Preview voice'));
    expect(onPreviewVoice).toHaveBeenCalledWith(
      'Hello! Ready when you are.',
      agent.preferences,
    );
  });
  it('closes the host panel without committing a change', () => {
    const onClose = jest.fn(),
      onChange = jest.fn();
    const view = editor(onChange, { onClose });
    fireEvent.press(view.getByLabelText('Close agent editor'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe('optional character editor', () => {
  it('offers beta controls only with a runtime and preserves the procedural recipe when choosing a preset', () => {
    const onChange = jest.fn();
    const plain = editor(onChange);
    expect(plain.queryByTestId('agent-creator-character-controls')).toBeNull();
    plain.unmount();
    const view = render(
      <CharacterRuntimeFixture value={{ runtimeUrl: '/runtime.mjs' }}>
        <BloomThemeProvider>
          <AgentCreator agent={agent} onChange={onChange} />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>,
    );
    const preset = view.UNSAFE_getAllByType(Select)[0]!;
    fireEvent(preset, 'valueChange', 'blue_beret');
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: { ...agent.avatar, character: { preset: 'blue_beret' } },
    });
  });
  it('retains explicit eye style when changing shape while awaiting engine compatibility', () => {
    const character = {
      preset: 'blue_beret',
      selections: { eyes: 'round_inset', color: 'pink' },
    };
    const onChange = jest.fn();
    const configured = { ...agent, avatar: { ...agent.avatar, character } };
    const capabilities = {
      key: JSON.stringify(character),
      available: { 'eyes:round_inset': false },
      selected: { eyes: 'oval', color: 'pink', shape: 'rounded_diamond' },
    };
    const view = render(
      <CharacterRuntimeFixture
        value={{
          runtimeUrl: '/runtime.mjs',
          capabilitiesByKey: new Map([[capabilities.key, capabilities]]),
        }}
      >
        <BloomThemeProvider>
          <AgentCreator agent={configured} onChange={onChange} />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>,
    );
    expect(view.UNSAFE_getByType(EmotionPicker).props.value).toBe(
      'round_inset',
    );
    expect(view.getByLabelText('Round inset').props.disabled).toBe(false);
    expect(view.queryByLabelText('Happy')).toBeNull();
    expect(view.getByLabelText('Custom avatar color')).toBeTruthy();
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'heart');
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...configured.avatar,
        character: {
          preset: 'blue_beret',
          selections: {
            eyes: 'round_inset',
            color: 'pink',
            shape: 'heart',
            accessory: 'felipe_beret',
          },
        },
      },
    });
    fireEvent(view.UNSAFE_getAllByType(Select)[0]!, 'valueChange', 'bloom');
    expect(onChange).toHaveBeenLastCalledWith({
      ...agent,
      avatar: { ...agent.avatar, lookAt: 'wander' },
    });
  });
});

it('edits custom beta body RGB through the existing picker and retains the entire recipe', () => {
  const character = {
    preset: 'blue_beret',
    bodyColor: '#123456',
    selections: { shape: 'heart', eyes: 'oval', accessory: 'bow' },
  };
  const configured = {
    ...agent,
    avatar: { ...agent.avatar, lookAt: 'top-left' as const, character },
  };
  const onChange = jest.fn();
  const capabilities = {
    key: JSON.stringify(character),
    available: { 'color:blue': true },
    selected: { color: 'blue', shape: 'heart', eyes: 'oval', accessory: 'bow' },
  };
  const view = render(
    <CharacterRuntimeFixture
      value={{
        runtimeUrl: '/runtime.mjs',
        capabilitiesByKey: new Map([[capabilities.key, capabilities]]),
      }}
    >
      <BloomThemeProvider>
        <AgentCreator agent={configured} onChange={onChange} />
      </BloomThemeProvider>
    </CharacterRuntimeFixture>,
  );
  expect(view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(false);
  expect(view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(
    true,
  );
  expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
    '#123456',
  );
  expect(
    view
      .UNSAFE_getAllByType(GlossArt)
      .some((art) => art.props.center === '#123456' && art.props.active),
  ).toBe(true);
  fireEvent.press(view.getByLabelText('Custom avatar color'));
  const picker = view.UNSAFE_getByType(CustomColorPicker);
  expect(picker.props.value).toBe('#123456');
  fireEvent(picker, 'change', '#Ab1234');
  expect(onChange).toHaveBeenLastCalledWith({
    ...configured,
    avatar: {
      ...configured.avatar,
      ...hexAppearance('#Ab1234'),
      character: { ...character, bodyColor: '#ab1234' },
    },
  });
  fireEvent.press(view.getByLabelText('Blue avatar'));
  expect(onChange).toHaveBeenLastCalledWith({
    ...configured,
    avatar: {
      ...configured.avatar,
      character: {
        preset: 'blue_beret',
        selections: { ...character.selections, color: 'blue' },
      },
    },
  });
});

describe('shared original-engine editor catalog', () => {
  function withRuntime(
    configured: AgentCreatorAgent,
    onChange = jest.fn(),
    selected: Record<string, string> = {},
  ) {
    const beta =
      configured.avatar.character &&
      configured.avatar.character.preset !== 'bloom';
    const key = JSON.stringify(
      beta
        ? configured.avatar.character
        : legacyCharacterRecipe(configured.avatar),
    );
    const caps = {
      key,
      selected: {
        shape: 'circle',
        eyes: configured.avatar.character?.selections?.eyes ?? 'oval',
        ...selected,
      },
      available: { 'eyes:dots': true },
    };
    return render(
      <CharacterRuntimeFixture
        value={{
          runtimeUrl: '/runtime.mjs',
          capabilitiesByKey: new Map([[key, caps]]),
        }}
      >
        <BloomThemeProvider>
          <AgentCreator agent={configured} onChange={onChange} />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>,
    );
  }

  it('offers all twenty-one unique shapes in the same arc for both saved recipe kinds', () => {
    const kinds = [
      agent,
      {
        ...agent,
        avatar: { ...agent.avatar, character: { preset: 'blue_beret' } },
      },
    ];
    for (const configured of kinds) {
      const view = withRuntime(configured);
      const choices = view.UNSAFE_getByType(ShapeArc).props.choices;
      expect(choices).toHaveLength(21);
      expect(
        new Set(choices.map((choice: { id: string }) => choice.id)).size,
      ).toBe(21);
      expect(choices.map((choice: { id: string }) => choice.id)).toEqual(
        expect.arrayContaining([
          'clippo',
          'circle',
          'heart',
          'rounded_triangle',
          'slender',
          'pocket',
          'petal',
          'star',
          'cloud',
          'shield',
          'pebble',
          'squircle',
        ]),
      );
      expect(view.queryByLabelText('Happy')).toBeNull();
      expect(view.UNSAFE_getByType(EmotionPicker).props.choices).toHaveLength(
        12,
      );
      view.unmount();
    }
  });

  it('offers Clippo static artwork and retains its independent eyes across every body', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: { preset: 'clippo', selections: { eyes: 'clippo' } },
      },
    };
    const view = withRuntime(configured, jest.fn(), { color: 'blue' });
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
      '#999b9d',
    );
    expect(view.getByLabelText('Blue avatar').props['aria-pressed']).toBe(
      false,
    );
    expect(
      view.UNSAFE_getAllByType(GlossArt).find((node) => node.props.active)
        ?.props,
    ).toMatchObject({ center: '#999b9d', edge: '#999b9d', rainbow: false });
    const eyes = view.UNSAFE_getByType(EmotionPicker).props.choices;
    expect(
      eyes.find((choice: { id: string }) => choice.id === 'clippo'),
    ).toMatchObject({
      artwork: 'clippo',
      disabled: false,
    });
    expect(
      eyes.find((choice: { id: string }) => choice.id === 'clippo').thumbnail,
    ).toBeUndefined();
    const choices = view.UNSAFE_getByType(ShapeArc).props.choices;
    expect(
      choices.find((choice: { id: string }) => choice.id === 'clippo')
        .thumbnail,
    ).toBeUndefined();
    for (const choice of choices)
      expect(choice.config.character.selections.eyes).toBe('clippo');
    for (const choice of choices)
      expect(
        choice.config.character.bodyColor ?? avatarHex(choice.config),
      ).toBe('#999b9d');
    view.unmount();
  });

  it('retains Todd eyes and Felipe’s beret when selecting any shape', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: {
          preset: 'blue_beret',
          selections: { eyes: 'todd', accessory: 'felipe_beret' },
        },
      },
    };
    const view = withRuntime(configured);
    const eyes = view.UNSAFE_getByType(EmotionPicker).props.choices;
    expect(
      eyes.find((choice: { id: string }) => choice.id === 'todd'),
    ).toMatchObject({
      thumbnail: '/thumbnails/eyes/todd.png',
      disabled: false,
    });
    const choices = view.UNSAFE_getByType(ShapeArc).props.choices;
    for (const choice of choices) {
      expect(choice.config.character.selections).toMatchObject({
        eyes: 'todd',
        accessory: 'felipe_beret',
      });
    }
  });

  it('materializes a known preset paint only when selecting another body', () => {
    const configured = {
      ...agent,
      avatar: { ...agent.avatar, character: { preset: 'blue_beret' } },
    };
    const onChange = jest.fn();
    const view = withRuntime(configured, onChange, {
      color: 'blue',
      eyes: 'oval',
      accessory: 'felipe_beret',
    });
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'todd');
    expect(onChange.mock.lastCall![0].avatar.character).toEqual({
      preset: 'blue_beret',
      selections: {
        shape: 'todd',
        color: 'blue',
        eyes: 'oval',
        accessory: 'felipe_beret',
      },
    });
    fireEvent.press(view.getByLabelText('Single eye'));
    expect(onChange.mock.lastCall![0].avatar.character).toEqual({
      preset: 'blue_beret',
      selections: { eyes: 'cyclops', accessory: 'felipe_beret' },
    });
    view.unmount();
  });

  it('copies actual unnamed preset RGB to every body instead of its unrelated procedural fallback', () => {
    const configured = {
      ...agent,
      avatar: { ...agent.avatar, hue: 300, character: { preset: 'gus' } },
    };
    const view = withRuntime(configured, jest.fn(), { bodyColor: '#f0bd73' });
    expect(avatarHex(configured.avatar)).not.toBe('#f0bd73');
    expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
      '#f0bd73',
    );
    for (const choice of view.UNSAFE_getByType(ShapeArc).props.choices)
      expect(
        choice.config.character.bodyColor ?? avatarHex(choice.config),
      ).toBe('#f0bd73');
    expect(
      view.getByLabelText('Custom avatar color').props['aria-pressed'],
    ).toBe(true);
    view.unmount();
  });

  it.each([
    [{ bodyColor: '#123456' }, '#123456'],
    [{ selections: { color: 'blue' } }, '#4778ff'],
  ])(
    'keeps an explicit color ahead of unnamed preset RGB metadata %#',
    (override, expected) => {
      const configured = {
        ...agent,
        avatar: { ...agent.avatar, character: { preset: 'gus', ...override } },
      };
      const view = withRuntime(configured, jest.fn(), { bodyColor: '#f0bd73' });
      expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
        expected,
      );
      for (const choice of view.UNSAFE_getByType(ShapeArc).props.choices) {
        const actual =
          choice.config.character.bodyColor ??
          (choice.config.character.selections.color === 'blue'
            ? '#4778ff'
            : avatarHex(choice.config));
        expect(actual).toBe(expected);
      }
      view.unmount();
    },
  );

  it.each(['round_inset', 'sleepy_lids', 'dots'])(
    'keeps %s, eyewear, headwear and spacing on every body',
    (eyes) => {
      const configured = {
        ...agent,
        avatar: {
          ...agent.avatar,
          character: {
            preset: 'lime_frog',
            eyeSpacing: 1.23,
            selections: { eyes, eyewear: 'monocle', accessory: 'crown' },
          },
        },
      };
      const view = withRuntime(configured);
      for (const choice of view.UNSAFE_getByType(ShapeArc).props.choices) {
        expect(choice.config.character).toMatchObject({
          eyeSpacing: 1.23,
          selections: { eyes, eyewear: 'monocle', accessory: 'crown' },
        });
      }
      view.unmount();
    },
  );

  it('edits every eye style on Todd without replacing its authored body preset', () => {
    const configured = {
      ...agent,
      avatar: { ...agent.avatar, character: { preset: 'lime_frog' } },
    };
    const onChange = jest.fn();
    const view = withRuntime(configured, onChange, {
      shape: 'todd',
      eyes: 'todd',
      eyewear: 'none',
      accessory: 'none',
    });
    for (const [id, title] of CHARACTER_OPTIONS.eyes) {
      expect(view.getByLabelText(title).props.disabled).toBe(false);
      fireEvent.press(view.getByLabelText(title));
      expect(onChange.mock.lastCall![0].avatar.character).toEqual({
        preset: 'lime_frog',
        selections: { eyes: id, eyewear: 'none', accessory: 'none' },
      });
    }
    const slider = view.getByLabelText('Eye spacing');
    expect(slider.props).toMatchObject({
      'aria-valuenow': 100,
      'aria-valuemin': 50,
      'aria-valuemax': 150,
    });
    expect(slider.props['aria-disabled']).not.toBe(true);
    fireEvent(
      view
        .UNSAFE_getAllByProps({ accessibilityLabel: 'Eye spacing' })
        .find((node) => typeof node.props.onValueChange === 'function')!,
      'valueChange',
      135,
    );
    expect(onChange.mock.lastCall![0].avatar.character).toEqual({
      preset: 'lime_frog',
      eyeSpacing: 1.35,
    });
    view.unmount();
  });

  it('uses static single-eye artwork on every body and hides paired-eye spacing without discarding it', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: {
          preset: 'lime_frog',
          eyeSpacing: 1.23,
          selections: { eyes: 'cyclops' },
        },
      },
    };
    const view = withRuntime(configured);
    expect(view.queryByLabelText('Eye spacing')).toBeNull();
    const single = view
      .UNSAFE_getByType(EmotionPicker)
      .props.choices.find((choice: { id: string }) => choice.id === 'cyclops');
    expect(single).toMatchObject({
      artwork: 'cyclops',
      label: 'Single eye',
      disabled: false,
    });
    expect(single.thumbnail).toBeUndefined();
    for (const choice of view.UNSAFE_getByType(ShapeArc).props.choices)
      expect(choice.config.character).toMatchObject({
        eyeSpacing: 1.23,
        selections: { eyes: 'cyclops' },
      });
    view.unmount();
  });

  it('keeps accepting spacing drag values while the edited recipe awaits new capabilities', () => {
    const initial = {
      ...agent,
      avatar: { ...agent.avatar, character: { preset: 'lime_frog' } },
    };
    const initialKey = JSON.stringify(initial.avatar.character);
    const onChange = jest.fn();
    function DragEditor() {
      const [current, setCurrent] = useState<AgentCreatorAgent>(initial);
      return (
        <CharacterRuntimeFixture
          value={{
            runtimeUrl: '/runtime.mjs',
            capabilitiesByKey: new Map([
              [
                initialKey,
                {
                  key: initialKey,
                  available: {},
                  selected: { eyes: 'todd', shape: 'todd' },
                },
              ],
            ]),
          }}
        >
          <BloomThemeProvider>
            <AgentCreator
              agent={current}
              onChange={(next) => {
                onChange(next);
                setCurrent(next);
              }}
            />
          </BloomThemeProvider>
        </CharacterRuntimeFixture>
      );
    }
    const view = render(<DragEditor />);
    const emit = (value: number) =>
      fireEvent(
        view
          .UNSAFE_getAllByProps({ accessibilityLabel: 'Eye spacing' })
          .find((node) => typeof node.props.onValueChange === 'function')!,
        'valueChange',
        value,
      );
    emit(123);
    expect(view.getByLabelText('Eye spacing').props['aria-disabled']).not.toBe(
      true,
    );
    expect(view.getByLabelText('Eye spacing').props['aria-valuenow']).toBe(123);
    // Capabilities still belong to initialKey, as they do during native preparation.
    emit(137);
    expect(view.getByLabelText('Eye spacing').props['aria-disabled']).not.toBe(
      true,
    );
    expect(view.getByLabelText('Eye spacing').props['aria-valuenow']).toBe(137);
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(onChange.mock.lastCall![0].avatar.character).toEqual({
      preset: 'lime_frog',
      eyeSpacing: 1.37,
    });
    view.unmount();
  });

  it('keeps the current RGB and native eyes when selecting a migrated body from a preset', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: {
          preset: 'blue_beret',
          bodyColor: '#123456',
          selections: { eyes: 'dots', accessory: 'bow' },
        },
      },
    };
    const onChange = jest.fn();
    const view = withRuntime(configured, onChange);
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'cloud');
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...agent.avatar,
        family: 'fold',
        foldShape: 'cloud',
        character: {
          preset: 'blue_beret',
          bodyColor: '#123456',
          selections: { eyes: 'dots', accessory: 'bow', shape: 'cloud' },
        },
      },
    });
  });

  it('enters a native body with the current color and explicitly empty preset accessories', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: {
          preset: 'bloom',
          bodyColor: '#123456',
          eyeSpacing: 0.78,
          selections: { eyes: 'dots' },
        },
      },
    };
    const onChange = jest.fn();
    const view = withRuntime(configured, onChange);
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'heart');
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...configured.avatar,
        character: {
          preset: 'legacy',
          bodyColor: '#123456',
          eyeSpacing: 0.78,
          selections: {
            shape: 'heart',
            eyes: 'dots',
            eyewear: 'none',
            accessory: 'none',
          },
        },
      },
    });
  });

  it('retains native eye choices when replacing an old custom color with the shared named palette', () => {
    const configured = {
      ...agent,
      avatar: {
        ...agent.avatar,
        character: {
          preset: 'bloom',
          bodyColor: '#123456',
          selections: { eyes: 'dots' },
        },
      },
    };
    const onChange = jest.fn();
    const view = withRuntime(configured, onChange);
    expect(view.getByLabelText('Dots').props['aria-pressed']).toBe(true);
    fireEvent.press(view.getByLabelText('Blue avatar'));
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...configured.avatar,
        character: {
          preset: 'legacy',
          selections: {
            shape: 'slender',
            color: 'blue',
            eyes: 'dots',
            eyewear: 'none',
            accessory: 'none',
          },
        },
      },
    });
  });

  it('replays working on the main migrated preview without editing the saved recipe', () => {
    const onChange = jest.fn();
    const view = withRuntime(agent, onChange);
    const hero = () =>
      view
        .UNSAFE_getAllByType(CharacterAvatar)
        .find((node) => node.props.size === 162)!;
    expect(hero().props.workingKey).toBe(0);
    fireEvent.press(view.getByText('Work'));
    expect(hero().props.workingKey).toBe(1);
    fireEvent.press(view.getByText('Work'));
    expect(hero().props.workingKey).toBe(2);
    expect(onChange).not.toHaveBeenCalled();
  });
});

it('edits migrated accessories, eyewear, eyes and color while preserving the original contour', () => {
  const initial = {
    ...agent,
    avatar: { ...agent.avatar, foldShape: 'cloud' as const },
  };
  const initialOutline = legacyRecipe(initial.avatar).points;
  const onChange = jest.fn();
  function ControlledEditor() {
    const [current, setCurrent] = useState<AgentCreatorAgent>(initial);
    const identity = legacyCharacterRecipe(current.avatar);
    const key = JSON.stringify(identity);
    const selections = current.avatar.character?.selections;
    const caps = {
      key,
      selected: {
        shape: 'circle',
        eyes: selections?.eyes ?? 'oval',
        eyewear: selections?.eyewear ?? 'none',
        accessory: selections?.accessory ?? 'none',
      },
      available: {
        'eyes:dots': true,
        'eyewear:monocle': true,
        'accessory:crown': true,
        'accessory:orb': false,
      },
    };
    return (
      <CharacterRuntimeFixture
        value={{
          runtimeUrl: '/runtime.mjs',
          capabilitiesByKey: new Map([[key, caps]]),
        }}
      >
        <BloomThemeProvider>
          <AgentCreator
            agent={current}
            onChange={(next) => {
              onChange(next);
              setCurrent(next);
            }}
          />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>
    );
  }
  const view = render(<ControlledEditor />);
  const controls = () => view.UNSAFE_getAllByType(Select);
  expect(controls()[1]!.props.value).toBe('none');
  expect(controls()[2]!.props.value).toBe('none');
  fireEvent(controls()[2]!, 'valueChange', 'crown');
  expect(onChange).toHaveBeenLastCalledWith({
    ...initial,
    avatar: {
      ...initial.avatar,
      character: {
        preset: 'legacy',
        bodyColor: avatarHex(initial.avatar),
        selections: {
          shape: 'cloud',
          eyes: 'oval',
          eyewear: 'none',
          accessory: 'crown',
        },
      },
    },
  });
  expect(controls()[2]!.props.value).toBe('crown');
  fireEvent(controls()[1]!, 'valueChange', 'monocle');
  expect(controls()[1]!.props.value).toBe('monocle');
  fireEvent.press(view.getByLabelText('Dots'));
  expect(view.getByLabelText('Dots').props['aria-pressed']).toBe(true);
  fireEvent.press(view.getByLabelText('Blue avatar'));
  let updated = onChange.mock.lastCall![0] as AgentCreatorAgent;
  expect(updated.avatar.character).toEqual({
    preset: 'legacy',
    selections: {
      shape: 'cloud',
      color: 'blue',
      accessory: 'crown',
      eyewear: 'monocle',
      eyes: 'dots',
    },
  });
  expect(updated.avatar).toMatchObject({
    family: 'fold',
    foldShape: 'cloud',
    foldDepth: initial.avatar.foldDepth,
    eyeGap: initial.avatar.eyeGap,
    hue: initial.avatar.hue,
    saturation: initial.avatar.saturation,
  });
  expect(legacyRecipe(updated.avatar).points).toEqual(initialOutline);
  fireEvent.press(view.getByLabelText('Custom avatar color'));
  fireEvent(view.UNSAFE_getByType(CustomColorPicker), 'change', '#abcdef');
  updated = onChange.mock.lastCall![0] as AgentCreatorAgent;
  expect(avatarHex(updated.avatar)).toBe('#abcdef');
  expect(updated.avatar.character?.selections).toEqual({
    shape: 'cloud',
    color: 'blue',
    accessory: 'crown',
    eyewear: 'monocle',
    eyes: 'dots',
  });
  expect(legacyRecipe(updated.avatar).points).toEqual(initialOutline);
});

it('accepts rapid body, eye, glasses, hat and palette edits while only the initial recipe has capabilities', () => {
  const initial = {
    ...agent,
    avatar: { ...agent.avatar, character: { preset: 'blue_beret' } },
  };
  const key = JSON.stringify(initial.avatar.character);
  const caps = {
    key,
    selected: {
      shape: 'circle',
      color: 'blue',
      eyes: 'oval',
      eyewear: 'none',
      accessory: 'felipe_beret',
    },
    available: {
      'eyes:todd': false,
      'eyewear:monocle': false,
      'accessory:crown': false,
      'color:pink': false,
    },
  };
  const onChange = jest.fn();
  function Controlled() {
    const [current, setCurrent] = useState<AgentCreatorAgent>(initial);
    return (
      <CharacterRuntimeFixture
        value={{
          runtimeUrl: '/runtime.mjs',
          capabilitiesByKey: new Map([[key, caps]]),
        }}
      >
        <BloomThemeProvider>
          <AgentCreator
            agent={current}
            onChange={(next) => {
              setCurrent(next);
              onChange(next);
            }}
          />
        </BloomThemeProvider>
      </CharacterRuntimeFixture>
    );
  }
  const view = render(<Controlled />);
  fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'cloud');
  expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
    '#4778ff',
  );
  expect(view.getByLabelText('Todd').props.disabled).toBe(false);
  fireEvent.press(view.getByLabelText('Todd'));
  fireEvent(view.UNSAFE_getAllByType(Select)[1]!, 'valueChange', 'monocle');
  fireEvent(view.UNSAFE_getAllByType(Select)[2]!, 'valueChange', 'crown');
  expect(view.getByLabelText('Pink avatar').props.disabled).toBe(false);
  fireEvent.press(view.getByLabelText('Pink avatar'));
  fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'todd');
  fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'slender');
  expect(onChange).toHaveBeenCalledTimes(7);
  expect(onChange.mock.lastCall![0].avatar.character).toEqual({
    preset: 'blue_beret',
    selections: {
      shape: 'slender',
      color: 'pink',
      eyes: 'todd',
      eyewear: 'monocle',
      accessory: 'crown',
    },
  });
  expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe(
    '#fa70ab',
  );
  expect(view.getByLabelText('Pink avatar').props['aria-pressed']).toBe(true);
});
