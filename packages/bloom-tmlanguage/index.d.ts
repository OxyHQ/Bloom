/**
 * Bloom, the language by Oxy (`.bloom`): its TextMate grammar as a Shiki language registration.
 * Structurally a Shiki `LanguageRegistration`, so it passes to `createHighlighter({ langs: [bloom] })`
 * and `highlighter.loadLanguage(bloom)` as it is.
 */
export interface BloomLanguageRegistration {
  name: 'bloom';
  displayName: 'Bloom';
  scopeName: 'source.bloom';
  fileTypes: string[];
  comment: string;
  // biome-ignore lint/suspicious/noExplicitAny: TextMate rules, typed by the engine that reads them.
  patterns: any[];
  // biome-ignore lint/suspicious/noExplicitAny: TextMate rules, typed by the engine that reads them.
  repository: Record<string, any>;
}

export declare const bloom: BloomLanguageRegistration;
export default bloom;
