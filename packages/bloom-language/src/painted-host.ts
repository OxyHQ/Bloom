import { type ComponentType, createElement, type ReactElement } from 'react';

import { drawLeaf, type Paint, type Palette, paintedLeaf } from './paint';
import { ink } from './style';
import { type InkToken, tokenKey } from './tokens';

/** A host drawn with the palette of the tree it is in (`palette`), which it paints from. */
type Host = (props: { palette: Palette } & Record<string, unknown>) => ReactElement;

const hosts = new WeakMap<object, Map<string, Host>>();

/**
 * `host` with one colour prop drawn from a colour token, for a Bloom component
 * that takes a colour as a value (a chip row's or a scroll surface's fade, an
 * auto-hiding bar's band): a role, at an opacity too, painted from the
 * palette of its tree (`palette`); an app's own colour as it is, the same in
 * both schemes. One host per component, prop and token, so
 * a chain that names the same colour draws the same component.
 */
export function paintedHost(
  host: ComponentType<never> | string,
  prop: string,
  token: InkToken,
): Host {
  let byToken = hosts.get(host as object);
  if (byToken === undefined) {
    byToken = new Map();
    hosts.set(host as object, byToken);
  }
  const id = `${prop}|${tokenKey(token)}`;
  let drawn = byToken.get(id);
  if (drawn === undefined) {
    const ref = ink(token);
    const component = host as ComponentType<Record<string, unknown>> | string;
    if (typeof ref === 'string') {
      drawn = ({ palette: _, ...props }) => createElement(component, { ...props, [prop]: ref });
    } else {
      const paint: Paint = {
        style: undefined,
        styleRoles: [],
        propRoles: [ref.opacity === undefined ? [prop, ref.role] : [prop, ref.role, ref.opacity]],
      };
      drawn = ({ palette, ...props }) =>
        drawLeaf(paintedLeaf(palette, { ...props, host: component, paint }));
    }
    byToken.set(id, drawn);
  }
  return drawn;
}
