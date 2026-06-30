import React from 'react';

export const useKeyboardHandler = jest.fn();

// Mirror the real module's <KeyboardProvider>. Renders an identifiable host
// node wrapping its children so suites can assert that the sheet re-establishes
// a provider INSIDE its RN <Modal> (the app-root provider does not cross the
// Modal's native-window boundary).
export const KeyboardProvider = ({ children }: { children?: React.ReactNode }) =>
  React.createElement('KeyboardProvider', null, children);
