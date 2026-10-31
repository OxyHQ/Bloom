package so.oxy.bloom

/** A gesture owns exactly the destination that was ready when it began. */
internal class BackPreviewSession {
  data class Owner(val key: String, val destinationTag: Int)
  var owner: Owner? = null
    private set
  var committed = false
    private set
  var progress = 0f
    private set

  fun begin(owner: Owner) {
    this.owner = owner
    committed = false
    progress = 0f
  }

  fun progress(value: Float) {
    if (owner != null && !committed) progress = value.coerceIn(0f, 1f)
  }

  fun commit(current: Owner?): Owner? {
    val started = owner ?: return null
    if (committed || current != started) return null
    committed = true
    progress = 1f
    return started
  }

  fun cancel() {
    owner = null
    committed = false
    progress = 0f
  }
}
