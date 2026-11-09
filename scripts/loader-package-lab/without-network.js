/** Offline release fixture: OS permission boundary denies native-module networking too. */
const { withAndroidManifest, withMainApplication } = require('expo/config-plugins');
module.exports = (config) => {
  config = withMainApplication(config, (mod) => {
    const marker = '// Bloom offline probe: preserve OS denial as an asynchronous network error.';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents = mod.modResults.contents.replace(
        'super.onCreate()',
        `super.onCreate()
    ${marker}
    com.facebook.react.modules.network.OkHttpClientProvider.setOkHttpClientFactory {
      com.facebook.react.modules.network.OkHttpClientProvider.createClientBuilder()
        .dns(object : okhttp3.Dns {
          override fun lookup(hostname: String): List<java.net.InetAddress> =
          try { okhttp3.Dns.SYSTEM.lookup(hostname) }
          catch (denied: SecurityException) {
            android.util.Log.i("BloomOfflineProbe", "OS denied DNS: " + hostname)
            throw java.net.UnknownHostException("OS denied INTERNET permission").apply { initCause(denied) }
          }
        }).build()
    }`,
      );
    }
    return mod;
  });
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';
    const blocked = [
      'android.permission.INTERNET',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.ACCESS_WIFI_STATE',
    ];
    manifest['uses-permission'] = (manifest['uses-permission'] || []).filter(
      (entry) => !blocked.includes(entry.$['android:name']),
    );
    for (const permission of blocked)
      manifest['uses-permission'].push({
        $: { 'android:name': permission, 'tools:node': 'remove' },
      });
    return mod;
  });
};
