// A test stub of react-i18next's surface, shaped as the real one: `useTranslation` is a const
// of a conditional type, and its result a tuple intersected with a record. Bloom reads it as
// `{ t: (String, options?) -> String, i18n, ready: Bool }`.
type Namespace = string | readonly string[];
type SelectorMode = true | 'optimize' | 'strict';
type EnableSelector = false;
export interface TFunction<_Ns = Namespace> {
  (key: string, options?: { defaultValue?: string; [option: string]: unknown }): string;
}
export type UseTranslationResponse<Ns> = [t: TFunction<Ns>, i18n: unknown, ready: boolean] & {
  t: TFunction<Ns>;
  i18n: unknown;
  ready: boolean;
};
export declare const useTranslation: EnableSelector extends SelectorMode
  ? <Ns extends Namespace>(ns?: Ns) => UseTranslationResponse<Ns>
  : <Ns extends Namespace>(ns?: Ns) => UseTranslationResponse<Ns>;
