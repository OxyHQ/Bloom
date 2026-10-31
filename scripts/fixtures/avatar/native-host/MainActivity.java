package so.oxy.bloom.avatarbenchmark;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Isolated test host. No connection to installed Oxy applications or their storage. */
public final class MainActivity extends Activity {
  private WebView webView;

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    WebView.setWebContentsDebuggingEnabled(true);
    webView = new WebView(this);
    webView.getSettings().setJavaScriptEnabled(true);
    webView.getSettings().setDomStorageEnabled(true);
    webView.getSettings().setAllowFileAccess(false);
    webView.setWebViewClient(new WebViewClient());
    setContentView(webView);
    String url = getIntent().getStringExtra("url");
    webView.loadUrl(url == null ? "http://127.0.0.1:6008/scripts/fixtures/avatar/native-benchmark.html" : url);
  }

  @Override public void onDestroy() {
    webView.destroy();
    super.onDestroy();
  }
}
