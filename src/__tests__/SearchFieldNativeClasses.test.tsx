import React from 'react';
import { View } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import { compile } from 'react-native-css/compiler';
import { StyleCollection } from 'react-native-css/native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Search } from '../search';
import { resolvedStyle } from './support/rendered-style';
jest.mock('react-native', () => ({ ...jest.requireActual('../../__mocks__/react-native'), PlatformColor: (...names: string[]) => ({ semantic: names }) }));
jest.mock('react-native-css', () => jest.requireActual('react-native-css/native'));
jest.mock('react-native-css/native-internal', () => jest.requireActual('../../node_modules/react-native-css/dist/commonjs/native-internal/index.js'));
beforeEach(() => {
  StyleCollection.styles.clear();
  StyleCollection.inject(compile(`
    .container { width:360px; margin-top:8px; }
    .field { height:44px; padding-left:12px; padding-right:12px; }
    .chrome { border-width:1px; border-color:#abcdef; border-radius:14px; background-color:#eef0f1; }
  `).stylesheet());
});
const field = (disabled=false, invalid=false) => <BloomThemeProvider><Search label="Find" value="query" disabled={disabled} invalid={invalid}
  containerClassName="container" fieldClassName="field" fieldChromeClassName="chrome" /></BloomThemeProvider>;
it('resolves container, layout and surface classes on distinct native hosts', () => {
 const api=render(field());
 const views=api.UNSAFE_getAllByType(View).map(node=>resolvedStyle(node.props.style));
 expect(views.some(s=>s.width===360&&s.marginTop===8)).toBe(true);
 expect(views.some(s=>s.height===44&&s.paddingLeft===12&&s.paddingRight===12)).toBe(true);
 expect(views.some(s=>s.position==='absolute'&&s.borderWidth===1&&s.borderRadius===14&&s.backgroundColor==='#eef0f1')).toBe(true);
 expect(api.getByLabelText('Find').props.value).toBe('query');
});
it('preserves focus, invalid and disabled state paint over the resting surface recipe', () => {
 const api=render(field());
 const chrome=()=>api.UNSAFE_getAllByType(View).map(node=>resolvedStyle(node.props.style)).find(s=>s.position==='absolute'&&s.borderRadius===14)!;
 expect(chrome().borderColor).toBe('#abcdef');
 fireEvent(api.getByLabelText('Find'),'focus',{});
 expect(chrome().borderColor).not.toBe('#abcdef');
 api.rerender(field(true));
 expect(chrome().backgroundColor).not.toBe('#eef0f1');
 expect(api.getByLabelText('Find').props.editable).toBe(false);
 api.rerender(field(false,true));
 expect(chrome().backgroundColor).not.toBe('#eef0f1');
 expect(api.getByLabelText('Find').props['aria-invalid']).toBe(true);
});
