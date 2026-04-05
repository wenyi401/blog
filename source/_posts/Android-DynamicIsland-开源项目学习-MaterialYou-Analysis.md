---
title: Android 灵动岛开源项目学习 - MaterialYou-Dynamic-Island 分析
date: 2026-04-05 16:00:00
tags:
  - Android
  - LSPosed
  - Dynamic Island
  - Jetpack Compose
categories: Android开发
---

# Android 灵动岛开源项目学习 - MaterialYou-Dynamic-Island 分析

> 学习时间：2026-04-05
> 项目地址：[MaterialYou-Dynamic-Island](https://github.com/Angel-Studio/MaterialYou-Dynamic-Island)

---

## 一、项目概述

MaterialYou-Dynamic-Island 是一个使用 Jetpack Compose 实现的免费 Android 灵动岛应用，支持 Android API 31 (Android 12) 及以上版本。

### 主要特性

| 功能 | 说明 |
|------|------|
| 通知弹出 | 新通知以弹出形式显示 |
| 媒体控制 | 播放/暂停控制，专辑信息显示 |
| 充电显示 | 电量百分比和充电状态 |
| 插件系统 | 可自定义插件 |
| 主题支持 | Light/Dark/Amoled 三种主题 |

---

## 二、技术架构

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                         │
├─────────────────────────────────────────────────────────────┤
│  MainActivity                                               │
│  ├── 权限申请 (SYSTEM_ALERT_WINDOW, NOTIFICATION_LISTENER)  │
│  └── 服务启动                                               │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                             │
├─────────────────────────────────────────────────────────────┤
│  OverlayService                                             │
│  ├── TYPE_APPLICATION_OVERLAY                              │
│  └── Jetpack Compose UI                                    │
├─────────────────────────────────────────────────────────────┤
│                    UI Layer (Compose)                       │
├─────────────────────────────────────────────────────────────┤
│  DynamicIslandScreen                                       │
│  ├── CompactIsland                                          │
│  ├── ExpandedIsland                                         │
│  ├── MusicIsland                                            │
│  └── BatteryIsland                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 插件化架构

```kotlin
// 插件接口
interface DynamicIslandPlugin {
    val name: String
    val priority: Int
    fun canRender(notification: StatusBarNotification): Boolean
    @Composable
    fun render(state: IslandState): Unit
}

// 插件注册表
object PluginRegistry {
    private val plugins = mutableListOf<DynamicIslandPlugin>()
    
    fun register(plugin: DynamicIslandPlugin) {
        plugins.add(plugin)
        plugins.sortByDescending { it.priority }
    }
    
    fun getPlugin(notification: StatusBarNotification): DynamicIslandPlugin? {
        return plugins.find { it.canRender(notification) }
    }
}
```

---

## 三、通知处理

### 3.1 通知优先级

```kotlin
enum class NotificationPriority {
    CRITICAL = 100,    // 通话、闹钟
    HIGH = 80,         // 音乐、下载
    MEDIUM = 60,       // IM 消息
    LOW = 40           // 普通通知
}
```

### 3.2 通知过滤规则

```kotlin
// 关键词黑名单
private val KEYWORD_BLACKLIST = listOf(
    "游戏", "game", "ad", "ads", "推广", "特惠"
)

// 白名单优先
private val KEYWORD_WHITELIST = listOf(
    "音乐", "music", "下载", "download", "来电", "call"
)

fun shouldShow(notification: StatusBarNotification): Boolean {
    val text = "${title} ${content}"
    
    // 白名单优先
    if (KEYWORD_WHITELIST.any { text.contains(it) }) {
        return true
    }
    
    // 黑名单过滤
    if (KEYWORD_BLACKLIST.any { text.contains(it) }) {
        return false
    }
    
    return true
}
```

---

## 四、媒体控制实现

### 4.1 MediaSession 集成

```kotlin
class MediaSessionManager(private val context: Context) {
    
    private var mediaController: MediaController? = null
    
    fun initialize(sessionToken: MediaSession.Token) {
        mediaController = MediaController(context, sessionToken)
    }
    
    fun getNowPlaying(): MediaMetadata? {
        return mediaController?.metadata
    }
    
    fun play() = mediaController?.transportControls?.play()
    fun pause() = mediaController?.transportControls?.pause()
    fun next() = mediaController?.transportControls?.skipToNext()
    fun prev() = mediaController?.transportControls?.skipToPrevious()
}
```

### 4.2 媒体信息提取

```kotlin
fun extractMediaInfo(extras: Bundle): MediaInfo {
    return MediaInfo(
        title = extras.getCharSequence(EXTRA_TITLE) ?: "",
        artist = extras.getCharSequence(EXTRA_TEXT) ?: "",
        album = extras.getCharSequence(EXTRA_SUB_TEXT),
        duration = extras.getLong(EXTRA_MEDIA_SESSION)?.let { 
            // MediaSession token 
        } ?: 0L
    )
}
```

---

## 五、充电状态显示

### 5.1 BatteryManager 监听

```kotlin
class BatteryStateReceiver {
    
    data class BatteryInfo(
        val level: Int,           // 0-100
        val isCharging: Boolean,
        val chargeType: String     // AC/USB/Wireless
    )
    
    fun getBatteryInfo(intent: Intent): BatteryInfo {
        val level = intent.getIntExtra(EXTRA_LEVEL, 0)
        val scale = intent.getIntExtra(EXTRA_SCALE, 100)
        val status = intent.getIntExtra(EXTRA_STATUS, -1)
        val plugged = intent.getIntExtra(EXTRA_PLUGGED, 0)
        
        return BatteryInfo(
            level = (level * 100) / scale,
            isCharging = status == BATTERY_STATUS_CHARGING,
            chargeType = when (plugged) {
                BATTERY_PLUGGED_AC -> "交流电"
                BATTERY_PLUGGED_USB -> "USB"
                BATTERY_PLUGGED_WIRELESS -> "无线"
                else -> "未充电"
            }
        )
    }
}
```

### 5.2 充电岛 UI

```kotlin
@Composable
fun BatteryChargingIsland(
    batteryInfo: BatteryInfo,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier
            .clip(RoundedCornerShape(18.dp))
            .background(Color.Black)
            .padding(horizontal = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.BatteryChargingFull,
            contentDescription = null,
            tint = when {
                batteryInfo.level >= 80 -> Color.Green
                batteryInfo.level >= 50 -> Color.Yellow
                else -> Color.White
            }
        )
        
        Text(
            text = "${batteryInfo.level}%",
            color = Color.White,
            fontWeight = FontWeight.Medium
        )
    }
}
```

---

## 六、Compose UI 动画

### 6.1 展开/收缩动画

```kotlin
val expandAnimation = expandVertically(
    animationSpec = spring(
        dampingRatio = Spring.DampingRatioMediumBouncy,
        stiffness = Spring.StiffnessLow
    )
) + fadeIn()

val collapseAnimation = shrinkVertically(
    animationSpec = spring(
        dampingRatio = Spring.DampingRatioMediumBouncy,
        stiffness = Spring.StiffnessLow
    )
) + fadeOut()
```

### 6.2 尺寸动画

```kotlin
val width by animateDpAsState(
    targetValue = when (state) {
        Compact -> 80.dp
        Expanded -> 300.dp
        Minimal -> 12.dp
    },
    animationSpec = spring(
        dampingRatio = Spring.DampingRatioMediumBouncy,
        stiffness = Spring.StiffnessMedium
    )
)
```

---

## 七、与本项目对比

| 特性 | MaterialYou-Dynamic-Island | 本项目 (HyperDynamicIsland) |
|------|---------------------------|---------------------------|
| 实现方式 | 应用层 Overlay | LSPosed Hook + Overlay |
| 媒体控制 | 完整 MediaSession | 部分支持 |
| 充电显示 | 支持 | 可添加 |
| 插件系统 | 完整插件化 | 尚未实现 |
| 主题支持 | Light/Dark/Amoled | 基础支持 |
| IPC 通信 | BroadcastReceiver | BroadcastReceiver + ContentProvider |

---

## 八、改进建议

### 8.1 可借鉴功能

1. **充电状态岛** - 通过 BatteryManager 监听充电状态
2. **更完善的媒体控制** - 使用 MediaController 实现播放控制
3. **插件化架构** - 参考其插件接口设计

### 8.2 代码借鉴

```kotlin
// 1. 添加充电状态监听
class BatteryStateReceiver(
    private val onBatteryChange: (BatteryInfo) -> Unit
) {
    fun register() {
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
        }
        context.registerReceiver(receiver, filter)
    }
}

// 2. 在 Service 中启动充电岛
if (batteryInfo.isCharging && uiState.state == Hidden) {
    viewModel.showBatteryIsland(batteryInfo)
}
```

---

## 九、总结

MaterialYou-Dynamic-Island 是一个很好的学习项目，展示了：
- Jetpack Compose 在自定义 UI 上的强大能力
- 插件化架构的设计思路
- 通知和媒体的处理方式

本项目可以借鉴其：
1. 充电状态显示功能
2. 更完善的 MediaSession 支持
3. 插件化通知渲染架构

---

*参考链接：*
- [MaterialYou-Dynamic-Island GitHub](https://github.com/Angel-Studio/MaterialYou-Dynamic-Island)
- [Jetpack Compose 官方文档](https://developer.android.com/jetpack/compose)
- [Android MediaSession](https://developer.android.com/reference/android/media/session/MediaSession)
