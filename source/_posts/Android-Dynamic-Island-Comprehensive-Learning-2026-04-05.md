# Android 灵动岛 Xposed 模块开发 - 综合学习笔记 2026-04-05

> 学习时间：2026-04-05 16:30
> 状态：✅ 项目构建成功，笔记整理推送中

---

## 一、项目构建验证

### 1.1 构建命令

```bash
cd /home/node/.openclaw/workspace/android-projects/DynamicIslandXposed

export JAVA_HOME=/home/node/.openclaw/workspace/java/jdk-17.0.13+11
export ANDROID_HOME=/home/node/.openclaw/workspace/android-sdk

./gradlew clean assembleDebug
```

### 1.2 构建结果

```
BUILD SUCCESSFUL in 5s
43 actionable tasks: 17 executed, 25 from cache, 1 up-to-date

APK: app/build/outputs/apk/debug/app-debug.apk
```

---

## 二、Xposed/LSPosed 框架核心原理

### 2.1 框架对比

| 特性 | Xposed | LSPosed | LSPosed (Zygisk) |
|------|--------|---------|------------------|
| 启动方式 | Zygote Fork | Zygote Fork | Zygote Fork (Zygisk) |
| 作用域 | 全局 | 模块作用域 | 模块作用域 |
| 隐藏性 | 较差 | 更好 | 最佳 |
| ART 兼容 | 一般 | 更好 | 最佳 |
| 8.0+ 支持 | 需修改 | 原生支持 | 原生支持 |
| Riru vs Zygisk | Riru | Riru | Zygisk |

### 2.2 核心接口

```kotlin
// 1. 加载包时 Hook（Hook 应用代码）
class MainHook : IXposedHookLoadPackage {
    override fun handleLoadPackage(lpparam: XC_LoadPackage.LoadPackageParam) {
        // lpparam.packageName - 目标包名
        // lpparam.classLoader - 类加载器
        // lpparam.processName - 进程名
        // lpparam.appInfo - 应用信息
        
        when (lpparam.packageName) {
            "com.android.systemui" -> {
                // Hook SystemUI
            }
        }
    }
}

// 2. 初始化包资源（替换 APK 资源）
class ResourceHook : IXposedHookInitPackageResources {
    override fun handleInitPackageResources(resparam: XC_LoadPackage.InitPackageResourcesParam) {
        // 可修改 APK 内资源
    }
}
```

### 2.3 方法 Hook

```kotlin
// 同步 Hook - 在方法执行后获取结果
XposedHelpers.findAndHookMethod(
    "com.android.systemui.statusbar.phone.StatusBar",
    lpparam.classLoader,
    "makeStatusBarView",
    object : XC_MethodHook() {
        override fun afterHookedMethod(param: MethodHookParam) {
            val statusBar = param.thisObject
            val result = param.result
        }
    }
)

// 替换方法实现
XposedHelpers.findAndHookMethod(
    "android.app.NotificationManager",
    lpparam.classLoader,
    "notify",
    Int::class.java,
    Notification::class.java,
    object : XC_MethodReplacement() {
        override fun replaceHookedMethod(param: MethodHookParam): Any? {
            // 完全替换原方法逻辑
            return null
        }
    }
)

// 监听方法调用（不修改）
XposedHelpers.findAndHookMethod(
    clazz,
    "methodName",
    object : XC_MethodHook() {
        override fun beforeHookedMethod(param: MethodHookParam) {
            // 方法调用前执行
        }
        override fun afterHookedMethod(param: MethodHookParam) {
            // 方法调用后执行
        }
    }
)
```

### 2.4 构造器 Hook

```kotlin
XposedHelpers.findAndHookConstructor(
    "com.example.ClassName",
    lpparam.classLoader,
    Int::class.java,
    String::class.java,
    object : XC_MethodHook() {
        override fun afterHookedMethod(param: MethodHookParam) {
            val instance = param.thisObject
            val arg1 = param.args[0] as Int
            val arg2 = param.args[1] as String
        }
    }
)
```

---

## 三、灵动岛实现方案

### 3.1 方案对比

| 方案 | 原理 | 优点 | 缺点 | 代表项目 |
|------|------|------|------|---------|
| Hook SystemUI | 直接修改通知系统 | 功能完整 | 版本适配复杂 | HyperCeiler |
| TYPE_APPLICATION_OVERLAY | 悬浮窗覆盖 | 实现简单 | 无法获取某些通知数据 | 本项目 |
| NotificationListenerService | 官方 API | 官方支持 | 功能受限 | Domi-Island |
| MIUI 官方 API | 调用系统 API | 原生体验 | 需适配 MIUI | 系统自带 |

