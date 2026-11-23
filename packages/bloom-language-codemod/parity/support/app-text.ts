/**
 * React Native's `Text` as an app on `@oxy.so/app-preset` 6.8.0 bundles it:
 * NativeWind's Text (`styled(host, { className: 'style' })`) over the host that
 * draws Bloom's base face (`metro/base-font`, restated in the language's
 * `parity/support/base-font`). The corpus draws a screen's Text with it.
 */
import type { ComponentType } from 'react';
import * as RN from 'react-native';
import { styled } from 'react-native-css';
import { copyComponentProperties } from 'react-native-css/components/copyComponentProperties';

import { BaseFontText } from '../../../bloom-language/parity/support/base-font';

/** The base-font host as NativeWind styles it: a Text taking React Native's Text props. */
const BaseText: ComponentType<RN.TextProps> = BaseFontText;

export const Text = copyComponentProperties(RN.Text, styled(BaseText, { className: 'style' }));
