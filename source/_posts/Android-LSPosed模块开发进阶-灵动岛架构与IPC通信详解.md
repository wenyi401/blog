# Android 灵动岛 / Dynamic Island Xposed 模块开发进阶笔记

> 📅 学习日期: 2026-04-05
> 🔧 项目状态: BUILD SUCCESSFUL ✅
> 📦 APK: `app/build/outputs/apk/debug/app-debug.apk`

---

## 一、核心概念回顾

### 1.1 什么是灵动岛（Dynamic Island）

灵动岛是苹果 iPhone 14 Pro 引入的交互设计，将前置摄像头区域"药丸化"，通过软件让这个区域变成可交互的信息展示区。后来小米 HyperOS 也实现了类似功能（叫"超级岛"或"灵动岛"）。

**核心特点：**
- 将通知、音乐、下载等信息以紧凑形态展示在状态栏
- 点击展开显示完整内容
- 支持快捷操作（播放/暂停、关闭等）

### 1.2 Xposed vs LSPosed

| 对比项 | Xposed (传统) | LSPosed (现代) |
|--------|---------------|----------------|
| 注入方式 | Riru (替换 zygote) | Zygisk (注入 zygote 进程) |
| 资源 Hook | 支持 | **不支持** |
| 资源占用 | 较大 | 较小 |
| 隐蔽性 | 一般 | 更好 |
| 兼容性 | 一般 | 更广 |
| 现状 | 停止维护 | 活跃维护 |

### 1.3 LSPosed 核心限制

```
✅ Method Hook (IXposedHookLoadPackage)    - 可用
❌ Resource Hook (IXposedHookInitPackageResources) - 不可用
❌ Package-level Hook (IXposedHookInitPackageResources) - 不可用
```

**资源 Hook 替代方案：**
1. Magisk 资源替换模块（直接替换 system 分区资源）
2. 运行时通过反射修改 View 属性
3. 使用 `substrate`/`frida` 等其他框架

---

## 二、当前项目架构详解

### 2.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     LSPosed Framework                         │
│                   (Zygisk Injection)                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    SystemUI / MIUI SystemUI                  │
│                                                              │
│  ┌──────────────┐    ┌────────────────┐    ┌────────────┐  │
│  │ MainHook     │───▶│Notification    │───▶│ IPC Broadcast│
│  │ (Hook入口)   │    │ Handler        │    │ (跨进程通信) │  │
│  └──────────────┘    └────────────────┘    └─────┬──────┘  │
└──────────────────────────────────────────────────┼───────────┘
                                                   │
                           ┌───────────────────────┼───────────┐
                           │                       │           │
                           ▼                       ▼           ▼
                    ┌────────────┐         ┌───────────┐ ┌─────────┐
                    │Notif       │         │Overlay    │ │Config   │
                    │Listener    │         │Service    │ │Store    │
                    │Service     │         │(悬浮窗)    │ │         │
                    └────────────┘         └─────┬─────┘ └─────────┘
                                                │
                          ┌─────────────────────┼─────────────────┐
                          │                     │                  │
                          ▼                     ▼                  ▼
                   ┌────────────┐        ┌───────────┐       ┌─────────┐
                   │ ViewModel  │◀───────│  Compose  │       │ Data    │
                   │            │        │   UI      │       │ Store   │
                   └────────────┘        └───────────┘       └─────────┘
