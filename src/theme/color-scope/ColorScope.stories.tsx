import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { BloomColorScope } from './ColorScope.web';
import { useTheme } from '../use-theme';
import { Dialog } from '../../dialog/Dialog.web';
import { useDialogControl } from '../../dialog/context';
import { Button } from '../../button/Button.web';
import { Portal } from '../../portal/Portal.web';

function Probe({ name }: { name: string }) {
  const theme = useTheme();
  const [value, setValue] = useState('retained');
  const [mount] = useState(() => Math.random().toString(16));
  return (
    <div
      data-testid={name}
      data-mount={mount}
      data-mode={theme.mode}
      data-color={theme.colors.background}
      style={{
        padding: 12,
        backgroundColor: 'var(--background)',
        color: 'var(--color-text)',
        pointerEvents: 'auto',
      }}
    >
      Exact scoped surface
      <input
        aria-label={`${name} draft`}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    </div>
  );
}
function ExactScopeFixture({ placement = 'end' }: { placement?: 'end' | 'bottom' }) {
  const sheet = useDialogControl();
  const nested = useDialogControl();
  const [exact, setExact] = useState(false);
  const [alternate, setAlternate] = useState(false);
  const [open, setOpen] = useState(false);
  return (
    <div style={{ padding: 24 }}>
      <button onClick={() => setExact((value) => !value)}>Toggle exact scope</button>
      <button onClick={() => setAlternate((value) => !value)}>Switch scoped mode</button>
      <button onClick={() => setOpen((value) => !value)}>Toggle scoped portal</button>
      <Probe name="outside-scope" />
      <BloomColorScope
        mode={exact ? (alternate ? 'light' : 'dark') : undefined}
        tokens={
          exact
            ? {
                background: alternate ? '#c46b12' : '#5433eb',
                foreground: '#ffffff',
                card: 'rgba(255,255,255,0.12)',
              }
            : undefined
        }
      >
        <Probe name="inside-scope" />
        <Button onPress={() => sheet.open()}>Open scoped sheet</Button>
        <Dialog control={sheet} placement={placement} label="Scoped sheet" material="flat">
          <Probe name="sheet-scope" />
          <Button onPress={() => nested.open()}>Open nested scope</Button>
          <Dialog control={nested} label="Nested scope" material="flat">
            <Probe name="nested-scope" />
          </Dialog>
        </Dialog>
        {open ? (
          <Portal>
            <div style={{ position: 'fixed', bottom: 12, right: 12 }}>
              <Probe name="portal-scope" />
            </div>
          </Portal>
        ) : null}
      </BloomColorScope>
    </div>
  );
}
const meta = {
  title: 'Theme/ColorScope',
  component: ExactScopeFixture,
} satisfies Meta<typeof ExactScopeFixture>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ExactTokens: Story = {};
