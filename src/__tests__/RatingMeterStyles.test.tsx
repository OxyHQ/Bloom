import { render } from '@testing-library/react-native';
import { BloomThemeProvider } from '../theme/BloomThemeProvider';
import { RatingBar } from '../rating';
import { Meter } from '../stat-bar';
import { resolvedStyle } from './support/rendered-style';

const label = { fontSize: 10, fontWeight: '600', color: '#121212' } as const;
const track = { height: 8, backgroundColor: '#eef0f1' } as const;
const fill = { width: '100%', backgroundColor: '#121212' } as const;

it('delegates RatingBar track and fill styles to Meter while keeping the fill fraction data-owned', () => {
  const api = render(
    <BloomThemeProvider>
      <RatingBar
        label="Five"
        display="75%"
        value={0.75}
        max={1}
        labelWidth={16}
        testID="row"
        style={{ gap: 8 }}
        labelStyle={label}
        displayStyle={label}
        trackStyle={track}
        fillStyle={fill}
      />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(api.getByTestId('row').props.style).gap).toBe(8);
  expect(resolvedStyle(api.getByTestId('row-bar').props.style)).toMatchObject(track);
  expect(resolvedStyle(api.getByTestId('row-fill').props.style)).toMatchObject({
    width: '75%',
    backgroundColor: '#121212',
  });
  for (const text of ['Five', '75%'])
    expect(
      resolvedStyle(api.getByText(text, { includeHiddenElements: true }).props.style),
    ).toMatchObject(label);
});

it('keeps direct Meter defaults and semantic values while its styles customize paint and height', () => {
  const api = render(
    <BloomThemeProvider>
      <Meter
        value={2}
        max={4}
        accessibilityLabel="Progress"
        testID="meter"
        style={track}
        fillStyle={fill}
      />
    </BloomThemeProvider>,
  );
  expect(resolvedStyle(api.getByTestId('meter').props.style)).toMatchObject(track);
  expect(api.getByTestId('meter').props['aria-valuenow']).toBe(2);
  expect(resolvedStyle(api.getByTestId('meter-fill').props.style)).toMatchObject({
    width: '50%',
    backgroundColor: '#121212',
  });
});
