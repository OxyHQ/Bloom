import { useState, createElement } from 'react';
export function useTranslation() {
  return T;
}
const T = { t: (k, o) => (o && o.defaultValue) || k };
export const logger = { error() {} };
export function useAuth() {
  return AUTH;
}
const AUTH = { canUsePrivateApi: true, isPrivateApiPending: false };
export function OxyAuthPrompt() {
  return createElement('View', null);
}
export function SettingsSkeleton() {
  return createElement('View', null);
}
const ROUTER = { push() {} };
export function useSettingsRouter() {
  return ROUTER;
}
// The viewer's settings section: the stored value, and an update that merges a patch (the server).
export function useViewerSettingsSection() {
  const [value, setValue] = useState({});
  if (globalThis.__stored)
    return { value: globalThis.__stored, isLoading: false, update: () => Promise.resolve() };
  return {
    value,
    isLoading: false,
    update: (p) => {
      setValue((v) => ({ ...v, ...p }));
      return Promise.resolve();
    },
  };
}
