package so.oxy.bloom.glassmenu.render

import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.graphics.RecordingCanvas
import android.graphics.Rect
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import androidx.annotation.RequiresApi
import so.oxy.bloom.glassmenu.field.GlassFieldTexture
import so.oxy.bloom.glassmenu.field.GlassGaussianField
import kotlin.math.ceil
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

@RequiresApi(Build.VERSION_CODES.TIRAMISU)
internal class GlassRenderer(private val density: Float, private val minimumFieldStep: Float) {
  private val material = RuntimeShader(GlassMaterialShader)
  private val shadow = RuntimeShader(GlassShadowShader)
  private val shadowPaint = Paint().apply { shader = shadow }
  private val shadowRect = RectF()
  private val foregroundRect = Rect()
  private val warmPaint = Paint().apply { color = Color.WHITE }
  private val windowLimits = Rect()
  private val portal = RuntimeShader(GlassPortalShader)
  private val glassNode = RenderNode("GlassMenu.glass")
  private val foregroundNode = RenderNode("GlassMenu.foreground")
  private val field = GlassGaussianField(minimumFieldStep)
  private val texture = GlassFieldTexture()
  private val nodeRect = Rect()
  private val union = RectF()
  private var warmed = false

  init {
    warmField()
  }

  private fun warmField() {
    val step = minimumFieldStep
    val unit = density
    Thread({
      val warm = GlassGaussianField(step)
      val menu = RectF(0f, 0f, 250f * unit, 335f * unit)
      val trigger = RectF(100f * unit, 0f, 250f * unit, 44f * unit)
      repeat(WarmRounds) { round ->
        warm.update(menu, 80f * unit, 80f * unit, trigger, 22f * unit, (2f + round % 18) * unit)
      }
    }, "GlassMenu.warm").apply {
      isDaemon = true
      priority = Thread.MIN_PRIORITY
      start()
    }
  }

