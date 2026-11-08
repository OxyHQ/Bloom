const { withMainActivity } = require('expo/config-plugins');
/** Synthetic app only: explicit adb intent probes an installed library view. */
module.exports = (config) =>
  withMainActivity(config, (mod) => {
    const marker = '// Bloom packaged Canvas capability probe.';
    mod.modResults.contents = mod.modResults.contents.replace(
      / {2}\/\/ Bloom packaged Canvas capability probe\.[\s\S]*?(?= {2}override fun onCreate)/,
      '',
    );
    if (!mod.modResults.contents.includes(marker))
      mod.modResults.contents = mod.modResults.contents.replace(
        'class MainActivity : ReactActivity() {',
        `class MainActivity : ReactActivity() {
  ${marker}
  private fun lightViews(view: android.view.View): List<so.oxy.bloom.ComposerLight> {
    if (view is so.oxy.bloom.ComposerLight) return listOf(view)
    if (view !is android.view.ViewGroup) return emptyList()
    return (0 until view.childCount).flatMap { lightViews(view.getChildAt(it)) }
  }
  override fun onNewIntent(intent: android.content.Intent) {
    super.onNewIntent(intent)
    val probe = intent.getStringExtra("bloomProbe") ?: return
    if (probe == "clock") {
      window.decorView.post {
        for (light in lightViews(window.decorView)) android.util.Log.i("BloomPackageClock", org.json.JSONObject().apply {
          put("wallMs", android.os.SystemClock.elapsedRealtime()); put("seconds", light.seconds)
          put("width", light.boxWidth); put("height", light.boxHeight); put("radius", light.radius)
        }.toString())
      }
      return
    }
    if (probe == "traceSelection") {
      fun watch(view: android.view.View) {
        if (view is android.widget.EditText) {
          val watcher = object : android.text.SpanWatcher {
            fun record(text: android.text.Spannable, what: Any) {
              if (what === android.text.Selection.SELECTION_START || what === android.text.Selection.SELECTION_END) {
                android.util.Log.i("BloomSelectionTrace", android.util.Log.getStackTraceString(Throwable("id=" + view.id + " start=" + android.text.Selection.getSelectionStart(text) + " end=" + android.text.Selection.getSelectionEnd(text))))
              }
            }
            override fun onSpanAdded(text: android.text.Spannable, what: Any, start: Int, end: Int) { record(text, what) }
            override fun onSpanRemoved(text: android.text.Spannable, what: Any, start: Int, end: Int) { record(text, what) }
            override fun onSpanChanged(text: android.text.Spannable, what: Any, oldStart: Int, oldEnd: Int, newStart: Int, newEnd: Int) { record(text, what) }
          }
          view.text?.setSpan(watcher, 0, view.text?.length ?: 0, android.text.Spanned.SPAN_INCLUSIVE_INCLUSIVE)
        }
        if (view is android.view.ViewGroup) for (i in 0 until view.childCount) watch(view.getChildAt(i))
      }
      window.decorView.post { watch(window.decorView) }
      return
    }
    if (probe == "inputs") {
      fun inspect(view: android.view.View) {
        if (view is android.widget.EditText) android.util.Log.i("BloomInputProbe", org.json.JSONObject().apply {
          put("testID", view.getTag(com.facebook.react.R.id.react_test_id))
          put("identity", System.identityHashCode(view)); put("id", view.id)
          put("start", view.selectionStart); put("end", view.selectionEnd)
          put("focused", view.hasFocus()); put("attached", view.isAttachedToWindow)
          put("text", view.text.toString())
        }.toString())
        if (view is android.view.ViewGroup) for (i in 0 until view.childCount) inspect(view.getChildAt(i))
      }
      window.decorView.post { inspect(window.decorView) }
      return
    }
    if (probe != "snapshot" && probe != "software" && probe != "transient") return
    window.decorView.postDelayed({
      val lights = lightViews(window.decorView)
      android.util.Log.i("BloomCanvasProbe", "before count=" + lights.size + " mode=" + probe)
      for (light in lights) {
        android.util.Log.i("BloomCanvasProbe", "windowHardware=" + light.isHardwareAccelerated + " layerType=" + light.layerType)
        if (probe == "software") light.setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null)
        else {
          val bitmap = android.graphics.Bitmap.createBitmap(light.width, light.height, android.graphics.Bitmap.Config.ARGB_8888)
          val previousLayer = light.layerType
          if (probe == "transient") light.setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null)
          val started = android.os.SystemClock.elapsedRealtimeNanos()
          try { light.draw(android.graphics.Canvas(bitmap)) }
          finally { if (probe == "transient") light.setLayerType(previousLayer, null) }
          val elapsed = (android.os.SystemClock.elapsedRealtimeNanos() - started) / 1000000.0
          val output = java.io.File(getExternalFilesDir(null), "snapshot-" + System.currentTimeMillis() + ".png")
          java.io.FileOutputStream(output).use { bitmap.compress(android.graphics.Bitmap.CompressFormat.PNG, 100, it) }
          android.util.Log.i("BloomCanvasProbe", "snapshotMs=" + elapsed + " seconds=" + light.seconds + " path=" + output.absolutePath)
          bitmap.recycle()
        }
      }
      window.decorView.postDelayed({
        android.util.Log.i("BloomCanvasProbe", "after count=" + lightViews(window.decorView).size + " mode=" + probe)
      }, 1500)
    }, 500)
  }
`,
      );
    const launchMarker = '// Bloom synthetic launch properties.';
    if (!mod.modResults.contents.includes(launchMarker)) {
      const before = mod.modResults.contents;
      mod.modResults.contents = before.replace(
        /fabricEnabled\s*\)\{\}/,
        `fabricEnabled
          ) {
            ${launchMarker}
            override fun getLaunchOptions(): android.os.Bundle = android.os.Bundle().apply {
              putString("scene", intent.getStringExtra("scene"))
              putBoolean("initialActive", intent.getBooleanExtra("initialActive", true))
            }
          }`,
      );
      if (mod.modResults.contents === before)
        throw new Error('Cannot inject synthetic launch properties');
    }
    return mod;
  });
