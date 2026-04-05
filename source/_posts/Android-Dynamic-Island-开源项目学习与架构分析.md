# Android 灵动岛开发实战：从开源项目学习架构设计

> 📅 学习日期: 2026-04-05
> 🎯 学习目标: 深入学习 Android 灵动岛实现方案，从开源项目汲取架构设计经验

## 前言

灵动岛（Dynamic Island）是 Apple 在 iPhone 14 Pro 引入的创新设计，随后被各大 Android 厂商（尤其是小米 HyperOS）借鉴实现。本文记录从开源项目学习灵动岛架构设计的过程，以及如何将这些知识应用到自己的 Xposed 模块项目中。

## 一、开源项目分析

### 1.1 JetIsland - Jetpack Compose 实现

**项目地址**: https://github.com/cengiztoru/JetIsland_Dynamic-Island-Jetpack-Compose

这是目前最完整的 Jetpack Compose 灵动岛开源实现，展示了：

```
✅ 灵动岛状态机：Notch → Collapsed → Expanded
✅ 通知到达时的动画过渡
✅ 音乐播放、拨打电话等场景的 UI 展示
✅ 使用前台服务（Foreground Service）保活
```

**核心实现思路**:
1. **状态管理**：使用 `StateFlow` 管理灵动岛的三种状态
2. **动画过渡**：使用 `AnimatedVisibility` + `spring` 动画
3. **点击交互**：通过 `clickable`  modifier 切换展开/收起

**关键代码结构**:
```kotlin
@Composable
fun DynamicIsland() {
    var state by remember { mutableStateOf(IslandState.HIDDEN) }
    
    AnimatedVisibility(
        visible = state != IslandState.HIDDEN,
        enter = expandVertically() + fadeIn(),
        exit = shrinkVertically() + fadeOut()
    ) {
        when (state) {
            IslandState.COMPACT -> CompactIsland()
            IslandState.EXPANDED -> ExpandedIsland()
        }
    }
}
```

### 1.2 HyperCeiler - LSPosed 模块标杆

**项目地址**: https://github.com/ReChronoRain/HyperCeiler

HyperCeiler 是 HyperOS 增强模块的代表项目，展示了企业级 LSPosed 模块的架构设计：

**核心架构特点**:
1. **模块化设计**：每个功能独立，互不干扰
2. **配置驱动**：通过 XSharedPreferences 管理开关
3. **多版本兼容**：支持多个 MIUI/HyperOS 版本
4. **精细化 Hook**：针对不同 Android 版本使用不同 Hook 点

**通知过滤系统**（重点借鉴）:
```kotlin
object NotificationFilter {
    // 黑名单（完全忽略）
    private val BLACKLIST = setOf(
        "com.android.systemui",
        "com.miui.systemui.provider"
    )
    
    // 私密通知
    private val PRIVATE_CHANNELS = setOf("私人消息", "敏感通知")
    
    // 游戏过滤
    private val GAME_KEYWORDS = listOf("game", "游戏", "王者", "吃鸡")
    
    fun shouldFilter(sbn: StatusBarNotification): FilterResult {
        return when {
            BLACKLIST.contains(sbn.packageName) -> FilterResult.BLOCK
            isPrivateChannel(sbn) -> FilterResult.PRIVATE
            isGameNotification(sbn) -> FilterResult.BLOCK
            else -> FilterResult.ALLOW
        }
    }
}
```

### 1.3 sinasamaki/dynamic-island

**项目地址**: https://www.sinasamaki.com/dynamic-island/

专注于灵动岛动画效果的开源实现，展示了精细的动画设计：

**动画设计亮点**:
- 灵动岛展开/收起使用 spring 动画
- 通知图标的多态切换
- 胶囊到圆角的平滑过渡

```kotlin
// 动画参数
val springSpec = spring(
    dampingRatio = Spring.DampingRatioMediumBouncy,
    stiffness = Spring.StiffnessLow
)

// 宽度动画
val width by animateDpAsState(
    targetValue = if (isExpanded) 300.dp else 80.dp,
    animationSpec = springSpec
)
```

## 二、核心架构设计

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    LSPosed Module                           │
├─────────────────────────────────────────────────────────────┤
│  Hook Layer (SystemUI 进程)                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ MainHook / ModernMainHook                            │  │
│  │ - NotificationPanelView Hook                         │  │
│  │ - ExpandableNotificationRow Hook                     │  │
│  │ - StatusBarIconController Hook                       │  │
│  │ - PhoneWindowManager Hook                             │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  IPC Layer                                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ BroadcastReceiver ←→ ContentProvider                 │  │
│  │ (降级方案)          (优先方案)                        │  │
│  └──────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  Module App (独立进程)                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │Notification  │  │  Overlay     │  │  MainActivity │   │
│  │ListenerService│  │  Service     │  │  (配置界面)   │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│         ↓                 ↓                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              ViewModel (UI 状态管理)                  │  │
│  └──────────────────────────────────────────────────────┘  │
│         ↓                                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Jetpack Compose (灵动岛 UI)                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 状态机设计