  fun warmPipelines(canvas: Canvas): Boolean {
    if (warmed) return false
    warmed = true
    texture.preallocate()
    texture.bindPrepared(material)
    texture.bindPrepared(portal)
    texture.bindPrepared(shadow)
    material.setFloatUniform("surfaceOpacity", 0f)
    shadow.setFloatUniform("surfaceOpacity", 0f)
    canvas.drawRect(0f, 0f, WarmSize.toFloat(), WarmSize.toFloat(), shadowPaint)
    val clamp = RenderEffect.createBlurEffect(WarmSample, WarmSample, Shader.TileMode.CLAMP)
    val decal = RenderEffect.createBlurEffect(WarmSample, WarmSample, Shader.TileMode.DECAL)
    warm(canvas, RenderEffect.createChainEffect(RenderEffect.createRuntimeShaderEffect(material, "content"), clamp))
    warm(canvas, RenderEffect.createChainEffect(RenderEffect.createRuntimeShaderEffect(portal, "content"), decal))
    for (radius in WarmBlurRadii) {
      warm(canvas, RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.CLAMP))
      warm(canvas, RenderEffect.createBlurEffect(radius, radius, Shader.TileMode.DECAL))
    }
    return true
  }

  private fun warm(canvas: Canvas, effect: RenderEffect) {
    val node = RenderNode("GlassMenu.warm")
    node.setPosition(0, 0, WarmSize, WarmSize)
    node.setAlpha(WarmAlpha)
    node.setRenderEffect(effect)
    val recording = node.beginRecording(WarmSize, WarmSize)
    recording.drawRect(0f, 0f, WarmSize.toFloat(), WarmSize.toFloat(), warmPaint)
    node.endRecording()
    canvas.drawRenderNode(node)
  }

  fun prepare(state: GlassSurfaceState) {
    val active = field.update(
      state.incoming, state.radiusX, state.radiusY,
      if (state.hasSource) state.source else null, state.sourceRadius, state.smoothing, state.lockedFieldStep,
    )
    texture.update(if (active) field else null)
    bindField(material, state)
    bindField(portal, state)
    bindField(shadow, state)
  }

  private fun bindField(shader: RuntimeShader, state: GlassSurfaceState) {
    val a = state.incoming
    shader.setFloatUniform("center", a.centerX(), a.centerY())
    shader.setFloatUniform("halfSize", a.width() / 2f, a.height() / 2f)
    shader.setFloatUniform("cornerRadii", state.radiusX, state.radiusY)
    val b = if (state.hasSource) state.source else a
    shader.setFloatUniform("secondaryEnabled", if (state.hasSource) 1f else 0f)
    shader.setFloatUniform("secondaryCenter", b.centerX(), b.centerY())
    shader.setFloatUniform("secondaryHalfSize", b.width() / 2f, b.height() / 2f)
    shader.setFloatUniform("secondaryRadii", state.sourceRadius, state.sourceRadius)
    shader.setFloatUniform("smoothing", state.smoothing)
    texture.bind(shader)
  }

  fun drawGlass(canvas: Canvas, backdrop: RenderNode, state: GlassSurfaceState, limits: Rect) {
    union.set(state.incoming)
    if (state.hasSource) union.union(state.source)
    val t = state.materialProgress.coerceIn(0f, 1f)
    val config = state.config
    val trigger = state.trigger
    val clearing = min(t * 6f, 1f)
    val base = trigger.blur + (MorphBlur - trigger.blur) * clearing
    val blurRadius = max(base + (config.blur - base) * t * t * t, .01f) * density

    val shadowRadius = (4f + 20f * t) * density
    val shadowGuard = shadowRadius * 2f + 9f * density + state.smoothing
    shadowRect.set(union.left - shadowGuard, union.top - shadowGuard, union.right + shadowGuard, union.bottom + shadowGuard)
    shadow.setFloatUniform("shadowParams", shadowRadius, .04f + .56f * t, 8f * density, .3f)
    shadow.setFloatUniform("surfaceOpacity", state.surfaceOpacity)
    canvas.drawRect(shadowRect, shadowPaint)

    val guard = max(2f * density, max(config.blur, trigger.blur) * density * BlurReach) + 2f
    windowLimits.set(limits)
    clampedRect(nodeRect, state.captureBounds, guard, limits)
    if (nodeRect.isEmpty) return
    val width = nodeRect.width()
    val height = nodeRect.height()

    val control = if (state.dark) GlassRecipe.ControlDark else GlassRecipe.ControlLight
    val menu = if (state.dark) GlassRecipe.MenuDark else GlassRecipe.MenuLight
    fun mix(a: Float, b: Float) = a + (b - a) * t
    material.setFloatUniform("nodeOrigin", nodeRect.left.toFloat(), nodeRect.top.toFloat())
    material.setFloatUniform("sampleExtent", width.toFloat(), height.toFloat())
    material.setFloatUniform("density", density)
    val saturation = mix(control.saturation * trigger.saturation, menu.saturation * config.saturation)
    material.setFloatUniform("face", saturation, mix(control.black, menu.black),
      mix(control.white, menu.white), mix(control.rollOff, menu.rollOff))
    material.setFloatUniform("faceFill", 1f, 1f, 1f, mix(control.fillAlpha, menu.fillAlpha))
    val tintProgress = min(t * 3f, 1f)
    val menuTint = config.tintColor
    val triggerTint = trigger.tintColor
    fun channel(menuValue: Float?, triggerValue: Float?): Float {
      val from = triggerValue ?: menuValue ?: menu.tint
      val to = menuValue ?: menu.tint
      return from + (to - from) * tintProgress
    }
    val triggerAlpha = trigger.tintOpacity ?: control.tintAlpha
    val menuAlpha = config.tintOpacity ?: menu.tintAlpha
    material.setFloatUniform(
      "tint",
      channel(menuTint?.red(), triggerTint?.red()),
      channel(menuTint?.green(), triggerTint?.green()),
      channel(menuTint?.blue(), triggerTint?.blue()),
      triggerAlpha + (menuAlpha - triggerAlpha) * tintProgress,
    )
    // refractionScale is 1 for the menu; the chrome sets 0 (ChromeMaterial): no lens, no outer displacement.
    val refraction = mix(trigger.refraction, config.refraction) * state.refractionScale
    val extent = min(union.width(), union.height()) / density
    val innerHeight = min(extent * .25f, 20f) * density
    val innerAmount = min(extent * .5f, 60f) * density
    val outerHeight = max(16f, extent * .2f) * density
    val outerAmount = max(16f, extent * .25f) * density
    val lensHeight = max(state.lensHeight, innerHeight)
    material.setFloatUniform("lensHeight", lensHeight)
    material.setFloatUniform("lensAmount", min(state.lensAmount, -innerAmount) * refraction)
    material.setFloatUniform("outerHeight", outerHeight)
    material.setFloatUniform("outerAmount", -outerAmount * refraction)
    material.setFloatUniform("keyThreshold", if (state.dark) .2588f else -.2756f)
    material.setFloatUniform("highlightAlpha", 1f)
    material.setFloatUniform("rimAlpha", ((if (state.dark) RimAlphaDark else RimAlphaLight) * mix(trigger.rim, config.rim)).coerceIn(0f, 1f))
    material.setFloatUniform("surfaceOpacity", state.surfaceOpacity)
    material.setFloatUniform("press", state.pressX, state.pressY, state.pressRadius, state.poolGain)
    material.setFloatUniform("pressLift", state.pressLift)
    material.setFloatUniform("rimLift", state.rimLift)

    val blur = RenderEffect.createBlurEffect(blurRadius, blurRadius, Shader.TileMode.CLAMP)
    glassNode.setRenderEffect(
      RenderEffect.createChainEffect(RenderEffect.createRuntimeShaderEffect(material, "content"), blur),
    )
    glassNode.setPosition(nodeRect)
    val recording = glassNode.beginRecording(width, height)
    recording.translate(-nodeRect.left.toFloat(), -nodeRect.top.toFloat())
    recording.drawRenderNode(backdrop)
    glassNode.endRecording()
    canvas.drawRenderNode(glassNode)
  }

  fun drawForeground(
    canvas: Canvas, state: GlassSurfaceState, warp: Boolean, portalBlur: Float,
    record: (RecordingCanvas) -> Unit,
  ) {
    clampedRect(foregroundRect, state.captureBounds, PortalReach * density + 2f, windowLimits)
    if (foregroundRect.isEmpty) return
    foregroundNode.setPosition(foregroundRect)
    if (warp) {
      portal.setFloatUniform("nodeOrigin", foregroundRect.left.toFloat(), foregroundRect.top.toFloat())
      portal.setFloatUniform("height", state.lensHeight)
      portal.setFloatUniform("amount", state.lensAmount * state.config.refraction)
      val bend = RenderEffect.createRuntimeShaderEffect(portal, "content")
      foregroundNode.setRenderEffect(
        if (portalBlur > .01f) {
          RenderEffect.createChainEffect(bend, RenderEffect.createBlurEffect(portalBlur, portalBlur, Shader.TileMode.DECAL))
        } else bend,
      )
    } else {
      foregroundNode.setRenderEffect(null)
    }
    val recording = foregroundNode.beginRecording(foregroundRect.width(), foregroundRect.height())
    recording.translate(-foregroundRect.left.toFloat(), -foregroundRect.top.toFloat())
    record(recording)
    foregroundNode.endRecording()
    canvas.drawRenderNode(foregroundNode)
  }

  private fun clampedRect(out: Rect, bounds: RectF, guard: Float, limits: Rect) {
    out.set(
      max(floor(bounds.left - guard).toInt(), limits.left),
      max(floor(bounds.top - guard).toInt(), limits.top),
      min(ceil(bounds.right + guard).toInt(), limits.right),
      min(ceil(bounds.bottom + guard).toInt(), limits.bottom),
    )
  }

  fun release() {
    glassNode.discardDisplayList()
    foregroundNode.discardDisplayList()
  }

  private companion object {
    const val MorphBlur = 1.2f
    const val BlurReach = 2f
    const val PortalReach = 28f
    const val WarmRounds = 40
    const val WarmSize = 32
    const val WarmAlpha = .004f
    const val WarmSample = 4f
    val WarmBlurRadii = floatArrayOf(
      1f, 2f, 3f, 4f, 5f, 6f, 7f, 8f, 9f, 10f, 11f, 12f, 13f, 14f, 15f, 16f,
      20f, 24f, 28f, 32f, 36f, 40f, 48f, 56f, 64f,
    )
    const val RimAlphaDark = 1f
    const val RimAlphaLight = .55f
  }
}
