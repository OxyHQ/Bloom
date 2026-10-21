/** Tailwind v4 publishers feed explicit Bloom geometry owners, never a selector ladder. */
export function concentricCss(): string {
  const corners = ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'];
  const sides = ['top', 'right', 'bottom', 'left'];
  const out: string[] = [];
  const property = (name: string, initial?: string) =>
    out.push(
      `@property --bloom-cx-${name} { syntax: "*"; inherits: false;${initial === undefined ? '' : ` initial-value: ${initial};`} }`,
    );
  const utility = (name: string, declarations: string[]) =>
    out.push(`@utility ${name} {\n${declarations.map((line) => `  ${line};`).join('\n')}\n}`);
  property('publisher');
  property('auto-mask', '0');
  property('rauto-mask', '0');
  const autoMask = ['', 'r'].map(
    (prefix) =>
      `--bloom-cx-${prefix}auto-mask: calc(${corners.map((corner, i) => `var(--bloom-cx-${prefix}auto-${corner}, 0) * ${2 ** i}`).join(' + ')})`,
  );
  for (const corner of corners) {
    property(`radius-${corner}`);
    property(`rradius-${corner}`);
    property(`self-${corner}`);
    property(`auto-${corner}`, '0');
    property(`rauto-${corner}`, '0');
  }
  for (const kind of ['padding', 'border', 'margin'])
    for (const side of sides) {
      property(`${kind}-${side}`, '0px');
      if (side === 'left' || side === 'right') property(`r${kind}-${side}`, '0px');
    }
  const sideGroups: Record<string, string[]> = {
    '': sides,
    x: ['left', 'right'],
    y: ['top', 'bottom'],
    t: ['top'],
    r: ['right'],
    b: ['bottom'],
    l: ['left'],
    s: ['start'],
    e: ['end'],
  };
  for (const [kind, prefix] of [
    ['padding', 'p'],
    ['margin', 'm'],
    ['border', 'border'],
  ] as const) {
    for (const [suffix, affected] of Object.entries(sideGroups)) {
      const root = kind === 'border' ? `border${suffix ? `-${suffix}` : ''}` : `${prefix}${suffix}`;
      const keys: string[] = [];
      for (const side of affected) {
        if (side === 'start') keys.push(`${kind}-left`, `r${kind}-right`);
        else if (side === 'end') keys.push(`${kind}-right`, `r${kind}-left`);
        else {
          keys.push(`${kind}-${side}`);
          if (side === 'left' || side === 'right') keys.push(`r${kind}-${side}`);
        }
      }
      const values =
        kind === 'border'
          ? ['--value(integer)px', '--value([length])']
          : ['--spacing(--value(number))', '--value(--spacing-*, [length])'];
      const declarations = (entries: string[]) => [
        `--tw-sort: ${kind === 'border' ? 'border-width' : kind}${suffix ? `-${suffix}` : ''}`,
        ...entries.flatMap((value) => keys.map((key) => `--bloom-cx-${key}: ${value}`)),
      ];
      utility(`${root}-*`, declarations(values));
      if (kind === 'border') utility(root, declarations(['1px']));
      else utility(`${root}-px`, declarations(['1px']));
      if (kind === 'margin') {
        utility(`-${root}-*`, declarations(values.map((value) => `calc(${value} * -1)`)));
        utility(`-${root}-px`, declarations(['-1px']));
      }
    }
  }
  const radiusGroups: Record<string, string[]> = {
    '': corners,
    t: corners.slice(0, 2),
    r: [corners[1]!, corners[2]!],
    b: corners.slice(2),
    l: [corners[0]!, corners[3]!],
    tl: [corners[0]!],
    tr: [corners[1]!],
    br: [corners[2]!],
    bl: [corners[3]!],
  };
  const cssCorner = (corner: string) =>
    corner.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
  for (const [suffix, selected] of Object.entries(radiusGroups)) {
    const root = `rounded${suffix ? `-${suffix}` : ''}`;
    const publish = (value: string) => [
      '--bloom-cx-publisher: 0px',
      ...autoMask,
      ...selected.flatMap((corner) => [
        `--bloom-cx-radius-${corner}: ${value}`,
        `--bloom-cx-rradius-${corner}: ${value}`,
        `--bloom-cx-auto-${corner}: 0`,
        `--bloom-cx-rauto-${corner}: 0`,
      ]),
    ];
    utility(root, publish('0.25rem'));
    utility(`${root}-*`, publish('--value(--radius-*, [length])'));
    utility(`${root}-none`, publish('0px'));
    utility(`${root}-full`, publish('calc(infinity * 1px)'));
    utility(`${root}-concentric`, [
      '--bloom-cx-publisher: 0px',
      ...autoMask,
      ...selected.flatMap((corner) => [
        `--bloom-cx-auto-${corner}: 1`,
        `--bloom-cx-rauto-${corner}: 1`,
        `border-${cssCorner(corner)}-radius: var(--bloom-cx-self-${corner}, var(--bloom-concentric-${corner}, 0px))`,
        `--bloom-cx-radius-${corner}: var(--bloom-cx-self-${corner}, var(--bloom-concentric-${corner}, 0px))`,
        `--bloom-cx-rradius-${corner}: var(--bloom-cx-self-${corner}, var(--bloom-concentric-${corner}, 0px))`,
      ]),
    ]);
  }
  const logical: Record<string, [string, string, string]> = {
    ss: ['topLeft', 'topRight', 'start-start'],
    se: ['topRight', 'topLeft', 'start-end'],
    es: ['bottomLeft', 'bottomRight', 'end-start'],
    ee: ['bottomRight', 'bottomLeft', 'end-end'],
  };
  for (const key of Object.keys(logical)) property(`self-${key}`);
  for (const [suffix, selected] of Object.entries({
    s: ['ss', 'es'],
    e: ['se', 'ee'],
    ss: ['ss'],
    se: ['se'],
    es: ['es'],
    ee: ['ee'],
  })) {
    const publish = (value: (key: string) => string, auto = 0) => [
      '--bloom-cx-publisher: 0px',
      ...autoMask,
      ...selected.flatMap((key) => {
        const [ltr, rtl] = logical[key]!;
        return [
          `--bloom-cx-radius-${ltr}: ${value(key)}`,
          `--bloom-cx-rradius-${rtl}: ${value(key)}`,
          `--bloom-cx-auto-${ltr}: ${auto}`,
          `--bloom-cx-rauto-${rtl}: ${auto}`,
        ];
      }),
    ];
    utility(
      `rounded-${suffix}`,
      publish(() => '0.25rem'),
    );
    utility(
      `rounded-${suffix}-*`,
      publish(() => '--value(--radius-*, [length])'),
    );
    utility(
      `rounded-${suffix}-none`,
      publish(() => '0px'),
    );
    utility(
      `rounded-${suffix}-full`,
      publish(() => 'calc(infinity * 1px)'),
    );
    const value = (key: string) =>
      `var(--bloom-cx-self-${key}, var(--bloom-concentric-${key}, 0px))`;
    utility(`rounded-${suffix}-concentric`, [
      ...publish(value, 1),
      ...selected.map((key) => `border-${logical[key]![2]}-radius: ${value(key)}`),
    ]);
  }
  return out.join('\n');
}
