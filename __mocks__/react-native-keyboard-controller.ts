import React from 'react';

export const useKeyboardHandler = jest.fn();

// Mirror the real module's <KeyboardProvider>. Renders an identifiable host
// node wrapping its children so suites can assert WHERE providers are mounted:
// the app's root has one, and the sheet must never add a second inside its
// RN <Modal> (see `bottom-sheet/BottomSheet.tsx`, `SheetKeyboardSync`).
export const KeyboardProvider = ({ children }: { children?: React.ReactNode }) =>
  React.createElement('KeyboardProvider', null, children);
