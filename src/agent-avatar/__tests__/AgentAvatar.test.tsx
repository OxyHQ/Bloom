import { act, create, type ReactTestRenderer } from 'react-test-renderer';
import { AgentAvatar } from '../AgentAvatar';
import { AgentFace } from '../AgentFace';
import { DrawingContext } from '../drawing';
import { DEFAULT_CONFIG, FOLD_CONFIG } from '../model';
import { Drawing, splitPaint } from '../SvgDrawing';

jest.mock('../../styles/styled-primitives', () => ({
  StyledView: require('react-native').View,
}));

describe('AgentAvatar lifecycle', () => {
  let renderer: ReactTestRenderer;
  const request = jest.fn(() => 1),
    cancel = jest.fn();
  const priorRequest = global.requestAnimationFrame,
    priorCancel = global.cancelAnimationFrame;
  beforeEach(() => {
    request.mockClear();
    cancel.mockClear();
    global.requestAnimationFrame = request;
    global.cancelAnimationFrame = cancel;
  });
  afterEach(() => {
    if (renderer) act(() => renderer.unmount());
  });
  afterAll(() => {
    global.requestAnimationFrame = priorRequest;
    global.cancelAnimationFrame = priorCancel;
  });

  it('names its layout node, honors pause and redraws when the expression changes', () => {
    act(() => {
      renderer = create(
        <AgentAvatar
          config={{ ...DEFAULT_CONFIG, grain: 0 }}
          label="Ember"
          className="m-2"
          paused
        />,
      );
    });
    const root = renderer.root.findByProps({ accessibilityRole: 'image' });
    expect(root.props.accessibilityLabel).toBe('Ember');
    expect(root.props.className).toBe('m-2');
    const before = JSON.stringify(renderer.toJSON());
    act(() => {
      renderer.update(
        <AgentAvatar
          config={{ ...DEFAULT_CONFIG, grain: 0, eyes: 'happy' }}
          paused
          accessibilityLabel="Happy Ember"
        />,
      );
    });
    expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
      'Happy Ember',
    );
    expect(JSON.stringify(renderer.toJSON())).not.toBe(before);
    expect(request).not.toHaveBeenCalled();
  });
  it('schedules motion and cancels the pending frame when paused', () => {
    act(() => {
      renderer = create(<AgentAvatar config={{ ...FOLD_CONFIG, grain: 0 }} entranceKey={1} />);
    });
    expect(request).toHaveBeenCalledTimes(1);
    act(() => {
      renderer.update(<AgentAvatar config={{ ...FOLD_CONFIG, grain: 0 }} entranceKey={1} paused />);
    });
    expect(cancel).toHaveBeenCalledWith(1);
    expect(request).toHaveBeenCalledTimes(1);
  });
  it('localizes the default accessible name while preserving explicit overrides', () => {
    act(() => {
      renderer = create(
        <AgentAvatar config={{ ...DEFAULT_CONFIG, grain: 0 }} paused locale="es" />,
      );
    });
    expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
      'Avatar del agente',
    );
    act(() => {
      renderer.update(
        <AgentAvatar config={{ ...DEFAULT_CONFIG, grain: 0 }} paused locale="es" label="Peri" />,
      );
    });
    expect(renderer.root.findByProps({ accessibilityRole: 'image' }).props.accessibilityLabel).toBe(
      'Peri',
    );
  });
  it('composites the original grain at full recipe opacity between material and face', () => {
    const context = new DrawingContext();
    context.fillStyle = 'red';
    context.fillRect(0, 0, 200, 200);
    context.save();
    context.globalCompositeOperation = 'soft-light';
    context.globalAlpha = 0.36;
    context.fillStyle = context.createPattern(null, 'repeat');
    context.fillRect(0, 0, 200, 200);
    context.restore();
    context.fillStyle = 'black';
    context.fillRect(80, 80, 10, 30);
    act(() => {
      renderer = create(<Drawing context={context} size={64} />);
    });
    const views = renderer.root.findAllByType(require('react-native').View);
    expect(views[0]!.props.style.isolation).toBe('isolate');
    expect(views.slice(1).map((view) => view.props.style.mixBlendMode)).toEqual([
      'normal',
      'soft-light',
      'normal',
    ]);
    const grainPath = renderer.root
      .findAllByType(require('react-native-svg').Path)
      .find((path) => String(path.props.fill).includes('-grain'))!;
    expect(grainPath.props.fillOpacity).toBe(1);
    expect(grainPath.parent!.props.opacity).toBe(0.36);
  });
  it('positions emotion chips exactly at the source canvas origin with its optical size', () => {
    act(() => {
      renderer = create(<AgentFace config={{ ...DEFAULT_CONFIG, eyeSize: 24, eyeGap: 36 }} />);
    });
    const groups = renderer.root.findAllByType(require('react-native-svg').G);
    expect(
      groups.some(
        (group) =>
          group.props.transform ===
          'matrix(2.1176470588235294 0 0 2.1176470588235294 100 111.76470588235294)',
      ),
    ).toBe(true);
  });
  it('keeps native SVG stop alpha separate from its color', () => {
    expect(splitPaint('hsla(0,100%,50%,0.7)')).toEqual({
      color: 'rgb(255,0,0)',
      opacity: 0.7,
    });
    expect(splitPaint('hsla(-120,100%,50%,0)')).toEqual({
      color: 'rgb(0,0,255)',
      opacity: 0,
    });
  });
});
