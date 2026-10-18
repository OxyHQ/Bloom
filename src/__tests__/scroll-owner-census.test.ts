import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const root = join(__dirname, '..');
const exceptions = new Set([
  'layout/ScrollViewport.tsx', // shared plain/animated primitive
  'sidebar/SidebarScrollArea.tsx', // existing owner + ScrollBar
  'bottom-sheet/BottomSheetBase.tsx', // gesture-coordinated owner + ScrollBar
  'screen/ScreenScrollView.tsx', // screen-coordinated owner + ScrollBar
  'carousel/Carousel.tsx', // discrete pages, navigated by arrows/dots
  'listing-card/ListingCard.tsx', // discrete image pager
  'zoomable-media-gallery/ZoomableMediaGalleryBase.tsx', // zoom-locked image pager
]);
function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '__tests__') return [];
    const path = join(dir, entry.name);
    return entry.isDirectory()
      ? files(path)
      : path.endsWith('.tsx') && !path.endsWith('.stories.tsx')
        ? [path]
        : [];
  });
}
it('ordinary scrollable components use ScrollArea; custom owners and image pagers are explicit', () => {
  const bypasses: string[] = [];
  for (const file of files(root)) {
    const name = relative(root, file);
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    );
    function visit(node: ts.Node) {
      if (
        (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
        /^(?:Animated\.)?(?:Styled)?ScrollView$/.test(node.tagName.getText(source)) &&
        !exceptions.has(name)
      )
        bypasses.push(name);
      ts.forEachChild(node, visit);
    }
    visit(source);
  }
  expect(bypasses).toEqual([]);
});