```

### 2.2 核心模块职责

#### Hook 层 (`hook/`)

**MainHook.kt** - LSPosed 模块入口
- 实现 `IXposedHookLoadPackage` 接口
- 监听目标应用加载时自动执行
- 遍历多个可能的类名（兼容不同系统版本）
- 通过广播与悬浮窗服务通信

**NotificationHandler.kt** - 通知处理核心
- `shouldShowInIsland()` - 判断是否显示
- `getNotificationPriority()` - 计算优先级
- `extractNotificationInfo()` - 提取通知信息
- 支持音乐、下载、IM、导航等多种通知类型

**关键代码示例：**

```kotlin
fun shouldShowInIsland(sbn: StatusBarNotification): Boolean {
    // 1. 排除系统黑名单
    if (SYSTEM_BLACKLIST.contains(sbn.packageName)) return false
    
    // 2. 排除游戏类应用
    if (isGamePackage(sbn.packageName)) return false
    
    // 3. 排除测试/开发包
    if (isTestPackage(sbn.packageName)) return false
    
    // 4. 检查通知渠道重要性
    if (!hasSufficientImportance(sbn)) return false
    
    return true
}
```

#### 服务层 (`service/`)

**DynamicIslandNotificationService.kt** - NotificationListenerService
- 系统级通知监听权限
- 拦截所有通知
- 按优先级过滤
- 与 OverlayService 协同工作

**DynamicIslandOverlayService.kt** - 悬浮窗服务
- `TYPE_APPLICATION_OVERLAY` 显示层级
- Compose UI 渲染
- 生命周期管理
- 广播接收器（IPC）

```kotlin
// 悬浮窗布局参数
val layoutParams = WindowManager.LayoutParams(
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.WRAP_CONTENT,
    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY, // 关键！
    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
    PixelFormat.TRANSLUCENT
).apply {
    gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
    y = getStatusBarHeight() + 8
}
```

#### UI 层 (`ui/`)

**DynamicIslandUi.kt** - 灵动岛 Compose 组件
- `HyperDynamicIsland` - 主组件
- `CompactIsland` - 紧凑状态
- `ExpandedIsland` - 展开状态
- `MinimalIsland` - 最小化状态

**状态机：**

```kotlin
sealed class DynamicIslandState {
    data object Hidden    // 完全隐藏
    data object Compact   // 紧凑形态：单点 + 图标
    data object Expanded  // 展开形态：完整卡片
    data object Minimal   // 最小化：小圆点
}
```

---

## 三、IPC 通信方案对比

### 3.1 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| BroadcastReceiver | 简单，兼容性好 | 延迟，不可靠 | 简单状态同步 |
| ContentProvider | 结构化，高效 | 实现复杂 | 配置共享 |
| LocalSocket | 实时，可靠 | 实现最复杂 | 高频数据 |

### 3.2 当前项目使用的方案

当前项目使用 **BroadcastReceiver** 方案：

```kotlin
// Hook 进程发送广播
val intent = Intent(ACTION_SHOW_NOTIFICATION).apply {
    putExtra(EXTRA_TITLE, title)
    putExtra(EXTRA_TEXT, text)
    putExtra(EXTRA_PACKAGE, packageName)
    setPackage(modulePackageName)
}
context.sendBroadcast(intent)

// 悬浮窗服务接收广播
private fun registerNotificationReceiver() {
    broadcastReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context?, intent: Intent?) {
            when (intent?.action) {
                DynamicIslandConstants.ACTION_SHOW_NOTIFICATION -> {
                    handleShowNotification(intent)
                }
                DynamicIslandConstants.ACTION_HIDE_NOTIFICATION -> {
                    viewModel.hide()
                }
            }
        }
    }
    // 注册广播接收器
    registerReceiver(broadcastReceiver, filter, RECEIVER_NOT_EXPORTED)
}
```

### 3.3 ContentProvider 改进方案（推荐）

对于更可靠的通知同步，可以使用 ContentProvider：

```kotlin
// 在模块中创建 ContentProvider
class DynamicIslandProvider : ContentProvider() {
    
    private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
        addURI("com.example.dynamicislandxposed.provider", "notification", 1)
        addURI("com.example.dynamicislandxposed.provider", "config", 2)
    }
    
    override fun query(uri: Uri, projection: Array<String>?, ...): Cursor? {
        return when (uriMatcher.match(uri)) {
            1 -> queryNotifications()
            else -> null
        }
    }
}
```

---

## 四、通知优先级系统

### 4.1 优先级计算

```kotlin
fun getNotificationPriority(sbn: StatusBarNotification): Int {
    var basePriority = 50
    
    // 正在进行的通知优先级提升
    if (notification.flags and Notification.FLAG_ONGOING_EVENT != 0) {
        basePriority += 20
    }
    
    return when {
        // 音乐类通知最高优先级
        isMusicNotification(sbn) -> 100
        
        // 来电/通话
        notification.category == Notification.CATEGORY_CALL -> 95
        
        // 闹钟/计时器
        notification.category == Notification.CATEGORY_ALARM -> 85
        
        // 下载进度
        isDownloadNotification(sbn) -> 90
        
        // IM/社交通讯
        PRIORITY_PACKAGES.contains(packageName) && isImNotification(sbn) -> 80
        
        else -> basePriority.coerceIn(0, 100)
    }
}
```

### 4.2 高优先级应用列表

```kotlin
private val PRIORITY_PACKAGES = setOf(
    "com.tencent.mm",           // 微信
    "com.tencent.mobileqq",     // QQ
    "com.alibaba.android.rim",  // 淘宝
    "com.sankuai.meituan",      // 美团
    "com.didi.driver",          // 滴滴司机
    "com.sg.movie",             // 哔哩哔哩
    "com.android.vending",      // Google Play
    "org.telegram.messenger",   // Telegram
    "com.whatsapp",             // WhatsApp
    "com.discord",              // Discord
    "com.alipay.payment"        // 支付宝
)
```

### 4.3 音乐应用识别

```kotlin
private val MUSIC_PACKAGES = setOf(
    "com.tencent.qqmusic",      // QQ音乐
    "com.netease.cloudmusic",   // 网易云音乐
    "com.kugou.android",        // 酷狗
    "com.kuwo.player",          // 酷我
    "com.spotify.music",         // Spotify
    "cn.woozw.music",           // 汽水音乐
    "com.pocketown.music"       // 波点音乐
)

