package com.ourtime.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.widget.RemoteViews;

public class OurTimeWidget extends AppWidgetProvider {
    private static PendingIntent open(Context context, String shortcut, int requestCode) {
        Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse("ourtime://open?shortcut=" + shortcut));
        intent.setClass(context, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        return PendingIntent.getActivity(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        for (int appWidgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_ourtime);
            views.setOnClickPendingIntent(R.id.widget_title, open(context, "home", 10));
            views.setOnClickPendingIntent(R.id.widget_new_moment, open(context, "newplan", 11));
            views.setOnClickPendingIntent(R.id.widget_chat, open(context, "chat", 12));
            views.setOnClickPendingIntent(R.id.widget_gallery, open(context, "gallery", 13));
            manager.updateAppWidget(appWidgetId, views);
        }
    }
}
