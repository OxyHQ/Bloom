/**
 * `@oxy.so/bloom-language/screen-host`: a screen's view drawn as a Bloom
 * `Screen`, its root's chrome (`title`, `toolbar`, `header`, `footer`,
 * `sheet`, …) around its content, for a navigator that is not expo-router's.
 * `screen()` of `/router` draws its body with it; the Bloom router of a Bloom
 * build draws each route with it. Nothing it reaches imports expo-router: on
 * iOS the header asks for it lazily, in a `try`, for the system bar inside
 * expo-router's stack, and is Bloom's PageHeader without it.
 */
export { drawScreen, ScreenHost } from './router/screen-host';
export type { ScreenHostOptions } from './router/screen-host';
