---
package: '@oxy.so/bloom-language-compiler'
bump: patch
section: Fixed
---

- **Invalid TS emitted:** a view with a prop named `props` declared it twice (`const { name, props } = props`, a SyntaxError); a module with a prop or a local named `props` names the view function's own parameter `$props`. A module that imports React's `useState` (or `useEffect`, `useRef`, `useId`) itself beside a hook-local `@State var` got a second `import { useState } from "react"`; the emitter's own import of a name the module already imports from that module is that binding (mention13 hook-state-import-clash, lang-native-android-2's `props` prop). The emitter's other names (`$c`, `$t0`, `$view0`, `$fn0`, `$jsx`, `$json`) start with `$`, which no Bloom identifier can.