private fun isMusicNotification(sbn: StatusBarNotification): Boolean {
    val packageName = sbn.packageName
    
    // 1. 预定义音乐应用
    if (MUSIC_PACKAGES.contains(packageName)) return true
    
    // 2. MediaSession 检测
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.KITKAT_WATCH) {
        val mediaSession = sbn.notification.extras.getParcelable<Parcelable>(
            Notification.EXTRA_MEDIA_SESSION
        )
        if (mediaSession is MediaSession.Token) return true
    }
    
    // 3. 通知类别为 media
    return sbn.notification.category == Notification.CATEGORY_TRANSPORT
}
```

---

## 五、LSPosed Module 配置详解

### 5.1 module.prop

```properties
# 模块基本信息
name=HyperDynamicIsland
version=1.0.0
versionCode=1
author=wenyi401
description=HyperOS 风格灵动岛增强模块

# API 版本要求
minApiVersion=93     # LSPosed 1.9+
targetApiVersion=105  # Android 14+
staticScope=false     # 允许用户自定义扩展作用域
```

### 5.2 scope.list

```
# AOSP SystemUI - 核心通知拦截
com.android.systemui

# MIUI/HyperOS SystemUI - 小米设备
com.miui.systemui

# 下载管理器
com.android.providers.downloads

# MIUI 设置
com.xiaomi.misettings
```

### 5.3 xposed_init

```
# 入口类（支持多入口）
com.example.dynamicislandxposed.hook.ModernMainHook
com.example.dynamicislandxposed.hook.MainHook
```

### 5.4 AndroidManifest.xml 关键配置

```xml
<!-- Xposed 模块元数据 -->
<meta-data
    android:name="xposedmodule"
    android:value="true" />
<meta-data
    android:name="xposeddescription"
    android:value="HyperOS 灵动岛增强模块" />
<meta-data
    android:name="xposedminversion"
    android:value="82" />
<meta-data
    android:name="xposedscope"
    android:resource="@array/xposed_scope" />

<!-- 通知监听服务 -->
<service
    android:name=".service.DynamicIslandNotificationService"
    android:permission="android.permission.BIND_NOTIFICATION_LISTENER_SERVICE"
    android:exported="true">
    <intent-filter>
        <action android:name="android.service.notification.NotificationListenerService" />
    </intent-filter>
</service>

<!-- 悬浮窗服务 -->
<service
    android:name=".service.DynamicIslandOverlayService"
    android:foregroundServiceType="specialUse"
    android:exported="false" />
