---
title: Android应用启动优化学习
date: 2026-04-03 23:33:00
tags: [Android, 启动优化, App Startup, 性能]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Android 应用的启动性能是用户体验的重要组成部分。一个启动缓慢的应用不仅会让用户感到烦躁，还可能导致用户放弃使用。

## 一、启动类型

### 冷启动

从头开始创建应用进程：
1. 加载并启动应用
2. 创建应用进程
3. 创建 Application 对象
4. 启动主线程
5. 创建 MainActivity
6. 布局、绘制

### 热启动

应用进程已存在，只需将 Activity 带到前台。

### 温启动

应用进程存在，但需要重新创建 Activity。

## 二、启动流程

### 冷启动流程

```
Zygote 进程创建
    │
    ▼
Application 创建
    │
    ▼
Application.attach()
    │
    ▼
Application.onCreate()
    │
    ▼
Activity 创建
    │
    ▼
Activity.onCreate()
    │
    ▼
onStart() → onResume()
    │
    ▼
布局绘制
```

## 三、测量启动时间

### adb 命令

```bash
# 测量启动时间
adb shell am start -W com.example/.MainActivity

# 输出
ThisTime: 1234
TotalTime: 1234
WaitTime: 1250
```

### 代码埋点

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        val startTime = System.currentTimeMillis()
        // 初始化代码
        Log.d("Startup", "Time: ${System.currentTimeMillis() - startTime}ms")
    }
}
```

### Systrace

```bash
python $ANDROID_SDK/platform-tools/systrace/systrace.py \
    --app=com.example \
    gfx view wm am
```

## 四、优化策略

### 1. 延迟初始化

```kotlin
// ❌ 错误：同步初始化所有 SDK
override fun onCreate() {
    super.onCreate()
    initSDK1()
    initSDK2()
    initSDK3()
}

// ✅ 正确：异步初始化
override fun onCreate() {
    super.onCreate()
    lifecycleScope.launch(Dispatchers.IO) {
        initSDK1()
        initSDK2()
        initSDK3()
    }
}
```

### 2. App Startup 库

```gradle
dependencies {
    implementation("androidx.startup:startup-runtime:1.1.1")
}
```

#### 定义 Initializer

```kotlin
class LoggerInitializer : Initializer<Unit> {
    override fun create(context: Context) {
        Logger.initialize(context)
    }
    
    override fun dependencies(): List<Class<out Initializer<*>>> {
        return emptyList()
    }
}
```

#### AndroidManifest 配置

```xml
<provider
    android:name="androidx.startup.InitializationProvider"
    android:authorities="${applicationId}.androidx-startup"
    android:exported="false"
    tools:node="merge">
    
    <meta-data
        android:name="com.example.LoggerInitializer"
        android:value="androidx.startup" />
</provider>
```

### 3. 优化 Application

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // 必须在主线程的初始化
        initEssential()
        
        // 异步初始化
        lifecycleScope.launch(Dispatchers.IO) {
            initNonEssential()
        }
    }
}
```

### 4. 优化 Activity

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 使用异步布局
    setContentView(R.layout.activity_main)
    
    // 延迟加载非必要 UI
    Handler(Looper.getMainLooper()).post {
        loadSecondaryUI()
    }
}
```

### 5. 使用 splash screen

```xml
<style name="Theme.App.Starting" parent="Theme.SplashScreen">
    <item name="windowSplashScreenAnimatedIcon">@drawable/splash</item>
    <item name="postSplashScreenTheme">@style/Theme.App</item>
</style>
```

```kotlin
// 在 Activity 中
override fun onCreate(savedInstanceState: Bundle?) {
    val splashScreen = installSplashScreen()
    super.onCreate(savedInstanceState)
}
```

## 五、优化清单

### Application 优化

| 优化项 | 描述 |
|--------|------|
| ✅ 延迟初始化 | 非必要 SDK 异步初始化 |
| ✅ 使用 App Startup | 统一管理初始化 |
| ✅ 避免耗时操作 | 不执行 I/O 操作 |
| ✅ 减少锁争用 | 避免同步锁 |

### Activity 优化

| 优化项 | 描述 |
|--------|------|
| ✅ 简化布局 | 减少布局层级 |
| ✅ 延迟加载 | 非必要 View 延迟加载 |
| ✅ 使用 ViewStub | 按需加载 |
| ✅ 避免主线程 I/O | 移至子线程 |

### 资源优化

| 优化项 | 描述 |
|--------|------|
| ✅ 压缩图片 | 使用 WebP |
| ✅ 移除无用资源 | shrinkResources |
| ✅ 使用矢量图 | VectorDrawable |

## 六、监控工具

### Android Profiler

- CPU 分析
- 内存分析
- 方法追踪

### Perfetto

```bash
# 捕获 trace
adb shell perfetto \
    -c /data/misc/perfetto-configs/trace_config.pb \
    --txt -o /data/misc/perfetto-traces/trace.perfetto-trace
```

### Macrobenchmark

```kotlin
@RunWith(AndroidJUnit4::class)
class StartupBenchmark {
    
    @get:Rule
    val benchmarkRule = MacrobenchmarkRule()
    
    @Test
    fun startup() = benchmarkRule.measureRepeated(
        packageName = "com.example",
        metrics = listOf(StartupTimingMetric()),
        iterations = 10,
        startupMode = StartupMode.COLD
    ) {
        pressHome()
        startActivityAndWait()
    }
}
```

## 七、最佳实践

1. **异步初始化**：所有非必要的初始化移至子线程
2. **使用 App Startup**：统一管理组件初始化
3. **延迟加载**：按需加载非必要 UI
4. **优化布局**：减少布局层级
5. **持续监控**：使用 Macrobenchmark 持续测量

## 学习资源

- [应用启动分析和优化 | Android Developers](https://developer.android.com/topic/performance/appstartup/analysis-optimization?hl=zh-cn)
- [Android 性能优化：启动优化全解析](https://blog.csdn.net/hai_qing_xu_kong/article/details/149322921)
- [深入研究Android启动速度优化](https://zhuanlan.zhihu.com/p/715981819)

---

*持续学习中...*
