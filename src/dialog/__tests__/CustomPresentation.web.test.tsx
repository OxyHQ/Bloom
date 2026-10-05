/** @jest-environment jsdom */
import React from 'react';
import { act } from 'react';
import { createRoot } from 'react-dom/client';
jest.mock('react-native', () => jest.requireActual('react-native-web'));
jest.mock('../../bottom-sheet', () => jest.requireActual('../../bottom-sheet/index.web'));
jest.mock('../../surface/SurfacePaint', () => ({SurfacePaint: () => <div data-surface-paint=""/>}));
import { BloomThemeProvider } from '../../theme/BloomThemeProvider';
import { Dialog } from '../Dialog.web';
import { useDialogControl, useDialogContext } from '../context';
import { resetOverlayStack } from '../../overlay/stack';
(globalThis as {IS_REACT_ACT_ENVIRONMENT?:boolean}).IS_REACT_ACT_ENVIRONMENT=true;
function Content(){const ctx=useDialogContext();return <button onClick={()=>ctx.close()} data-closing={String(!!ctx.isClosing)}>Dismiss</button>;}
function Fixture({custom=false,onClose}:{custom?:boolean;onClose:()=>void}){const control=useDialogControl();return <BloomThemeProvider mode="light" colorPreset="teal"><Dialog startOpen control={control} presentation={custom?'custom':undefined} exitDuration={custom?560:undefined} onClose={onClose} label="Fixture"><Content/></Dialog></BloomThemeProvider>;}
describe('custom Dialog presentation',()=>{
 let host:HTMLDivElement;let root:ReturnType<typeof createRoot>;
 beforeEach(()=>{jest.useFakeTimers();resetOverlayStack();host=document.createElement('div');document.body.appendChild(host);root=createRoot(host);});
 afterEach(()=>{act(()=>root.unmount());host.remove();resetOverlayStack();jest.useRealTimers();});
 it('keeps the default material and close lifecycle',()=>{const close=jest.fn();act(()=>root.render(<Fixture onClose={close}/>));expect(document.querySelector('[data-surface-paint]')).not.toBeNull();act(()=>document.querySelector('button')!.click());expect(close).not.toHaveBeenCalled();act(()=>jest.advanceTimersByTime(1000));expect(close).toHaveBeenCalledTimes(1);});
 it('leaves custom paint to content and retains it through the requested exit',()=>{const close=jest.fn();act(()=>root.render(<Fixture custom onClose={close}/>));expect(document.querySelector('[data-surface-paint]')).toBeNull();act(()=>document.querySelector('button')!.click());expect(document.querySelector('[data-closing=true]')).not.toBeNull();act(()=>jest.advanceTimersByTime(559));expect(close).not.toHaveBeenCalled();expect(document.querySelector('[role=dialog]')).not.toBeNull();act(()=>jest.advanceTimersByTime(1));expect(close).toHaveBeenCalledTimes(1);expect(document.querySelector('[role=dialog]')).toBeNull();});
});
