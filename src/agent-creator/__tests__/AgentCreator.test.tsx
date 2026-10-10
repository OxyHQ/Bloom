import { fireEvent, render } from '@testing-library/react-native';
import { useState } from 'react';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { CharacterAvatar } from '../../agent-avatar/CharacterAvatar';
import { legacyCharacterRecipe, legacyRecipe } from '../../agent-avatar/legacy-recipe';
import { Select } from '../../select';
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
    fireEvent.changeText(view.getByLabelText('Agent description'), 'Builds better systems');
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
    expect(onPreviewVoice).toHaveBeenCalledWith('Hello! Ready when you are.', agent.preferences);
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
  it('removes an incompatible explicit eye style after changing shape and uses actual engine selections', () => {
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
    expect(view.UNSAFE_getByType(EmotionPicker).props.value).toBe('oval');
    expect(view.getByLabelText('Round inset').props.disabled).toBe(true);
    expect(view.queryByLabelText('Happy')).toBeNull();
    expect(view.getByLabelText('Custom avatar color')).toBeTruthy();
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'heart');
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...configured.avatar,
        character: {
          preset: 'blue_beret',
          selections: { color: 'pink', shape: 'heart' },
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
  expect(view.getByLabelText('Custom avatar color').props['aria-pressed']).toBe(true);
  expect(view.UNSAFE_getByType(EmotionPicker).props.backgroundColor).toBe('#123456');
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
  function withRuntime(configured: AgentCreatorAgent, onChange = jest.fn()) {
    const beta = configured.avatar.character && configured.avatar.character.preset !== 'bloom';
    const key = JSON.stringify(
      beta ? configured.avatar.character : legacyCharacterRecipe(configured.avatar),
    );
    const caps = {
      key,
      selected: {
        shape: 'circle',
        eyes: configured.avatar.character?.selections?.eyes ?? 'oval',
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

  it('offers all nineteen unique shapes in the same arc for both saved recipe kinds', () => {
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
      expect(choices).toHaveLength(19);
      expect(new Set(choices.map((choice: { id: string }) => choice.id)).size).toBe(19);
      expect(choices.map((choice: { id: string }) => choice.id)).toEqual(
        expect.arrayContaining([
          'circle',
          'heart',
          'rounded_triangle',
          'legacy:fold:slender',
          'legacy:fold:pocket',
          'legacy:fold:petal',
          'legacy:fold:star',
          'legacy:fold:cloud',
          'legacy:fold:shield',
          'legacy:blob:pebble',
          'legacy:blob:squircle',
        ]),
      );
      expect(view.queryByLabelText('Happy')).toBeNull();
      expect(view.UNSAFE_getByType(EmotionPicker).props.choices).toHaveLength(9);
      view.unmount();
    }
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
    fireEvent(view.UNSAFE_getByType(ShapeArc), 'select', 'legacy:fold:cloud');
    expect(onChange).toHaveBeenLastCalledWith({
      ...configured,
      avatar: {
        ...agent.avatar,
        ...hexAppearance('#123456'),
        lightEyes: false,
        family: 'fold',
        foldShape: 'cloud',
        character: {
          preset: 'bloom',
          selections: { eyes: 'dots', accessory: 'bow' },
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
          preset: 'blue_beret',
          bodyColor: '#123456',
          selections: { shape: 'heart', eyewear: 'none', accessory: 'none' },
        },
      },
    });
  });

  it('retains native eye choices when replacing a legacy custom color with a named HSL swatch', () => {
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
        hue: 220,
        saturation: 85,
        lightness: undefined,
        lightEyes: false,
        lookAt: 'wander',
        character: { preset: 'bloom', selections: { eyes: 'dots' } },
      },
    });
  });

  it('replays working on the main migrated preview without editing the saved recipe', () => {
    const onChange = jest.fn();
    const view = withRuntime(agent, onChange);
    const hero = () =>
      view.UNSAFE_getAllByType(CharacterAvatar).find((node) => node.props.size === 162)!;
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
      character: { preset: 'bloom', selections: { accessory: 'crown' } },
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
    preset: 'bloom',
    selections: { accessory: 'crown', eyewear: 'monocle', eyes: 'dots' },
  });
  expect(updated.avatar).toMatchObject({
    family: 'fold',
    foldShape: 'cloud',
    foldDepth: initial.avatar.foldDepth,
    eyeGap: initial.avatar.eyeGap,
    hue: 220,
    saturation: 85,
  });
  expect(legacyRecipe(updated.avatar).points).toEqual(initialOutline);
  fireEvent.press(view.getByLabelText('Custom avatar color'));
  fireEvent(view.UNSAFE_getByType(CustomColorPicker), 'change', '#abcdef');
  updated = onChange.mock.lastCall![0] as AgentCreatorAgent;
  expect(avatarHex(updated.avatar)).toBe('#abcdef');
  expect(updated.avatar.character?.selections).toEqual({
    accessory: 'crown',
    eyewear: 'monocle',
    eyes: 'dots',
  });
  expect(legacyRecipe(updated.avatar).points).toEqual(initialOutline);
});
