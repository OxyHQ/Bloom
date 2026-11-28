---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- Foundation's math is public in `Bloom.Math`, with the same double on every backend (fdlibm: V8's `Math` on TypeScript, `StrictMath` on the JVM). It covers `cbrt`, `asin`, `acos`, `atan`, `sinh`, `cosh`, `tanh`, `asinh`, `acosh`, `atanh`, `exp2`, `expm1`, `log1p`, `trunc` and `fmod`, plus `Double.truncatingRemainder(dividingBy:)`. `cbrt` is the true cube root, negative for a negative input, where `pow(x, 1.0 / 3.0)` misses.
