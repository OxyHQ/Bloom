/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FOLD_CONFIG } from '../../agent-avatar/model';
import { Field } from '../../field';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { AgentCreator } from '../AgentCreator.web';
import { CustomColorPicker } from '../CustomColorPicker';
jest.mock('react-native', () => jest.requireActual('react-native-web'));

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
