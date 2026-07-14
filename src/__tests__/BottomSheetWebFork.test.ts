import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Regression guard for the BottomSheet RN-Web fix.
 *
 * On React-Native-Web, RN's `<Modal>` renders through `ModalPortal`, which
 * appends its host `<div>` DURING RENDER and removes it in an unmount effect
 * that nulls its ref. Under React 19 concurrent/StrictMode that host node is
 * orphaned, so the sheet mounts but its DOM lands in a detached node and never
 * paints — breaking the responsive `Dialog` bottom placement on narrow web.
 *
 * The fix splits the component: a shared, platform-agnostic `BottomSheetBase`
 * (no `<Modal>`, no keyboard-controller) plus two shells — native `index.tsx`
 * (RN `<Modal>` + keyboard-controller, unchanged) and web `index.web.tsx`
 * (bloom's stable DOM `<Portal>`). These source/contract assertions fail loudly
 * if any leg regresses. (The actual paint is verified in a real browser — jest
 * cannot reproduce the RN-Web render race.)
 */

const SRC = join(__dirname, '..');
const REPO_ROOT = join(SRC, '..');

const read = (rel: string) => readFileSync(join(SRC, rel), 'utf8');

describe('BottomSheet web fork (RN-Web Modal-orphan fix)', () => {
  it('web shell renders through bloom DOM Portal, never RN <Modal>/keyboard-controller', () => {
    const web = read('bottom-sheet/index.web.tsx');
    expect(web).toMatch(/from '\.\.\/portal\/index\.web'/);
    expect(web).toMatch(/BottomSheetBase/);
    // The whole point: no RN Modal *import* (orphaned ModalPortal) on web.
    // Doc comments may still reference Modal to explain why it's avoided.
    expect(web).not.toMatch(/import \{[^}]*\bModal\b[^}]*\} from 'react-native'/);
    expect(web).not.toMatch(/require\(\s*['"]react-native-keyboard-controller['"]/);
  });

  it('native shell keeps RN <Modal> + keyboard-controller', () => {
    const native = read('bottom-sheet/index.tsx');
    expect(native).toMatch(/import \{ Modal[^}]*\} from 'react-native'/);
    expect(native).toContain('react-native-keyboard-controller');
    expect(native).toMatch(/BottomSheetBase/);
  });

  it('shared base is a clean default: no <Modal>, no keyboard-controller import', () => {
    const base = read('bottom-sheet/BottomSheetBase.tsx');
    // Comments may MENTION Modal; assert there is no Modal *import*.
    expect(base).not.toMatch(/import \{[^}]*\bModal\b[^}]*\} from 'react-native'/);
    expect(base).not.toContain("require('react-native-keyboard-controller')");
    // Base injects the platform Shell rather than hard-coding a container.
    expect(base).toContain('Shell');
  });

  it('package.json exports ./bottom-sheet with a browser condition → index.web.js', () => {
    const pkg = JSON.parse(readFileSync(join(REPO_ROOT, 'package.json'), 'utf8')) as {
      exports: Record<string, { browser?: { import?: string } }>;
    };
    const entry = pkg.exports['./bottom-sheet'];
    expect(entry).toBeDefined();
    expect(entry?.browser?.import).toBe('./lib/module/bottom-sheet/index.web.js');
  });

  it('generator lists ./bottom-sheet as a web-forked subpath', () => {
    const gen = readFileSync(join(REPO_ROOT, 'scripts/generate-platform-exports.mjs'), 'utf8');
    expect(gen).toMatch(/WEB_FORKED_SUBPATHS[\s\S]*'\.\/bottom-sheet'/);
  });
});
