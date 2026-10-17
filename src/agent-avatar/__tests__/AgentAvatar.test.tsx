import React from 'react';
import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { DEFAULT_CONFIG, FOLD_CONFIG } from '../model';
import { splitPaint } from '../SvgDrawing';

jest.mock('../../styles/styled-primitives', () => ({ StyledView: require('react-native').View }));

describe('AgentAvatar lifecycle', () => {
  let renderer: ReactTestRenderer;
  const request = jest.fn(() => 1), cancel = jest.fn();
  const priorRequest = global.requestAnimationFrame, priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    request.mockClear(); cancel.mockClear();
    global.requestAnimationFrame = request; global.cancelAnimationFrame = cancel;
  });
  afterEach(() => { if (renderer) act(() => renderer.unmount()); });
  afterAll(() => { global.requestAnimationFrame = priorRequest; global.cancelAnimationFrame = priorCancel; });

  it('names its layout node, honors pause and redraws when the expression changes', () => {
    act(() => { renderer = create(<AgentAvatar config={{ ...DEFAULT_CONFIG, grain: 0 }} label="Ember" className="m-2" paused />); });
    const root = renderer.root.findByProps({ accessibilityRole: 'image' });
    expect(root.props.accessibilityLabel).toBe('Ember'); expect(root.props.className).toBe('m-2');
    const before = JSON.stringify(renderer.toJSON());
    act(() => { renderer.update(<AgentAvatar config={{ ...DEFAULT_CONFIG, grain: 0, eyes: 'happy' }} paused accessibilityLabel="Happy Ember" />); });
    expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe('Happy Ember');
    expect(JSON.stringify(renderer.toJSON())).not.toBe(before);
    expect(request).not.toHaveBeenCalled();
  });
  it('schedules motion and cancels the pending frame when paused', () => {
    act(() => { renderer = create(<AgentAvatar config={{ ...FOLD_CONFIG, grain: 0 }} entranceKey={1} />); });
    expect(request).toHaveBeenCalledTimes(1);
    act(() => { renderer.update(<AgentAvatar config={{ ...FOLD_CONFIG, grain: 0 }} entranceKey={1} paused />); });
    expect(cancel).toHaveBeenCalledWith(1);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('keeps native SVG stop alpha separate from its color', () => {
    expect(splitPaint('hsla(0,100%,50%,0.7)')).toEqual({ color: 'rgb(255,0,0)', opacity: .7 });
    expect(splitPaint('hsla(-120,100%,50%,0)')).toEqual({ color: 'rgb(0,0,255)', opacity: 0 });
  });
});
