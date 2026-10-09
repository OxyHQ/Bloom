import React from 'react';
import { View, Text as RNText } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Checkbox } from '../checkbox';
import { Radio } from '../radio';
import { Text } from '../typography';
import { RiStarFill } from '../icons/remix/RiStarFill';

const content = <View testID="custom-label"><RiStarFill width={20} height={20} /><Text>Visual rating</Text></View>;
const wrap = (children:React.ReactNode) => <BloomThemeProvider>{children}</BloomThemeProvider>;
for (const kind of ['checkbox','radio'] as const) {
  it(`${kind} renders a View label outside Text and retains one explicitly named row target`, () => {
    const change=jest.fn();
    const node=kind==='checkbox'
      ? <Checkbox label="Four stars" labelContent={content} onCheckedChange={change} />
      : <Radio value="four" accessibilityLabel="Four stars" labelContent={content} onValueChange={change} />;
    const api=render(wrap(node));
    const control=api.getByLabelText('Four stars');
    const custom=api.getByTestId('custom-label', { includeHiddenElements:true });
    expect(control.props.accessibilityRole).toBe(kind);
    for(let parent=custom.parent;parent;parent=parent.parent) expect(parent.type).not.toBe(RNText);
    let decoration=custom.parent;
    while(decoration&&!decoration.props['aria-hidden']) decoration=decoration.parent;
    expect(decoration?.props.importantForAccessibility).toBe('no-hide-descendants');
    fireEvent.press(custom);
    expect(change).toHaveBeenCalledWith(kind==='checkbox'?true:'four');
    expect(api.queryByText('Four stars')).toBeNull();
  });
  it(`${kind} keeps disabled behavior with a custom label`,()=>{
    const change=jest.fn();
    const node=kind==='checkbox'
      ? <Checkbox accessibilityLabel="Disabled" labelContent={content} disabled onCheckedChange={change} />
      : <Radio value="four" label="Disabled" labelContent={content} disabled onValueChange={change} />;
    const api=render(wrap(node));fireEvent.press(api.getByTestId('custom-label', { includeHiddenElements:true }));
    expect(change).not.toHaveBeenCalled();
  });
}
