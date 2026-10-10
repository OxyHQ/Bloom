import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// These consumers must keep using the shared material rather than growing
// another local gradient/rim recipe after the migration.
it.each([
  'src/card/Card.tsx',
  'src/sidebar/Sidebar.tsx',
  'src/settings-modal/SettingsModal.tsx',
  'src/dialog/Dialog.web.tsx',
  'src/bottom-sheet/BottomSheetBase.tsx',
  'src/queue-panel/QueuePanel.tsx',
  'src/user-hover-card/UserHoverCard.tsx',
  'src/tooltip/Tooltip.tsx',
  'src/composer-panel/ComposerPanelBase.tsx',
  'src/toast/ToastContent.tsx',
])('%s composes the universal material', (file) => {
  const source = read(file);
  expect(source).toMatch(
    /import\s+\{\s*SurfacePaint\s*\}\s+from\s+['"][^'"]*surface\/SurfacePaint['"]/,
  );
  expect(source).toContain('<SurfacePaint');
});

it.each([
  'src/floating/FloatingPanel.tsx',
  'src/tooltip/Tooltip.web.tsx',
  'src/content-panel/ContentPanel.web.tsx',
])('%s decorates its existing web host', (file) => {
  expect(read(file)).toContain('useSurfaceMaterial(');
});

it('Social composes the real link preview and has no private card chrome', () => {
  const source = read('templates/social/SocialContent.tsx');
  expect(source).toMatch(
    /import\s+\{\s*LinkPreviewCard\s*\}\s+from\s+['"]\.\.\/\.\.\/src\/link-preview['"]/,
  );
  expect(source).toContain('<LinkPreviewCard');
  expect(source).not.toMatch(/linkPreviewCopy:|linkPreviewImage:|linkDomain:|bookStack:/);
});
