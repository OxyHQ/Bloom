// A Swift port of the subset of fdlibm that V8 uses for Math.sin, Math.cos,
// Math.atan2, Math.exp, Math.log, Math.cbrt and (legacy) Math.pow.
//
// Source: V8 13.6 `src/base/ieee754.cc`, itself derived from fdlibm 5.3 /
// FreeBSD msun (Copyright (C) 1993-2004 by Sun Microsystems, Inc. All rights
// reserved. Developed at SunSoft, a Sun Microsystems, Inc. business.
// Permission to use, copy, modify, and distribute this software is freely
// granted, provided that this notice is preserved.)
//
// The code is a line-by-line transliteration: same operations in the same
// order on IEEE-754 doubles, so it returns the same bits as V8 on every
// platform. Swift never contracts a*b+c into an FMA and never reassociates,
// and no libm call is made (sqrt is correctly rounded everywhere).

enum Fdlibm {
  // MARK: - Word access (EXTRACT_WORDS, GET_HIGH_WORD, INSERT_WORDS, ...)

  @inline(__always)
  private static func highWord(_ d: Double) -> Int32 {
    Int32(truncatingIfNeeded: d.bitPattern >> 32)
  }

  @inline(__always)
  private static func lowWord(_ d: Double) -> UInt32 {
    UInt32(truncatingIfNeeded: d.bitPattern)
  }

  @inline(__always)
  private static func fromWords(_ hi: Int32, _ lo: UInt32) -> Double {
    Double(bitPattern: (UInt64(UInt32(bitPattern: hi)) << 32) | UInt64(lo))
  }

  @inline(__always)
  private static func setHighWord(_ d: Double, _ hi: Int32) -> Double {
    fromWords(hi, lowWord(d))
  }

  @inline(__always)
  private static func setLowWord(_ d: Double, _ lo: UInt32) -> Double {
    fromWords(highWord(d), lo)
  }

  // MARK: - scalbn (fdlibm s_scalbn.c, matches the C library's exact scalbn)

  private static func scalbn(_ xIn: Double, _ n: Int32) -> Double {
    let two54 = 1.80143985094819840000e+16
    let twom54 = 5.55111512312578270212e-17
    let huge = 1.0e+300
    let tiny = 1.0e-300
    var x = xIn
    var hx = highWord(x)
    let lx = lowWord(x)
    var k = (hx & 0x7FF0_0000) >> 20
    if k == 0 {
      if (lx | UInt32(bitPattern: hx & 0x7FFF_FFFF)) == 0 { return x }
      x *= two54
      hx = highWord(x)
      k = ((hx & 0x7FF0_0000) >> 20) - 54
      if n < -50000 { return tiny * x }
    }
    if k == 0x7FF { return x + x }
    k = k &+ n
    if k > 0x7FE { return huge * (x.sign == .minus ? -huge : huge) }
    if k > 0 {
      return setHighWord(x, (hx & Int32(bitPattern: 0x800F_FFFF)) | (k << 20))
    }
    if k <= -54 {
      if n > 50000 { return huge * (x.sign == .minus ? -huge : huge) }
      return tiny * (x.sign == .minus ? -tiny : tiny)
    }
    k += 54
    x = setHighWord(x, (hx & Int32(bitPattern: 0x800F_FFFF)) | (k << 20))
    return x * twom54
  }

  // MARK: - Argument reduction for sin/cos

  private static let twoOverPi: [Int32] = [
    0xA2F983, 0x6E4E44, 0x1529FC, 0x2757D1, 0xF534DD, 0xC0DB62, 0x95993C,
    0x439041, 0xFE5163, 0xABDEBB, 0xC561B7, 0x246E3A, 0x424DD2, 0xE00649,
    0x2EEA09, 0xD1921C, 0xFE1DEB, 0x1CB129, 0xA73EE8, 0x8235F5, 0x2EBB44,
    0x84E99C, 0x7026B4, 0x5F7E41, 0x3991D6, 0x398353, 0x39F49C, 0x845F8B,
    0xBDF928, 0x3B1FF8, 0x97FFDE, 0x05980F, 0xEF2F11, 0x8B5A0A, 0x6D1F6D,
    0x367ECF, 0x27CB09, 0xB74F46, 0x3F669E, 0x5FEA2D, 0x7527BA, 0xC7EBE5,
    0xF17B3D, 0x0739F7, 0x8A5292, 0xEA6BFB, 0x5FB11F, 0x8D5D08, 0x560330,
    0x46FC7B, 0x6BABF0, 0xCFBC20, 0x9AF436, 0x1DA9E3, 0x91615E, 0xE61B08,
    0x659985, 0x5F14A0, 0x68408D, 0xFFD880, 0x4D7327, 0x310606, 0x1556CA,
    0x73A8C9, 0x60E27B, 0xC08C6B,
  ]

  private static let npio2HW: [Int32] = [
    0x3FF921FB, 0x400921FB, 0x4012D97C, 0x401921FB, 0x401F6A7A, 0x4022D97C,
    0x4025FDBB, 0x402921FB, 0x402C463A, 0x402F6A7A, 0x4031475C, 0x4032D97C,
    0x40346B9C, 0x4035FDBB, 0x40378FDB, 0x403921FB, 0x403AB41B, 0x403C463A,
    0x403DD85A, 0x403F6A7A, 0x40407E4C, 0x4041475C, 0x4042106C, 0x4042D97C,
    0x4043A28C, 0x40446B9C, 0x404534AC, 0x4045FDBB, 0x4046C6CB, 0x40478FDB,
    0x404858EB, 0x404921FB,
  ]

