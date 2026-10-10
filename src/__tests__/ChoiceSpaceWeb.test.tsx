/** @jest-environment jsdom */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
jest.mock('react-native',()=>jest.requireActual('react-native-web'));
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { Checkbox } from '../checkbox';
import { Radio, RadioChip } from '../radio';
(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
let container:HTMLDivElement,root:Root;
beforeEach(()=>{container=document.createElement('div');document.body.appendChild(container);root=createRoot(container);});
afterEach(()=>{act(()=>root.unmount());container.remove();});
for(const kind of ['checkbox','radio','radio-chip'] as const){
 it(`${kind} activates once on Space release, cancels on blur and retains Enter`,()=>{
  const change=jest.fn();
  act(()=>root.render(<BloomThemeProvider>{kind==='checkbox'
   ?<Checkbox label="Rating" labelContent={<span>Stars</span>} onCheckedChange={change}/>
   :kind==='radio-chip'?<RadioChip value="four" label="Rating" labelContent={<span>Stars</span>} onValueChange={change}/>:<Radio value="four" label="Rating" labelContent={<span>Stars</span>} onValueChange={change}/>
  }</BloomThemeProvider>));
  const el=container.querySelector<HTMLElement>(`[role=${kind==='radio-chip'?'radio':kind}]`)!;
  const key=(type:string,key=' ',repeat=false)=>act(()=>el.dispatchEvent(new KeyboardEvent(type,{key,repeat,bubbles:true,cancelable:true})));
  act(()=>el.focus());key('keydown');key('keydown',' ',true);expect(change).not.toHaveBeenCalled();
  key('keyup');expect(change).toHaveBeenCalledTimes(1);
  change.mockClear();key('keydown');act(()=>el.blur());key('keyup');expect(change).not.toHaveBeenCalled();
  act(()=>el.focus());key('keydown','Enter');key('keyup','Enter');expect(change).toHaveBeenCalledTimes(1);
  expect(el.getAttribute('aria-label')).toBe('Rating');
  expect(el.querySelector('[aria-hidden=true]')).not.toBeNull();
 });
 it(`${kind} cannot activate through keyboard when disabled`,()=>{
  const change=jest.fn();
  act(()=>root.render(<BloomThemeProvider>{kind==='checkbox'
   ?<Checkbox label="Disabled" disabled onCheckedChange={change}/>
   :kind==='radio-chip'?<RadioChip value="four" label="Disabled" disabled onValueChange={change}/>:<Radio value="four" label="Disabled" disabled onValueChange={change}/>
  }</BloomThemeProvider>));
  const el=container.querySelector<HTMLElement>(`[role=${kind==='radio-chip'?'radio':kind}]`)!;
  for(const key of [' ','Enter']) for(const type of ['keydown','keyup']) act(()=>el.dispatchEvent(new KeyboardEvent(type,{key,bubbles:true,cancelable:true})));
  expect(change).not.toHaveBeenCalled();expect(el.getAttribute('aria-disabled')).toBe('true');
 });
}
