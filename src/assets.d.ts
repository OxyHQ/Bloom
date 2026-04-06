/** Ambient module declarations for static image assets (Metro + web bundlers). */

declare module '*.jpg' {
  const value: number; // Metro returns a numeric asset ID; web bundlers return a URL string at runtime
  export default value;
}

declare module '*.jpeg' {
  const value: number;
  export default value;
}

declare module '*.png' {
  const value: number;
  export default value;
}

declare module '*.gif' {
  const value: number;
  export default value;
}

declare module '*.webp' {
  const value: number;
  export default value;
}
