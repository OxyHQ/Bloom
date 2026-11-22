package so.oxy.bloom.glassmenu.records

import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

// A glass of a group on one base (GlassGroup).
class GlassMemberRecord : Record {
  // The nativeID of the member's views; several views with one key are one shape around them all (a union).
  @Field val key: String = ""
  // The corner radius in points; null is a capsule.
  @Field val cornerRadius: Float? = null
  // How it arrives and leaves: "matchedGeometry" out of and into the nearest glass, "materialize" where it is.
  @Field val transition: String = "matchedGeometry"
}
