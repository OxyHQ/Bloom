// The transcendental functions the engine calls, with V8's results (node 24 / V8 13.6 on Linux
// x86-64, where the goldens are generated): `Math.sin`, `Math.cos`, `Math.atan2`, `Math.exp`,
// `Math.log` and `Math.cbrt` are V8's fdlibm (Fdlibm.swift), `Math.pow` is the platform's
// `std::pow`, glibc's FMA build there (GlibcPow.swift). Both are pure Swift on IEEE doubles, so
// Linux and Apple compute the same bits; Darwin's and glibc's own libm differ from V8 in the last
// bit (measured: 3–18% of samples for these functions). `sqrt` needs no port: it is correctly
// rounded everywhere. The engine calls these, never Foundation's.

@inline(__always) func jsPow(_ x: Double, _ y: Double) -> Double { GlibcPow.v8Pow(x, y, fma: true) }
@inline(__always) func jsCbrt(_ x: Double) -> Double { Fdlibm.cbrt(x) }
@inline(__always) func jsAtan2(_ y: Double, _ x: Double) -> Double { Fdlibm.atan2(y, x) }
@inline(__always) func jsExp(_ x: Double) -> Double { Fdlibm.exp(x) }
@inline(__always) func jsLog(_ x: Double) -> Double { Fdlibm.log(x) }
@inline(__always) func jsSin(_ x: Double) -> Double { Fdlibm.sin(x) }
@inline(__always) func jsCos(_ x: Double) -> Double { Fdlibm.cos(x) }
