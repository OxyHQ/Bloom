package so.oxy.bloom.glassmenu.records

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class GlassTriggerConfigRecord : Record {
  @Field val blur: Float = 1f
  @Field var tintColor: Color? = null
  @Field var tintOpacity: Float? = null
  @Field val saturation: Float = 1f
  @Field val refraction: Float = 1f
  @Field val rim: Float = 1f
  @Field val shine: Float = 1f
  @Field val jelly: Float = 1f
  @Field val morphOrigin: String = "trigger"
  @Field val shrink: GlassShrinkRecord? = null
  @Field val absorb: GlassAbsorbRecord? = null
}
