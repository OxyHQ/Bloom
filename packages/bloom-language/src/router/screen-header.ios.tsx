/**
 * iOS: a screen's header is the system navigation bar when the screen is one
 * of a native stack's (see platform/header-host.ios.tsx); otherwise Bloom's
 * PageHeader, in the page.
 *
 * NOT VERIFIED: written without an iOS build (no Mac on this machine).
 */
export { useSystemBar } from '../platform/header-host.ios';
