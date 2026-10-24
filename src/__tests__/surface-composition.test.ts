import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '../..');
const read = (file: string) => fs.readFileSync(path.join(root, file), 'utf8');

// These consumers must keep using the shared material rather than growing
// another local gradient/rim recipe after the migration.
it.each([
  'src/card/Card.tsx',
  'src/sidebar/Sidebar.tsx',
  'src/settings-modal/SettingsModalBase.tsx',
  'src/dialog/Dialog.web.tsx',
  'src/bottom-sheet/BottomSheetBase.tsx',
  'src/queue-panel/QueuePanelBase.tsx',
  'src/user-hover-card/UserHoverCard.tsx',
  'src/tooltip/Tooltip.tsx',
  'src/toast/ToastContent.tsx',
  'src/text-field/TextField.tsx',
  'src/textarea/Textarea.tsx',
  'src/input-group/InputGroup.tsx',
  'src/tag-field/TagField.tsx',
  'src/select/Select.tsx',
  'src/select/Select.web.tsx',
  'src/chip/Chip.tsx',
  'src/badge/Badge.tsx',
  'src/chat-indicators/UnreadBadge.tsx',
  'src/segmented-control/SegmentedControl.tsx',
  'src/tab-bar/TabBarBase.tsx',
  'src/notification/Notification.tsx',
  'src/announcement/Announcement.tsx',
  'src/admonition/Admonition.tsx',
  'src/button/CloseButton.tsx',
  'src/menubar/MenubarBase.tsx',
  'src/pagination/Pagination.tsx',
  'src/input-otp/InputOtp.tsx',
  'src/file-upload/FileUpload.tsx',
  'src/share-sheet/ShareTargetButton.tsx',
  'src/media-controls/PlayButton.tsx',
  'src/switch/Switch.tsx',
  'src/slider/Slider.tsx',
  'src/checkbox/shared.tsx',
  'src/radio-indicator/RadioIndicator.tsx',
])('%s composes the universal material', (file) => {
  const source = read(file);
  expect(source).toMatch(
    /import\s+\{\s*SurfacePaint\s*\}\s+from\s+['"][^'"]*surface\/SurfacePaint['"]/,
  );
  expect(source).toContain('<SurfacePaint');
});

// The composer is the shared `Surface` itself, so its tone is the one buttons and bubbles have.
it.each(['src/composer-panel/ComposerPanelBase.tsx', 'src/composer-panel/ComposerPillBase.tsx'])(
  '%s is the shared Surface',
  (file) => {
    const source = read(file);
    expect(source).toMatch(/import\s+\{\s*Surface\s*\}\s+from\s+['"][^'"]*\/surface['"]/);
    expect(source).toContain('<Surface');
  },
);

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
