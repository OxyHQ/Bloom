/** Portable drawing commands. The artwork uses these on every platform; no DOM canvas. */
export type Point = [number, number];
export class DrawingMatrix {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  constructor(values: number[] = [1, 0, 0, 1, 0, 0]) {
    [this.a, this.b, this.c, this.d, this.e, this.f] = values as [
      number,
      number,
      number,
      number,
      number,
      number,
    ];
  }
  point(x: number, y: number): Point {
    return [this.a * x + this.c * y + this.e, this.b * x + this.d * y + this.f];
  }
  multiply(m: DrawingMatrix) {
    return new DrawingMatrix([
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d,
      this.a * m.e + this.c * m.f + this.e,
      this.b * m.e + this.d * m.f + this.f,
    ]);
  }
  toString() {
    return `matrix(${this.a} ${this.b} ${this.c} ${this.d} ${this.e} ${this.f})`;
  }
}
type Command = { kind: 'M' | 'L' | 'C' | 'Q' | 'A' | 'Z'; values: number[] };
export class DrawingPath {
  commands: Command[] = [];
  moveTo(x: number, y: number) {
    this.commands.push({ kind: 'M', values: [x, y] });
  }
  lineTo(x: number, y: number) {
    this.commands.push({ kind: 'L', values: [x, y] });
  }
  bezierCurveTo(...values: [number, number, number, number, number, number]) {
    this.commands.push({ kind: 'C', values });
  }
  quadraticCurveTo(...values: [number, number, number, number]) {
    this.commands.push({ kind: 'Q', values });
  }
  closePath() {
    this.commands.push({ kind: 'Z', values: [] });
  }
  addPath(path: DrawingPath, matrix = new DrawingMatrix()) {
    for (const command of path.commands) {
      if (command.kind === 'A') {
        const [rx, ry, degrees, large, sweep, x, y] = command.values as [
          number,
          number,
          number,
          number,
          number,
          number,
          number,
        ];
        const angle = (degrees * Math.PI) / 180;
        const ux =
          rx * (matrix.a * Math.cos(angle) + matrix.c * Math.sin(angle));
        const uy =
          rx * (matrix.b * Math.cos(angle) + matrix.d * Math.sin(angle));
        const vx =
          ry * (-matrix.a * Math.sin(angle) + matrix.c * Math.cos(angle));
        const vy =
          ry * (-matrix.b * Math.sin(angle) + matrix.d * Math.cos(angle));
        const xx = ux * ux + vx * vx,
          yy = uy * uy + vy * vy,
          xy = ux * uy + vx * vy;
        const difference = Math.hypot(xx - yy, 2 * xy);
        this.commands.push({
          kind: 'A',
          values: [
            Math.sqrt((xx + yy + difference) / 2),
            Math.sqrt(Math.max(0, (xx + yy - difference) / 2)),
            (Math.atan2(2 * xy, xx - yy) * 90) / Math.PI,
            large,
            matrix.a * matrix.d - matrix.b * matrix.c < 0 ? 1 - sweep : sweep,
            ...matrix.point(x, y),
          ],
        });
      } else {
        const values = command.values.flatMap((value, i) =>
          i % 2 ? [] : matrix.point(value, command.values[i + 1]!),
        );
        this.commands.push({ kind: command.kind, values });
      }
    }
  }
  ellipse(
    x: number,
    y: number,
    rx: number,
    ry: number,
    rotation: number,
    start: number,
    end: number,
    reverse = false,
  ) {
    // SVG elliptical arcs retain the original profile exactly, including its
    // winding through a rear-facing turn; a four-cubic circle is an approximation.
    const span = Math.min(Math.PI * 2, Math.abs(end - start));
    const segments = Math.ceil(span / Math.PI);
    if (!segments) return;
    const step = ((reverse ? -1 : 1) * span) / segments;
    const point = (angle: number): Point => [
      x +
        rx * Math.cos(angle) * Math.cos(rotation) -
        ry * Math.sin(angle) * Math.sin(rotation),
      y +
        rx * Math.cos(angle) * Math.sin(rotation) +
        ry * Math.sin(angle) * Math.cos(rotation),
    ];
    this.moveTo(...point(start));
    for (let i = 1; i <= segments; i++) {
      this.commands.push({
        kind: 'A',
        values: [
          rx,
          ry,
          (rotation * 180) / Math.PI,
          Math.abs(step) > Math.PI ? 1 : 0,
          reverse ? 0 : 1,
          ...point(start + i * step),
        ],
      });
    }
    this.closePath();
  }
  toString() {
    return this.commands.map((c) => `${c.kind}${c.values.join(' ')}`).join(' ');
  }
}
export class DrawingGradient {
  stops: { offset: number; color: string }[] = [];
  constructor(
    public kind: 'linear' | 'radial',
    public coordinates: number[],
    public matrix: DrawingMatrix,
  ) {}
  addColorStop(offset: number, color: string) {
    this.stops.push({ offset, color });
  }
}
export type DrawingPaint = string | DrawingGradient | { kind: 'grain' };
export interface DrawingState {
  matrix: DrawingMatrix;
  clips: DrawingPath[];
  fillStyle: DrawingPaint;
  strokeStyle: DrawingPaint;
  globalAlpha: number;
  lineWidth: number;
  lineCap: 'butt' | 'round' | 'square';
  globalCompositeOperation: string;
  font: string;
  textAlign: string;
  textBaseline: string;
}
export type DrawingNode = DrawingState & {
  path?: DrawingPath;
  stroke?: boolean;
  text?: string;
  x?: number;
  y?: number;
};
export class DrawingContext implements DrawingState {
  matrix = new DrawingMatrix();
  clips: DrawingPath[] = [];
  fillStyle: DrawingPaint = '#000';
  strokeStyle: DrawingPaint = '#000';
  globalAlpha = 1;
  lineWidth = 1;
  lineCap: 'butt' | 'round' | 'square' = 'butt';
  globalCompositeOperation = 'source-over';
  font = '10px sans-serif';
  textAlign = 'left';
  textBaseline = 'alphabetic';
  nodes: DrawingNode[] = [];
  private stack: DrawingState[] = [];
  private current = new DrawingPath();
  private snapshot(): DrawingState {
    return {
      matrix: this.matrix,
      clips: [...this.clips],
      fillStyle: this.fillStyle,
      strokeStyle: this.strokeStyle,
      globalAlpha: this.globalAlpha,
      lineWidth: this.lineWidth,
      lineCap: this.lineCap,
      globalCompositeOperation: this.globalCompositeOperation,
      font: this.font,
      textAlign: this.textAlign,
      textBaseline: this.textBaseline,
    };
  }
  save() {
    this.stack.push(this.snapshot());
  }
  restore() {
    const state = this.stack.pop();
    if (state) Object.assign(this, state);
  }
  transform(...m: [number, number, number, number, number, number]) {
    this.matrix = this.matrix.multiply(new DrawingMatrix(m));
  }
  translate(x: number, y: number) {
    this.transform(1, 0, 0, 1, x, y);
  }
  scale(x: number, y: number) {
    this.transform(x, 0, 0, y, 0, 0);
  }
  rotate(a: number) {
    this.transform(Math.cos(a), Math.sin(a), -Math.sin(a), Math.cos(a), 0, 0);
  }
  beginPath() {
    this.current = new DrawingPath();
  }
  moveTo(x: number, y: number) {
    this.current.moveTo(x, y);
  }
  lineTo(x: number, y: number) {
    this.current.lineTo(x, y);
  }
  bezierCurveTo(...p: [number, number, number, number, number, number]) {
    this.current.bezierCurveTo(...p);
  }
  quadraticCurveTo(...p: [number, number, number, number]) {
    this.current.quadraticCurveTo(...p);
  }
  closePath() {
    this.current.closePath();
  }
  clip(path = this.current) {
    const projected = new DrawingPath();
    projected.addPath(path, this.matrix);
    this.clips.push(projected);
  }
  fill(path = this.current) {
    this.nodes.push({ ...this.snapshot(), path });
  }
  stroke(path = this.current) {
    this.nodes.push({ ...this.snapshot(), path, stroke: true });
  }
  fillRect(x: number, y: number, width: number, height: number) {
    const path = new DrawingPath();
    path.moveTo(x, y);
    path.lineTo(x + width, y);
    path.lineTo(x + width, y + height);
    path.lineTo(x, y + height);
    path.closePath();
    this.fill(path);
  }
  fillText(text: string, x: number, y: number) {
    this.nodes.push({ ...this.snapshot(), text, x, y });
  }
  createLinearGradient(...coordinates: [number, number, number, number]) {
    return new DrawingGradient('linear', coordinates, this.matrix);
  }
  createRadialGradient(
    ...coordinates: [number, number, number, number, number, number]
  ) {
    return new DrawingGradient('radial', coordinates, this.matrix);
  }
  createPattern(_grain: unknown, _repeat: string): DrawingPaint {
    return { kind: 'grain' };
  }
}
