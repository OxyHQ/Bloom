import './global.css';
import { createElement } from 'react';
import { registerRootComponent } from 'expo';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { PanelGroupsLab } from './PanelGroupsLab';
function NativeLab() {
  return createElement(KeyboardProvider, null, createElement(PanelGroupsLab));
}
registerRootComponent(NativeLab);
