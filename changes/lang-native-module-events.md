---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Module events in `extern native`: `func onStatus(_ listener: ({ player: Int, status: String }) -> Void) -> () -> Void` is an event the native module sends. The spec declares it as codegen's `EventEmitter`, so the Java spec has `emitOnStatus(ReadableMap)`, and the bridge adds the listener and returns what removes it.
