import { getThemeBootstrap } from '../theme/prepaint';

/** Each rule's declarations, as `name → value`. */
function rules(css: string): Record<string, string>[] {
  return [...css.matchAll(/\{([^{}]*)\}/g)].map(
    ([, body = '']) =>
      Object.fromEntries(
        body
          .split(';')
          .filter(Boolean)
          .map((declaration) => {
            const at = declaration.indexOf(':');
            return [declaration.slice(0, at), declaration.slice(at + 1)];
          }),
      ) as Record<string, string>,
  );
}

// `Text` paints with the colour tokens (`var(--foreground)`), where it used to
// read the prepaint variables (`var(--bloom-paint-text)`): the server's first
// paint writes both in the same rule, so they are the same colour in every mode
// and preset the bootstrap answers.
it('the prepainted document gives the tokens Text reads the paint colours', () => {
  const painted = rules(getThemeBootstrap({ defaultColorPreset: 'blue' }).css).filter(
    (rule) => '--bloom-paint-text' in rule,
  );
  expect(painted.length).toBeGreaterThan(1);
  for (const rule of painted) {
    expect(rule['--foreground']).toBe(rule['--bloom-paint-text']);
    expect(rule['--muted-foreground']).toBe(rule['--bloom-paint-textSecondary']);
    expect(rule['--border']).toBe(rule['--bloom-paint-border']);
  }
});

it('with every stored preset, the paint colours Text read are the tokens themselves', () => {
  const [aliases = {}] = rules(
    getThemeBootstrap({ defaultColorPreset: 'oxy', persistKey: 'theme' }).css,
  );
  expect(aliases['--bloom-paint-text']).toBe('var(--foreground)');
  expect(aliases['--bloom-paint-textSecondary']).toBe('var(--muted-foreground)');
  expect(aliases['--bloom-paint-border']).toBe('var(--border)');
});
