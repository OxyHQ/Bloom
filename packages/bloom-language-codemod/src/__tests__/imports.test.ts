import { exportMap, rewriteImports } from '../imports';

const map = exportMap();

describe('imports', () => {
  it('reads the entries from the export map', () => {
    expect(map.moduleOf.get('Row')).toBe('@oxy.so/bloom-language/containers');
    expect(map.moduleOf.get('TextField')).toBe('@oxy.so/bloom-language/inputs');
    expect(map.moduleOf.get('VirtualList')).toBe('@oxy.so/bloom-language/list');
    expect(map.moduleOf.get('Text')).toBe('@oxy.so/bloom-language');
    // A type is its entry's too.
    expect(map.moduleOf.get('TextFieldView')).toBe('@oxy.so/bloom-language/inputs');
  });

  it("moves each name to its family's entry, keeping the root's and the aliases", () => {
    const source = [
      "import { Text, Row, Card as LCard, type TextFieldView, TextField } from '@oxy.so/bloom-language';",
      "import type { ViewModifiers } from '@oxy.so/bloom-language';",
      'const x = 1;',
    ].join('\n');
    const result = rewriteImports(source, map);
    expect(result.changed).toBe(true);
    expect(result.code).toBe(
      [
        "import { Text } from '@oxy.so/bloom-language';",
        "import { Row, Card as LCard } from '@oxy.so/bloom-language/containers';",
        "import { type TextFieldView, TextField } from '@oxy.so/bloom-language/inputs';",
        "import type { ViewModifiers } from '@oxy.so/bloom-language';",
        'const x = 1;',
      ].join('\n'),
    );
    expect(result.moved.map((m) => m.name)).toEqual(['Row', 'Card', 'TextFieldView', 'TextField']);
  });

  it('changes nothing the second time, nor a name no entry exports', () => {
    const once = rewriteImports("import { Row, Unheard } from '@oxy.so/bloom-language';\n", map);
    expect(once.code).toBe(
      "import { Unheard } from '@oxy.so/bloom-language';\nimport { Row } from '@oxy.so/bloom-language/containers';\n",
    );
    expect(rewriteImports(once.code, map).changed).toBe(false);
  });

  it('keeps a whole-type import type-only, and leaves other packages alone', () => {
    const result = rewriteImports(
      'import type { SearchView } from "@oxy.so/bloom-language"\nimport { Row } from \'@oxy.so/bloom/row\';\n',
      map,
    );
    expect(result.code).toBe(
      'import type { SearchView } from "@oxy.so/bloom-language/inputs"\nimport { Row } from \'@oxy.so/bloom/row\';\n',
    );
  });
});
