---
title: Android 灵动岛进阶开发 - 从 HyperCeiler 学到的架构与最佳实践
date: 2026-04-05 11:30:00
tags: [Android, LSPosed, 灵动岛, HyperOS, SystemUI Hook]
categories: Android开发
---

# Android 灵动岛进阶开发

> 作者：夏目 🍃
> 记录日期：2026-04-05

---

## 前言

最近在完善自己的 Android 灵动岛 LSPosed 模块项目，学习了 [HyperCeiler](https://github.com/ReChronoRain/HyperCeiler) 这个成熟的 HyperOS 增强模块，学到了很多架构设计和最佳实践。这篇文章记录一下学习心得。

<!-- more -->

## 一、整体架构对比

### 当前项目的架构

```
┌─────────────────────────────────────────┐
│         Module Application               │
│  MainActivity + Jetpack Compose UI       │
│  Hilt ViewModel + DataStore              │
├─────────────────────────────────────────┤
│  NotificationListenerService            │
│  DynamicIslandOverlayService            │
├─────────────────────────────────────────┤
│  MainHook (Legacy Xposed API)           │
│  - NotificationHandler                  │
│  - ResourceHook (deprecated)            │
└─────────────────────────────────────────┘
              ↓ Broadcast IPC
┌─────────────────────────────────────────┐
│           SystemUI Process             │
│  Hook NotificationPanel/Row/Presenter  │
└─────────────────────────────────────────┘
```

### HyperCeiler 的架构

```
┌─────────────────────────────────────────┐
│         Module Application               │
│  Settings UI (Compose)                   │
│  XSharedPreferences (持久化)             │
├─────────────────────────────────────────┤
│  Shared Layer                           │
│  ContentProvider + Broadcast + File     │
├─────────────────────────────────────────┤
│  Hook Layer (按功能模块化)               │
│  SystemUI Hook / Settings Hook / ...   │
│  VersionCompat (多版本兼容)             │
└─────────────────────────────────────────┘
```

### 关键区别

| 方面 | 当前项目 | HyperCeiler |
|------|---------|-------------|
| IPC | BroadcastReceiver | ContentProvider + Broadcast |
| 配置 | DataStore | XSharedPreferences |
| Hook | 单一 MainHook | 按功能模块化 |
| 版本兼容 | 简单 try-catch | VersionCompat 类 |
| 通知过滤 | 基础黑名单 | 规则引擎 |

---

## 二、通知识别系统

### 2.1 通知优先级策略

HyperCeiler 实现了精细的优先级系统：

```kotlin
object NotificationPriority {
    const val CALL = 100          // 来电
    const val MUSIC = 95          // 音乐
    const val NAVIGATION = 90     // 导航
    const val ALARM = 85          // 闹钟
    const val IM_MESSAGE = 80     // 即时消息
    const val DOWNLOAD = 75       // 下载
    const val SOCIAL = 60         // 社交
    const val EMAIL = 50          // 邮件
    const val MARKETING = 10      // 营销广告
}
```

### 2.2 多级过滤规则

```kotlin
class NotificationFilterEngine {
    
    // 白名单（始终显示）
    private val whitelist = mutableSetOf<String>()
    
    // 黑名单（始终隐藏）
    private val blacklist = setOf(
        "com.android.systemui",
        "com.miui.android.fmsapkmgr",
        "com.xiaomi.ab"
    )
    
    // 游戏关键词
    private val gameKeywords = listOf("game", "游戏", "手游")
    
    fun shouldShow(sbn: StatusBarNotification): FilterResult {
        // 1. 白名单直接显示
        if (whitelist.contains(sbn.packageName)) {
            return FilterResult.SHOW
        }
        
        // 2. 黑名单直接隐藏
        if (blacklist.contains(sbn.packageName)) {
            return FilterResult.HIDE
        }
        
        // 3. 系统通知过滤
        if (isSystemNotification(sbn)) {
            return FilterResult.HIDE
        }
        
        // 4. 游戏过滤
        if (isGameNotification(sbn)) {
            return FilterResult.HIDE
        }
        
        // 5. 渠道重要性检查
        if (!hasSufficientImportance(sbn)) {
            return FilterResult.HIDE
        }
        
        return FilterResult.SHOW
    }
    
    private fun isGameNotification(sbn: StatusBarNotification): Boolean {
        val title = sbn.notification.extras
            .getCharSequence(Notification.EXTRA_TITLE)?.toString() ?: ""
        val pkg = sbn.packageName
        
        return gameKeywords.any { 
            title.contains(it, ignoreCase = true) ||
            pkg.contains(it, ignoreCase = true)
        }
    }
}
```

### 2.3 MediaSession 集成

音乐通知是灵动岛最重要的场景之一：

```kotlin
class MediaSessionManager(private val context: Context) {
    
    private var mediaSession: MediaSession? = null
    
    fun getCurrentMediaInfo(): MediaInfo? {
        return try {
            val controller = mediaSession?.controller ?: return null
            val metadata = controller.metadata ?: return null
            
            MediaInfo(
                title = metadata.getText(MediaMetadata.METADATA_KEY_TITLE)?.toString(),
                artist = metadata.getText(MediaMetadata.METADATA_KEY_ARTIST)?.toString(),
                album = metadata.getText(MediaMetadata.METADATA_KEY_ALBUM)?.toString(),
                duration = metadata.getLong(MediaMetadata.METADATA_KEY_DURATION),
                isPlaying = controller.playbackState?.state == PlaybackState.STATE_PLAYING
            )
        } catch (e: SecurityException) {
            null
        }
    }
    
    fun sendMediaKey(keyCode: Int) {
        val controller = mediaSession?.controller ?: return
        val event = KeyEvent(KeyEvent.ACTION_DOWN, keyCode)
        controller.dispatchMediaButtonEvent(event)
    }
}
```

---

## 三、SystemUI Hook 技术

### 3.1 核心 Hook 类

| 类名 | 作用 |
|------|------|
| `NotificationPanelView` | 通知面板（展开/收起） |
| `NotificationStackScrollLayout` | 通知列表 |
| `ExpandableNotificationRow` | 单条通知行 |
| `StatusBarIconController` | 状态栏图标 |
| `NotificationPresenter` | 通知呈现器 |

### 3.2 方法拦截示例

```kotlin
// Hook 通知点击
findClass("com.android.systemui.statusbar.notification.row.ExpandableNotificationRow")
    .hookMethod("handleNotificationClick", object : XC_MethodHook() {
        override fun beforeHookedMethod(param: MethodHookParam) {
            val row = param.thisObject
            val key = row.getObjectField("mNotificationKey") as String
            log("通知点击: $key")
        }
    })

// Hook 面板展开
findClass("com.android.systemui.statusbar.phone.NotificationPanelView")
    .hookMethod("setExpanded", object : XC_MethodHook() {
        override fun beforeHookedMethod(param: MethodHookParam) {
            val isExpanded = param.args[0] as Boolean
            if (isExpanded) {
                // 面板展开，隐藏灵动岛
                sendHideBroadcast()
            }
        }
    })
```

### 3.3 版本兼容性处理

```kotlin
object VersionCompat {
    
    private val sdk = Build.VERSION.SDK_INT
    
    fun getNotificationPanelClass(classLoader: ClassLoader): Class<*>? {
        val className = when {
            sdk >= 35 -> "com.android.systemui.shade.NotificationPanelView"
            sdk >= 34 -> "com.android.systemui.statusbar.phone.NotificationPanelViewController"
            else -> "com.android.systemui.statusbar.phone.NotificationPanelView"
        }
        
        return try {
            XposedHelpers.findClass(className, classLoader)
        } catch (e: Throwable) {
            null
        }
    }
    
    fun getNotificationRowClass(classLoader: ClassLoader): Class<*>? {
        // Android 12+ 使用 RowController
        val className = if (sdk >= 31) {
            "com.android.systemui.statusbar.notification.row.ExpandableNotificationRowController"
        } else {
            "com.android.systemui.statusbar.notification.row.ExpandableNotificationRow"
        }
        
        return try {
            XposedHelpers.findClass(className, classLoader)
        } catch (e: Throwable) {
            null
        }
    }
}
```

---

## 四、ContentProvider IPC

相比广播，ContentProvider 提供更可靠的进程间通信：

```kotlin
// Module 端
class DynamicIslandProvider : ContentProvider() {
    
    companion object {
        const val AUTHORITY = "com.example.dynamicislandxposed.provider"
        val CONTENT_URI = Uri.parse("content://$AUTHORITY/notifications")
    }

    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        return when (uri.path) {
            "/current" -> queryCurrentNotification()
            "/list" -> queryAllNotifications()
            else -> null
        }
    }
    
    private fun queryCurrentNotification(): Cursor {
        // 返回当前活跃通知
        return MatrixCursor(arrayOf("key", "title", "text", "package"))
    }
}

// Hook 端 - 读取数据
val cursor = context.contentResolver.query(
    Uri.parse("content://com.example.dynamicislandxposed.provider/notifications/current"),
    null, null, null, null
)

cursor?.use {
    while (it.moveToNext()) {
        val title = it.getString(it.getColumnIndexOrThrow("title"))
        // 处理通知
    }
}
```

---

## 五、配置管理系统

### XSharedPreferences 使用

```kotlin
class PreferencesManager(context: Context) {
    
    private val prefs = XSharedPreferences(
        "com.example.dynamicislandxposed",
        "settings"
    )
    
    fun isEnabled(): Boolean = prefs.getBoolean("enabled", true)
    
    fun getPriorityApps(): Set<String> = prefs.getStringSet("priority_apps") ?: emptySet()
    
    fun registerListener(
        listener: SharedPreferences.OnSharedPreferenceChangeListener
    ) {
        prefs.registerOnSharedPreferenceChangeListener(listener)
    }
}
```

---

## 六、总结

从 HyperCeiler 学到的核心要点：

1. **精细化 Hook**：针对不同 Android 版本选择正确的 Hook 点
2. **完善的配置系统**：XSharedPreferences + LSPosed 框架
3. **多版本兼容**：使用 VersionCompat 类处理版本差异
4. **模块化设计**：按功能模块化，互不干扰
5. **可靠的 IPC**：优先使用 ContentProvider

**当前项目的改进方向**：

| 优先级 | 改进项 |
|--------|--------|
| P0 | ContentProvider IPC 实现 |
| P0 | MediaSession 集成 |
| P1 | 通知过滤规则引擎 |
| P1 | 版本兼容性处理 |
| P2 | APK 大小优化 |

---

## 参考项目

- [HyperCeiler](https://github.com/ReChronoRain/HyperCeiler) - HyperOS 增强模块
- [MaterialYou-Dynamic-Island](https://github.com/Angel-Studio/MaterialYou-Dynamic-Island) - Jetpack Compose 灵动岛
- [LSPosed](https://github.com/LSPosed/LSPosed) - Xposed 框架

---

*如果你有任何问题，欢迎留言讨论！*
