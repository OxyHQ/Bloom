const { withMainApplication } = require('expo/config-plugins');
const marker = '// Bloom path origin probe (fixture only).';
const probe = `${marker}
    for (sample in arrayOf(floatArrayOf(379f, 52f, 26f), floatArrayOf(100f, 80f, 10f), floatArrayOf(100f, 80f, 0f))) {
      val path = android.graphics.Path().apply { addRoundRect(0f, 0f, sample[0], sample[1], sample[2], sample[2], android.graphics.Path.Direction.CW) }
      val measure = android.graphics.PathMeasure(path, false)
      val point = FloatArray(2)
      measure.getPosTan(0f, point, null)
      android.util.Log.i("BloomPathProbe", "size=" + sample.contentToString() + " start=" + point.contentToString() + " length=" + measure.length)
    }
`;
module.exports = (config) =>
  withMainApplication(config, (mod) => {
    if (!mod.modResults.contents.includes(marker))
      mod.modResults.contents = mod.modResults.contents.replace(
        'super.onCreate()',
        `super.onCreate()\n    ${probe}`,
      );
    return mod;
  });
module.exports.probe = probe;
