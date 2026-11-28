/** A component with a hook of its own, declared as react-native 0.81 declares `Switch`. */
import { type ReactNode, useState } from 'react';
import { Text } from 'react-native';

const Toggle: (props: { label: string }) => ReactNode = function Toggle(props) {
  const [suffix] = useState('!');
  return <Text>{props.label + suffix}</Text>;
};
const $$Toggle: typeof Toggle = Toggle;
export { $$Toggle as Toggle };
