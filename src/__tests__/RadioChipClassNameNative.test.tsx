import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RadioGroup } from '../radio';
import { resolvedStyle } from './support/rendered-style';

jest.mock('react-native', () => ({ ...jest.requireActual('../../__mocks__/react-native'), PlatformColor: (...names: string[]) => ({ semantic: names }) }));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () => jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'));

beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(compile(`
    .chip-layout { min-height:48px; border-radius:12px; padding:10px; background-color:#eeeeee; }
    .chip-selected { background-color:#123456; }
    .chip-label { font-size:18px; color:#654321; }
  `).stylesheet());
});

it.each(['ios', 'android'] as const)('%s resolves authored chip styles and retains controlled selection and disabled semantics', platform => {
  const previous = Platform.OS;
  Object.defineProperty(Platform, 'OS', { configurable: true, value: platform });
  try {
    const onChange = jest.fn();
    function Example() {
      const [value, setValue] = React.useState('small');
      return <BloomThemeProvider><RadioGroup variant="chip" value={value}
        onValueChange={next => { setValue(next); onChange(next); }} label="Size"
        optionClassName={({ checked }) => `chip-layout ${checked ? 'chip-selected' : ''}`}
        optionLabelClassName="chip-label"
        options={[{ testID: 'small', value: 'small', label: 'Small' }, { testID: 'medium', value: 'medium', label: 'Medium', disabled: true }, { testID: 'large', value: 'large', label: 'Large' }]} /></BloomThemeProvider>;
    }
    const api = render(<Example />);
    const radios = () => ['small', 'medium', 'large'].map(id => api.getByTestId(id));
    expect(resolvedStyle(radios()[0]!.props.style)).toMatchObject({ minHeight:48, borderRadius:12, backgroundColor:'#123456' });
    expect(resolvedStyle(api.getByText('Large').props.style)).toMatchObject({ fontSize:18, color:'#654321' });
    fireEvent.press(radios()[1]!);
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.press(radios()[2]!);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenLastCalledWith('large');
    expect(radios()[2]!.props['aria-checked']).toBe(true);
    expect(resolvedStyle(radios()[2]!.props.style).backgroundColor).toBe('#123456');
    fireEvent.press(radios()[2]!);
    expect(onChange).toHaveBeenCalledTimes(1);
  } finally {
    Object.defineProperty(Platform, 'OS', { configurable: true, value: previous });
  }
});
