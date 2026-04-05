---
title: Android LSPosed 灵动岛模块进阶开发 - 2026 学习总结
date: 2026-04-05 11:30:00
categories:
  - Android开发
  - LSPosed模块
tags:
  - Android
  - Xposed
  - LSPosed
  - 灵动岛
  - Jetpack Compose
  - Kotlin
---

# LSPosed 灵动岛模块进阶开发 - 2026-04-05 学习总结

## 今日学习核心成果

### 项目构建状态
✅ **BUILD SUCCESSFUL** - Debug APK 成功构建 (57MB)

- 路径: `app/build/outputs/apk/debug/app-debug.apk`
- Gradle: 8.5
- Kotlin: 2.0.21
- Jetpack Compose BOM: 2024.09.00

---

## 一、Xposed vs LSPosed 核心差异深度解析

### 1.1 底层架构对比

| 特性 | Xposed | LSPosed |
|------|--------|---------|
| 注入方式 | Riru | Zygisk |
| 资源 Hook | ✅ 支持 | ❌ 不支持 |
| minApiVersion | 54+ | 93+ (Android 14+) |
| staticScope | ❌ 不支持 | ✅ 支持 |
| 模块隔离 | 较弱 | 强 (每个模块独立) |

### 1.2 关键差异

**Riru vs Zygisk:**
- Riru: 注入到 Zygote 进程，使用 `nativeForkAndSpecialize`
- Zygisk: 注入到 Zygote 进程，使用 `ZygiskRequest` 机制，更干净

**资源 Hook 在 Zygisk 下不可用:**
```kotlin
// ❌ Zygisk 下不可用
XposedHelpers.findAndHookMethod("com.android.systemui.R$layout", ...) 

// ✅ 替代方案：修改资源 XML 或使用副本
// 在模块资源目录下放置同名资源文件
```

**staticScope 配置:**
```xml
<!-- LSPosed 特有的作用域优化 -->
<meta-data
    android:name="staticScope"
    android:value="true" />
```
启用后，Hook 只在声明的包内生效，提高性能。

---

## 二、灵动岛实现核心架构

### 2.1 三层架构设计

```
┌─────────────────────────────────────────────────────┐
│                    Hook 层                          │
│  MainHook.kt / ModernMainHook.kt                   │
│  - IXposedHookLoadPackage                          │
│  - SystemUI / MIUI SystemUI Hook                  │
└─────────────────┬───────────────────────────────────┘
                  │ 广播/IPC
┌─────────────────▼───────────────────────────────────┐
│                  服务层                             │
│  DynamicIslandNotificationService.kt                │
│  - NotificationListenerService                      │
│  - 通知拦截、过滤、优先级判断                        │
└─────────────────┬───────────────────────────────────┘
                  │ StateFlow
┌─────────────────▼───────────────────────────────────┐
│                  UI 层                             │
│  DynamicIslandOverlayService.kt                    │
│  - TYPE_APPLICATION_OVERLAY                        │
│  - Jetpack Compose UI                              │
└─────────────────────────────────────────────────────┘
```

### 2.2 通知优先级系统

```kotlin
// 优先级分层 (0-100)
音乐播放:     100 (最高)
下载进度:      90
来电/通话:     95
闹钟/计时器:   85
导航应用:      80
高优先级 IM:   80
普通通知:      40-60
营销通知:      5-10
```

### 2.3 IPC 通信方案对比

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| BroadcastReceiver | 简单 | 不可靠、延迟 | ⭐⭐ |
| ContentProvider | 结构化、可靠 | 稍复杂 | ⭐⭐⭐⭐ |
| LocalSocket | 实时性最好 | 最复杂 | ⭐⭐⭐⭐⭐ |
| XSharedPreferences | 配置共享 | 非实时 | ⭐⭐⭐ |

---

## 三、SystemUI Hook 核心类参考

### 3.1 AOSP SystemUI Hook 点

| 类名 | 作用 | Hook 方法 |
|------|------|----------|
| NotificationPanelView | 通知面板 | setExpanded, onNotificationClicked |
| NotificationStackScrollLayout | 通知列表 | addNotification, removeNotification |
| ExpandableNotificationRow | 单条通知 | setExpanded, onNotificationClick |
| StatusBarIconController | 状态栏图标 | setIcon, removeIcon |
| PhoneWindowManager | 窗口管理 | getTopFocusedWindow |

