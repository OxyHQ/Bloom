package so.oxy.bloom.avatarbenchmark;

import android.app.Activity;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.GridLayout;
import java.util.ArrayList;

/** Isolated test host. No connection to installed Oxy applications or their storage. */
public final class MainActivity extends Activity {
  private final ArrayList<WebView> webViews = new ArrayList<>();

  @Override public void onCreate(Bundle state) {
    super.onCreate(state);
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    WebView.setWebContentsDebuggingEnabled(true);
    String url = getIntent().getStringExtra("url");
    if (url == null) url = "http://127.0.0.1:6008/iframe.html";
    int count = Math.max(1, Math.min(9, getIntent().getIntExtra("count", 1)));
    GridLayout grid = new GridLayout(this);
    grid.setColumnCount(3);
    int cell = Math.round(128 * getResources().getDisplayMetrics().density);
    for (int index = 0; index < count; index++) {
      WebView webView = new WebView(this);
      webViews.add(webView);
      webView.getSettings().setJavaScriptEnabled(true);
      webView.getSettings().setDomStorageEnabled(true);
      webView.getSettings().setAllowFileAccess(false);
      webView.setWebViewClient(new WebViewClient());
      if (count == 1) setContentView(webView);
      else grid.addView(webView, new GridLayout.LayoutParams(new android.view.ViewGroup.LayoutParams(cell, cell)));
      webView.loadUrl(url + (url.contains("?") ? "&" : "?") + "host=" + index);
    }
    if (count > 1) setContentView(grid);
  }

  @Override public void onDestroy() {
    for (WebView webView : webViews) webView.destroy();
    super.onDestroy();
  }
}
