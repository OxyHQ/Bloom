import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';

import { LocaleProvider } from '../locale';
import { MailComposeHeader, MailRecipientField } from '../mail-compose';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { resolvedStyle } from './support/rendered-style';

const noop = () => undefined;

function renderHeader(locale: string) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      <LocaleProvider locale={locale}>
        <MailComposeHeader to={[]} onToChange={noop} onCcChange={noop} onBccChange={noop} copiesVisible testID="h" />
      </LocaleProvider>
    </BloomThemeProvider>,
  );
}

/** The measuring copy reports a natural width, as a layout pass would. */
function measure(screen: ReturnType<typeof render>, label: string, width: number) {
  const copies = screen.getAllByText(label, { includeHiddenElements: true });
  const copy = copies.find((node) => node.props.onLayout);
  if (!copy) throw new Error(`no measuring copy for ${label}`);
  fireEvent(copy, 'layout', { nativeEvent: { layout: { width, height: 20, x: 0, y: 0 } } });
}

describe('MailComposeHeader gutter', () => {
  it('starts at 56 and grows every row to the widest label, so a long translation is not clipped', () => {
    const screen = renderHeader('ru');
    const widthOf = (testID: string) => resolvedStyle(screen.getByTestId(testID).props.style).width;
    expect(widthOf('h-to-label')).toBe(56);

    measure(screen, 'Кому', 34);
    measure(screen, 'Скрытая копия', 103.4);
    // Every row takes the widest, rounded up, so the chips keep one margin.
    expect(widthOf('h-to-label')).toBe(104);
    expect(widthOf('h-cc-label')).toBe(104);
    expect(widthOf('h-bcc-label')).toBe(104);
  });

  it('keeps 56 when every label fits, and caps a runaway label at 120', () => {
    const screen = renderHeader('en');
    measure(screen, 'Subject', 50);
    expect(resolvedStyle(screen.getByTestId('h-to-label').props.style).width).toBe(56);
    measure(screen, 'Bcc', 400);
    expect(resolvedStyle(screen.getByTestId('h-to-label').props.style).width).toBe(120);
  });

  it('hides the measuring copy from assistive technology', () => {
    const screen = renderHeader('en');
    expect(screen.getAllByText('Subject')).toHaveLength(1);
  });

  it('leaves a standalone field at its fixed 56, with no measuring copy', () => {
    const screen = render(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <MailRecipientField label="To" recipients={[]} onRecipientsChange={noop} testID="f" />
      </BloomThemeProvider>,
    );
    expect(resolvedStyle(screen.getByTestId('f-label').props.style).width).toBe(56);
    expect(screen.getAllByText('To', { includeHiddenElements: true })).toHaveLength(1);
  });
});