  private static let PIo2: [Double] = [
    1.57079625129699707031e+00,  // 0x3FF921FB, 0x40000000
    7.54978941586159635335e-08,  // 0x3E74442D, 0x00000000
    5.39030252995776476554e-15,  // 0x3CF84698, 0x80000000
    3.28200341580791294123e-22,  // 0x3B78CC51, 0x60000000
    1.27065575308067607349e-29,  // 0x39F01B83, 0x80000000
    1.22933308981111328932e-36,  // 0x387A2520, 0x40000000
    2.73370053816464559624e-44,  // 0x36E38222, 0x80000000
    2.16741683877804819444e-51,  // 0x3569F31D, 0x00000000
  ]

  /// __ieee754_rem_pio2: returns n and x - n*pi/2 as y0 + y1.
  private static func remPio2(_ x: Double) -> (n: Int32, y0: Double, y1: Double) {
    let half = 5.00000000000000000000e-01
    let two24 = 1.67772160000000000000e+07
    let invpio2 = 6.36619772367581382433e-01  // 0x3FE45F30, 0x6DC9C883
    let pio2_1 = 1.57079632673412561417e+00   // 0x3FF921FB, 0x54400000
    let pio2_1t = 6.07710050650619224932e-11  // 0x3DD0B461, 0x1A626331
    let pio2_2 = 6.07710050630396597660e-11   // 0x3DD0B461, 0x1A600000
    let pio2_2t = 2.02226624879595063154e-21  // 0x3BA3198A, 0x2E037073
    let pio2_3 = 2.02226624871116645580e-21   // 0x3BA3198A, 0x2E000000
    let pio2_3t = 8.47842766036889956997e-32  // 0x397B839A, 0x252049C1

    let hx = highWord(x)
    let ix = hx & 0x7FFF_FFFF
    if ix <= 0x3FE921FB { return (0, x, 0) }
    if ix < 0x4002D97C {  // |x| < 3pi/4, n = +-1
      if hx > 0 {
        var z = x - pio2_1
        if ix != 0x3FF921FB {
          let y0 = z - pio2_1t
          return (1, y0, (z - y0) - pio2_1t)
        } else {
          z -= pio2_2
          let y0 = z - pio2_2t
          return (1, y0, (z - y0) - pio2_2t)
        }
      } else {
        var z = x + pio2_1
        if ix != 0x3FF921FB {
          let y0 = z + pio2_1t
          return (-1, y0, (z - y0) + pio2_1t)
        } else {
          z += pio2_2
          let y0 = z + pio2_2t
          return (-1, y0, (z - y0) + pio2_2t)
        }
      }
    }
    if ix <= 0x413921FB {  // |x| ~<= 2^19*(pi/2), medium size
      var t = Swift.abs(x)
      let n = Int32(t * invpio2 + half)
      let fn = Double(n)
      var r = t - fn * pio2_1
      var w = fn * pio2_1t
      var y0: Double
      if n < 32 && ix != npio2HW[Int(n - 1)] {
        y0 = r - w
      } else {
        let j = ix >> 20
        y0 = r - w
        var high = UInt32(bitPattern: highWord(y0))
        var i = j - Int32((high >> 20) & 0x7FF)
        if i > 16 {
          t = r
          w = fn * pio2_2
          r = t - w
          w = fn * pio2_2t - ((t - r) - w)
          y0 = r - w
          high = UInt32(bitPattern: highWord(y0))
          i = j - Int32((high >> 20) & 0x7FF)
          if i > 49 {
            t = r
            w = fn * pio2_3
            r = t - w
            w = fn * pio2_3t - ((t - r) - w)
            y0 = r - w
          }
        }
      }
      let y1 = (r - y0) - w
      if hx < 0 { return (-n, -y0, -y1) }
      return (n, y0, y1)
    }
    if ix >= 0x7FF0_0000 {
      let nan = x - x
      return (0, nan, nan)
    }
    // Large arguments: Payne-Hanek.
    var z = setLowWord(0.0, lowWord(x))
    let e0 = (ix >> 20) - 1046
    z = setHighWord(z, ix &- Int32(bitPattern: UInt32(bitPattern: e0) << 20))
    var tx: [Double] = [0, 0, 0]
    for i in 0..<2 {
      tx[i] = Double(Int32(z))
      z = (z - tx[i]) * two24
    }
    tx[2] = z
    var nx = 3
    while tx[nx - 1] == 0 { nx -= 1 }
    let (n, y0, y1) = kernelRemPio2(tx, e0: e0, nx: nx)
    if hx < 0 { return (-n, -y0, -y1) }
    return (n, y0, y1)
  }

