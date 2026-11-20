import { isNode, type NavStackProps, type Node, type RouteProps } from '../node';

/** A stack's routes, in order: a bare name is pushed. */
export function routesOf(node: Node): RouteProps[] {
  return (node.props as NavStackProps).routes.map((route) =>
    isNode(route) && route.kind === 'route'
      ? (route.props as RouteProps)
      : { name: String(route), presentation: 'push' as const },
  );
}