```

---

## 六、常见问题与解决方案

### 6.1 LSPosed Zygisk 不支持资源 Hook

**错误：**
```
Unresolved reference: XC_LayoutInflated
Unresolved reference: hookLayout
```

**解决：**
资源 Hook 在 Zygisk 下不可用。将 ResourceHook.kt 改为存根文件：

```kotlin
@Deprecated("LSPosed Zygisk 不支持资源 Hook，请使用 Magisk 模块替代方案")
object ResourceHook {
    // 资源 Hook 功能已禁用
}
```

替代方案：
1. Magisk 资源替换模块
2. 运行时反射修改 View
3. SystemOverlay 方式

### 6.2 动画函数返回值类型

**错误：**
```
Return type mismatch: expected 'Dp', actual 'State<Dp>'
```

**解决：**
`animateDpAsState()` 返回 `State<Dp>`，需要 `.value` 解包：

```kotlin
@Composable
fun expandedWidth(state: IslandState): Dp {
    return animateDpAsState(
        targetValue = target,
        animationSpec = spring(
            dampingRatio = Spring.DampingRatioHighBouncy,
            stiffness = Spring.StiffnessMedium
        )
    ).value // ← 添加 .value
}
```

### 6.3 Service 实现多个 Owner 接口

**错误：**
```
Conflicting declarations: val viewModelStore
```

**解决：**
让 Service 同时实现 `ViewModelStoreOwner`：

```kotlin
@AndroidEntryPoint
class DynamicIslandOverlayService : Service(), 
    LifecycleOwner, 
    SavedStateRegistryOwner, 
    ViewModelStoreOwner { // ← 添加此接口
    
    private val vmStore = ViewModelStore()
    
    override val viewModelStore: ViewModelStore
        get() = vmStore
}
```

### 6.4 compileSdk 35 警告

**警告：**
```
We recommend using a newer Android Gradle plugin to use compileSdk = 35
This Android Gradle plugin (8.5.2) was tested up to compileSdk = 34.
```

**解决：**
在 `gradle.properties` 添加：

```properties
android.suppressUnsupportedCompileSdk=35
```

---

## 七、开源项目参考

### 7.1 成熟项目

| 项目 | 描述 | 地址 |
|------|------|------|
| HyperCeiler | 最完整的 HyperOS 增强模块 | github.com/Xposed-Modules-Repo/com.sevtinge.hyperceiler |
| HyperIsland | Flutter 实现的 HyperOS 灵动岛 | github.com/1812z/HyperIsland |
| LSPosed | LSPosed 框架本身 | github.com/LSPosed/LSPosed |

### 7.2 HyperCeiler 架构学习

HyperCeiler 是目前最成熟的 HyperOS 增强模块，其架构特点：

1. **多进程 Hook**：分别在 SystemUI、Settings 等进程中 Hook
2. **ContentProvider IPC**：使用 ContentProvider 进行配置共享
3. **PreferenceFragment**：原生设置界面
4. **模块化设计**：每个功能独立模块，便于维护

### 7.3 HyperIsland 实现细节

HyperIsland 是一个纯 Flutter 实现的替代方案：

```dart
// Flutter 构建命令
flutter build apk --target-platform=android-arm64
```

其优点：
- 跨平台代码复用
- 声明式 UI
- 热重载开发

缺点：
- 性能开销比原生 Compose 大
- 不能真正 Hook 系统 API（需要 LSPosed + Flutter 结合）

---

## 八、下一步改进计划

### 高优先级
- [ ] **ContentProvider IPC 实现**：替代广播，提高通知同步可靠性
- [ ] **MediaSession 集成**：完善音乐播放控制
- [ ] **真机测试**：LSPosed 设备上实际测试

### 中优先级
- [ ] **多通知切换**：左右滑动切换不同通知
- [ ] **通知操作按钮**：Reply、Action 等
- [ ] **主题定制**：颜色、圆角可配置

### 低优先级
- [ ] **下载进度动画优化**：更流畅的进度展示
- [ ] **国际化**：英文界面支持
- [ ] **抗检测优化**：防止被检测为 Xposed 模块

---

## 九、构建验证

```
✅ BUILD SUCCESSFUL in 18s
42 actionable tasks: 42 up-to-date

APK 位置: app/build/outputs/apk/debug/app-debug.apk
APK 大小: ~57MB
```

### 构建环境

| 组件 | 版本 |
|------|------|
| JDK | OpenJDK 17.0.13 |
| Gradle | 8.7 |
| AGP | 8.5.2 |
| Kotlin | 2.0.21 |
| compileSdk | 35 |
| minSdk | 30 |

---

## 十、总结

今天的学习和实践让我对 Android Xposed/LSPosed 模块开发有了更深入的理解：

1. **架构设计**：从简单的 Hook 到完整的通知处理流程
2. **IPC 通信**：BroadcastReceiver、ContentProvider、LocalSocket 各有优劣
3. **Compose UI**：状态驱动的灵动岛 UI 实现
4. **LSPosed 限制**：Zygisk 下资源 Hook 不可用，需要替代方案

**核心经验：**
- LSPosed 模块开发的难点不在于 Hook，而在于进程间通信和状态同步
- 资源 Hook 被移除是最大的限制，需要通过其他方式弥补
- 成熟的参考项目（如 HyperCeiler）是最好的学习资料

---

> 💡 **参考链接**
> - LSPosed 官网: https://lsposed.org/
> - LSPosed GitHub: https://github.com/LSPosed/LSPosed
> - Xposed API: https://api.xposed.info/
> - 模块仓库: https://modules.lsposed.org/
