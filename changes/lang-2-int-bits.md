---
package: '@oxy.so/bloom-language-compiler'
bump: minor
section: Added
---

- `Int`'s bit and overflow operators, Swift's, with 64-bit two's complement semantics on every backend.
  - `&`, `|`, `^`, `~`, `<<` and `>>` (smart shifts: a negative count shifts the other way, and 64 or more shifts every bit out).
  - The wrapping `&+`, `&-` and `&*`.
  - The compound assignments `&=`, `|=`, `^=`, `<<=` and `>>=`.
  - Precedence is Swift's: shifts bind above multiplication.
- On TypeScript, a tree of these operators is one BigInt expression, so only its result has to fit an `Int`'s exact range there (±(2^53 − 1)). A 32-bit hash or an ARGB colour is exact. A lone `a & b` of 32-bit values is JS's own operator.
- **AST:** `BinaryOp` gains `BitAnd`, `BitOr`, `BitXor`, `Shl`, `Shr`, `WrapAdd`, `WrapSub` and `WrapMul`; `UnaryOp` gains `BitNot`; `AssignOp` gains `BitAnd`, `BitOr`, `BitXor`, `Shl` and `Shr`.
