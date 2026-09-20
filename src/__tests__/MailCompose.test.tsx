/**
 * @jest-environment jsdom
 *
 * `mail-compose`, through the REAL react-native-web.
 *
 * The claim worth a rendered test here is `Field` membership: the four things
 * an enclosing `Field` contributes reach a DOM `<input>` as `id`,
 * `aria-describedby`, `aria-invalid` and `readOnly`, and every one of them is
 * silently absent if the control resolves membership by hand and gets one
 * direction backwards. So the attributes are read off the input, not off the
 * props.
 *
 * `copiesOpen`, `recipientsInvalid` and `recipientName` are asserted directly —
 * each encodes a direction (`||`, never `??`) that a rendered field cannot
 * distinguish from luck.
 */
import React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

jest.mock('react-native', () => jest.requireActual('react-native-web'));

import { Field } from '../field';
import {
  MailComposeHeader,
  MailComposeSurface,
  MailRecipientField,
} from '../mail-compose';
import {
  DEFAULT_MAIL_COMPOSE_STRINGS,
  copiesOpen,
  recipientName,
  recipientsInvalid,
} from '../mail-compose/shared';
import type { MailRecipient } from '../mail-compose/types';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

function mount(ui: React.ReactElement): HTMLElement {
  act(() => {
    root.render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        {ui}
      </BloomThemeProvider>,
    );
  });
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

function byTestId(id: string): HTMLElement {
  const el = container.querySelector(`[data-testid="${id}"]`);
  if (!(el instanceof HTMLElement)) throw new Error(`No element for testID "${id}"`);
  return el;
}

function maybe(id: string): HTMLElement | null {
  const el = container.querySelector(`[data-testid="${id}"]`);
  return el instanceof HTMLElement ? el : null;
}

function click(el: HTMLElement) {
  act(() => {
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  });
}

const MIREIA: MailRecipient = { id: 'mireia', name: 'Mireia Solans', address: 'm@v.example' };
const PERE: MailRecipient = { id: 'pere', name: 'Pere Aguiló', address: 'p@v.example' };
const BAD: MailRecipient = { id: 'typo', address: 'nuria@@vallnit', invalid: true };

// ---------------------------------------------------------------------------
//  Pure helpers
// ---------------------------------------------------------------------------

describe('recipientName', () => {
  it('falls back to the address', () => {
    expect(recipientName(MIREIA)).toBe('Mireia Solans');
    expect(recipientName(BAD)).toBe('nuria@@vallnit');
    expect(recipientName({ id: 'x', name: '', address: 'x@y.example' })).toBe('x@y.example');
  });
});

describe('recipientsInvalid', () => {
  it('COMBINES, so neither side can clear the other', () => {
    // A field told it is invalid stays invalid however good its recipients look.
    expect(recipientsInvalid([MIREIA], true)).toBe(true);
    // A good field holding one rejected address is not a good field.
    expect(recipientsInvalid([MIREIA, BAD], false)).toBe(true);
    expect(recipientsInvalid([MIREIA], undefined)).toBe(false);
    expect(recipientsInvalid([], undefined)).toBe(false);
  });
});

