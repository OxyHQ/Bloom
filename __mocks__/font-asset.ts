// Stub font binary requires/imports so Jest doesn't try to parse the file
// contents as JS. Web bundlers (Vite/webpack) return a URL string; Metro
// returns a numeric asset id. The mock returns a stable string so any code
// reading the resolved URL in tests gets a usable identifier.
export default 'mock-font-asset.ttf';
