import React from 'react';
import { translateTemplateCopy } from '../TemplateCopyProvider';

describe('template display copy', () => {
  it('translates rendered strings and accessible names without changing state identifiers', () => {
    const onPress = jest.fn();
    const element = <View title="Hello" accessibilityLabel="Open" value="canonical-id" onPress={onPress} items={[{ id: 'id', label: 'Label', value: 'raw' }]}>Hello</View>;
    const result = translateTemplateCopy(element, text => `ES:${text}`);
    expect(result.props.children).toBe('ES:Hello'); expect(result.props.accessibilityLabel).toBe('ES:Open');
    expect(result.props.value).toBe('canonical-id'); expect(result.props.onPress).toBe(onPress);
    expect(result.props.items).toEqual([{ id: 'id', label: 'ES:Label', value: 'raw' }]);
  });
  it('preserves source and shortcut text and translates callback display output only', () => {
    const result = translateTemplateCopy(<View items={[{ id: 'id', cell: (value: string) => <span>{value}</span> }]}><code>const source = true</code></View>, text => `ES:${text}`);
    expect(result.props.children.props.children).toBe('const source = true');
    expect(result.props.items[0]!.cell('Hello').props.children).toBe('ES:Hello');
  });
});
function View(props: Record<string, any>) { return <div {...props} />; }