describe('copiesOpen', () => {
  it('forces the rows open whenever a copy exists, whatever the toggle said', () => {
    expect(copiesOpen(false, [MIREIA], [])).toBe(true);
    expect(copiesOpen(undefined, [], [PERE])).toBe(true);
    expect(copiesOpen(true, [], [])).toBe(true);
    expect(copiesOpen(false, [], [])).toBe(false);
    expect(copiesOpen(undefined, undefined, undefined)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
//  MailRecipientField
// ---------------------------------------------------------------------------

describe('MailRecipientField', () => {
  const input = () => byTestId('rf-input') as HTMLInputElement;

  it('draws one removable chip per recipient, named after the person', () => {
    mount(
      <MailRecipientField
        label="To"
        recipients={[MIREIA, PERE]}
        onRecipientsChange={() => undefined}
        testID="rf"
      />,
    );
    expect(byTestId('rf-chip-mireia').getAttribute('aria-label')).toBe('Mireia Solans');
    expect(byTestId('rf-chip-pere').getAttribute('aria-label')).toBe('Pere Aguiló');
  });

  it('removes the pressed recipient and keeps the rest', () => {
    const seen: MailRecipient[][] = [];
    mount(
      <MailRecipientField
        label="To"
        recipients={[MIREIA, PERE]}
        onRecipientsChange={(next) => seen.push(next)}
        testID="rf"
      />,
    );
    const remove = byTestId('rf-chip-mireia').querySelector('[aria-label="Remove"]');
    if (!(remove instanceof HTMLElement)) throw new Error('no remove control');
    click(remove);
    expect(seen[seen.length - 1]?.map((r: MailRecipient) => r.id)).toEqual(['pere']);
  });

  it('takes the field’s id, description and invalid state onto the INPUT', () => {
    mount(
      <Field label="Recipients" description="Comma separated" error="Add someone">
        <MailRecipientField
          label="To"
          recipients={[]}
          onRecipientsChange={() => undefined}
          testID="rf"
        />
      </Field>,
    );
    const el = input();
    expect(el.getAttribute('id')).toBeTruthy();
    expect(el.getAttribute('aria-describedby')).toBeTruthy();
    expect(el.getAttribute('aria-invalid')).toBe('true');
  });

  it('keeps its OWN name inside a field, because the gutter is what the eye reads', () => {
    mount(
      <Field label="Recipients">
        <MailRecipientField
          label="To"
          recipients={[]}
          onRecipientsChange={() => undefined}
          testID="rf"
        />
      </Field>,
    );
    // `labelPlacement: 'adjacent'` — the announced name and the visible gutter
    // must not disagree. A `stacked` control would say "Recipients".
    expect(input().getAttribute('aria-label')).toBe('To');
  });

  it('cannot re-enable itself inside a disabled field', () => {
    mount(
      <Field label="Recipients" disabled>
        <MailRecipientField
          label="To"
          recipients={[MIREIA]}
          onRecipientsChange={() => undefined}
          disabled={false}
          testID="rf"
        />
      </Field>,
    );
    expect(input().readOnly).toBe(true);
    expect(byTestId('rf-chip-mireia').querySelector('[aria-label="Remove"]')).toBeNull();
  });

  it('reports invalid from ONE bad recipient, with no field around it', () => {
    mount(
      <MailRecipientField
        label="To"
        recipients={[MIREIA, BAD]}
        onRecipientsChange={() => undefined}
        testID="rf"
      />,
    );
    expect(input().getAttribute('aria-invalid')).toBe('true');
  });

  it('lists the suggestions under the row, named and pressable', () => {
    const picked: string[] = [];
    mount(
      <MailRecipientField
        label="To"
        recipients={[]}
        onRecipientsChange={() => undefined}
        suggestions={[{ id: 'pere', name: 'Pere Aguiló', address: 'p@v.example' }]}
        onSuggestionPress={(s) => picked.push(s.id)}
        testID="rf"
      />,
    );
    // `Item` puts the testID on its content box and the role + name on the
    // pressable AROUND it, so the name is asserted where ARIA reads it.
    const row = byTestId('rf-suggestion-pere').parentElement;
    if (!(row instanceof HTMLElement)) throw new Error('no suggestion pressable');
    expect(row.getAttribute('role')).toBe('button');
    expect(row.getAttribute('aria-label')).toBe('Pere Aguiló, p@v.example');
    click(row);
    expect(picked).toEqual(['pere']);
  });

  it('draws no suggestion list when there is nothing to suggest', () => {
    mount(
      <MailRecipientField
        label="To"
        recipients={[]}
        onRecipientsChange={() => undefined}
        suggestions={[]}
        testID="rf"
      />,
    );
    expect(maybe('rf-suggestions')).toBeNull();
  });
});

// ---------------------------------------------------------------------------
//  MailComposeHeader
// ---------------------------------------------------------------------------

describe('MailComposeHeader', () => {
  const base = {
    to: [MIREIA],
    onToChange: () => undefined,
    onCcChange: () => undefined,
    onBccChange: () => undefined,
  };

  it('hides Cc and Bcc behind the reveal, then draws both', () => {
    mount(<MailComposeHeader {...base} testID="h" />);
    expect(maybe('h-cc')).toBeNull();
    expect(maybe('h-bcc')).toBeNull();

    click(byTestId('h-copies'));
    expect(maybe('h-cc')).not.toBeNull();
    expect(maybe('h-bcc')).not.toBeNull();
    expect(maybe('h-copies')).toBeNull();
  });

  it('never hides a non-empty Cc, whatever the reveal says', () => {
    mount(<MailComposeHeader {...base} cc={[PERE]} copiesVisible={false} testID="h" />);
    expect(maybe('h-cc')).not.toBeNull();
  });

  it('puts the subject last and names it', () => {
    mount(<MailComposeHeader {...base} subject="Roof survey" testID="h" />);
    const subject = byTestId('h-subject') as HTMLInputElement;
    expect(subject.value).toBe('Roof survey');
    expect(subject.getAttribute('aria-label')).toBe(DEFAULT_MAIL_COMPOSE_STRINGS.subject);
  });
});

// ---------------------------------------------------------------------------
//  MailComposeSurface
// ---------------------------------------------------------------------------

describe('MailComposeSurface', () => {
  it('draws a frame when docked and none at all when a sheet', () => {
    mount(<MailComposeSurface variant="docked" testID="s" />);
    expect(getComputedStyle(byTestId('s')).borderTopWidth).toBe('1px');

    act(() => root.render(<div />));
    mount(<MailComposeSurface variant="sheet" testID="s" />);
    expect(getComputedStyle(byTestId('s')).borderTopWidth).toBe('0px');
  });

  it('collapses a docked panel to its bar, and ignores minimized on a sheet', () => {
    mount(
      <MailComposeSurface variant="docked" minimized onMinimizedChange={() => undefined} testID="s">
        <span data-testid="body-slot">body</span>
      </MailComposeSurface>,
    );
    expect(maybe('s-title')).not.toBeNull();
    expect(maybe('body-slot')).toBeNull();

    act(() => root.render(<div />));
    mount(
      <MailComposeSurface variant="sheet" minimized onMinimizedChange={() => undefined} testID="s">
        <span data-testid="body-slot">body</span>
      </MailComposeSurface>,
    );
    expect(maybe('body-slot')).not.toBeNull();
  });

  it('renders the toolbar as a SLOT, drawing nothing of its own without one', () => {
    mount(<MailComposeSurface testID="s" />);
    expect(maybe('s-toolbar')).toBeNull();

    act(() => root.render(<div />));
    mount(
      <MailComposeSurface toolbar={<span data-testid="tb">toolbar</span>} testID="s" />,
    );
    expect(byTestId('s-toolbar').textContent).toBe('toolbar');
  });

  it('swaps the send label while sending and disables it either way', () => {
    mount(<MailComposeSurface onSend={() => undefined} sending testID="s" />);
    expect(byTestId('s-send').textContent).toBe(DEFAULT_MAIL_COMPOSE_STRINGS.sending);
    expect(byTestId('s-send').getAttribute('aria-disabled')).toBe('true');

    act(() => root.render(<div />));
    mount(<MailComposeSurface onSend={() => undefined} sendDisabled testID="s" />);
    expect(byTestId('s-send').textContent).toBe(DEFAULT_MAIL_COMPOSE_STRINGS.send);
    expect(byTestId('s-send').getAttribute('aria-disabled')).toBe('true');
  });

  it('names every bar control, and draws only the ones the app answered', () => {
    mount(<MailComposeSurface testID="s" />);
    expect(maybe('s-close')).toBeNull();
    expect(maybe('s-expand')).toBeNull();
    expect(maybe('s-minimize')).toBeNull();

    act(() => root.render(<div />));
    mount(
      <MailComposeSurface
        onClose={() => undefined}
        onExpand={() => undefined}
        onMinimizedChange={() => undefined}
        onAttach={() => undefined}
        onDiscard={() => undefined}
        testID="s"
      />,
    );
    expect(byTestId('s-close').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_COMPOSE_STRINGS.close,
    );
    expect(byTestId('s-expand').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_COMPOSE_STRINGS.expand,
    );
    expect(byTestId('s-minimize').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_COMPOSE_STRINGS.minimize,
    );
    expect(byTestId('s-attach').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_COMPOSE_STRINGS.attach,
    );
    expect(byTestId('s-discard').getAttribute('aria-label')).toBe(
      DEFAULT_MAIL_COMPOSE_STRINGS.discard,
    );
  });

  it('hands the pending attachments to the shared composer strip', () => {
    mount(
      <MailComposeSurface
        attachments={[{ id: 'f1', name: 'survey.pdf' }]}
        onAttachmentRemove={() => undefined}
        testID="s"
      />,
    );
    expect(maybe('s-attachments')).not.toBeNull();
    expect(byTestId('s-attachments-f1-remove').getAttribute('aria-label')).toBe(
      'Remove survey.pdf',
    );
  });
});