  /// __kernel_rem_pio2 with prec = 2 (as called by __ieee754_rem_pio2).
  private static func kernelRemPio2(_ x: [Double], e0: Int32, nx: Int) -> (Int32, Double, Double) {
    let two24 = 1.67772160000000000000e+07
    let twon24 = 5.96046447753906250000e-08
    let ipio2 = twoOverPi
    let jk = 4  // init_jk[prec = 2]
    let jp = jk

    var iq = [Int32](repeating: 0, count: 20)
    var f = [Double](repeating: 0, count: 20)
    var fq = [Double](repeating: 0, count: 20)
    var q = [Double](repeating: 0, count: 20)

    let jx = nx - 1
    var jv = Int((e0 - 3) / 24)
    if jv < 0 { jv = 0 }
    var q0 = Int(e0) - 24 * (jv + 1)

    var j = jv - jx
    let m = jx + jk
    for i in 0...m {
      f[i] = (j < 0) ? 0.0 : Double(ipio2[j])
      j += 1
    }

    for i in 0...jk {
      var fw = 0.0
      for jj in 0...jx { fw += x[jj] * f[jx + i - jj] }
      q[i] = fw
    }

    var jz = jk
    var z: Double
    var n: Int32
    var ih: Int32
    var fw: Double
    while true {  // recompute:
      var i = 0
      j = jz
      z = q[jz]
      while j > 0 {
        fw = Double(Int32(twon24 * z))
        iq[i] = Int32(z - two24 * fw)
        z = q[j - 1] + fw
        i += 1
        j -= 1
      }

      z = scalbn(z, Int32(q0))
      z -= 8.0 * (z * 0.125).rounded(.down)
      n = Int32(z)
      z -= Double(n)
      ih = 0
      if q0 > 0 {
        let ii = iq[jz - 1] >> Int32(24 - q0)
        n += ii
        iq[jz - 1] -= ii << Int32(24 - q0)
        ih = iq[jz - 1] >> Int32(23 - q0)
      } else if q0 == 0 {
        ih = iq[jz - 1] >> 23
      } else if z >= 0.5 {
        ih = 2
      }

      if ih > 0 {
        n += 1
        var carry: Int32 = 0
        for k in 0..<jz {
          let jj = iq[k]
          if carry == 0 {
            if jj != 0 {
              carry = 1
              iq[k] = 0x1000000 - jj
            }
          } else {
            iq[k] = 0xFFFFFF - jj
          }
        }
        if q0 > 0 {
          switch q0 {
          case 1: iq[jz - 1] &= 0x7FFFFF
          case 2: iq[jz - 1] &= 0x3FFFFF
          default: break
          }
        }
        if ih == 2 {
          z = 1.0 - z
          if carry != 0 { z -= scalbn(1.0, Int32(q0)) }
        }
      }

      if z == 0 {
        var jj: Int32 = 0
        var k = jz - 1
        while k >= jk {
          jj |= iq[k]
          k -= 1
        }
        if jj == 0 {  // need recomputation
          var kk = 1
          while jk >= kk && iq[jk - kk] == 0 { kk += 1 }
          var ii = jz + 1
          while ii <= jz + kk {
            f[jx + ii] = Double(ipio2[jv + ii])
            var s = 0.0
            for jx2 in 0...jx { s += x[jx2] * f[jx + ii - jx2] }
            q[ii] = s
            ii += 1
          }
          jz += kk
          continue
        }
      }
      break
    }

    // chop off zero terms
    if z == 0.0 {
      jz -= 1
      q0 -= 24
      while iq[jz] == 0 {
        jz -= 1
        q0 -= 24
      }
    } else {
      z = scalbn(z, Int32(-q0))
      if z >= two24 {
        fw = Double(Int32(twon24 * z))
        iq[jz] = Int32(z - two24 * fw)
        jz += 1
        q0 += 24
        iq[jz] = Int32(fw)
      } else {
        iq[jz] = Int32(z)
      }
    }

    fw = scalbn(1.0, Int32(q0))
    var i = jz
    while i >= 0 {
      q[i] = fw * Double(iq[i])
      fw *= twon24
      i -= 1
    }

    i = jz
    while i >= 0 {
      fw = 0.0
      var k = 0
      while k <= jp && k <= jz - i {
        fw += PIo2[k] * q[i + k]
        k += 1
      }
      fq[jz - i] = fw
      i -= 1
    }

    // prec 2: compress fq[] into y[0], y[1]
    fw = 0.0
    i = jz
    while i >= 0 {
      fw += fq[i]
      i -= 1
    }
    let y0 = (ih == 0) ? fw : -fw
    fw = fq[0] - fw
    if jz >= 1 {
      for k in 1...jz { fw += fq[k] }
    }
    let y1 = (ih == 0) ? fw : -fw
    return (n & 7, y0, y1)
  }

  // MARK: - Kernels

  private static func kernelCos(_ x: Double, _ y: Double) -> Double {
    let one = 1.00000000000000000000e+00
    let C1 = 4.16666666666666019037e-02   // 0x3FA55555, 0x5555554C
    let C2 = -1.38888888888741095749e-03  // 0xBF56C16C, 0x16C15177
    let C3 = 2.48015872894767294178e-05   // 0x3EFA01A0, 0x19CB1590
    let C4 = -2.75573143513906633035e-07  // 0xBE927E4F, 0x809C52AD
    let C5 = 2.08757232129817482790e-09   // 0x3E21EE9E, 0xBDB4B1C4
    let C6 = -1.13596475577881948265e-11  // 0xBDA8FAE9, 0xBE8838D4

    let ix = highWord(x) & 0x7FFF_FFFF
    if ix < 0x3E40_0000 { return one }  // |x| < 2**-27: (int)x == 0 always
    let z = x * x
    let r = z * (C1 + z * (C2 + z * (C3 + z * (C4 + z * (C5 + z * C6)))))
    if ix < 0x3FD3_3333 {
      return one - (0.5 * z - (z * r - x * y))
    } else {
      let qx: Double
      if ix > 0x3FE9_0000 {
        qx = 0.28125
      } else {
        qx = fromWords(ix - 0x0020_0000, 0)
      }
      let iz = 0.5 * z - qx
      let a = one - qx
      return a - (iz - (z * r - x * y))
    }
  }

