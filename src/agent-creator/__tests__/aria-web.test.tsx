/** @jest-environment jsdom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
import { AgentCreator } from '../AgentCreator.web';
import { CustomColorPicker } from '../CustomColorPicker';
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { FOLD_CONFIG } from '../../agent-avatar/model';

let container: HTMLDivElement, root: Root;
beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(ui: React.ReactNode) { act(() => root.render(<BloomThemeProvider mode="light" colorPreset="teal">{ui}</BloomThemeProvider>)); }

it('announces selected avatar colors and profile fields through real react-native-web attributes', () => {
  render(<AgentCreator agent={{ id: 'design', name: 'Designer', label: 'Design', description: '', avatar: { ...FOLD_CONFIG, hue: 220, saturation: 85, eyes: 'happy', foldShape: 'diamond' } }} onChange={() => {}} />);
  expect(container.querySelector('[aria-label="Blue avatar"]')?.getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('[aria-label="Teal avatar"]')?.getAttribute('aria-pressed')).toBe('false');
  expect(container.querySelector('[aria-label="Notify when this agent finishes"]')?.getAttribute('aria-checked')).toBe('true');
  expect(container.querySelector('[aria-label="Agent name"]')?.getAttribute('value')).toBe('Designer');
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
