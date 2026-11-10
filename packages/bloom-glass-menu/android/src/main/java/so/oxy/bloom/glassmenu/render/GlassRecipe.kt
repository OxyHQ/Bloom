package so.oxy.bloom.glassmenu.render

internal class GlassRecipe(
  val saturation: Float,
  val black: Float,
  val white: Float,
  val rollOff: Float,
  val fillAlpha: Float,
  val tint: Float = 0f,
  val tintAlpha: Float = 0f,
) {
  companion object {
    val ControlDark = GlassRecipe(1.3f, .125f, 1.125f, .4f, 0f)
    val MenuDark = GlassRecipe(1.3f, .125f, 1.125f, .65f, 0f, tint = .042f, tintAlpha = .7f)
    val ControlLight = GlassRecipe(1.2f, .4f, 1.03f, 0f, .2f)
    val MenuLight = GlassRecipe(1.2f, .4f, 1.03f, 0f, .2f, tint = .975f, tintAlpha = .5f)
  }
}