### 3.2 本项目架构

```
┌──────────────────────────────────────────────────────────────┐
│                     LSPosed Framework                         │
├──────────────────────────────────────────────────────────────┤
│  MainHook.kt                                                 │
│  ├── handleLoadPackage()                                    │
│  │   └── Hook NotificationInterceptorService                │
│  └── NotificationInterceptorHook.kt                         │
│      └── 捕获通知 posting/removing 事件                       │
├──────────────────────────────────────────────────────────────┤
│  IPC: Broadcast / ContentProvider                          │
├──────────────────────────────────────────────────────────────┤
│  DynamicIslandNotificationService                           │
│  ├── NotificationListenerService                            │
│  └── 接收系统通知，通过广播发送到 OverlayService             │
├──────────────────────────────────────────────────────────────┤
│  DynamicIslandOverlayService                               │
│  ├── TYPE_APPLICATION_OVERLAY 悬浮窗                       │
│  ├── ForegroundService 保活                                 │
│  └── Jetpack Compose 渲染灵动岛 UI                         │
├──────────────────────────────────────────────────────────────┤
│  HyperDynamicIsland (Compose UI)                            │
│  ├── Compact - 紧凑形态                                     │
│  ├── Expanded - 展开形态                                    │
│  ├── Minimal - 最小化形态                                    │
│  └── 动画过渡                                               │
└──────────────────────────────────────────────────────────────┘
```

### 3.3 悬浮窗服务实现

```kotlin
@AndroidEntryPoint
class DynamicIslandOverlayService : Service(), LifecycleOwner {
    
    private lateinit var windowManager: WindowManager
    private lateinit var composeView: ComposeView
    
    override fun onCreate() {
        super.onCreate()
        
        windowManager = getSystemService(WINDOW_SERVICE) as WindowManager
        
        composeView = ComposeView(this).apply {
            setContent {
                HyperDynamicIsland(
                    state = uiState,
                    onExpand = { /* 展开 */ },
                    onCollapse = { /* 收起 */ }
                )
            }
        }
        
        val params = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            layoutInDisplayCutoutMode = LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
        }
        
        windowManager.addView(composeView, params)
    }
}
```

---

## 四、通知拦截与处理

### 4.1 关键 Hook 点

| Android 版本 | 核心类 | Hook 方法 |
|-------------|--------|----------|
| 12+ | NotificationInterceptorService | onNotificationPosted, onNotificationRemoved |
| 11- | NotificationPresenter | setHeadsUp, onNotificationClick |
| 10+ | NotificationStackScrollLayout | addNotification, removeNotification |
| 全版本 | ExpandableNotificationRow | setExpanded, onNotificationClick |
| 全版本 | StatusBarIconController | setIcon |

### 4.2 通知过滤规则

```kotlin
// 排除规则
private fun shouldShowInIsland(sbn: StatusBarNotification): Boolean {
    val packageName = sbn.packageName
    
    // 1. 排除系统包
    if (isSystemPackage(packageName)) return false
    
    // 2. 排除游戏
    if (packageName.contains("game", ignoreCase = true)) return false
    
    // 3. 排除测试包
    if (packageName.startsWith("com.example.") ||
        packageName.startsWith("test.") ||
        packageName.startsWith("debug.")) return false
    
    // 4. 检查高优先级应用
    val highPriorityApps = setOf(
        "com.tencent.mm",        // 微信
        "com.tencent.mobileqq",  // QQ
        "com.alipay",            // 支付宝
        "com.netease.cloudmusic" // 网易云音乐
    )
    
    return packageName in highPriorityApps || isMusicPackage(packageName)
}

private fun isMusicPackage(packageName: String): Boolean {
    val musicPackages = setOf(
        "com.tencent.qqmusic",
        "com.netease.cloudmusic",
        "com.kugou.android",
        "com.kuwo.player",
        "com.spotify.music"
    )
    return packageName in musicPackages
}
```

### 4.3 通知优先级