### 3.2 MIUI/HyperOS 特有类

| 类名 | 作用 |
|------|------|
| MiuiDynamicIsland | MIUI 灵动岛核心 |
| MiuiDynamicIslandManager | 灵动岛管理器 |
| MiuiIslandAnalytics | 灵动岛数据分析 |
| NotificationPanelView (MIUI) | MIUI 通知面板 |

---

## 四、开源项目架构学习

### 4.1 HyperCeiler (最完整参考)

**架构特点:**
- 模块化设计：每个功能独立注册
- 精细化 Hook：按 Android 版本选择正确类
- ContentProvider IPC：可靠的跨进程通信
- XSharedPreferences：配置持久化

### 4.2 其他参考项目

| 项目 | 特点 |
|------|------|
| HyperIsland | Flutter 超级岛样式 |
| MaterialYou-Dynamic-Island | Jetpack Compose 插件化 |
| LSPosed Core | 框架本身 |

---

## 五、项目改进建议

### 5.1 高优先级改进

1. **ContentProvider IPC**
   - 替代广播实现更可靠的进程间通信
   - 定义 Uri: `content://com.example.dynamicislandxposed.provider/notifications`

2. **MediaSession 集成**
   - 完善音乐播放通知的媒体控制按钮
   - 支持 MediaSession.Token 获取当前播放信息

3. **真机测试**
   - Hook 实际运行验证
   - 不同 Android 版本兼容性测试

### 5.2 中优先级改进

1. **多通知切换** - 左右滑动切换不同通知
2. **通知操作按钮** - Reply 快捷回复、Action 按钮点击
3. **主题定制** - 深色/浅色主题、自定义颜色

---

## 六、关键代码片段

### 6.1 通知监听服务

```kotlin
@AndroidEntryPoint
class DynamicIslandNotificationService : NotificationListenerService() {
    
    companion object {
        private val _currentNotification = MutableStateFlow<DynamicIslandNotification?>(null)
        val currentNotification: StateFlow<DynamicIslandNotification?> = _currentNotification.asStateFlow()
    }
    
    override fun onNotificationPosted(sbn: StatusBarNotification?) {
        sbn ?: return
        
        if (notificationHandler.shouldShowInIsland(sbn)) {
            val notification = sbn.toDynamicIslandNotification()
            // 优先级判断后更新
            if (currentNotification.value == null || 
                getPriority(notification) > getPriority(currentNotification.value!!)) {
                _currentNotification.value = notification
            }
        }
    }
}
```

### 6.2 悬浮窗服务核心

```kotlin
@AndroidEntryPoint
class DynamicIslandOverlayService : Service(), LifecycleOwner {
    
    private lateinit var composeView: ComposeView
    
    private fun attachToWindow() {
        val layoutParams = WindowManager.LayoutParams(
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.WRAP_CONTENT,
            WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,
            WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or
                    WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,
            PixelFormat.TRANSLUCENT
        ).apply {
            gravity = Gravity.TOP or Gravity.CENTER_HORIZONTAL
            y = getStatusBarHeight() + 8
        }
        windowManager.addView(composeView, layoutParams)
    }
}
```

### 6.3 Hook 入口

```kotlin
class MainHook : IXposedHookLoadPackage {
    
    override fun handleLoadPackage(lpparam: XC_LoadPackage.LoadPackageParam) {
        when (lpparam.packageName) {
            TARGET_SYSTEM_UI -> hookSystemUI(lpparam)
            TARGET_MIUI_SYSTEM_UI -> hookMiuiSystemUI(lpparam)
        }
    }
}
```

---

## 七、参考资源

| 项目 | 地址 | 用途 |
|------|------|------|
| LSPosed Core | github.com/LSPosed/LSPosed | 框架本身 |
| HyperCeiler | github.com/LonelyBurger/HyperCeiler-R1 | 完整参考 |
| Vector | github.com/JingMatrix/Vector | Modern Xposed |
| LSPosed Module Repo | modules.lsposed.org | 模块市场 |

---

_学习日期: 2026-04-05_
_项目: DynamicIslandXposed_
_GitHub: https://github.com/wenyi401/DynamicIslandXposed_
