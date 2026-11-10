package so.oxy.bloom.glassmenu.records

import android.graphics.Color
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record

class GlassMenuConfigRecord : Record {
  @Field val blur: Float = 16f
  @Field val morphBlur: Float = 1f
  @Field val tintColor: Color? = null
  @Field val tintOpacity: Float? = null
  // Row ink; null keeps the built-in light/dark colours.
  @Field val textColor: Color? = null
  @Field val mutedColor: Color? = null
  @Field val destructiveColor: Color? = null
  @Field val separatorColor: Color? = null
  @Field val saturation: Float = 1f
  @Field val refraction: Float = 1f
  @Field val rim: Float = 1f
  @Field val shine: Float = 1f
  @Field val highlightOpacity: Float = 1f
  @Field val jelly: Float = 1f
  @Field val speed: Float = 1f
}
