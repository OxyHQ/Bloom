/** A TS interface a `@State` holds (Mention's MerchantInstallmentPreferences). */
export interface InstallmentPrefs {
  enabled: boolean;
  countries: readonly string[];
  message: string;
}
