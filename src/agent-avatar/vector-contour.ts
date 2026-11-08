/**
 * Projected triangle union, represented by oriented boundary curves.
 * Every triangle contributes the same screen-space winding. Internal edges
 * cancel algebraically; the remaining directed graph is balanced, including
 * open/double-sided/non-manifold source meshes. Its Euler circuits have exactly
 * the triangles' winding field, so holes survive and subpaths cannot randomly
 * cancel each other as an undirected contour traversal would.
 */
type Mesh = {
  points: number[][];
  faces: number[][];
};
type Edge = {
  a: number;
  b: number;
  incidents: number[];
};
const topology = new WeakMap<object, Edge[]>();
function edgesOf(mesh: Mesh) {
  let edges = topology.get(mesh);
  if (edges) return edges;
  const map = new Map<number, Edge>();
  const count = mesh.points.length;
  mesh.faces.forEach((face, index) => {
    for (let k = 0; k < 3; k++) {
      const from = face[k]!,
        to = face[(k + 1) % 3]!;
      if (from === to) continue;
      const a = Math.min(from, to),
        b = Math.max(from, to);
      const key = a * count + b;
      let edge = map.get(key);
      if (!edge) {
        edge = { a, b, incidents: [] };
        map.set(key, edge);
      }
      edge.incidents.push((index + 1) * (from === a ? 1 : -1));
    }
  });
  edges = [...map.values()];
  topology.set(mesh, edges);
  return edges;
}
export function projectedContour(points: number[][], mesh: Mesh) {
  const signs = new Int8Array(mesh.faces.length);
  mesh.faces.forEach((face, index) => {
    const [a, b, c] = face as [number, number, number];
    const area =
      (points[b]![0]! - points[a]![0]!) * (points[c]![1]! - points[a]![1]!) -
      (points[b]![1]! - points[a]![1]!) * (points[c]![0]! - points[a]![0]!);
    signs[index]! = area > 1e-10 ? 1 : area < -1e-10 ? -1 : 0;
  });
  const outgoing = new Map<number, number[]>();
  for (const { a, b, incidents } of edgesOf(mesh)) {
    let weight = 0;
    for (const face of incidents) weight += (face > 0 ? 1 : -1) * signs[Math.abs(face) - 1]!;
    if (!weight) continue;
    const from = weight > 0 ? a : b,
      to = weight > 0 ? b : a;
    let next = outgoing.get(from);
    if (!next) {
      next = [];
      outgoing.set(from, next);
    }
    for (let n = Math.abs(weight); n > 0; n--) next.push(to);
  }
  let d = '';
  for (const [start, next] of outgoing) {
    if (!next.length) continue;
    const stack = [start],
      circuit: number[] = [];
    while (stack.length) {
      const neighbors = outgoing.get(stack[stack.length - 1]!);
      if (neighbors?.length) stack.push(neighbors.pop()!);
      else circuit.push(stack.pop()!);
    }
    // A balanced graph closes naturally. Never invent a straight closing edge.
    if (circuit.length < 4 || circuit[0]! !== circuit[circuit.length - 1]!) continue;
    circuit.reverse();
    d += `M${circuit.map((i) => `${points[i]![0]!.toFixed(4)} ${points[i]![1]!.toFixed(4)}`).join('L')}Z`;
  }
  return d;
}
