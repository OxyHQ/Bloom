package so.oxy.bloom.glassmenu.motion

import android.graphics.RectF
import android.view.View
import android.view.ViewGroup
import com.facebook.react.R
import so.oxy.bloom.glassmenu.field.GlassShapes
import so.oxy.bloom.glassmenu.records.GlassMemberRecord
import kotlin.math.max
import kotlin.math.min

// The glasses of a group on one base (SwiftUI's GlassEffectContainer), in the base's own pixels. A member is the views
// in the base that carry its key as their nativeID: one view, or several drawn as one shape around them all (a union).
// Each member's glass is where its views are drawn, transforms included, so what moves a view (a matched geometry, an
// animation) moves its glass with it. What a view cannot do the group does here, on a spring: a key that moves to
// another view takes its glass there, a member that arrives grows out of the nearest glass and one that leaves goes
// back into the nearest one ('materialize': out of and into its own centre). The first members of a group are where
// they are, with no motion.
internal class GlassGroup {
  private class Member(val key: String) {
    var radius: Float? = null
    var materialize = false
    var leaving = false
    // The view its glass is on (the first, for a union): another one takes the glass there on a spring.
    var view: View? = null
    val target = RectF()
    val centerX = GlassSpring(.5f, 8f)
    val centerY = GlassSpring(.5f, 8f)
    val width = GlassSpring(.5f, 8f)
    val height = GlassSpring(.5f, 8f)
    val isSettled get() = centerX.isSettled && centerY.isSettled && width.isSettled && height.isSettled

    fun reset(rect: RectF) {
      centerX.reset(rect.centerX())
      centerY.reset(rect.centerY())
      width.reset(rect.width())
      height.reset(rect.height())
    }

    fun spring(rect: RectF) {
      centerX.target(rect.centerX(), Spring)
      centerY.target(rect.centerY(), Spring)
      width.target(rect.width(), Spring)
      height.target(rect.height(), Spring)
    }

    fun advance(seconds: Float) {
      centerX.advance(seconds)
      centerY.advance(seconds)
      width.advance(seconds)
      height.advance(seconds)
    }

    fun current(out: RectF) {
      val w = max(width.value, 0f)
      val h = max(height.value, 0f)
      out.set(centerX.value - w / 2f, centerY.value - h / 2f, centerX.value + w / 2f, centerY.value + h / 2f)
    }
  }

  // Null: the base is not a group, and is its own rect.
  private var records: List<GlassMemberRecord>? = null
  private val members = LinkedHashMap<String, Member>()
  private val found = HashMap<String, RectF>()
  private val owners = HashMap<String, View>()
  // The rects [found] holds, kept from frame to frame (measuring runs before every frame the window draws).
  private val pool = ArrayList<RectF>()
  private var pooled = 0
  private val measured = RectF()
  private val placed = RectF()
  var blend = 0f

  val isGroup get() = records != null
  val isSettled get() = members.values.all { it.isSettled && !it.leaving }

  fun setRecords(value: List<GlassMemberRecord>?) {
    records = value
    if (value == null) members.clear()
  }

  // Where the members' views are in [base] now. True when a member's glass changed (the caller draws it again).
  fun measure(base: ViewGroup): Boolean {
    val list = records ?: return false
    found.clear()
    owners.clear()
    pooled = 0
    collect(base, base)
    val drawn = members.values.any { !it.leaving }
    var changed = false
    for (record in list) {
      val rect = found[record.key] ?: continue
      val owner = owners[record.key]
      val member = members[record.key]
      if (member == null) {
        val arriving = Member(record.key).also { members[record.key] = it }
        arriving.radius = record.cornerRadius
        arriving.materialize = record.transition == Materialize
        arriving.view = owner
        arriving.target.set(rect)
        if (drawn) {
          arriving.reset(origin(arriving, rect))
          arriving.spring(rect)
        } else {
          arriving.reset(rect)
        }
        changed = true
        continue
      }
      member.radius = record.cornerRadius
      member.materialize = record.transition == Materialize
      if (member.leaving) {
        member.leaving = false
        member.target.set(rect)
        member.spring(rect)
        changed = true
      } else if (member.target != rect || member.view !== owner) {
        // Its own view moved: settled, the glass follows it. Moving still, or on another view now (the key moved
        // there), it springs to where the view is.
        val moved = member.view !== owner
        member.view = owner
        member.target.set(rect)
        if (member.isSettled && !moved) member.reset(rect) else member.spring(rect)
        changed = true
      }
    }
    for (member in members.values) {
      if (member.leaving || list.any { it.key == member.key && found.containsKey(it.key) }) continue
      member.leaving = true
      member.view = null
      member.spring(origin(member, member.target))
      changed = true
    }
    return changed
  }

