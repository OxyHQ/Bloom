import React from 'react';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { PatientInfoCard } from '../patient-info-card';
import type { PatientInfoCardDetail } from '../patient-info-card';
import { RiDropLine } from '../icons/remix/RiDropLine';
import { resolvedStyle } from './support/rendered-style';

const DETAILS: PatientInfoCardDetail[] = [
  { icon: RiDropLine, label: 'Blood Type', value: 'A rh+' },
  { icon: RiDropLine, label: 'Gender', value: 'Male' },
];

function renderIn(ui: React.ReactElement) {
  return render(
    <BloomThemeProvider mode="light" colorPreset="teal">
      {ui}
    </BloomThemeProvider>,
  );
}

describe('PatientInfoCard', () => {
  it('keeps the geometry: radius 20, padding 24/10/10, 15 apart; rows radius 10 padding 8/10', () => {
    const { getByTestId } = renderIn(<PatientInfoCard testID="card" name="Maya" details={DETAILS} />);
    expect(resolvedStyle(getByTestId('card').props.style)).toMatchObject({
      height: 330,
      borderRadius: 20,
      gap: 15,
      paddingTop: 24,
      paddingBottom: 10,
      paddingLeft: 10,
      paddingRight: 10,
    });
    expect(resolvedStyle(getByTestId('card-detail-0').props.style)).toMatchObject({
      borderRadius: 10,
      paddingTop: 8,
      paddingBottom: 8,
      paddingLeft: 10,
      paddingRight: 10,
    });
  });

  it('renders the name, every detail, and initials derived from the name', () => {
    const { getByText, getAllByText } = renderIn(<PatientInfoCard name="maya" details={DETAILS} />);
    expect(getByText('maya')).toBeTruthy();
    expect(getByText('Blood Type')).toBeTruthy();
    expect(getByText('A rh+')).toBeTruthy();
    expect(getAllByText('M').length).toBeGreaterThan(0);
  });

  it('names the photo button and hides it on request', () => {
    const { getByLabelText, queryByLabelText, rerender } = renderIn(
      <PatientInfoCard name="Maya" details={DETAILS} addPhotoLabel="Add photo" />,
    );
    expect(getByLabelText('Add photo')).toBeTruthy();
    rerender(
      <BloomThemeProvider mode="light" colorPreset="teal">
        <PatientInfoCard name="Maya" details={DETAILS} addPhotoLabel="Add photo" hideAddPhoto />
      </BloomThemeProvider>,
    );
    expect(queryByLabelText('Add photo')).toBeNull();
  });
});
