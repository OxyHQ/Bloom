import type { ComponentType } from 'react';

export type PanelRouteParams = Record<string, string | string[]>;
export type PanelHref = string | { pathname: string; params?: Record<string, unknown> };
export interface PanelRouteDefinition {
  path: string;
  component: ComponentType;
  /** Outer to inner. A layout renders its child through PanelRouteSlot. */
  layouts?: readonly ComponentType[];
}
export interface PanelRouteMatch {
  route: PanelRouteDefinition;
  params: PanelRouteParams;
}

/** URL semantics shared by imperative navigation and links. */
export function resolvePanelHref(href: PanelHref, current = '/'): string {
  let path = typeof href === 'string' ? href : href.pathname;
  if (typeof href !== 'string') {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(href.params ?? {})) {
      const token = `[${key}]`;
      const rest = `[...${key}]`;
      if (path.includes(token)) path = path.replace(token, encodeURIComponent(String(value)));
      else if (path.includes(rest))
        path = path.replace(
          rest,
          (Array.isArray(value) ? value : [value])
            .map((part) => encodeURIComponent(String(part)))
            .join('/'),
        );
      else if (value != null)
        for (const item of Array.isArray(value) ? value : [value]) query.append(key, String(item));
    }
    if (query.size) path += `${path.includes('?') ? '&' : '?'}${query}`;
  }
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path)) return path;
  // Route groups do not form part of the public URL.
  path = path.replace(/\([^/]+\)\//g, '');
  const url = new URL(path, `https://panel.invalid${current}`);
  return `${url.pathname}${url.search}${url.hash}`;
}

export function matchPanelRoute(
  routes: readonly PanelRouteDefinition[],
  href: string,
): PanelRouteMatch | null {
  const url = new URL(href, 'https://panel.invalid');
  const segments = url.pathname.split('/').filter(Boolean);
  let best: (PanelRouteMatch & { score: number }) | null = null;
  for (const route of routes) {
    const pattern = route.path.split('/').filter(Boolean);
    const params: PanelRouteParams = {};
    let score = 0;
    let index = 0;
    let matched = true;
    for (const part of pattern) {
      const rest = /^\[\.\.\.(.+)\]$/.exec(part);
      const parameter = /^\[(.+)\]$/.exec(part);
      if (rest) {
        if (index >= segments.length) {
          matched = false;
          break;
        }
        params[rest[1]!] = segments.slice(index).map(decodeURIComponent);
        index = segments.length;
        score += 1;
      } else if (parameter && segments[index] !== undefined) {
        params[parameter[1]!] = decodeURIComponent(segments[index++]!);
        score += 10;
      } else if (part === segments[index]) {
        index++;
        score += 100;
      } else {
        matched = false;
        break;
      }
    }
    if (!matched || index !== segments.length || (best && best.score >= score)) continue;
    for (const key of new Set(url.searchParams.keys())) {
      if (key in params) continue;
      const values = url.searchParams.getAll(key);
      params[key] = values.length === 1 ? values[0]! : values;
    }
    best = { route, params, score };
  }
  return best;
}