  // Where a member grows out of or goes back into: the nearest other glass, or its own centre.
  private fun origin(member: Member, rect: RectF): RectF {
    if (!member.materialize) {
      var nearest: Member? = null
      var best = Float.MAX_VALUE
      for (other in members.values) {
        if (other === member || other.leaving || !found.containsKey(other.key)) continue
        val dx = other.target.centerX() - rect.centerX()
        val dy = other.target.centerY() - rect.centerY()
        val distance = dx * dx + dy * dy
        if (distance < best) {
          best = distance
          nearest = other
        }
      }
      if (nearest != null) {
        nearest.current(placed)
        return placed
      }
    }
    placed.set(rect.centerX(), rect.centerY(), rect.centerX(), rect.centerY())
    return placed
  }

  // The views in [view] that carry a member's key, each shape the union of its views' rects in [base].
  private fun collect(view: View, base: ViewGroup) {
    if (view !== base) {
      val key = view.getTag(R.id.view_tag_native_id) as? String
      if (key != null && view.visibility == View.VISIBLE && measure(view, base)) {
        val shape = found[key]
        if (shape != null) {
          shape.union(measured)
        } else {
          found[key] = take().apply { set(measured) }
          owners[key] = view
        }
      }
    }
    if (view is ViewGroup) for (index in 0 until view.childCount) collect(view.getChildAt(index), base)
  }

  private fun take(): RectF = (pool.getOrNull(pooled) ?: RectF().also { pool.add(it) }).also { pooled += 1 }

  // The view's bounds in the base's pixels, through every transform and scroll between them.
  private fun measure(view: View, base: ViewGroup): Boolean {
    measured.set(0f, 0f, view.width.toFloat(), view.height.toFloat())
    var current = view
    while (current !== base) {
      if (!current.matrix.isIdentity) current.matrix.mapRect(measured)
      measured.offset(current.left.toFloat(), current.top.toFloat())
      val parent = current.parent as? View ?: return false
      measured.offset(-parent.scrollX.toFloat(), -parent.scrollY.toFloat())
      current = parent
    }
    return measured.width() > 0f && measured.height() > 0f
  }

  fun advance(seconds: Float) {
    if (members.isEmpty()) return
    for (member in members.values) member.advance(seconds)
    members.values.removeAll { it.leaving && it.isSettled }
  }

  // The members as they are now into [out], from the base's pixels ([baseWidth] x [baseHeight]) into [rect], where
  // the base is drawn now (its press and its morph stretch it). False for a group with nothing to draw.
  fun place(out: GlassShapes, rect: RectF, baseWidth: Int, baseHeight: Int, density: Float): Boolean {
    out.clear()
    out.blend = blend * density
    if (records == null) return true
    val scaleX = rect.width() / max(baseWidth, 1)
    val scaleY = rect.height() / max(baseHeight, 1)
    for (member in members.values) {
      member.current(placed)
      if (placed.width() < MinimumSize || placed.height() < MinimumSize) continue
      placed.set(
        rect.left + placed.left * scaleX, rect.top + placed.top * scaleY,
        rect.left + placed.right * scaleX, rect.top + placed.bottom * scaleY,
      )
      val radius = member.radius?.let { it * density * min(scaleX, scaleY) } ?: Float.MAX_VALUE
      out.add(placed, radius)
    }
    return out.count > 0
  }

  private companion object {
    const val Materialize = "materialize"
    const val MinimumSize = .5f
    val Spring = GlassSpringSpec(.75f, .32f)
  }
}
