package com.appliedinteractions.trailsafe.devicesearch

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.core.content.pm.ShortcutInfoCompat
import androidx.core.content.pm.ShortcutManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class DeviceSearchModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("DeviceSearch")

    AsyncFunction("isAvailable") {
      val context = appContext.reactContext ?: return@AsyncFunction false
      return@AsyncFunction ShortcutManagerCompat.getMaxShortcutCountPerActivity(context) > 0
    }

    AsyncFunction("indexItems") { items: List<Map<String, Any?>> ->
      val context = appContext.reactContext ?: return@AsyncFunction
      val shortcuts = mutableListOf<ShortcutInfoCompat>()

      for (item in items) {
        val id = item["id"] as? String ?: continue
        val title = item["title"] as? String ?: continue
        val description = item["description"] as? String ?: ""
        val url = (item["url"] as? String) ?: "trailsafe://article/$id"

        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
          setPackage(context.packageName)
        }

        val shortcut = ShortcutInfoCompat.Builder(context, id)
          .setShortLabel(title.take(25))
          .setLongLabel("$title: $description".take(50))
          .setIntent(intent)
          .setCategories(setOf("com.appliedinteractions.trailsafe.GUIDE"))
          .build()

        shortcuts.add(shortcut)
      }

      ShortcutManagerCompat.setDynamicShortcuts(context, shortcuts)
    }

    AsyncFunction("clearItems") {
      val context = appContext.reactContext ?: return@AsyncFunction
      ShortcutManagerCompat.removeAllDynamicShortcuts(context)
    }
  }
}
