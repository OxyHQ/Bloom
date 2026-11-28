/** A component with a hook of its own, declared as react-native 0.81 declares `Switch`. */
import { type lazy, type ReactNode, useState } from 'react';
import { Text } from 'react-native';

const Toggle: (props: { label: string }) => ReactNode = function Toggle(props) {
  const [suffix] = useState('!');
  return <Text>{props.label + suffix}</Text>;
};
const $$Toggle: typeof Toggle = Toggle;
export { $$Toggle as Toggle };

/** A module's component, loaded as `import(…)` would give it (Jest runs no dynamic import). */
export const loadToggle: Parameters<typeof lazy>[0] = () => Promise.resolve({ default: Toggle });