| 优先级 | 类型 | 示例 |
|--------|------|------|
| 100 | 音乐播放 | 网易云音乐、QQ音乐 |
| 90 | 下载进度 | 系统下载管理器 |
| 80 | 高优先级 | 微信、QQ、支付宝 |
| 60 | 普通应用 | 其他应用 |
| 40 | 低优先级 | 新闻、天气 |

---

## 五、Jetpack Compose 灵动岛 UI

### 5.1 状态定义

```kotlin
sealed class DynamicIslandState {
    data object Hidden : DynamicIslandState()
    data object Compact : DynamicIslandState()   // 单点 + 图标
    data object Expanded : DynamicIslandState()  // 完整卡片
    data object Minimal : DynamicIslandState()   // 小圆点
}
```

### 5.2 紧凑形态

```kotlin
@Composable
private fun CompactIsland(
    uiState: DynamicIslandUiState,
    onClick: () -> Unit
) {
    val width by animateDpAsState(
        targetValue = when {
            uiState.notification == null -> 80.dp
            uiState.progress > 0 -> 160.dp
            else -> 120.dp
        },
        animationSpec = spring(stiffness = Spring.StiffnessMedium)
    )

    Box(
        modifier = Modifier
            .width(width)
            .height(32.dp)
            .clip(RoundedCornerShape(16.dp))
            .background(Color.Black)
            .clickable(onClick = onClick),
        contentAlignment = Alignment.Center
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.Center
        ) {
            if (uiState.progress > 0) {
                CircularProgressIndicator(
                    progress = { uiState.progress },
                    modifier = Modifier.size(16.dp),
                    color = Color.White,
                    strokeWidth = 2.dp
                )
                Text(
                    text = "${(uiState.progress * 100).toInt()}%",
                    color = Color.White,
                    fontSize = 12.sp
                )
            } else if (uiState.notification != null) {
                Icon(
                    imageVector = Icons.Default.Notifications,
                    tint = Color.White,
                    modifier = Modifier.size(16.dp)
                )
                Text(
                    text = uiState.notification.title,
                    color = Color.White,
                    fontSize = 12.sp,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }
        }
    }
}
```

### 5.3 展开形态

```kotlin
@Composable
private fun ExpandedIsland(
    uiState: DynamicIslandUiState,
    onCollapse: () -> Unit,
    onClear: () -> Unit
) {
    Box(
        modifier = Modifier
            .width(300.dp)
            .height(80.dp)
            .clip(RoundedCornerShape(24.dp))
            .background(Color.Black)
            .clickable(onClick = onCollapse)
            .padding(16.dp)
    ) {
        Column {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .clip(CircleShape)
                            .background(Color.Gray),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            tint = Color.White
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text(
                            text = uiState.notification?.title ?: "通知",
                            color = Color.White,
                            fontSize = 14.sp,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = uiState.notification?.text ?: "",
                            color = Color.White.copy(alpha = 0.7f),
                            fontSize = 12.sp
                        )
                    }
                }
                IconButton(onClick = onClear) {
                    Icon(
                        imageVector = Icons.Default.Close,
                        tint = Color.White.copy(alpha = 0.7f)
                    )
                }
            }
        }
    }
}
```

---

## 六、MediaSession 媒体控制

### 6.1 MediaSessionManager

```kotlin
@Singleton
class MediaControlHelper @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    private var mediaController: MediaController? = null
    
    private val mediaControllerCallback = object : MediaController.Callback() {
        override fun onPlaybackStateChanged(state: PlaybackState?) {
            updateMediaInfo()
        }
        override fun onMetadataChanged(metadata: MediaMetadata?) {
            updateMediaInfo()
        }
    }
    
    fun initMediaController() {
        val mediaSessionManager = context.getSystemService(Context.MEDIA_SESSION_SERVICE) 
            as MediaSessionManager
        
        val componentName = ComponentName(context, MediaControlHelper::class.java)
        val activeSessions = mediaSessionManager.getActiveSessions(componentName)
        
        val controller = activeSessions
            .filter { it.playbackState?.state == PlaybackState.STATE_PLAYING ||
                      it.playbackState?.state == PlaybackState.STATE_PAUSED }
            .maxByOrNull { it.playbackState?.position ?: 0 }
        
        controller?.let {
            mediaController = it
            it.registerCallback(mediaControllerCallback)
            updateMediaInfo()
        }
    }
    
    fun sendPlayPause() {
        val event = KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
        mediaController?.dispatchMediaButtonEvent(event)
    }
    
    fun sendNext() {
        val event = KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_NEXT)
        mediaController?.dispatchMediaButtonEvent(event)
    }
}
```