  private static func kernelSin(_ x: Double, _ y: Double, _ iy: Int) -> Double {
    let half = 5.00000000000000000000e-01
    let S1 = -1.66666666666666324348e-01  // 0xBFC55555, 0x55555549
    let S2 = 8.33333333332248946124e-03   // 0x3F811111, 0x1110F8A6
    let S3 = -1.98412698298579493134e-04  // 0xBF2A01A0, 0x19C161D5
    let S4 = 2.75573137070700676789e-06   // 0x3EC71DE3, 0x57B1FE7D
    let S5 = -2.50507602534068634195e-08  // 0xBE5AE5E6, 0x8A2B9CEB
    let S6 = 1.58969099521155010221e-10   // 0x3DE5D93A, 0x5ACFD57C

    let ix = highWord(x) & 0x7FFF_FFFF
    if ix < 0x3E40_0000 { return x }  // |x| < 2**-27
    let z = x * x
    let v = z * x
    let r = S2 + z * (S3 + z * (S4 + z * (S5 + z * S6)))
    if iy == 0 {
      return x + v * (S1 + z * r)
    } else {
      return x - ((z * (half * y - v * r) - y) - v * S1)
    }
  }

  // MARK: - sin, cos

  static func sin(_ x: Double) -> Double {
    let ix = highWord(x) & 0x7FFF_FFFF
    if ix <= 0x3FE921FB { return kernelSin(x, 0.0, 0) }
    if ix >= 0x7FF0_0000 { return x - x }
    let (n, y0, y1) = remPio2(x)
    switch n & 3 {
    case 0: return kernelSin(y0, y1, 1)
    case 1: return kernelCos(y0, y1)
    case 2: return -kernelSin(y0, y1, 1)
    default: return -kernelCos(y0, y1)
    }
  }

  static func cos(_ x: Double) -> Double {
    let ix = highWord(x) & 0x7FFF_FFFF
    if ix <= 0x3FE921FB { return kernelCos(x, 0.0) }
    if ix >= 0x7FF0_0000 { return x - x }
    let (n, y0, y1) = remPio2(x)
    switch n & 3 {
    case 0: return kernelCos(y0, y1)
    case 1: return -kernelSin(y0, y1, 1)
    case 2: return -kernelCos(y0, y1)
    default: return kernelSin(y0, y1, 1)
    }
  }

  // MARK: - atan, atan2

  private static let atanhi: [Double] = [
    4.63647609000806093515e-01,  // atan(0.5)hi 0x3FDDAC67, 0x0561BB4F
    7.85398163397448278999e-01,  // atan(1.0)hi 0x3FE921FB, 0x54442D18
    9.82793723247329054082e-01,  // atan(1.5)hi 0x3FEF730B, 0xD281F69B
    1.57079632679489655800e+00,  // atan(inf)hi 0x3FF921FB, 0x54442D18
  ]

  private static let atanlo: [Double] = [
    2.26987774529616870924e-17,  // atan(0.5)lo 0x3C7A2B7F, 0x222F65E2
    3.06161699786838301793e-17,  // atan(1.0)lo 0x3C81A626, 0x33145C07
    1.39033110312309984516e-17,  // atan(1.5)lo 0x3C700788, 0x7AF0CBBD
    6.12323399573676603587e-17,  // atan(inf)lo 0x3C91A626, 0x33145C07
  ]

  private static let aT: [Double] = [
    3.33333333333329318027e-01,   // 0x3FD55555, 0x5555550D
    -1.99999999998764832476e-01,  // 0xBFC99999, 0x9998EBC4
    1.42857142725034663711e-01,   // 0x3FC24924, 0x920083FF
    -1.11111104054623557880e-01,  // 0xBFBC71C6, 0xFE231671
    9.09088713343650656196e-02,   // 0x3FB745CD, 0xC54C206E
    -7.69187620504482999495e-02,  // 0xBFB3B0F2, 0xAF749A6D
    6.66107313738753120669e-02,   // 0x3FB10D66, 0xA0D03D51
    -5.83357013379057348645e-02,  // 0xBFADDE2D, 0x52DEFD9A
    4.97687799461593236017e-02,   // 0x3FA97B4B, 0x24760DEB
    -3.65315727442169155270e-02,  // 0xBFA2B444, 0x2C6A6C2F
    1.62858201153657823623e-02,   // 0x3F90AD3A, 0xE322DA11
  ]

  private static func atan(_ xIn: Double) -> Double {
    let one = 1.0
    let huge = 1.0e300
    var x = xIn
    let hx = highWord(x)
    let ix = hx & 0x7FFF_FFFF
    let id: Int
    if ix >= 0x4410_0000 {  // |x| >= 2^66
      let low = lowWord(x)
      if ix > 0x7FF0_0000 || (ix == 0x7FF0_0000 && low != 0) { return x + x }
      if hx > 0 { return atanhi[3] + atanlo[3] }
      return -atanhi[3] - atanlo[3]
    }
    if ix < 0x3FDC_0000 {  // |x| < 0.4375
      if ix < 0x3E40_0000 {  // |x| < 2^-27
        if huge + x > one { return x }
      }
      id = -1
    } else {
      x = Swift.abs(x)
      if ix < 0x3FF3_0000 {  // |x| < 1.1875
        if ix < 0x3FE6_0000 {  // 7/16 <= |x| < 11/16
          id = 0
          x = (2.0 * x - one) / (2.0 + x)
        } else {  // 11/16 <= |x| < 19/16
          id = 1
          x = (x - one) / (x + one)
        }
      } else {
        if ix < 0x4003_8000 {  // |x| < 2.4375
          id = 2
          x = (x - 1.5) / (one + 1.5 * x)
        } else {  // 2.4375 <= |x| < 2^66
          id = 3
          x = -1.0 / x
        }
      }
    }
    var z = x * x
    let w = z * z
    let s1 = z * (aT[0] + w * (aT[2] + w * (aT[4] + w * (aT[6] + w * (aT[8] + w * aT[10])))))
    let s2 = w * (aT[1] + w * (aT[3] + w * (aT[5] + w * (aT[7] + w * aT[9]))))
    if id < 0 {
      return x - x * (s1 + s2)
    }
    z = atanhi[id] - ((x * (s1 + s2) - atanlo[id]) - x)
    return (hx < 0) ? -z : z
  }

