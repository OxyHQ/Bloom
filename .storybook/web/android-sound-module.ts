/**
 * Web resolution of react-native-svg's Android touch-sound TurboModule.
 *
 * react-native-svg 15.16's touch mixin (`lib/SvgTouchableMixin.js`) lazily
 * `require`s `../fabric/NativeSvgSoundModule` inside a
 * `Platform.OS === 'android'` branch. Metro keeps that require lazy; esbuild
 * hoists it into the web bundle as a static
 * `import { TurboModuleRegistry } from 'react-native'`, which react-native-web
 * does not export, so the whole preview fails to link and no story renders.
 * The branch never runs on web, so nothing reads this module.
 */
export default null;