### 6.2 MediaInfo 数据类

```kotlin
data class MediaInfo(
    val title: String,
    val artist: String,
    val album: String? = null,
    val duration: Long = 0,
    val position: Long = 0,
    val isPlaying: Boolean = false,
    val packageName: String = ""
) {
    fun formatDuration(): String {
        val seconds = duration / 1000
        val minutes = seconds / 60
        return "%d:%02d".format(minutes, seconds % 60)
    }
    
    fun getProgress(): Float {
        return if (duration > 0) position.toFloat() / duration else 0f
    }
}
```

---

## 七、电池状态监听

### 7.1 BatteryStateReceiver

```kotlin
@Singleton
class BatteryStateReceiver @Inject constructor(
    @ApplicationContext private val context: Context
) {
    
    data class BatteryInfo(
        val level: Int,
        val scale: Int,
        val isCharging: Boolean,
        val chargeType: Int,
        val batteryStatus: Int,
        val temperature: Float,
        val voltage: Int,
        val health: Int
    ) {
        val percent: Int get() = if (scale > 0) (level * 100) / scale else 0
        
        val chargeTypeName: String get() = when (chargeType) {
            PLUGGED_AC -> "交流电"
            PLUGGED_USB -> "USB"
            PLUGGED_WIRELESS -> "无线充电"
            else -> "未充电"
        }
    }
    
    fun batteryStatusFlow(): Flow<BatteryInfo> = callbackFlow {
        val receiver = object : BroadcastReceiver() {
            override fun onReceive(context: Context?, intent: Intent?) {
                parseBatteryIntent(intent)?.let { trySend(it) }
            }
        }
        
        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_BATTERY_CHANGED)
            addAction(Intent.ACTION_POWER_CONNECTED)
            addAction(Intent.ACTION_POWER_DISCONNECTED)
        }
        
        context.registerReceiver(receiver, filter)
        awaitClose { context.unregisterReceiver(receiver) }
    }
}
```

---

## 八、开源项目参考

### 8.1 HyperCeiler

**特点**：
- LSPosed 模块集合
- 精细化 Hook（按 Android 版本选择 Hook 点）
- ContentProvider IPC
- XSharedPreferences 配置

**借鉴点**：
- VersionCompat 版本兼容处理
- 完善的日志系统
- 抗检测优化

### 8.2 MaterialYou-Dynamic-Island

**特点**：
- Jetpack Compose + Material You
- 插件化架构
- 充电显示、媒体控制

**架构借鉴**：
```kotlin
interface DynamicIslandPlugin {
    val priority: Int
    fun canRender(notification: StatusBarNotification): Boolean
    @Composable
    fun Render(notification: StatusBarNotification)
}

object PluginRegistry {
    private val plugins = mutableListOf<DynamicIslandPlugin>()
    
    fun register(plugin: DynamicIslandPlugin) {
        plugins.add(plugin)
        plugins.sortByDescending { it.priority }
    }
}
```

---

## 九、项目待完善功能

### 高优先级
- [ ] MediaSession 播放控制完善
- [ ] 充电状态显示
- [ ] 多通知滑动切换
- [ ] 真机测试

### 中优先级
- [ ] 通知 Action 按钮支持
- [ ] 通知过滤配置界面
- [ ] 主题定制 UI

### 低优先级
- [ ] 国际化（英文界面）
- [ ] 抗检测优化
- [ ] 插件系统重构

---

## 十、关键文件索引

| 文件 | 作用 |
|------|------|
| MainHook.kt | LSPosed 入口，Hook SystemUI |
| NotificationInterceptorHook.kt | 通知拦截核心 |
| NotificationHandler.kt | 通知过滤和处理逻辑 |
| DynamicIslandNotificationService.kt | 通知监听服务 |
| DynamicIslandOverlayService.kt | 悬浮窗服务 |
| DynamicIslandUi.kt | Compose UI |
| DynamicIslandViewModel.kt | UI 状态管理 |
| MediaControlHelper.kt | 媒体控制 |
| BatteryStateReceiver.kt | 电池状态监听 |
| ModuleConfig.kt | 配置管理 |

---

*学习时间：2026-04-05 16:30*
*项目状态：✅ 构建成功*
*博客推送：待完成*
