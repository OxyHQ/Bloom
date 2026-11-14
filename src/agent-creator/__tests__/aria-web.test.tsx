/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { Field } from '../../field';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator.web';
import { normalizeAvatarSkinColor } from '../../agent-avatar/skin-color';
import { CustomColorPicker } from '../CustomColorPicker';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
// This suite measures real DOM controls; the SVG renderer is covered separately by browser checks.
jest.mock('../../agent-avatar/CharacterAvatar', () => ({
  CharacterAvatar: () => null,
}));

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
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
    <CharacterRuntimeFixture value={{}}>
      <AgentCreator
        agent={{
          id: 'design',
          name: 'Designer',
          label: 'Design',
          description: '',
          avatar: { preset: 'blue_beret', shape: 'rounded_diamond' },
          color: '#4778ff',
          preferences: { voice: 'local', speed: 1, language: 'en', notifications: true },
        }}
        onChange={() => {}}
      />
    </CharacterRuntimeFixture>,
  );
  expect(container.querySelector('[aria-label="Blue avatar"]')?.getAttribute('aria-pressed')).toBe(
    'true',
  );
  expect(container.querySelector('[aria-label="Teal avatar"]')?.getAttribute('aria-pressed')).toBe(
    'false',
  );
  expect(
    container
      .querySelector('[aria-label="Notify when this agent finishes"]')
      ?.getAttribute('aria-checked'),
  ).toBe('true');
  expect(container.querySelector('[aria-label="Agent name"]')?.getAttribute('value')).toBe(
    'Designer',
  );
});

it('offers eye styles without an eye-placement control, including saved spacing', () => {
  const agent = {
    id: 'todd',
    name: 'Todd',
    label: '',
    description: '',
    avatar: { preset: 'lime_frog' as const, eyes: 'todd' as const, eyeSpacing: 1.23 },
    color: 'green',
  };
  const onChange = jest.fn();
  render(
    <CharacterRuntimeFixture value={{}}>
      <AgentCreator agent={agent} onChange={onChange} />
    </CharacterRuntimeFixture>,
  );
  expect(container.querySelector('[aria-label="Eye spacing"]')).toBeNull();
  expect(container.querySelector('[aria-label="Todd"]')?.getAttribute('aria-pressed')).toBe('true');
  expect(onChange).not.toHaveBeenCalled();
});

it('announces the custom saturation/brightness and hue values', () => {
  render(<CustomColorPicker value="#ff0000" onChange={() => {}} />);
  const field = container.querySelector('[aria-label="Saturation and brightness"]');
  expect(field?.getAttribute('role')).toBe('slider');
  expect(field?.getAttribute('aria-valuenow')).toBe('100');
  expect(field?.getAttribute('aria-valuetext')).toBe('saturation 100%, brightness 100%');
  expect(container.querySelector('[aria-label="Hue"]')?.getAttribute('aria-valuenow')).toBe('0');
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
      slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })),
    );
  }
  const input = container.querySelector<HTMLInputElement>('[aria-label="Brand color"]')!;
  expect(input.readOnly).toBe(true);
  expect(input.getAttribute('aria-invalid')).toBe('true');
  expect(document.getElementById(input.getAttribute('aria-describedby')!)?.textContent).toBe(
    'Choose another color',
  );
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
        avatar: { preset: 'blue_beret' },
        color: 'teal',
      }}
      onChange={() => {}}
    />,
  );
  expect(container.querySelector('[aria-label="Nombre del agente"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Agent name"]')).toBeNull();
  expect(container.textContent).toContain('Notificaciones');
});

it('announces a custom account colour and returns to a named one through the shared palette', () => {
  const agent = {
    id: 'beta',
    name: 'Felipe',
    label: '',
    description: '',
    avatar: { preset: 'blue_beret' as const },
    color: '#123456',
  };
  const onChange = jest.fn();
  render(
    <CharacterRuntimeFixture value={{}}>
      <AgentCreator agent={agent} onChange={onChange} />
    </CharacterRuntimeFixture>,
  );
  const custom = container.querySelector('[aria-label="Custom avatar color"]')!;
  const blue = container.querySelector('[aria-label="Blue avatar"]')!;
  expect(custom.getAttribute('aria-pressed')).toBe('true');
  expect(blue.getAttribute('aria-pressed')).toBe('false');
  act(() => blue.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  // The account colour changes; the character is handed back as it was, without paint.
  expect(onChange).toHaveBeenLastCalledWith({ ...agent, color: '#4778ff' });
});

it.each([
  ['#000000', '#6b6b6b', 'rgb(107, 107, 107)'],
  ['#ffffff', '#ffffff', 'rgb(255, 255, 255)'],
  ['#080019', '#746587', 'rgb(116, 101, 135)'],
  ['#0000ff', '#4852ff', 'rgb(72, 82, 255)'],
  ['#4778ff', '#4778ff', 'rgb(71, 120, 255)'],
])(
  'paints the SVG eye wheel in a %s account colour, lifted to the skin floor',
  (color, normalized, background) => {
    const agent = {
      id: 'color-preview',
      name: 'Preview',
      label: '',
      description: '',
      avatar: { preset: 'lime_frog' as const, eyes: 'todd' as const },
      color,
    };
    const onChange = jest.fn();
    render(
      <CharacterRuntimeFixture value={{}}>
        <AgentCreator agent={agent} onChange={onChange} />
      </CharacterRuntimeFixture>,
    );
    const eye = container.querySelector<HTMLElement>('[role="button"][aria-label="Clippo"]')!;
    expect(getComputedStyle(eye).backgroundColor).toBe(background);
    expect(normalizeAvatarSkinColor(color)).toBe(normalized);
    act(() => eye.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const emitted = onChange.mock.lastCall![0];
    expect(emitted.color).toBe(color);
    expect(emitted.avatar).toMatchObject({ eyes: 'clippo' });
    expect(emitted.avatar).not.toHaveProperty('bodyColor');
  },
);

it('coalesces rapid keyboard color edits into one frame without losing the final value', () => {
  const original = global.requestAnimationFrame;
  let flush: FrameRequestCallback | undefined;
  const schedule = jest.fn((callback: FrameRequestCallback) => {
    flush = callback;
    return 123;
  });
  global.requestAnimationFrame = schedule;
  try {
    const onChange = jest.fn();
    render(<CustomColorPicker value="#ff0000" onChange={onChange} />);
    schedule.mockClear();
    const field = container.querySelector('[aria-label="Saturation and brightness"]')!;
    act(() => {
      for (let i = 0; i < 5; i++)
        field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
    expect(schedule).toHaveBeenCalledTimes(1);
    act(() => flush!(0));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('#ff1a1a');
    expect(field.getAttribute('aria-valuetext')).toBe('saturation 90%, brightness 100%');
  } finally {
    global.requestAnimationFrame = original;
  }
});
