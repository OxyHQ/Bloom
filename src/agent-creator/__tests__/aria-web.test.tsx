/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { Field } from '../../field';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator.web';
import { CustomColorPicker } from '../CustomColorPicker';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
// This suite measures real DOM controls; the separately tested hosted renderer needs browser APIs.
jest.mock('../../agent-avatar/CharacterAvatar', () => ({
  CharacterAvatar: () => null,
}));

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (
    globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
  ).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
});
function render(ui: React.ReactNode) {
  act(() =>
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    ),
  );
}

it('announces selected avatar colors and profile fields through real react-native-web attributes', () => {
  render(
    <AgentCreator
      agent={{
        id: 'design',
        name: 'Designer',
        label: 'Design',
        description: '',
        avatar: {
          ...FOLD_CONFIG,
          hue: 220,
          saturation: 85,
          eyes: 'happy',
          foldShape: 'diamond',
        },
      }}
      onChange={() => {}}
    />,
  );
  expect(
    container
      .querySelector('[aria-label="Blue avatar"]')
      ?.getAttribute('aria-pressed'),
  ).toBe('true');
  expect(
    container
      .querySelector('[aria-label="Teal avatar"]')
      ?.getAttribute('aria-pressed'),
  ).toBe('false');
  expect(
    container
      .querySelector('[aria-label="Notify when this agent finishes"]')
      ?.getAttribute('aria-checked'),
  ).toBe('true');
  expect(
    container.querySelector('[aria-label="Agent name"]')?.getAttribute('value'),
  ).toBe('Designer');
});

it('names fitted eye spacing, exposes its bounds and edits it with the keyboard', () => {
  const character = { preset: 'lime_frog', eyeSpacing: 1.23 };
  const key = JSON.stringify(character);
  const agent = {
    id: 'todd',
    name: 'Todd',
    label: '',
    description: '',
    avatar: { ...FOLD_CONFIG, character },
  };
  const onChange = jest.fn();
  render(
    <CharacterRuntimeFixture
      value={{
        runtimeUrl: '/runtime.mjs',
        capabilitiesByKey: new Map([
          [
            key,
            { key, available: {}, selected: { eyes: 'todd', shape: 'todd' } },
          ],
        ]),
      }}
    >
      <AgentCreator agent={agent} onChange={onChange} />
    </CharacterRuntimeFixture>,
  );
  const slider = container.querySelector('[aria-label="Eye spacing"]')!;
  expect(slider.getAttribute('role')).toBe('slider');
  expect(slider.getAttribute('aria-valuemin')).toBe('50');
  expect(slider.getAttribute('aria-valuemax')).toBe('150');
  expect(slider.getAttribute('aria-valuenow')).toBe('123');
  const thumb = slider.querySelector('[data-bloom-slider-thumb]')!;
  act(() =>
    thumb.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    ),
  );
  expect(onChange).toHaveBeenLastCalledWith({
    ...agent,
    avatar: { ...agent.avatar, character: { ...character, eyeSpacing: 1.24 } },
  });
});

it('announces the custom saturation/brightness and hue values', () => {
  render(<CustomColorPicker value="#ff0000" onChange={() => {}} />);
  const field = container.querySelector(
    '[aria-label="Saturation and brightness"]',
  );
  expect(field?.getAttribute('role')).toBe('slider');
  expect(field?.getAttribute('aria-valuenow')).toBe('100');
  expect(field?.getAttribute('aria-valuetext')).toBe(
    'saturation 100%, brightness 100%',
  );
  expect(
    container
      .querySelector('[aria-label="Hue"]')
      ?.getAttribute('aria-valuenow'),
  ).toBe('0');
  expect(container.querySelector('[aria-label="Hex color"]')).not.toBeNull();
});

it('carries disabled field constraints to all three color inputs and associates errors', () => {
  const onChange = jest.fn();
  render(
    <Field label="Brand color" disabled error="Choose another color">
      <CustomColorPicker value="#ff0000" onChange={onChange} />
    </Field>,
  );
  const sliders = Array.from(container.querySelectorAll('[role="slider"]'));
  expect(sliders).toHaveLength(2);
  for (const slider of sliders) {
    expect(slider.getAttribute('aria-disabled')).toBe('true');
    expect(slider.getAttribute('aria-invalid')).toBe('true');
    expect(slider.getAttribute('tabindex')).toBe('-1');
    act(() =>
      slider.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
      ),
    );
  }
  const input = container.querySelector<HTMLInputElement>(
    '[aria-label="Brand color"]',
  )!;
  expect(input.readOnly).toBe(true);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(
    document.getElementById(input.getAttribute('aria-describedby')!)
      ?.textContent,
  ).toBe('Choose another color');
  expect(onChange).not.toHaveBeenCalled();
});

it('uses the requested locale for drawn and announced editor copy', () => {
  render(
    <AgentCreator
      locale="es"
      agent={{
        id: 'design',
        name: '',
        label: '',
        description: '',
        avatar: { ...FOLD_CONFIG },
      }}
      onChange={() => {}}
    />,
  );
  expect(
    container.querySelector('[aria-label="Nombre del agente"]'),
  ).not.toBeNull();
  expect(container.querySelector('[aria-label="Agent name"]')).toBeNull();
  expect(container.textContent).toContain('Notificaciones');
});

it('announces a custom beta body color and returns to a named color through the shared palette', () => {
  const character = {
    preset: 'blue_beret',
    bodyColor: '#123456',
    selections: { eyes: 'oval' },
  };
  const agent = {
    id: 'beta',
    name: 'Felipe',
    label: '',
    description: '',
    avatar: { ...FOLD_CONFIG, character },
  };
  const capabilities = {
    key: JSON.stringify(character),
    selected: { color: 'blue', eyes: 'oval' },
    available: { 'color:blue': true },
  };
  const onChange = jest.fn();
  render(
    <CharacterRuntimeFixture
      value={{
        runtimeUrl: '/runtime.mjs',
        capabilitiesByKey: new Map([[capabilities.key, capabilities]]),
      }}
    >
      <AgentCreator agent={agent} onChange={onChange} />
    </CharacterRuntimeFixture>,
  );
  const custom = container.querySelector('[aria-label="Custom avatar color"]')!;
  const blue = container.querySelector('[aria-label="Blue avatar"]')!;
  expect(custom.getAttribute('aria-pressed')).toBe('true');
  expect(blue.getAttribute('aria-pressed')).toBe('false');
  act(() => blue.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(onChange).toHaveBeenLastCalledWith({
    ...agent,
    avatar: {
      ...agent.avatar,
      character: {
        preset: 'blue_beret',
        selections: { eyes: 'oval', color: 'blue', accessory: 'felipe_beret' },
      },
    },
  });
});
