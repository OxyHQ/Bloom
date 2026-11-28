// The language's string helpers, read where the standard library is checked in place (its tests,
// this package's tsc). An app's `.bloom/std/Bloom/text.ts` is that file itself, embedded by the
// compiler (`crate::stdlib::SOURCES`), so a std module never loads the language's index.
export {
  characterCount,
  characterOffset,
  characterSlice,
  characters,
  utf16Offset,
} from '../../../bloom-language/src/text';