  static func atan2(_ y: Double, _ x: Double) -> Double {
    let tiny = 1.0e-300
    let pi_o_4 = 7.8539816339744827900E-01  // 0x3FE921FB, 0x54442D18
    let pi_o_2 = 1.5707963267948965580E+00  // 0x3FF921FB, 0x54442D18
    let pi = 3.1415926535897931160E+00      // 0x400921FB, 0x54442D18
    let pi_lo = 1.2246467991473531772E-16   // 0x3CA1A626, 0x33145C07

    let hx = highWord(x)
    let lx = lowWord(x)
    let ix = hx & 0x7FFF_FFFF
    let hy = highWord(y)
    let ly = lowWord(y)
    let iy = hy & 0x7FFF_FFFF
    let nanx = UInt32(bitPattern: ix) | ((lx | (0 &- lx)) >> 31)
    let nany = UInt32(bitPattern: iy) | ((ly | (0 &- ly)) >> 31)
    if nanx > 0x7FF0_0000 || nany > 0x7FF0_0000 { return x + y }
    if (UInt32(bitPattern: hx &- 0x3FF0_0000) | lx) == 0 { return atan(y) }  // x = 1.0
    var m = ((hy >> 31) & 1) | ((hx >> 30) & 2)  // 2*sign(x)+sign(y)

    if (UInt32(bitPattern: iy) | ly) == 0 {
      switch m {
      case 0, 1: return y
      case 2: return pi + tiny
      default: return -pi - tiny
      }
    }
    if (UInt32(bitPattern: ix) | lx) == 0 {
      return (hy < 0) ? -pi_o_2 - tiny : pi_o_2 + tiny
    }
    if ix == 0x7FF0_0000 {
      if iy == 0x7FF0_0000 {
        switch m {
        case 0: return pi_o_4 + tiny
        case 1: return -pi_o_4 - tiny
        case 2: return 3.0 * pi_o_4 + tiny
        default: return -3.0 * pi_o_4 - tiny
        }
      } else {
        switch m {
        case 0: return 0.0
        case 1: return -0.0
        case 2: return pi + tiny
        default: return -pi - tiny
        }
      }
    }
    if iy == 0x7FF0_0000 { return (hy < 0) ? -pi_o_2 - tiny : pi_o_2 + tiny }

    let k = (iy - ix) >> 20
    let z: Double
    if k > 60 {
      z = pi_o_2 + 0.5 * pi_lo
      m &= 1
    } else if hx < 0 && k < -60 {
      z = 0.0
    } else {
      z = atan(Swift.abs(y / x))
    }
    switch m {
    case 0: return z
    case 1: return -z
    case 2: return pi - (z - pi_lo)
    default: return (z - pi_lo) - pi
    }
  }

  // MARK: - exp

