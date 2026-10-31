/** Production PBO pixels: arbitrary premultiplied edges, scaling and sparse atlas reads. */
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const puppeteer = createRequire(import.meta.url)(
  process.env.BLOOM_PUPPETEER_MODULE || 'puppeteer-core',
);
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
  args: ['--no-sandbox', '--enable-unsafe-swiftshader'],
});
try {
  const page = await browser.newPage();
  await page.goto(`${process.env.BLOOM_STORYBOOK_URL || 'http://localhost:6007'}/iframe.html`);
  const report = await page.evaluate(async () => {
    const { createPBOAvatarPresenter } = await import('/runtime/avatar-pbo-presenter.ts');
    const stage = document.createElement('canvas');
    const gl = stage.getContext('webgl2', {
      alpha: true,
      antialias: false,
      preserveDrawingBuffer: true,
    });
    const shader = (type, source) => {
      const value = gl.createShader(type);
      gl.shaderSource(value, source);
      gl.compileShader(value);
      if (!gl.getShaderParameter(value, gl.COMPILE_STATUS)) throw Error(gl.getShaderInfoLog(value));
      return value;
    };
    const vertex = shader(
      gl.VERTEX_SHADER,
      '#version 300 es\nvoid main(){vec2 p=vec2((gl_VertexID<<1)&2,gl_VertexID&2);gl_Position=vec4(p*2.-1.,0.,1.);}',
    );
    const fragment = shader(
      gl.FRAGMENT_SHADER,
      '#version 300 es\nprecision highp float;out vec4 color;void main(){vec2 p=floor(gl_FragCoord.xy);float a=mod(floor(p.x/7.)+floor(p.y/11.),7.)/6.;vec3 c=vec3(mod(p.x,29.)/28.,mod(p.y,31.)/30.,mod(p.x+p.y,37.)/36.);color=vec4(c*a,a);}',
    );
    const program = gl.createProgram();
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS))
      throw Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const original = gl.readPixels.bind(gl),
      reads = [];
    gl.readPixels = (...args) => {
      reads.push(args.slice(0, 4));
      return original(...args);
    };
    const presenter = createPBOAvatarPresenter(),
      cases = [];
    for (const sourceSize of [64, 192, 512])
      for (const outputSize of [64, 96, 128]) {
        stage.width = sourceSize * 4;
        stage.height = sourceSize * 3;
        gl.viewport(0, 0, stage.width, stage.height);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        // ImageData can represent only valid premultiplied RGB<=alpha. Using
        // half-integer gl_FragCoord directly in modulo/divisor ramps can exceed
        // 1 at the last sample, producing unrepresentable synthetic C>A colors.
        const raw = new Uint8Array(stage.width * stage.height * 4);
        original(0, 0, stage.width, stage.height, gl.RGBA, gl.UNSIGNED_BYTE, raw);
        for (let i = 0; i < raw.length; i += 4) {
          if (Math.max(raw[i], raw[i + 1], raw[i + 2]) > raw[i + 3])
            throw Error('Synthetic RGB exceeds premultiplied alpha');
        }
        const records = [
          [1, 0],
          [2, 0],
          [1, 1],
          [2, 1],
        ].map(([column, row]) => {
          const canvas = document.createElement('canvas'),
            reference = document.createElement('canvas');
          canvas.width = canvas.height = reference.width = reference.height = outputSize;
          return {
            canvas,
            reference,
            context: canvas.getContext('2d'),
            sourceX: column * sourceSize,
            sourceY: row * sourceSize,
            sourceWidth: sourceSize,
            sourceHeight: sourceSize,
            destinationWidth: outputSize,
            destinationHeight: outputSize,
            isCurrent: () => true,
          };
        });
        // Capture PBO before reference drawing; each destination is read once.
        const task = presenter.present(stage, records);
        for (const record of records)
          record.reference
            .getContext('2d')
            .drawImage(
              stage,
              record.sourceX,
              record.sourceY,
              sourceSize,
              sourceSize,
              0,
              0,
              outputSize,
              outputSize,
            );
        if (!(await task)) throw Error('Production presenter did not complete');
        let changed = 0,
          maxChannel = 0,
          maxPremultiplied = 0,
          maxAlpha = 0;
        for (const record of records) {
          const expected = record.reference
            .getContext('2d')
            .getImageData(0, 0, outputSize, outputSize).data;
          const actual = record.context.getImageData(0, 0, outputSize, outputSize).data;
          for (let i = 0; i < actual.length; i += 4) {
            let delta = 0;
            for (let c = 0; c < 4; c++)
              delta = Math.max(delta, Math.abs(expected[i + c] - actual[i + c]));
            maxAlpha = Math.max(maxAlpha, Math.abs(expected[i + 3] - actual[i + 3]));
            for (let c = 0; c < 3; c++)
              maxPremultiplied = Math.max(
                maxPremultiplied,
                Math.abs(
                  Math.round((expected[i + c] * expected[i + 3]) / 255) -
                    Math.round((actual[i + c] * actual[i + 3]) / 255),
                ),
              );
            changed += Number(delta !== 0);
            maxChannel = Math.max(maxChannel, delta);
          }
        }
        cases.push({
          sourceSize,
          outputSize,
          pixels: outputSize * outputSize * 4,
          changed,
          maxChannel,
          maxPremultiplied,
          maxAlpha,
          read: reads.at(-1),
          stage: [stage.width, stage.height],
        });
      }
    presenter.dispose();
    gl.deleteProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return cases;
  });
  console.log(JSON.stringify(report));
  for (const value of report) {
    assert.equal(value.changed, 0, `${value.sourceSize}->${value.outputSize}`);
    assert.ok(
      value.read[2] * value.read[3] < value.stage[0] * value.stage[1],
      'Sparse presentation read the entire atlas',
    );
  }
} finally {
  await browser.close();
}
