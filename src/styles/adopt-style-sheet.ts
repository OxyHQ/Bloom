// ---------------------------------------------------------------------------
//  adoptStyleSheet — the ONE way a Bloom web fork puts CSS on the page.
//
//  Bloom's `.web.tsx` forks self-inject the CSS they need (`@keyframes`,
//  pseudo-classes, `::-webkit-scrollbar`) rather than asking consumers to paste
//  it into a global stylesheet — see AGENTS.md, "Web Fork CSS & Style
//  Conventions". The mechanism used to be a `<style>` element carrying the CSS
//  as text content. That is exactly the shape a Content-Security-Policy of
//  `style-src 'self'` blocks: the check runs when a style element's text
//  content is parsed into a sheet, so the rules are dropped, the component
//  renders with none of its CSS, and NOTHING is thrown — the fork's own
//  "already injected?" guard even finds its element in the DOM and reports
//  success. Astro's `astro://` WebUI pages ship that CSP, and every other Oxy
//  surface behind one would fail the same silent way.
//
//  A constructed stylesheet is not subject to `style-src` at all — CSSOM is
//  outside CSP's inline hooks — so `new CSSStyleSheet()` + `replaceSync()` +
//  `document.adoptedStyleSheets` applies the same CSS under a strict policy
//  with no nonce, no hash, and no consumer-side wiring. (This is also why
//  react-native-web is unaffected: it appends an EMPTY style element and fills
//  it through `sheet.insertRule`, never through text content.)
//
//  The `<style>` path survives only as the fallback for a document without
//  constructed-stylesheet support — jsdom 26 has the `CSSStyleSheet`
//  constructor but neither `replaceSync` nor `adoptedStyleSheets`, so the whole
//  jest suite takes it, and so do browsers older than Chrome 73 / Safari 16.4 /
//  Firefox 101. There it behaves exactly as Bloom did before, CSP included:
//  the fallback cannot make anything worse, and cannot make a strict policy
//  work either.
// ---------------------------------------------------------------------------

interface AdoptedSheet {
  sheet: CSSStyleSheet;
  /** The CSS currently in `sheet`, so a re-render re-parses nothing. */
  css: string;
}

/**
 * The sheets Bloom has constructed, per document. Keyed by document rather than
 * held in one flat map because a constructed sheet belongs to the realm that
 * created it — adopting one into a different document throws — and Bloom runs
 * in more than one when a consumer opens a popout window.
 */
const adoptedByDocument = new WeakMap<Document, Map<string, AdoptedSheet>>();

function sheetsFor(doc: Document): Map<string, AdoptedSheet> {
  const existing = adoptedByDocument.get(doc);
  if (existing) return existing;
  const created = new Map<string, AdoptedSheet>();
  adoptedByDocument.set(doc, created);
  return created;
}

/**
 * Whether `doc` can take a constructed stylesheet. Evaluated per call, not once
 * at module scope: a test installs the API on its window after this module has
 * already been imported, and a module-scope constant would freeze the answer
 * from before that.
 */
function supportsAdoption(doc: Document): boolean {
  return (
    'adoptedStyleSheets' in doc &&
    typeof CSSStyleSheet === 'function' &&
    typeof CSSStyleSheet.prototype.replaceSync === 'function'
  );
}

/**
 * Make `css` apply to the document, under the identity `id`.
 *
 * Idempotent in both directions: calling it again with the same CSS re-parses
 * nothing and adopts nothing twice (the usual case — every mount of every
 * instance of a component calls it), and calling it with DIFFERENT CSS under
 * the same id replaces the previous content in place (the theme-dependent case,
 * `BottomSheetBase`'s scrollbar colours).
 *
 * No-op off the web, so a platform-neutral component can call it unguarded.
 */
export function adoptStyleSheet(id: string, css: string): void {
  if (typeof document === 'undefined') return;

  if (supportsAdoption(document)) {
    const sheets = sheetsFor(document);
    let entry = sheets.get(id);
    if (!entry) {
      entry = { sheet: new CSSStyleSheet(), css: '' };
      sheets.set(id, entry);
    }
    if (entry.css !== css) {
      entry.sheet.replaceSync(css);
      entry.css = css;
    }
    // Re-adoption after a consumer (or a test) has reset the list. `includes`
    // is what makes the common repeat call free.
    if (!document.adoptedStyleSheets.includes(entry.sheet)) {
      document.adoptedStyleSheets = [...document.adoptedStyleSheets, entry.sheet];
    }
    return;
  }

  const existing = document.getElementById(id);
  if (existing instanceof HTMLStyleElement) {
    if (existing.textContent !== css) existing.textContent = css;
    return;
  }
  const element = document.createElement('style');
  element.id = id;
  element.textContent = css;
  document.head.appendChild(element);
}

/**
 * Detach the stylesheet `id`, whichever path installed it.
 *
 * Only for CSS whose lifetime is a component's — `BottomSheetBase` removes its
 * scrollbar rules when the last sheet unmounts. The static per-component CSS is
 * never dropped: it is the same bytes for the life of the page, and removing it
 * on unmount would make a re-mount re-parse it.
 */
export function dropStyleSheet(id: string): void {
  if (typeof document === 'undefined') return;

  const entry = adoptedByDocument.get(document)?.get(id);
  if (entry) {
    document.adoptedStyleSheets = document.adoptedStyleSheets.filter(
      (sheet) => sheet !== entry.sheet,
    );
    adoptedByDocument.get(document)?.delete(id);
  }
  document.getElementById(id)?.remove();
}
