/**
 * @jest-environment jsdom
 *
 * `MapControls`, `MapCompass` and `MapLayerPicker` through the REAL
 * react-native-web.
 *
 * What this file is FOR. Every control in this stack draws a glyph and no text,
 * so the NAME is the only thing that reaches a screen reader — and two of them
 * are TOGGLES, which react-native-web reads only through `aria-pressed` while
 * React Native reads only `accessibilityState`. Both spellings are asserted on
 * the rendered element rather than on the prop that was passed in.
 *
 * The compass carries a third claim a prop test cannot see: the needle turns by
 * MINUS the heading (it points at north while the map turns), and the control
 * removes itself once the map is already there.
 */
import React from 'react';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { MAP_CONTROLS_GEOMETRY, MapCompass, MapControls, MapLayerPicker } from '../map-controls';
import type { MapLayerOption, MapOverlayOption } from '../map-controls';
import {
  byLabel,
  byTestId,
  click,
  mount,
  queryTestId,
  root$,
  setupHarness,
} from './support/commerce-harness';

setupHarness();

const noop = () => undefined;

const LAYERS: MapLayerOption[] = [
  { id: 'standard', label: 'Standard' },
  { id: 'satellite', label: 'Satellite' },
];
const OVERLAYS: MapOverlayOption[] = [{ id: 'traffic', label: 'Traffic' }];

describe('every control draws a glyph, so every control is named by prop', () => {
  it('names the stack and each control', () => {
    mount(
      <MapControls
        onLocate={noop}
        heading={45}
        onResetNorth={noop}
        onZoomIn={noop}
        onZoomOut={noop}
        onTiltChange={noop}
        testID="m"
      />,
    );
    expect(byTestId('m').getAttribute('role')).toBe('group');
    expect(byTestId('m').getAttribute('aria-label')).toBe('Map controls');
    expect(byTestId('m-locate').getAttribute('aria-label')).toBe('Show my location');
    expect(byTestId('m-zoom-in').getAttribute('aria-label')).toBe('Zoom in');
    expect(byTestId('m-zoom-out').getAttribute('aria-label')).toBe('Zoom out');
    expect(byTestId('m-tilt').getAttribute('aria-label')).toBe('Tilt the map');
    expect(byTestId('m-zoom').getAttribute('aria-label')).toBe('Zoom');
  });

  it('takes every word from `labels`', () => {
    mount(
      <MapControls
        onLocate={noop}
        onZoomIn={noop}
        onZoomOut={noop}
        onTiltChange={noop}
        tilted
        following
        labels={{
          group: 'Controls del mapa',
          following: 'Deixa de seguir',
          zoomIn: 'Apropa',
          zoomOut: 'Allunya',
          zoom: 'Zoom del mapa',
          tiltOff: 'Aplana el mapa',
        }}
        testID="m"
      />,
    );
    expect(byTestId('m').getAttribute('aria-label')).toBe('Controls del mapa');
    expect(byTestId('m-locate').getAttribute('aria-label')).toBe('Deixa de seguir');
    expect(byTestId('m-zoom-in').getAttribute('aria-label')).toBe('Apropa');
    expect(byTestId('m-tilt').getAttribute('aria-label')).toBe('Aplana el mapa');
  });

  it('draws only what it was given a handler for', () => {
    mount(<MapControls onZoomIn={noop} onZoomOut={noop} testID="m" />);
    expect(queryTestId('m-locate')).toBeNull();
    expect(queryTestId('m-tilt')).toBeNull();
    expect(queryTestId('m-compass')).toBeNull();
    expect(queryTestId('m-zoom-in')).not.toBeNull();
  });

  it('draws no zoom pair for one zoom handler — one zoom button is not a pair', () => {
    mount(<MapControls onZoomIn={noop} testID="m" />);
    expect(queryTestId('m-zoom')).toBeNull();
  });
});