  static func exp(_ xIn: Double) -> Double {
    let one = 1.0
    let halF: [Double] = [0.5, -0.5]
    let o_threshold = 7.09782712893383973096e+02   // 0x40862E42, 0xFEFA39EF
    let u_threshold = -7.45133219101941108420e+02  // 0xC0874910, 0xD52D3051
    let ln2HI: [Double] = [6.93147180369123816490e-01, -6.93147180369123816490e-01]
    let ln2LO: [Double] = [1.90821492927058770002e-10, -1.90821492927058770002e-10]
    let invln2 = 1.44269504088896338700e+00  // 0x3FF71547, 0x652B82FE
    let P1 = 1.66666666666666019037e-01      // 0x3FC55555, 0x5555553E
    let P2 = -2.77777777770155933842e-03     // 0xBF66C16C, 0x16BEBD93
    let P3 = 6.61375632143793436117e-05      // 0x3F11566A, 0xAF25DE2C
    let P4 = -1.65339022054652515390e-06     // 0xBEBBBD41, 0xC5D26BF1
    let P5 = 4.13813679705723846039e-08      // 0x3E663769, 0x72BEA4D0
    let E = 2.718281828459045                // 0x4005BF0A, 0x8B145769
    let huge = 1.0e+300
    let twom1000 = 9.33263618503218878990e-302  // 2**-1000
    let two1023 = 8.988465674311579539e307      // 0x1p1023

    var x = xIn
    var hi = 0.0
    var lo = 0.0
    var k: Int32 = 0
    var hx = UInt32(bitPattern: highWord(x))
    let xsb = Int((hx >> 31) & 1)
    hx &= 0x7FFF_FFFF

    if hx >= 0x4086_2E42 {  // |x| >= 709.78...
      if hx >= 0x7FF0_0000 {
        if ((hx & 0xFFFFF) | lowWord(x)) != 0 { return x + x }
        return (xsb == 0) ? x : 0.0
      }
      if x > o_threshold { return huge * huge }
      if x < u_threshold { return twom1000 * twom1000 }
    }

    if hx > 0x3FD6_2E42 {  // |x| > 0.5 ln2
      if hx < 0x3FF0_A2B2 {  // and |x| < 1.5 ln2
        if x == 1.0 { return E }
        hi = x - ln2HI[xsb]
        lo = ln2LO[xsb]
        k = Int32(1 - xsb - xsb)
      } else {
        k = Int32(invln2 * x + halF[xsb])
        let t = Double(k)
        hi = x - t * ln2HI[0]
        lo = t * ln2LO[0]
      }
      x = hi - lo
    } else if hx < 0x3E30_0000 {  // |x| < 2**-28
      if huge + x > one { return one + x }
    } else {
      k = 0
    }

    let t = x * x
    let twopk: Double
    if k >= -1021 {
      twopk = fromWords(0x3FF0_0000 &+ Int32(bitPattern: UInt32(bitPattern: k) << 20), 0)
    } else {
      twopk = fromWords(Int32(bitPattern: 0x3FF0_0000 &+ (UInt32(bitPattern: k + 1000) << 20)), 0)
    }
    let c = x - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))))
    if k == 0 {
      return one - ((x * c) / (c - 2.0) - x)
    }
    let y = one - ((lo - (x * c) / (2.0 - c)) - hi)
    if k >= -1021 {
      if k == 1024 { return y * 2.0 * two1023 }
      return y * twopk
    }
    return y * twopk * twom1000
  }

  // MARK: - log

  static func log(_ xIn: Double) -> Double {
    let ln2_hi = 6.93147180369123816490e-01  // 3fe62e42 fee00000
    let ln2_lo = 1.90821492927058770002e-10  // 3dea39ef 35793c76
    let two54 = 1.80143985094819840000e+16   // 43500000 00000000
    let Lg1 = 6.666666666666735130e-01       // 3FE55555 55555593
    let Lg2 = 3.999999999940941908e-01       // 3FD99999 9997FA04
    let Lg3 = 2.857142874366239149e-01       // 3FD24924 94229359
    let Lg4 = 2.222219843214978396e-01       // 3FCC71C5 1D8E78AF
    let Lg5 = 1.818357216161805012e-01       // 3FC74664 96CB03DE
    let Lg6 = 1.531383769920937332e-01       // 3FC39A09 D078C69F
    let Lg7 = 1.479819860511658591e-01       // 3FC2F112 DF3E5244

    var x = xIn
    var hx = highWord(x)
    let lx = lowWord(x)
    var k: Int32 = 0
    if hx < 0x0010_0000 {  // x < 2**-1022
      if (UInt32(bitPattern: hx & 0x7FFF_FFFF) | lx) == 0 { return -Double.infinity }
      if hx < 0 { return Double.nan }
      k -= 54
      x *= two54
      hx = highWord(x)
    }
    if hx >= 0x7FF0_0000 { return x + x }
    k += (hx >> 20) - 1023
    hx &= 0x000F_FFFF
    var i = (hx + 0x95F64) & 0x10_0000
    x = setHighWord(x, hx | (i ^ 0x3FF0_0000))  // normalize x or x/2
    k += (i >> 20)
    let f = x - 1.0
    if (0x000F_FFFF & (2 + hx)) < 3 {  // -2**-20 <= f < 2**-20
      if f == 0.0 {
        if k == 0 { return 0.0 }
        let dk = Double(k)
        return dk * ln2_hi + dk * ln2_lo
      }
      let R = f * f * (0.5 - 0.33333333333333333 * f)
      if k == 0 { return f - R }
      let dk = Double(k)
      return dk * ln2_hi - ((R - dk * ln2_lo) - f)
    }
    let s = f / (2.0 + f)
    let dk = Double(k)
    let z = s * s
    i = hx - 0x6147A
    let w = z * z
    let j = 0x6B851 - hx
    let t1 = w * (Lg2 + w * (Lg4 + w * Lg6))
    let t2 = z * (Lg1 + w * (Lg3 + w * (Lg5 + w * Lg7)))
    i |= j
    let R = t2 + t1
    if i > 0 {
      let hfsq = 0.5 * f * f
      if k == 0 { return f - (hfsq - s * (hfsq + R)) }
      return dk * ln2_hi - ((hfsq - (s * (hfsq + R) + dk * ln2_lo)) - f)
    } else {
      if k == 0 { return f - s * (f - R) }
      return dk * ln2_hi - ((s * (f - R) - dk * ln2_lo) - f)
    }
  }

  // MARK: - cbrt

  static func cbrt(_ x: Double) -> Double {
    let B1: UInt32 = 715_094_163  // (1023-1023/3-0.03306235651)*2**20
    let B2: UInt32 = 696_219_795  // (1023-1023/3-54/3-0.03306235651)*2**20
    let P0 = 1.87595182427177009643     // 0x3FFE03E6, 0x0F61E692
    let P1 = -1.88497979543377169875    // 0xBFFE28E0, 0x92F02420
    let P2 = 1.621429720105354466140    // 0x3FF9F160, 0x4A49D6C2
    let P3 = -0.758397934778766047437   // 0xBFE844CB, 0xBEE751D9
    let P4 = 0.145996192886612446982    // 0x3FC2B000, 0xD4E4EDD7

    var hx = UInt32(bitPattern: highWord(x))
    let low = lowWord(x)
    let sign = hx & 0x8000_0000
    hx ^= sign
    if hx >= 0x7FF0_0000 { return x + x }  // cbrt(NaN, INF) is itself

    var t: Double
    if hx < 0x0010_0000 {  // zero or subnormal
      if (hx | low) == 0 { return x }  // cbrt(0) is itself
      t = setHighWord(0.0, 0x4350_0000)  // 2**54
      t *= x
      let high = UInt32(bitPattern: highWord(t))
      t = fromWords(Int32(bitPattern: sign | ((high & 0x7FFF_FFFF) / 3 + B2)), 0)
    } else {
      t = fromWords(Int32(bitPattern: sign | (hx / 3 + B1)), 0)
    }

    var r = (t * t) * (t / x)
    t = t * ((P0 + r * (P1 + r * P2)) + ((r * r) * r) * (P3 + r * P4))

    // Round t away from zero to 23 bits.
    t = Double(bitPattern: (t.bitPattern &+ 0x8000_0000) & 0xFFFF_FFFF_C000_0000)

    // One Newton step to 53 bits.
    let s = t * t
    r = x / s
    let w = t + t
    r = (r - t) / (w + r)
    t = t + t * r
    return t
  }

  // MARK: - pow (V8 base::ieee754::legacy::pow, fdlibm e_pow.c)

  static func pow(_ x: Double, _ y: Double) -> Double {
    let bp: [Double] = [1.0, 1.5]
    let dp_h: [Double] = [0.0, 5.84962487220764160156e-01]  // 0x3FE2B803, 0x40000000
    let dp_l: [Double] = [0.0, 1.35003920212974897128e-08]  // 0x3E4CFDEB, 0x43CFD006
    let zero = 0.0
    let one = 1.0
    let two = 2.0
    let two53 = 9007199254740992.0
    let huge = 1.0e300
    let tiny = 1.0e-300
    let L1 = 5.99999999999994648725e-01   // 0x3FE33333, 0x33333303
    let L2 = 4.28571428578550184252e-01   // 0x3FDB6DB6, 0xDB6FABFF
    let L3 = 3.33333329818377432918e-01   // 0x3FD55555, 0x518F264D
    let L4 = 2.72728123808534006489e-01   // 0x3FD17460, 0xA91D4101
    let L5 = 2.30660745775561754067e-01   // 0x3FCD864A, 0x93C9DB65
    let L6 = 2.06975017800338417784e-01   // 0x3FCA7E28, 0x4A454EEF
    let P1 = 1.66666666666666019037e-01   // 0x3FC55555, 0x5555553E
    let P2 = -2.77777777770155933842e-03  // 0xBF66C16C, 0x16BEBD93
    let P3 = 6.61375632143793436117e-05   // 0x3F11566A, 0xAF25DE2C
    let P4 = -1.65339022054652515390e-06  // 0xBEBBBD41, 0xC5D26BF1
    let P5 = 4.13813679705723846039e-08   // 0x3E663769, 0x72BEA4D0
    let lg2 = 6.93147180559945286227e-01  // 0x3FE62E42, 0xFEFA39EF
    let lg2_h = 6.93147182464599609375e-01   // 0x3FE62E43, 0x00000000
    let lg2_l = -1.90465429995776804525e-09  // 0xBE205C61, 0x0CA86C39
    let ovt = 8.0085662595372944372e-0017    // -(1024-log2(ovfl+.5ulp))
    let cp = 9.61796693925975554329e-01      // 0x3FEEC709, 0xDC3A03FD
    let cp_h = 9.61796700954437255859e-01    // 0x3FEEC709, 0xE0000000
    let cp_l = -7.02846165095275826516e-09   // 0xBE3E2FE0, 0x145B01F5
    let ivln2 = 1.44269504088896338700e+00   // 0x3FF71547, 0x652B82FE
    let ivln2_h = 1.44269502162933349609e+00  // 0x3FF71547, 0x60000000
    let ivln2_l = 1.92596299112661746887e-08  // 0x3E54AE0B, 0xF85DDF44

    let hx = highWord(x)
    let lx = lowWord(x)
    let hy = highWord(y)
    let ly = lowWord(y)
    var ix = hx & 0x7FFF_FFFF
    let iy = hy & 0x7FFF_FFFF

    // y == zero: x**0 = 1
    if (UInt32(bitPattern: iy) | ly) == 0 { return one }

    // +-NaN return x+y
    if ix > 0x7FF0_0000 || (ix == 0x7FF0_0000 && lx != 0) || iy > 0x7FF0_0000
      || (iy == 0x7FF0_0000 && ly != 0)
    {
      return x + y
    }

    // yisint = 0: not an integer, 1: odd int, 2: even int (only when x < 0)
    var yisint: Int32 = 0
    if hx < 0 {
      if iy >= 0x4340_0000 {
        yisint = 2
      } else if iy >= 0x3FF0_0000 {
        let k = (iy >> 20) - 0x3FF
        if k > 20 {
          let j = ly >> UInt32(52 - k)
          if (j << UInt32(52 - k)) == ly { yisint = 2 - Int32(j & 1) }
        } else if ly == 0 {
          let j = iy >> (20 - k)
          if (j << (20 - k)) == iy { yisint = 2 - (j & 1) }
        }
      }
    }

    // special value of y
    if ly == 0 {
      if iy == 0x7FF0_0000 {  // y is +-inf
        if (UInt32(bitPattern: ix &- 0x3FF0_0000) | lx) == 0 {
          return y - y  // (+-1)**+-inf is NaN
        } else if ix >= 0x3FF0_0000 {
          return (hy >= 0) ? y : zero
        } else {
          return (hy < 0) ? -y : zero
        }
      }
      if iy == 0x3FF0_0000 {  // y is +-1
        return (hy < 0) ? one / x : x
      }
      if hy == 0x4000_0000 { return x * x }  // y is 2
      if hy == 0x3FE0_0000 {  // y is 0.5
        if hx >= 0 { return x.squareRoot() }
      }
    }

    var ax = Swift.abs(x)
    // special value of x
    if lx == 0 {
      if ix == 0x7FF0_0000 || ix == 0 || ix == 0x3FF0_0000 {
        var z = ax  // x is +-0, +-inf, +-1
        if hy < 0 { z = one / z }
        if hx < 0 {
          if ((ix &- 0x3FF0_0000) | yisint) == 0 {
            z = Double.nan  // (-1)**non-int is NaN
          } else if yisint == 1 {
            z = -z
          }
        }
        return z
      }
    }

    var n = (hx >> 31) + 1

    // (x<0)**(non-int) is NaN
    if (n | yisint) == 0 { return Double.nan }

    var s = one  // sign of result
    if (n | (yisint - 1)) == 0 { s = -one }  // (-ve)**(odd int)

    var t1: Double
    var t2: Double
    var t: Double
    var u: Double
    var v: Double
    var w: Double
    if iy > 0x41E0_0000 {  // |y| > 2**31
      if iy > 0x43F0_0000 {  // |y| > 2**64, must o/uflow
        if ix <= 0x3FEF_FFFF { return (hy < 0) ? huge * huge : tiny * tiny }
        if ix >= 0x3FF0_0000 { return (hy > 0) ? huge * huge : tiny * tiny }
      }
      // over/underflow if x is not close to one
      if ix < 0x3FEF_FFFF { return (hy < 0) ? s * huge * huge : s * tiny * tiny }
      if ix > 0x3FF0_0000 { return (hy > 0) ? s * huge * huge : s * tiny * tiny }
      // now |1-x| is tiny <= 2**-20
      t = ax - one
      w = (t * t) * (0.5 - t * (0.3333333333333333333333 - t * 0.25))
      u = ivln2_h * t
      v = t * ivln2_l - w * ivln2
      t1 = u + v
      t1 = setLowWord(t1, 0)
      t2 = v - (t1 - u)
    } else {
      n = 0
      // take care of subnormal numbers
      if ix < 0x0010_0000 {
        ax *= two53
        n -= 53
        ix = highWord(ax)
      }
      n += (ix >> 20) - 0x3FF
      let j = ix & 0x000F_FFFF
      // determine interval
      ix = j | 0x3FF0_0000
      let k: Int
      if j <= 0x3988E {
        k = 0  // |x| < sqrt(3/2)
      } else if j < 0xBB67A {
        k = 1  // |x| < sqrt(3)
      } else {
        k = 0
        n += 1
        ix -= 0x0010_0000
      }
      ax = setHighWord(ax, ix)

      // ss = s_h + s_l = (x-1)/(x+1) or (x-1.5)/(x+1.5)
      u = ax - bp[k]
      v = one / (ax + bp[k])
      let ss = u * v
      var s_h = ss
      s_h = setLowWord(s_h, 0)
      // t_h = ax + bp[k] High
      var t_h = setHighWord(zero, ((ix >> 1) | 0x2000_0000) + 0x0008_0000 + Int32(k << 18))
      var t_l = ax - (t_h - bp[k])
      let s_l = v * ((u - s_h * t_h) - s_h * t_l)
      // log(ax)
      var s2 = ss * ss
      var r = s2 * s2 * (L1 + s2 * (L2 + s2 * (L3 + s2 * (L4 + s2 * (L5 + s2 * L6)))))
      r += s_l * (s_h + ss)
      s2 = s_h * s_h
      t_h = 3.0 + s2 + r
      t_h = setLowWord(t_h, 0)
      t_l = r - ((t_h - 3.0) - s2)
      // u + v = ss*(1+...)
      u = s_h * t_h
      v = s_l * t_h + t_l * ss
      // 2/(3log2)*(ss+...)
      var p_h = u + v
      p_h = setLowWord(p_h, 0)
      let p_l = v - (p_h - u)
      let z_h = cp_h * p_h
      let z_l = cp_l * p_h + p_l * cp + dp_l[k]
      // log2(ax) = (ss+..)*2/(3*log2) = n + dp_h + z_h + z_l
      t = Double(n)
      t1 = (((z_h + z_l) + dp_h[k]) + t)
      t1 = setLowWord(t1, 0)
      t2 = z_l - (((t1 - t) - dp_h[k]) - z_h)
    }

    // split y into y1+y2 and compute (y1+y2)*(t1+t2)
    let y1 = setLowWord(y, 0)
    let p_l = (y - y1) * t1 + y * t2
    var p_h = y1 * t1
    var z = p_l + p_h
    var j = highWord(z)
    var i = Int32(bitPattern: lowWord(z))
    if j >= 0x4090_0000 {  // z >= 1024
      if ((j &- 0x4090_0000) | i) != 0 {
        return s * huge * huge  // overflow
      } else {
        if p_l + ovt > z - p_h { return s * huge * huge }
      }
    } else if (j & 0x7FFF_FFFF) >= 0x4090_CC00 {  // z <= -1075
      if ((j &- Int32(bitPattern: 0xC090_CC00)) | i) != 0 {
        return s * tiny * tiny  // underflow
      } else {
        if p_l <= z - p_h { return s * tiny * tiny }
      }
    }

    // compute 2**(p_h+p_l)
    i = j & 0x7FFF_FFFF
    var k = (i >> 20) - 0x3FF
    n = 0
    if i > 0x3FE0_0000 {  // |z| > 0.5, set n = [z+0.5]
      n = j &+ (0x0010_0000 >> (k + 1))
      k = ((n & 0x7FFF_FFFF) >> 20) - 0x3FF  // new k for n
      t = setHighWord(zero, n & ~(0x000F_FFFF >> k))
      n = ((n & 0x000F_FFFF) | 0x0010_0000) >> (20 - k)
      if j < 0 { n = -n }
      p_h -= t
    }
    t = p_l + p_h
    t = setLowWord(t, 0)
    u = t * lg2_h
    v = (p_l - (t - p_h)) * lg2 + t * lg2_l
    z = u + v
    w = v - (z - u)
    t = z * z
    t1 = z - t * (P1 + t * (P2 + t * (P3 + t * (P4 + t * P5))))
    let r = (z * t1) / ((t1 - two) - (w + z * w))
    z = one - (r - z)
    j = highWord(z)
    j = j &+ Int32(bitPattern: UInt32(bitPattern: n) << 20)
    if (j >> 20) <= 0 {
      z = scalbn(z, n)  // subnormal output
    } else {
      let tmp = highWord(z)
      z = setHighWord(z, tmp &+ Int32(bitPattern: UInt32(bitPattern: n) << 20))
    }
    return s * z
  }
}
