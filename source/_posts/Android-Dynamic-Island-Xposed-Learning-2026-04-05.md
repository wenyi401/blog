# Android 灵动岛 Xposed 模块开发学习笔记

> 日期：2026-04-05
> 目标：深入学习 Android 灵动岛实现方案与 Xposed 模块开发

## 今日学习成果

### 1. 项目构建成功 ✅

成功在服务器环境构建了 `DynamicIslandXposed` 项目：

```bash
export JAVA_HOME=/home/node/.openclaw/workspace/java/jdk-17.0.13+11
export ANDROID_HOME=/home/node/.openclaw/workspace/android-sdk
./gradlew assembleDebug
# BUILD SUCCESSFUL
```

**APK 输出位置：**
```
app/build/outputs/apk/debug/app-debug.apk
```

### 2. Modern Xposed API 学习

#### 与 Legacy API 核心区别

| 特性 | Legacy API | Modern API |
|------|-----------|------------|
| 入口配置 | `assets/xposed_init` | `META-INF/xposed/java_init.list` |
| 模块元数据 | AndroidManifest metadata | `META-INF/xposed/module.prop` |
| 作用域 | AndroidManifest xposedscope | `META-INF/xposed/scope.list` |
| 入口类 | `IXposedHookLoadPackage` | `XposedModule` |
| Hook 方式 | `XC_MethodHook` | `Hooker` 接口 + 拦截器链 |
| 资源 Hook | 支持 | **已移除** |

#### Modern API 关键配置

**module.prop:**
```properties
minApiVersion=101
targetApiVersion=105
staticScope=false
name=MyModule
version=1.0
```

**scope.list:**
```
com.android.systemui
com.miui.systemui
```

### 3. 项目架构分析

`DynamicIslandXposed` 采用以下架构：

```
├── hook/                       # LSPosed Hook 入口
│   ├── MainHook.kt             # Legacy API 实现
│   └── HookLogger.kt           # 日志工具
├── service/                     # 通知监听 + 悬浮窗
├── ui/                          # Jetpack Compose UI
├── viewmodel/                   # MVVM
├── config/                      # DataStore 配置
└── di/                          # Hilt 依赖注入
```

### 4. 参考项目

| 项目 | 描述 | 链接 |
|------|------|------|
| **HyperIsland** | LSPosed 通知转超级岛 | [GitHub](https://github.com/Xposed-Modules-Repo/io.github.hyperisland) |
| **MaterialYou-Dynamic-Island** | Material You 风格灵动岛 | [GitHub](https://github.com/Angel-Studio/MaterialYou-Dynamic-Island) |
| **HyperCeiler** | HyperOS 深度定制 | LSPosed 仓库 |

### 5. 核心 Hook 点 (AOSP SystemUI)

| 类名 | Hook 方法 | 作用 |
|------|-----------|------|
| `NotificationPanelView` | `setExpanded` | 面板展开/收起 |
| `ExpandableNotificationRow` | `setExpanded` / `onNotificationClick` | 通知展开/点击 |
| `StatusBarIconController` | `setIcon` / `removeIcon` | 状态栏图标管理 |
| `NotificationStackScrollLayout` | `addNotification` / `removeNotification` | 通知列表 |
| `PhoneWindowManager` | `getTopFocusedWindow` | 窗口焦点 |

### 6. 灵动岛状态机

```kotlin
sealed class DynamicIslandState {
    data object Hidden    // 完全隐藏
    data object Compact   // 紧凑形态：单点 + 图标
    data object Expanded  // 展开形态：完整卡片
    data object Minimal   // 最小化：小圆点
}
```

### 7. 通知优先级设计

| 类型 | 优先级 | 示例应用 |
|------|--------|----------|
| 音乐播放 | 100 | 网易云音乐、QQ音乐 |
| 下载进度 | 90 | 系统下载管理器 |
| 高优先级应用 | 80 | 微信、QQ、支付宝 |
| 普通应用 | 40~60 | 其他应用 |

## 学习建议

### 对于灵动岛模块开发：

1. **使用 Legacy API** - 复杂模块需要资源 Hook 和稳定性
2. **参考 HyperIsland** - 专注于通知转超级岛的 LSPosed 模块
3. **参考 MaterialYou-Dynamic-Island** - Jetpack Compose UI 实现
4. **理解 NotificationListenerService** - 通知监听的正确使用方式

### 技术栈推荐：

- **Kotlin** - 现代 Android 开发
- **Jetpack Compose** - 声明式 UI
- **Hilt** - 依赖注入
- **DataStore** - 配置持久化
- **LSPosed** - Hook 框架

## 待深入学习

- [ ] HyperIsland 源码分析
- [ ] MediaSession 媒体通知解析
- [ ] MIUI/HyperOS 特定类适配
- [ ] 真机测试验证

## 参考资料

- [LSPosed 官方文档](https://github.com/LSPosed/LSPosed/wiki)
- [Modern Xposed API](https://github.com/LSPosed/LSPosed/wiki/Develop-Xposed-Modules-Using-Modern-Xposed-API)
- [MaterialYou-Dynamic-Island](https://github.com/Angel-Studio/MaterialYou-Dynamic-Island)
- [Xposed Modules Repo](https://modules.lsposed.org/)
