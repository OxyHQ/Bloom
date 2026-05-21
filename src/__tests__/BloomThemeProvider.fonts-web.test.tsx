/**
 * @jest-environment jsdom
 */

import React from 'react';
import { Platform, Text } from 'react-native';
import { render } from '@testing-library/react-native';

import { BloomThemeProvider } from '../theme/BloomThemeProvider';

describe('BloomThemeProvider — font injection on web', () => {
  const originalOS = Platform.OS;

  beforeEach(() => {
    document.head.innerHTML = '';
    document.body.innerHTML = '';
    Platform.OS = 'web';
  });

  afterAll(() => {
    Platform.OS = originalOS;
  });

  it('injects <style id="bloom-fonts"> by default', () => {
    expect(document.getElementById('bloom-fonts')).toBeNull();
    render(
      <BloomThemeProvider>
        <Text>hi</Text>
      </BloomThemeProvider>,
    );
    expect(document.getElementById('bloom-fonts')).not.toBeNull();
  });

  it('does not inject the style tag when fonts={false}', () => {
    render(
      <BloomThemeProvider fonts={false}>
        <Text>hi</Text>
      </BloomThemeProvider>,
    );
    expect(document.getElementById('bloom-fonts')).toBeNull();
  });
});