```kotlin
sealed class DynamicIslandState {
    data object Hidden   : DynamicIslandState()  // 完全隐藏
    data object Compact  : DynamicIslandState()  // 紧凑形态
    data object Expanded : DynamicIslandState()  // 展开形态
    data object Minimal  : DynamicIslandState()  // 最小化
}

data class DynamicIslandUiState(
    val state: DynamicIslandState = DynamicIslandState.Hidden,
    val notification: DynamicIslandNotification? = null,
    val progress: Float = 0f,
    val isMusicPlaying: Boolean = false,
    val musicInfo: MusicInfo? = null
)
```

### 2.3 IPC 通信设计

**方案对比**:

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| BroadcastReceiver | 实现简单 | 不可靠，依赖系统调度 | 降级方案 |
| ContentProvider | 可靠，可查询历史 | 实现复杂 | 优先方案 |
| AIDL | 最可靠，高性能 | 实现最复杂 | 高度实时性场景 |

**ContentProvider 实现要点**:

```kotlin
class DynamicIslandContentProvider : ContentProvider() {
    
    companion object {
        // 通知数据（跨进程共享）
        private val _currentNotification = MutableStateFlow<NotificationData?>(null)
        
        // URI 定义
        val URI_NOTIFICATION = Uri.parse("content://$AUTHORITY/notification")
    }
    
    override fun update(uri: Uri, values: ContentValues?): Int {
        // 写入数据并通知变化
        _currentNotification.value = data
        context?.contentResolver?.notifyChange(uri, null)
        return 1
    }
}
```

## 三、通知优先级系统

### 3.1 优先级定义

```kotlin
object NotificationPriority {
    const val MUSIC = 100      // 音乐播放
    const val CALL = 95        // 通话
    const val DOWNLOAD = 90     // 下载进度
    const val NAVIGATION = 85   // 导航
    const val ALARM = 85        // 闹钟
    const val IM = 80           // 即时消息
    const val SOCIAL = 60       // 社交
    const val EMAIL = 50        // 邮件
    const val PROMOTION = 10    // 营销
}
```

### 3.2 通知分类器

```kotlin
class NotificationClassifier {
    
    fun classify(sbn: StatusBarNotification): NotificationType {
        return when {
            isMusic(sbn) -> NotificationType.MUSIC
            isDownload(sbn) -> NotificationType.DOWNLOAD
            isCall(sbn) -> NotificationType.CALL
            isIm(sbn) -> NotificationType.IM
            else -> NotificationType.NORMAL
        }
    }
    
    private fun isMusic(sbn: StatusBarNotification): Boolean {
        val packageName = sbn.packageName
        val musicPackages = setOf(
            "com.tencent.qqmusic",
            "com.netease.cloudmusic",
            "com.spotify.music"
        )
        
        // 1. 包名匹配
        if (musicPackages.contains(packageName)) return true
        
        // 2. MediaSession 检测
        if (hasMediaSession(sbn)) return true
        
        // 3. Category 检测
        return sbn.notification.category == Notification.CATEGORY_TRANSPORT
    }
    
    private fun hasMediaSession(sbn: StatusBarNotification): Boolean {
        val extras = sbn.notification.extras
        val mediaSession = extras.getParcelable<Parcelable>(
            Notification.EXTRA_MEDIA_SESSION
        )
        return mediaSession is MediaSession.Token
    }
}
```

## 四、UI 组件设计

### 4.1 紧凑形态 (Compact)

```kotlin
@Composable
private fun CompactIsland(uiState: DynamicIslandUiState) {
    val width by animateDpAsState(
        targetValue = when {
            uiState.progress > 0 -> 160.dp  // 下载进度
            uiState.notification != null -> 120.dp  // 普通通知
            uiState.isMusicPlaying -> 120.dp  // 音乐
            else -> 80.dp  // 最小
        },
        animationSpec = spring(stiffness = Spring.StiffnessMedium)
    )
    
    Box(
        modifier = Modifier
            .width(width)
            .height(32.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.Black)
    ) {
        // 根据状态显示不同内容
    }
}
```

### 4.2 展开形态 (Expanded)

