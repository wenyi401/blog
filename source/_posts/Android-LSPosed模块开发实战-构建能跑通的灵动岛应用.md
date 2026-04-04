---
title: Android LSPosed模块开发实战 - 构建能跑通的灵动岛应用
date: 2026-04-05 01:30:00
categories:
- Android开发
tags:
- LSPosed
- Xposed
- 灵动岛
- Android
- Hook
---

# Android LSPosed 模块开发实战 - 构建能跑通的灵动岛应用

> 📅 学习时间: 2026-04-05
> 🔧 修复版本: Build Successful! APK 生成于 `app/build/outputs/apk/debug/app-debug.apk` (57MB)

## 前言

上一篇文章记录了 LSPosed 和 Xposed 的基础知识学习。今天在尝试构建项目时，遇到了大量编译错误。通过深入分析每个错误的原因，成功将项目从编译失败修复为成功打包 APk。本文记录所有遇到的问题及解决方案。

## 问题汇总与修复

### 1. LSPosed Zygisk 不支持资源 Hook (ResourceHook.kt)

**错误:**
```
Unresolved reference: XC_LayoutInflated
Unresolved reference: XposedBridge
Unresolved reference: hookLayout
```

**原因:** LSPosed 使用 Zygisk 架构，移除了 `IXposedHookInitPackageResources` 接口。资源 Hook 功能不再可用。

**修复:** 将 ResourceHook.kt 改为存根文件，添加 `@Deprecated` 注解说明替代方案：

```kotlin
package com.example.dynamicislandxposed.hook

/**
 * LSPosed 资源 Hook 实现
 *
 * 注意: LSPosed (Zygisk) 移除了 IXposedHookInitPackageResources
 * 资源 Hook 在 Zygisk 环境下不可用
 *
 * 如需修改 SystemUI 资源，可以：
 * 1. 使用 Magisk 模块直接替换 system 分区资源
 * 2. 使用 SystemOverlay 方式动态加载自定义布局
 * 3. 在运行时通过反射修改 View 属性
 */
@Deprecated("LSPosed Zygisk 不支持资源 Hook，请使用 Magisk 模块替代方案")
object ResourceHook {
    // 资源 Hook 功能已禁用
}
```

### 2. animateDpAsState 返回类型不匹配 (DynamicIslandAnimations.kt)

**错误:**
```
Return type mismatch: expected 'Dp', actual 'State<Dp>'
Return type mismatch: expected 'Float', actual 'State<Float>'
Unresolved reference: SpringDefaults
```

**原因:** 
- `animateDpAsState()` 和 `animateFloatAsState()` 返回的是 `State<Dp>` 和 `State<Float>`，而不是直接返回值
- `SpringDefaults` 嵌套在 `IslandAnimations` 对象内部，但代码中引用路径错误

**修复:** 在动画函数末尾添加 `.value` 解包，同时修正 `SpringDefaults` 的引用路径：

```kotlin
object IslandAnimations {
    object SpringDefaults {
        const val DAMPING_RATIO_HIGH = 0.8f
        const val DAMPING_RATIO_MEDIUM = 0.6f
        const val DAMPING_RATIO_LOW = 0.4f
        const val STIFFNESS_HIGH = 500f
        const val STIFFNESS_MEDIUM = 300f
        const val STIFFNESS_LOW = 100f
    }
}

@Composable
fun expandedWidth(state: IslandState): Dp {
    val target = when (state) {
        IslandState.HIDDEN -> 0.dp
        IslandState.COMPACT -> IslandAnimations.COMPACT_WIDTH
        IslandState.EXPANDED -> IslandAnimations.EXPANDED_WIDTH
        IslandState.MINIMAL -> IslandAnimations.MINIMAL_SIZE
    }
    return animateDpAsState(
        targetValue = target,
        animationSpec = spring(
            dampingRatio = IslandAnimations.SpringDefaults.DAMPING_RATIO_HIGH,
            stiffness = IslandAnimations.SpringDefaults.STIFFNESS_MEDIUM
        ),
        label = "width"
    ).value  // ← 添加 .value 解包
}
```

### 3. Notification.importance 不存在

**错误:**
```
Unresolved reference 'importance'
```

**原因:** `StatusBarNotification` 在 Android SDK 中没有直接的 `importance` 属性可访问（尽管 `getImportance()` 方法存在于 API 30+）。

**修复方案:** 使用 `Notification.priority` 作为替代判断：

