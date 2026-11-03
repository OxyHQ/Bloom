import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { TOAST_LAYER_Z } from '../overlay';
import { ToastHost } from '../toast/ToastHost.native';

/**
 * The native toast host (Metro's `.native` pick; jest resolves the web file for
 * `./ToastHost`, so the subject is imported explicitly). It renders the rows
 * inline, but as a layer of their own: an absolute view with a `zIndex` forms a
 * stacking context, so the rows' negative `zIndex` orders them among themselves
 * instead of beneath the app's views (Fabric flattens the paintless
 * positioner), and the layer sits above the app as the web's portal does.
 */
const layerOf = (rendered: ReturnType<typeof render>) =>
  rendered.UNSAFE_root.findAll((node) => {
    const style = StyleSheet.flatten(node.props.style) as Record<string, unknown> | undefined;
    return typeof node.type === 'string' && style?.zIndex === TOAST_LAYER_Z;
  });

describe('ToastHost (native)', () => {
  it('holds the rows in one pinned, absolute toast layer', () => {
    const rendered = render(
      <ToastHost>
        <Text>Copiado</Text>
      </ToastHost>,
    );
    const layers = layerOf(rendered);
    expect(layers).toHaveLength(1);
    const style = StyleSheet.flatten(layers[0]!.props.style) as Record<string, unknown>;
    expect(style).toMatchObject({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 });
    expect(layers[0]!.findByType(Text).props.children).toBe('Copiado');
  });

  it('keeps the layer inside a consumer overlay wrapper', () => {
    const Wrapper = ({ children }: { children?: React.ReactNode }) => (
      <View testID="wrapper">{children}</View>
    );
    const rendered = render(
      <ToastHost ToasterOverlayWrapper={Wrapper}>
        <Text>Copiado</Text>
      </ToastHost>,
    );
    const [layer] = layerOf(rendered);
    expect(layer).toBeDefined();
    expect(rendered.getByTestId('wrapper').findAll((node) => node === layer)).toHaveLength(1);
  });
});