```kotlin
@Composable
private fun ExpandedIsland(uiState: DynamicIslandUiState) {
    val width by animateDpAsState(targetValue = 300.dp)
    val height by animateDpAsState(targetValue = 80.dp)
    val cornerRadius by animateDpAsState(targetValue = 24.dp)
    
    Box(
        modifier = Modifier
            .width(width)
            .height(height)
            .clip(RoundedCornerShape(cornerRadius))
            .background(Color.Black)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // 应用图标 + 标题 + 内容
            // 操作按钮（关闭、展开详情）
        }
    }
}
```

### 4.3 音乐播放形态

```kotlin
@Composable
fun MusicPlayingIsland(
    title: String,
    artist: String,
    isPlaying: Boolean,
    onPlayPause: () -> Unit
) {
    Box(
        modifier = Modifier
            .width(220.dp)
            .height(48.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.Black)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // 专辑封面
            Box(modifier = Modifier.size(36.dp).clip(CircleShape)) {
                Icon(Icons.Default.MusicNote)
            }
            
            // 歌曲信息
            Column(modifier = Modifier.weight(1f)) {
                Text(title, fontSize = 13.sp)
                Text(artist, fontSize = 11.sp, alpha = 0.6f)
            }
            
            // 播放/暂停按钮
            IconButton(onClick = onPlayPause) {
                Icon(
                    imageVector = if (isPlaying) Icons.Default.Pause else Icons.Default.PlayArrow
                )
            }
        }
    }
}
```

## 五、WindowManager 悬浮窗实现

### 5.1 关键配置

```kotlin
val layoutParams = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,  // Android 8+ 必须用 OVERLAY
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or
            WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
    PixelFormat.TRANSLUCENT
).apply {
    gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
    y = statusBarHeight + 8  // 状态栏高度 + 间距
}

windowManager.addView(composeView, layoutParams)
```

### 5.2 生命周期管理

```kotlin
class DynamicIslandOverlayService : Service(), 
    LifecycleOwner, 
    SavedStateRegistryOwner, 
    ViewModelStoreOwner {
    
    override fun onCreate() {
        lifecycleRegistry.currentState = Lifecycle.State.CREATED
        setupComposeView()
        startForeground(NOTIFICATION_ID, notification)
    }
    
    override fun onStartCommand(): Int {
        lifecycleRegistry.currentState = Lifecycle.State.STARTED
        attachToWindow()
        lifecycleRegistry.currentState = Lifecycle.State.RESUMED
        return START_STICKY
    }
    
    override fun onDestroy() {
        lifecycleRegistry.currentState = Lifecycle.State.DESTROYED
        detachFromWindow()
        super.onDestroy()
    }
}
```

## 六、参考与改进方向

### 6.1 当前项目优势

✅ **架构清晰**：MVVM + Hilt 依赖注入
✅ **UI 现代化**：完全使用 Jetpack Compose
✅ **构建成功**：已验证可打包 APK
✅ **通知处理**：完整的优先级和分类系统

### 6.2 需要改进的地方

| 方向 | 当前实现 | 改进目标 |
|------|---------|---------|
| 动画流畅度 | 基础 spring | 参考 sinasamaki 的精细化动画 |
| 音乐控制 | 简单 UI | 集成 MediaSession 真实控制 |
| 下载进度 | 显示进度 | 真实的 DownloadManager 监听 |
| 配置界面 | 基础 | 参考 HyperCeiler 的完整配置 |
| 多设备适配 | 单一 | 添加平板/折叠屏适配 |

### 6.3 优先级计划

**P0（必须）**:
1. 完善 MediaSession 媒体控制集成
2. 实现真实的 DownloadManager 进度监听
3. 真机测试验证

**P1（重要）**:
1. 动画效果优化
2. 配置界面完善
3. 多版本 Android 兼容

**P2（优化）**:
1. APK 大小优化（当前 57MB）
2. 性能优化
3. 深色/浅色主题适配

## 七、总结

通过分析三个优秀的开源项目，我学到了：

1. **JetIsland** 展示了 Jetpack Compose 实现灵动岛的基础架构
2. **HyperCeiler** 展示了企业级 LSPosed 模块的完整设计
3. **sinasamaki** 展示了精细的动画设计理念

将这些知识应用到自己的项目后，项目的架构已经相对完善。下一步的重点是：
- 真机测试验证功能
- 完善媒体控制集成
- 优化动画效果

---

> 💡 **学习资源**:
> - JetIsland: https://github.com/cengiztoru/JetIsland_Dynamic-Island-Jetpack-Compose
> - HyperCeiler: https://github.com/ReChronoRain/HyperCeiler
> - LSPosed: https://github.com/LSPosed/LSPosed