describe('the two toggles carry BOTH spellings', () => {
  it('announces the locate toggle as pressed and changes its name with it', () => {
    mount(<MapControls onLocate={noop} following={false} testID="m" />);
    expect(byTestId('m-locate').getAttribute('aria-pressed')).toBe('false');
    mount(<MapControls onLocate={noop} following testID="m" />);
    expect(byTestId('m-locate').getAttribute('aria-pressed')).toBe('true');
    expect(byTestId('m-locate').getAttribute('aria-label')).toBe('Stop following my location');
  });

  it('leaves a locate button that is not a toggle without a pressed state', () => {
    // `aria-pressed="false"` on a button nobody toggles announces a state that
    // does not exist.
    mount(<MapControls onLocate={noop} testID="m" />);
    expect(byTestId('m-locate').hasAttribute('aria-pressed')).toBe(false);
  });

  it('flips the tilt toggle to the opposite of what it was given', () => {
    const calls: boolean[] = [];
    mount(<MapControls tilted onTiltChange={(next) => calls.push(next)} testID="m" />);
    expect(byTestId('m-tilt').getAttribute('aria-pressed')).toBe('true');
    click(byTestId('m-tilt'));
    expect(calls).toEqual([false]);
  });

  it('disables the zoom button at the end of the range', () => {
    mount(<MapControls onZoomIn={noop} onZoomOut={noop} canZoomIn={false} testID="m" />);
    expect(byTestId('m-zoom-in').getAttribute('aria-disabled')).toBe('true');
    expect(byTestId('m-zoom-out').hasAttribute('aria-disabled')).toBe(false);
  });
});

describe('the compass points at north while the map turns', () => {
  /** The rotation actually applied to the needle, in degrees. */
  function needleRotation(testID: string): number | null {
    const found = Array.from(byTestId(testID).querySelectorAll<HTMLElement>('*')).find((element) =>
      /rotate\(/.test(element.style.transform ?? ''),
    );
    const match = found?.style.transform.match(/rotate\((-?[\d.]+)deg\)/);
    return match ? Number(match[1]) : null;
  }

  it('turns the needle by MINUS the heading', () => {
    mount(<MapCompass heading={45} onPress={noop} testID="c" />);
    expect(needleRotation('c')).toBe(-45);
    mount(<MapCompass heading={270} onPress={noop} testID="c" />);
    expect(needleRotation('c')).toBe(-270);
  });

  it('removes itself once the map is already pointing north', () => {
    mount(<MapCompass heading={0} onPress={noop} testID="c" />);
    expect(queryTestId('c')).toBeNull();
    mount(<MapCompass heading={MAP_CONTROLS_GEOMETRY.northTolerance / 2} onPress={noop} testID="c" />);
    expect(queryTestId('c')).toBeNull();
    mount(<MapCompass heading={MAP_CONTROLS_GEOMETRY.northTolerance * 4} onPress={noop} testID="c" />);
    expect(queryTestId('c')).not.toBeNull();
  });

  it('stays when the app pins it, and says which way the map is facing', () => {
    mount(<MapCompass heading={0} hideAtNorth={false} onPress={noop} testID="c" />);
    expect(byTestId('c-button').getAttribute('aria-label')).toBe('Facing 0 degrees. Reset to north');
    mount(<MapCompass heading={34.4} hideAtNorth={false} onPress={noop} testID="c" />);
    expect(byTestId('c-button').getAttribute('aria-label')).toBe('Facing 34 degrees. Reset to north');
  });

  it('resets the map on a press', () => {
    let pressed = 0;
    mount(<MapCompass heading={90} onPress={() => (pressed += 1)} testID="c" />);
    click(byTestId('c-button'));
    expect(pressed).toBe(1);
  });
});

describe('the layer picker is a trigger, not a second menu', () => {
  it('names the trigger and declares what it opens', () => {
    mount(<MapLayerPicker layers={LAYERS} layerId="standard" overlays={OVERLAYS} testID="l" />);
    const trigger = byTestId('l-trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Map layers');
    // `asChild` composes the open handler AND the a11y state onto the item —
    // an item that dropped the props it was handed would announce neither.
    expect(trigger.getAttribute('aria-haspopup')).toBe('menu');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('takes a translated trigger name', () => {
    mount(<MapLayerPicker layers={LAYERS} labels={{ trigger: 'Capes del mapa' }} testID="l" />);
    expect(byTestId('l-trigger').getAttribute('aria-label')).toBe('Capes del mapa');
  });

  it('is inert while disabled', () => {
    mount(<MapLayerPicker layers={LAYERS} disabled testID="l" />);
    expect(byTestId('l-trigger').getAttribute('aria-disabled')).toBe('true');
  });

  it('places into the stack as one more island', () => {
    mount(
      <MapControls onZoomIn={noop} onZoomOut={noop} testID="m">
        <MapLayerPicker layers={LAYERS} testID="l" />
      </MapControls>,
    );
    expect(byTestId('m').contains(byTestId('l-trigger'))).toBe(true);
    expect(root$().contains(byLabel('Map layers'))).toBe(true);
  });
});
