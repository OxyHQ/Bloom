const { withMainActivity } = require('expo/config-plugins');
/** Synthetic app only: explicit adb intent probes an installed library view. */
module.exports = (config) =>
  withMainActivity(config, (mod) => {
    const marker = '// Bloom packaged Canvas capability probe.';
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
    if (probe != "snapshot" && probe != "software") return
    window.decorView.postDelayed({
      val lights = lightViews(window.decorView)
      android.util.Log.i("BloomCanvasProbe", "before count=" + lights.size + " mode=" + probe)
      for (light in lights) {
        android.util.Log.i("BloomCanvasProbe", "windowHardware=" + light.isHardwareAccelerated + " layerType=" + light.layerType)
        if (probe == "software") light.setLayerType(android.view.View.LAYER_TYPE_SOFTWARE, null)
        else {
          val bitmap = android.graphics.Bitmap.createBitmap(light.width, light.height, android.graphics.Bitmap.Config.ARGB_8888)
          light.draw(android.graphics.Canvas(bitmap))
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
    return mod;
  });
