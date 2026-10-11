/**
 * @jest-environment node
 */

/**
 * Every `<GestureDetector>` in the library has a DECIDED `touchAction`.
 *
 * On web, react-native-gesture-handler writes
 * `touch-action: <touchAction ?? 'none'>` INLINE on the detector's view
 * (`GestureHandlerWebDelegate.setTouchAction`). `none` tells a touch browser it
 * may never pan from that element. For a detector that sits inside a vertically
 * scrolling container — a list row, a chat bubble, a picker in a long form —
 * that silently freezes the scroll wherever the finger lands on it, while the
 * gesture itself keeps working, so nobody notices on a desktop or in jest.
 * `failOffsetY` cannot help: the browser has decided before any JS runs. And a
 * `touch-pan-y` CLASS on the child cannot help either, because the inline style
 * beats it. Native ignores the prop, so nothing on a device shows it.
 *
 * Shipped once: `SwipeRow` rows tiled Inbox's whole mail list on a phone-sized
 * web viewport, and the list could be swiped but not scrolled.
 *
 * So each detector is pinned here, per file, to the value it passes — or to
 * `default` (RNGH's `none`) / `spread` (props forwarded) — with the reason that
 * value is right. The map is an EQUALITY: a new detector, or one whose value
 * changes, fails until someone writes down why.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import ts from 'typescript';

const SRC = join(__dirname, '..');

/**
 * file → the `touchAction` of each detector in it, in source order.
 *
 * `pan-y` — a horizontal gesture inside something that scrolls vertically:
 * the browser keeps vertical panning (and cancels the pointer, so the pan with
 * it, once it scrolls) and horizontal movement still reaches the handler.
 *
 * `default` (`none`) is only right where the element is NOT scroll content, or
 * where the gesture itself needs both axes.
 */
const DECISIONS: Record<string, readonly string[]> = {
  // Rows tile a vertically scrolling list.
  'swipe-row/SwipeRow.tsx': ['pan-y'],
  // Bubbles tile a vertically scrolling transcript. Web never mounts the
  // detector today; pan-y keeps enabling it from freezing the transcript.
  'message-bubble/SwipeToReply.tsx': ['pan-y'],
  // Horizontal strip inside screen content.
  'segmented-control/SegmentedControl.tsx': ['pan-y'],
  // Horizontal tab swipe over a vertically scrolling page.
  'tabs/expo-router/RouterTabs.tsx': ['pan-y'],
  // Horizontal shape carousel inside the agent-creator form; its `touch-pan-y`
  // class always meant this, but the inline `none` overrode it.
  'agent-creator/ShapeArc.tsx': ['pan-y'],
  // Rotary drag — both axes are the gesture, and the dial says `touch-none`.
  'agent-creator/EmotionPicker.tsx': ['default'],
  // 2-D saturation/value field, then a hue rail that takes its value on
  // touch-down (`minDistance(0)`) like `Slider`, which is `touch-action: none`.
  'agent-creator/CustomColorPicker.tsx': ['default', 'default'],
  // Sheet drag handle; body pan over the sheet; the native wrapper around the
  // sheet's ScrollView (RNGH's Native handler sets `auto` itself on web). The
  // sheet is an overlay, not scroll content, and dragging it is vertical.
  'bottom-sheet/BottomSheetBase.tsx': ['default', 'default', 'default'],
  // Fullscreen media viewer: drag-to-dismiss, pinch and pan-while-zoomed own
  // every axis.
  'zoomable-media-gallery/ZoomableMediaGalleryBase.tsx': ['default', 'default'],
  // Card drag between columns is 2-D.
  'project-board/ProjectBoardBase.tsx': ['default'],
  // Toasts float in an overlay above the page, never inside a scroller; a swipe
  // may dismiss them vertically.
  'toast/ToastSwipeHandler.tsx': ['default'],
  // `OptionalGesture` forwards its props; its one call site passes none, and it
  // is mounted only when the bar is NOT scrollable — the bar is fixed chrome.
  'tab-bar/TabBarBase.tsx': ['spread'],
};

function files(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      if (entry !== '__tests__') out.push(...files(path));
    } else if (/\.tsx?$/.test(entry) && !/\.(stories|test)\.tsx?$/.test(entry)) {
      out.push(path);
    }
  }
  return out;
}

/** The `touchAction` of every `<GestureDetector>` in one source text, in order. */
function scan(file: string, text: string): string[] {
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const found: string[] = [];
  const visit = (node: ts.Node): void => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      node.tagName.getText(source) === 'GestureDetector'
    ) {
      let value: string | null = null;
      let spread = false;
      for (const attribute of node.attributes.properties) {
        if (ts.isJsxSpreadAttribute(attribute)) {
          spread = true;
        } else if (attribute.name.getText(source) === 'touchAction') {
          const init = attribute.initializer;
          if (init !== undefined && ts.isStringLiteral(init)) value = init.text;
          else if (
            init !== undefined &&
            ts.isJsxExpression(init) &&
            init.expression !== undefined &&
            ts.isStringLiteral(init.expression)
          )
            value = init.expression.text;
          else value = 'dynamic';
        }
      }
      found.push(value ?? (spread ? 'spread' : 'default'));
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return found;
}

describe('GestureDetector touchAction census', () => {
  it('pins every detector in src to a decided touchAction', () => {
    const actual: Record<string, string[]> = {};
    for (const path of files(SRC)) {
      const text = readFileSync(path, 'utf8');
      if (!text.includes('GestureDetector')) continue;
      const found = scan(path, text);
      if (found.length > 0) actual[relative(SRC, path).split('\\').join('/')] = found;
    }
    expect(actual).toEqual(DECISIONS);
  });

  it('can tell a detector without touchAction from one with it (the gate is falsifiable)', () => {
    expect(
      scan('a.tsx', 'const a = <GestureDetector gesture={g}><V /></GestureDetector>;'),
    ).toEqual(['default']);
    expect(
      scan(
        'b.tsx',
        'const b = <GestureDetector gesture={g} touchAction="pan-y"><V /></GestureDetector>;',
      ),
    ).toEqual(['pan-y']);
    expect(
      scan(
        'c.tsx',
        "const c = <GestureDetector gesture={g} touchAction={'pan-x'}><V /></GestureDetector>;",
      ),
    ).toEqual(['pan-x']);
    expect(scan('d.tsx', 'const d = <GestureDetector {...p}>{c}</GestureDetector>;')).toEqual([
      'spread',
    ]);
  });
});
