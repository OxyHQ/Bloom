import React from 'react';
import { Text, View } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { BenefitList, BenefitRow } from '../benefit-list';

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('BenefitRow', () => {
  it('renders the label as caption text', () => {
    const { getByText } = renderWithTheme(
      <BenefitRow icon={<View />} label="Your data stays private" />,
    );
    expect(getByText('Your data stays private')).toBeTruthy();
  });

  it('renders children when provided instead of label', () => {
    const { getByText, queryByText } = renderWithTheme(
      <BenefitRow icon={<View />} label="ignored">
        Encrypted end to end
      </BenefitRow>,
    );
    expect(getByText('Encrypted end to end')).toBeTruthy();
    expect(queryByText('ignored')).toBeNull();
  });

  it('renders the (decorative, a11y-hidden) icon slot', () => {
    const { getByText } = renderWithTheme(
      <BenefitRow icon={<Text>ICON</Text>} label="Row" />,
    );
    // The icon square is aria-hidden (the caption carries the meaning), so the
    // icon node is only reachable with hidden elements included.
    expect(getByText('ICON', { includeHiddenElements: true })).toBeTruthy();
  });

  it('derives an accessibility label from string content', () => {
    const { getByLabelText } = renderWithTheme(
      <BenefitRow icon={<View />} label="Revoke anytime" />,
    );
    const node = getByLabelText('Revoke anytime');
    expect(node.props.accessibilityRole).toBe('text');
  });

  it('uses an explicit accessibilityLabel over the text content', () => {
    const { getByLabelText } = renderWithTheme(
      <BenefitRow
        icon={<View />}
        label="Revoke anytime"
        accessibilityLabel="Custom label"
      />,
    );
    expect(getByLabelText('Custom label')).toBeTruthy();
  });
});

describe('BenefitList', () => {
  it('renders stacked rows', () => {
    const { getByText } = renderWithTheme(
      <BenefitList accessibilityLabel="Benefits">
        <BenefitRow icon={<View />} label="First benefit" />
        <BenefitRow icon={<View />} label="Second benefit" />
        <BenefitRow icon={<View />} label="Third benefit" />
      </BenefitList>,
    );
    expect(getByText('First benefit')).toBeTruthy();
    expect(getByText('Second benefit')).toBeTruthy();
    expect(getByText('Third benefit')).toBeTruthy();
  });

  it('applies the card accessibility label', () => {
    const { getByLabelText } = renderWithTheme(
      <BenefitList accessibilityLabel="What you're sharing">
        <BenefitRow icon={<View />} label="Profile photo" />
      </BenefitList>,
    );
    expect(getByLabelText("What you're sharing")).toBeTruthy();
  });

  it('renders a bordered, rounded card surface using the token roles', () => {
    const { getByLabelText } = renderWithTheme(
      <BenefitList accessibilityLabel="card">
        <BenefitRow icon={<View />} label="Row" />
      </BenefitList>,
    );
    const card = getByLabelText('card');
    // The card style is a nested style array; flatten it fully to assert the
    // radius-20 / border-hairline (0.5px) / border-image token values landed.
    const flat: Record<string, unknown> = {};
    const visit = (s: unknown): void => {
      if (Array.isArray(s)) {
        s.forEach(visit);
      } else if (s && typeof s === 'object') {
        Object.assign(flat, s);
      }
    };
    visit(card.props.style);
    expect(flat.borderRadius).toBe(20);
    expect(flat.borderWidth).toBe(0.5);
    expect(flat.borderColor).toBeTruthy();
  });
});
