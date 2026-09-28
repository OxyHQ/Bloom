import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

it('composer actions use shared button bases instead of local Pressable implementations', () => {
  const localActions: string[] = [];
  for (const family of ['chat-composer', 'composer-panel']) {
    const directory = path.join(__dirname, '..', family);
    for (const name of fs.readdirSync(directory).filter(name => name.endsWith('.tsx') && !name.includes('.stories.'))) {
      const source = ts.createSourceFile(name, fs.readFileSync(path.join(directory, name), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      function visit(node: ts.Node) {
        if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'Pressable') {
          const role = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && ['role', 'accessibilityRole'].includes(attribute.name.getText(source)));
          if (role && ts.isJsxAttribute(role) && role.initializer && ts.isStringLiteral(role.initializer) && ['button', 'link'].includes(role.initializer.text)) {
            const label = node.attributes.properties.find(attribute => ts.isJsxAttribute(attribute) && attribute.name.getText(source) === 'accessibilityLabel');
            localActions.push(`${family}/${name}:${label && ts.isJsxAttribute(label) ? label.initializer?.getText(source) : ''}`);
          }
        }
        ts.forEachChild(node, visit);
      }
      visit(source);
    }
  }
  // An overlay dismissal plane is not a visible action button. Radio/tab/media
  // roles likewise keep their own interaction semantics.
  expect(localActions).toEqual(['composer-panel/ComposerPopover.tsx:{common.dismiss}']);
});
