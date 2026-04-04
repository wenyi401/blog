---
title: Android内存泄漏检测学习-LeakCanary与MAT
date: 2026-04-03 23:35:00
tags: [Android, 内存泄漏, LeakCanary, MAT, 性能优化]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

内存泄漏是 Android 开发中常见的问题，会导致应用内存占用持续增长，最终引发 OOM（Out of Memory）崩溃。LeakCanary 和 MAT 是检测和分析内存泄漏的核心工具。

## 一、内存泄漏常见原因

| 原因 | 描述 |
|------|------|
| **静态变量持有 Context** | 静态变量持有 Activity/Context 引用 |
| **匿名内部类** | Handler、Runnable 等持有外部类引用 |
| **单例模式** | 单例持有 Context 但未释放 |
| **注册未取消** | 广播、EventBus 注册后未取消 |
| **资源未关闭** | Cursor、Stream 等未关闭 |
| **WebView** | WebView 持有 Activity 引用 |

## 二、LeakCanary

### 添加依赖

```gradle
dependencies {
    debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.14'
}
```

### 自动检测

LeakCanary 会自动检测以下对象的泄漏：
- Activity
- Fragment
- ViewModel
- Service

### 自定义检测

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        
        // 监控特定对象
        LeakCanary.config = LeakCanary.config.copy(
            onObjectRetained = { retainedObjectCount ->
                Log.d("LeakCanary", "Retained: $retainedObjectCount")
            }
        )
    }
}
```

### 手动监控

```kotlin
// 监控任何对象
val watchedObject = SomeClass()
LeakCanary.watch(watchedObject, "SomeClass was leaked!")
```

### 分析报告

LeakCanary 会生成详细的泄漏报告：
- 泄漏对象的引用链
- 泄漏对象的大小
- 导致泄漏的代码位置

## 三、Android Studio Memory Profiler

### 捕获内存快照

1. 打开 Android Studio Profiler
2. 选择 Memory 选项卡
3. 点击 Capture Heap Dump

### 分析内存快照

- **Instance View**：查看对象实例
- **Reference Tree**：查看引用关系
- **Allocation Tracking**：追踪内存分配

### 查找内存泄漏

1. 触发可能泄漏的操作
2. 捕获内存快照
3. 过滤可疑对象
4. 分析引用链

## 四、MAT (Memory Analyzer Tool)

### 下载和安装

从 Eclipse 官网下载 MAT：https://eclipse.dev/mat/

### 导出 HPROF 文件

```bash
# 使用 adb 导出
adb shell am dumpheap <pid> /data/local/tmp/heap.hprof
adb pull /data/local/tmp/heap.hprof
```

### 转换格式

```bash
hprof-conv heap.hprof converted.hprof
```

### 分析步骤

1. 打开 HPROF 文件
2. 点击 Leak Suspects Report
3. 查看可疑泄漏对象
4. 分析 Dominator Tree
5. 查看引用链（Path to GC Roots）

### 关键功能

| 功能 | 描述 |
|------|------|
| **Leak Suspects** | 自动检测可疑泄漏 |
| **Dominator Tree** | 支配树，显示对象大小 |
| **Histogram** | 对象数量统计 |
| **OQL** | 对象查询语言 |

## 五、常见泄漏案例

### 1. Handler 泄漏

```kotlin
// ❌ 错误：Handler 持有 Activity 引用
class MainActivity : AppCompatActivity() {
    private val handler = Handler(Looper.getMainLooper())
    
    fun postDelayed() {
        handler.postDelayed({ updateUI() }, 10000)
    }
}

// ✅ 正确：使用静态内部类
class MainActivity : AppCompatActivity() {
    private static class SafeHandler(activity: MainActivity) : Handler(Looper.getMainLooper()) {
        private val activityRef = WeakReference(activity)
        
        override fun handleMessage(msg: Message) {
            activityRef.get()?.updateUI()
        }
    }
    
    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
    }
}
```

### 2. 匿名内部类泄漏

```kotlin
// ❌ 错误：匿名 Runnable 持有 Activity 引用
class MainActivity : AppCompatActivity() {
    fun startThread() {
        Thread {
            Thread.sleep(10000)
            updateUI()  // 持有 Activity 引用
        }.start()
    }
}

// ✅ 正确：使用弱引用
class MainActivity : AppCompatActivity() {
    fun startThread() {
        val activityRef = WeakReference(this)
        Thread {
            Thread.sleep(10000)
            activityRef.get()?.updateUI()
        }.start()
    }
}
```

### 3. 广播接收器泄漏

```kotlin
// ❌ 错误：未取消注册
class MainActivity : AppCompatActivity() {
    private val receiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) { }
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        registerReceiver(receiver, IntentFilter("ACTION"))
    }
}

// ✅ 正确：在 onDestroy 中取消注册
override fun onDestroy() {
    unregisterReceiver(receiver)
}
```

## 六、检测流程

### LeakCanary 检测流程

```
对象创建
    │
    ▼
Watch Reference（弱引用）
    │
    ▼
GC 执行
    │
    ▼
检查弱引用是否被回收
    │
    ├── 已回收 → 无泄漏
    │
    └── 未回收 → 分析堆转储
          │
          ▼
        找到最短引用链
          │
          ▼
        显示泄漏报告
```

### 手动分析流程

```
捕获堆转储
    │
    ▼
打开 MAT
    │
    ▼
Leak Suspects Report
    │
    ▼
分析 Dominator Tree
    │
    ▼
Path to GC Roots
    │
    ▼
找到泄漏原因
```

## 七、最佳实践

1. **及时释放引用**：onDestroy 中清理引用
2. **使用弱引用**：对于可能泄漏的引用
3. **避免静态 Context**：使用 ApplicationContext
4. **取消注册**：广播、EventBus 及时取消
5. **关闭资源**：Cursor、Stream 及时关闭
6. **使用工具**：LeakCanary 自动检测

## 学习资源

- [LeakCanary GitHub](https://github.com/square/leakcanary)
- [Android内存泄漏排查实战](https://blog.csdn.net/xwdrhgr/article/details/157580450)
- [LeakCanary入门教程](https://cloud.tencent.com/developer/article/2568627)

---

*持续学习中...*
