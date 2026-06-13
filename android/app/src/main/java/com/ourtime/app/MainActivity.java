package com.ourtime.app;

import android.content.Intent;
import android.os.Bundle;
import android.webkit.WebStorage;

import java.io.File;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginHandle;

import ee.forgr.capacitor.social.login.GoogleProvider;
import ee.forgr.capacitor.social.login.SocialLoginPlugin;
import ee.forgr.capacitor.social.login.ModifiedMainActivityForSocialLoginPlugin;

public class MainActivity extends BridgeActivity implements ModifiedMainActivityForSocialLoginPlugin {
    @Override
    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);

        // Check if the request code belongs to Google Sign-In
        if (requestCode >= GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MIN && 
            requestCode < GoogleProvider.REQUEST_AUTHORIZE_GOOGLE_MAX) {
            
            PluginHandle pluginHandle = getBridge().getPlugin("SocialLogin");
            if (pluginHandle != null) {
                Plugin plugin = pluginHandle.getInstance();
                if (plugin instanceof SocialLoginPlugin) {
                    ((SocialLoginPlugin) plugin).handleGoogleLoginIntent(requestCode, data);
                }
            }
        }
    }

    @Override
    public void IHaveModifiedTheMainActivityForTheUseWithSocialLoginPlugin() {
        // This function is required by the interface but should remain empty
    }

    private void deleteRecursively(File file) {
        if (file == null || !file.exists()) return;
        File[] children = file.listFiles();
        if (children != null) {
            for (File child : children) deleteRecursively(child);
        }
        file.delete();
    }

    private void clearStaleWebViewData() {
        // Capacitor auth lives in native Preferences, so clearing WebView data
        // removes stale PWA bundles without signing the user out.
        deleteRecursively(new File(getDataDir(), "app_webview"));
        deleteRecursively(getCacheDir());
        deleteRecursively(getCodeCacheDir());
        WebStorage.getInstance().deleteAllData();
    }

    private long currentVersionCode() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).getLongVersionCode();
        } catch (Exception ignored) {
            return 1;
        }
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        long currentVersion = currentVersionCode();
        long installedVersion = getSharedPreferences("ourtime_native", MODE_PRIVATE)
            .getLong("web_data_version", 0);
        if (installedVersion != currentVersion) {
            clearStaleWebViewData();
            getSharedPreferences("ourtime_native", MODE_PRIVATE)
                .edit()
                .putLong("web_data_version", currentVersion)
                .apply();
        }

        super.onCreate(savedInstanceState);
        if (installedVersion != currentVersion && bridge != null) {
            bridge.getWebView().clearCache(true);
        }
    }
}
