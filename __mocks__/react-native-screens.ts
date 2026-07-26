/**
 * Bloom never imports `react-native-screens` itself — the toast engine takes
 * `FullWindowOverlay` from the consumer through `ToasterOverlayWrapper` instead
 * of hard-depending on an undeclared package. This stub exists so a test can
 * exercise that injection path without pulling the real native module in.
 */
import type React from 'react';

export const FullWindowOverlay = ({ children }: { children: React.ReactNode }) => children;
