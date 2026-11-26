// A test stub of react-i18next's surface the fixtures use (the real
// TFunction is a conditional type, which Bloom reads as Foreign).
export type TFunction = (key: string, options?: { defaultValue?: string }) => string;
export interface UseTranslationResponse {
  t: TFunction;
  ready: boolean;
}
export declare function useTranslation(): UseTranslationResponse;
