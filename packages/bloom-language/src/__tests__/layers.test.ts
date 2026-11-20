import { addToLayers, type Layer, type LayerModifier } from '../style';
import { Text } from '../primitives';

function layersOf(node: { modifiers: readonly unknown[] }): string[] {
  const layers: Layer[] = [];
  for (const m of node.modifiers as LayerModifier[]) addToLayers(layers, m);
  return layers.map((layer) => layer.key);
}

describe('modifier order maps onto as few views as it allows', () => {
  it('padding then background is one view: the fill covers the padding', () => {
    expect(layersOf(Text('x').padding('md').background('surface'))).toEqual([
      'p:all:md;bg:surface',
    ]);
  });

  it('background then padding is two: the padding sits outside the fill', () => {
    expect(layersOf(Text('x').background('surface').padding('md'))).toEqual([
      'bg:surface',
      'p:all:md',
    ]);
  });

  it('a second padding on the same edge adds, so it wraps', () => {
    expect(layersOf(Text('x').padding('md').padding('leading', 'lg'))).toEqual([
      'p:all:md',
      'p:leading:lg',
    ]);
    expect(layersOf(Text('x').padding('leading', 'md').padding('trailing', 'lg'))).toEqual([
      'p:leading:md;p:trailing:lg',
    ]);
  });

  it('a corner after the fill clips it; a fill after the corner is not clipped', () => {
    expect(layersOf(Text('x').background('surface').corner('lg'))).toEqual(['bg:surface;r:lg']);
    expect(layersOf(Text('x').corner('lg').background('surface'))).toEqual(['r:lg', 'bg:surface']);
  });

  it('a frame after padding includes it; padding after a frame grows past it', () => {
    expect(layersOf(Text('x').padding('md').frame({ height: 'xl' }))).toEqual([
      'p:all:md;f:height=xl',
    ]);
    expect(layersOf(Text('x').frame({ height: 'xl' }).padding('md'))).toEqual([
      'f:height=xl',
      'p:all:md',
    ]);
  });
});