```kotlin
// 检查通知重要性 - 使用 notification.priority 作为降级方案
val priority = sbn.notification.priority
val impliedImportance = when {
    priority >= 1 -> NotificationManager.IMPORTANCE_HIGH
    priority >= 0 -> NotificationManager.IMPORTANCE_DEFAULT
    priority >= -1 -> NotificationManager.IMPORTANCE_LOW
    else -> NotificationManager.IMPORTANCE_MIN
}
return impliedImportance >= NotificationManager.IMPORTANCE_LOW
```

### 4. ViewModelStoreOwner 未正确实现 (DynamicIslandOverlayService.kt)

**错误:**
```
None of the following candidates is applicable: 
  constructor(owner: ViewModelStoreOwner): ViewModelProvider
Conflicting declarations: val viewModelStore
```

**原因:** 
- `Service` 实现了 `LifecycleOwner` 但没有实现 `ViewModelStoreOwner`
- 重复声明了 `viewModelStore` 属性

**修复:** 让 Service 同时实现 `ViewModelStoreOwner` 接口：

```kotlin
@AndroidEntryPoint
class DynamicIslandOverlayService : Service(), 
    LifecycleOwner, 
    SavedStateRegistryOwner, 
    ViewModelStoreOwner {  // ← 添加此接口
    
    private val vmStore = ViewModelStore()
    
    override val viewModelStore: ViewModelStore
        get() = vmStore
}
```

### 5. Material Icons 扩展包缺失

**错误:**
```
Unresolved reference: Download
Unresolved reference: MusicNote
Unresolved reference: Stop
Unresolved reference: Pause
Unresolved reference: SkipNext
Unresolved reference: SkipPrevious
```

**原因:** 默认的 Material Icons 不包含 `Download`、`MusicNote`、`Pause` 等图标。

**修复:** 在 build.gradle.kts 中添加扩展图标库依赖：

```kotlin
dependencies {
    implementation("androidx.compose.material:material-icons-extended")
}
```

### 6. SpringDefaults 导入路径错误

**错误:**
```
Unresolved reference: SpringDefaults
```

**原因:** `SpringDefaults` 位于 `IslandAnimations` 内部，但某些组件错误地从 `ui.theme.SpringDefaults` 导入。

**修复:** 更正导入路径：

```kotlin
// 错误 ❌
import com.example.dynamicislandxposed.ui.theme.SpringDefaults

// 正确 ✅
import com.example.dynamicislandxposed.ui.IslandAnimations
// 使用时: IslandAnimations.SpringDefaults.DAMPING_RATIO_HIGH
```

## 项目架构总结

修复后的项目架构如下：

```
app/src/main/java/com/example/dynamicislandxposed/
├── hook/
│   ├── NotificationHandler.kt    # 通知拦截与优先级处理
│   └── ResourceHook.kt           # ⚠️ 已禁用（LSPosed Zygisk 不支持）
├── service/
│   ├── DynamicIslandNotificationService.kt  # NotificationListenerService
│   └── DynamicIslandOverlayService.kt       # TYPE_APPLICATION_OVERLAY 悬浮窗
├── ui/
│   ├── MainActivity.kt           # 模块配置界面
│   ├── DynamicIslandUi.kt        # 灵动岛主组件（Compose）
│   ├── DynamicIslandAnimations.kt # 动画配置
│   └── components/
│       ├── MusicPlayingIsland.kt      # 音乐播放岛
│       └── DownloadProgressIsland.kt   # 下载进度岛
├── data/
│   └── DynamicIslandData.kt      # 数据模型
├── viewmodel/
│   └── DynamicIslandViewModel.kt # UI 状态管理
└── config/
    └── ModuleConfig.kt           # SharedPreferences 配置
```

## 关键技术点

### 1. 通知监听
通过 `NotificationListenerService` 拦截所有通知，根据包名和类型（音乐/下载/普通）分配优先级。

### 2. 悬浮窗显示
使用 `WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY` 在状态栏区域显示 Compose UI。

### 3. LSPosed 特殊限制
- ✅ Method Hook (IXposedHookLoadPackage) - 可用
- ❌ Resource Hook (IXposedHookInitPackageResources) - 不可用
- 可通过 Magisk 资源替换模块弥补

## 构建成果

```
BUILD SUCCESSFUL in 1m 27s
APK: app/build/outputs/apk/debug/app-debug.apk (57MB)
```

## 下一步计划

1. ✅ 修复编译错误 → 完成
2. 🔲 在真机上测试通知拦截功能
3. 🔲 完善音乐播放通知的媒体控制按钮
4. 🔲 添加更多灵动岛样式模板
5. 🔲 实现与 SystemUI 动画的同步

---

> 💡 **经验总结:** LSPosed 模块开发需要特别注意 Zygisk 和 Riru 的 API 差异。资源 Hook 不可用是最大的限制，需要通过 Magisk 模块或其他方案解决。
