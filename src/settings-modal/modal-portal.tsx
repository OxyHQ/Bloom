/**
 * The portal the settings modal renders through — WEB/default. A DOM portal to
 * `document.body`'s bloom root, like `dialog/Dialog.web`. Metro selects the
 * `.native` sibling; every other bundler resolves this file.
 */
export { Portal as ModalPortal } from '../portal/index.web';
