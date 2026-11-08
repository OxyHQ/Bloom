import React from 'react';
import { createRoot } from 'react-dom/client';
import { AgentAvatar } from '../../src/agent-avatar/AgentAvatar';
import type { AvatarPresetId } from '../../src/agent-avatar/catalog-ids';
let root: ReturnType<typeof createRoot>;
export function mount(count: number, mixed = false) {
  if (!root) {
    document.querySelector<HTMLElement>('#storybook-root')!.style.display = 'none';
    const host = document.createElement('div');
    host.id = 'crowd';
    host.style.cssText =
      'position:fixed;inset:0;display:flex;flex-wrap:wrap;align-content:flex-start;background:white';
    document.body.append(host);
    root = createRoot(host);
  }
  root.render(
    <>
      {Array.from({ length: count }, (_, i) => (
        <AgentAvatar
          key={`${count}-${i}`}
          character={
            mixed
              ? i % 10 === 9
                ? {
                    shape: 'bot_cloud',
                    eyes: 'bot',
                    accessory: 'none',
                    eyewear: 'none',
                    color: 'blue',
                  }
                : {
                    preset: [
                      'blue_beret',
                      'alfred',
                      'purple_heart',
                      'lime_frog',
                      'coral_monocle',
                      'gus',
                      'blue_spectacles',
                      'lime_headphones',
                      'clippo',
                    ][i % 10] as AvatarPresetId,
                  }
              : { preset: 'blue_beret' }
          }
          size={90}
          interactive
        />
      ))}
    </>,
  );
}
