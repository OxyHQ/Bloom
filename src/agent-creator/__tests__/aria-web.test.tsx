/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CharacterRuntimeFixture } from './support/character-runtime-fixture';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator.web';
import { COLOR_PRESET_REGISTRY } from '../../theme/color-presets';

const displayName = (key: string) =>
  COLOR_PRESET_REGISTRY.find(({ name }) => name === key)!.displayName;
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

it('announces the selected agent colour and profile fields through real react-native-web attributes', () => {
  render(
    <CharacterRuntimeFixture value={{}}>
      <AgentCreator
        agent={{
          id: 'design',
          name: 'Designer',
          label: 'Design',
          description: '',
          avatar: { preset: 'blue_beret', shape: 'rounded_diamond' },
          color: 'blue',
          preferences: { voice: 'local', speed: 1, language: 'en', notifications: true },
        }}
        onChange={() => {}}
      />
    </CharacterRuntimeFixture>,
  );
  const group = container.querySelector('[data-testid="agent-avatar-color-selector"]')!;
  const swatch = (key: string) =>
    Array.from(group.querySelectorAll('[role="option"]')).find(
      (node) => node.getAttribute('aria-label') === displayName(key),
    );
  expect(swatch('blue')?.getAttribute('aria-selected')).toBe('true');
  expect(swatch('teal')?.getAttribute('aria-selected')).toBe('false');
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

it('chooses another agent colour through the shared swatches', () => {
  const agent = {
    id: 'beta',
    name: 'Felipe',
    label: '',
    description: '',
    avatar: { preset: 'blue_beret' as const },
    color: 'teal',
  };
  const onChange = jest.fn();
  render(
    <CharacterRuntimeFixture value={{}}>
      <AgentCreator agent={agent} onChange={onChange} />
    </CharacterRuntimeFixture>,
  );
  const group = container.querySelector('[data-testid="agent-avatar-color-selector"]')!;
  const lagoon = Array.from(group.querySelectorAll('[role="option"]')).find(
    (node) => node.getAttribute('aria-label') === displayName('lagoon'),
  )!;
  act(() => lagoon.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(onChange).toHaveBeenLastCalledWith({ ...agent, color: 'lagoon' });
});

it.each([
  ['#000000', '#6b6b6b', 'rgb(107, 107, 107)'],
  ['#ffffff', '#ffffff', 'rgb(255, 255, 255)'],
  ['#080019', '#746587', 'rgb(116, 101, 135)'],
  ['#0000ff', '#4852ff', 'rgb(72, 82, 255)'],
  ['#4778ff', '#4778ff', 'rgb(71, 120, 255)'],
])(
  'paints the SVG eye wheel in a legacy %s account colour, lifted to the skin floor',
  (color, _normalized, background) => {
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
    act(() => eye.dispatchEvent(new MouseEvent('click', { bubbles: true })));
    const emitted = onChange.mock.lastCall![0];
    expect(emitted.color).toBe(color);
    expect(emitted.avatar).toMatchObject({ eyes: 'clippo' });
    expect(emitted.avatar).not.toHaveProperty('bodyColor');
  },
);
