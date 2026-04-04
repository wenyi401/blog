---
title: Android ANR问题分析与解决
date: 2026-04-03 23:31:00
tags: [Android, ANR, 性能优化, 应用无响应]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

ANR（Application Not Responding，应用无响应）是 Android 系统对主线程响应超时的强制保护机制。当应用的主线程处于阻塞状态的时间过长，系统会发送 ANR 错误。

## 一、ANR 类型

### 输入调度超时

| 描述 | 超时时间 |
|------|----------|
| 主线程未及时响应输入事件 | 5 秒 |

### 广播接收器超时

| 描述 | 超时时间 |
|------|----------|
| 前台广播 | 10 秒 |
| 后台广播 | 60 秒 |

### 服务超时

| 描述 | 超时时间 |
|------|----------|
| 前台服务 | 5 秒 |
| 后台服务 | 200 秒 |

### ContentProvider 超时

| 描述 | 超时时间 |
|------|----------|
| 内容提供者发布 | 10 秒 |

## 二、输入调度 ANR

### 常见原因

| 原因 | 出现情况 | 解决方法 |
|------|----------|----------|
| **binder 调用缓慢** | 主线程进行同步 binder 长调用 | 移出主线程或优化 |
| **连续 binder 调用** | 主线程连续多次同步调用 | 避免紧密循环中调用 |
| **阻塞 I/O** | 主线程进行数据库或网络访问 | 移出主线程 |
| **锁争用** | 主线程等待获取锁 | 减少锁争用 |
| **耗用大量资源的帧** | 单帧渲染工作量大 | 使用 Paging 库 |
| **被其他组件阻塞** | 广播接收器阻塞主线程 | 移出主线程 |

### 最佳实践

```kotlin
// ✅ 正确：使用 StrictMode 捕获主线程问题
StrictMode.setThreadPolicy(
    StrictMode.ThreadPolicy.Builder()
        .detectDiskReads()
        .detectDiskWrites()
        .detectNetwork()
        .penaltyLog()
        .build()
)

// ❌ 错误：主线程进行网络请求
fun fetchData() {
    val result = URL("https://api.example.com").readText()
}

// ✅ 正确：使用协程
fun fetchData() {
    viewModelScope.launch(Dispatchers.IO) {
        val result = URL("https://api.example.com").readText()
    }
}
```

## 三、广播接收器 ANR

### 同步接收器

```kotlin
// ❌ 错误：主线程处理耗时操作
class MyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // 耗时操作
        Thread.sleep(10000)
    }
}
```

### 异步接收器

```kotlin
// ✅ 正确：使用 goAsync()
class MyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val pendingResult = goAsync()
        Thread {
            try {
                // 耗时操作
                Thread.sleep(5000)
            } finally {
                pendingResult.finish()
            }
        }.start()
    }
}
```

### 最佳实践

```kotlin
// ✅ 推荐：使用 WorkManager
class MyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        val workRequest = OneTimeWorkRequestBuilder<MyWorker>()
            .build()
        WorkManager.getInstance(context).enqueue(workRequest)
    }
}
```

## 四、服务 ANR

### 前台服务

```kotlin
// ✅ 正确：使用协程处理耗时操作
class MyService : Service() {
    private val scope = CoroutineScope(Dispatchers.IO)
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        scope.launch {
            // 耗时操作
            doWork()
            stopSelf(startId)
        }
        return START_NOT_STICKY
    }
}
```

### 启动超时

```kotlin
// ❌ 错误：onCreate 中进行耗时操作
override fun onCreate() {
    super.onCreate()
    Thread.sleep(10000) // 会导致 ANR
}

// ✅ 正确：异步处理
override fun onCreate() {
    super.onCreate()
    lifecycleScope.launch(Dispatchers.IO) {
        initialize()
    }
}
```

## 五、ANR 调试

### 使用 Perfetto

1. 查看主线程是否已调度
2. 检查 system_server 线程中的锁争用
3. 分析 binder 调用速度

### 使用 StrictMode

```kotlin
if (BuildConfig.DEBUG) {
    StrictMode.setThreadPolicy(
        StrictMode.ThreadPolicy.Builder()
            .detectDiskReads()
            .detectDiskWrites()
            .detectNetwork()
            .penaltyLog()
            .penaltyDeath()
            .build()
    )
}
```

### 分析 traces.txt

```bash
# 获取 ANR traces
adb pull /data/anr/traces.txt

# 查看主线程状态
grep "main" traces.txt -A 50
```

## 六、预防 ANR

### 检查清单

1. ✅ 主线程不执行阻塞操作
2. ✅ 使用 StrictMode 检测问题
3. ✅ 减少锁争用
4. ✅ 广播接收器使用 goAsync
5. ✅ 服务使用协程或线程
6. ✅ 使用 WorkManager 处理后台任务

### 性能监控

```kotlin
// 使用 Choreographer 监控帧率
Choreographer.getInstance().postFrameCallback { frameTimeNanos ->
    val frameDuration = System.nanoTime() - frameTimeNanos
    if (frameDuration > 16_000_000) { // 超过 16ms
        Log.w("Performance", "Frame dropped: ${frameDuration / 1_000_000}ms")
    }
}
```

## 七、常见问题

### Q1: 如何区分系统问题和应用问题？

使用 Perfetto 轨迹文件：
- 查看应用主线程是否已调度
- 检查 system_server 线程中的锁争用
- 分析 binder 调用

### Q2: 如何避免锁争用？

```kotlin
// ❌ 错误：持有锁时间过长
synchronized(lock) {
    Thread.sleep(5000)
}

// ✅ 正确：减少锁持有时间
val data = synchronized(lock) {
    lock.getData()
}
processData(data)
```

### Q3: 如何优化 binder 调用？

```kotlin
// ❌ 错误：循环中调用 binder
for (item in items) {
    service.process(item)
}

// ✅ 正确：批量处理
service.processAll(items)
```

## 学习资源

- [诊断和修复 ANR | Android Developers](https://developer.android.google.cn/topic/performance/anrs/diagnose-and-fix-anrs?hl=zh-cn)
- [Android性能优化：ANR问题快速定位与优化](https://juejin.cn/post/7509697007483142196)
- [Android ANR 系列文章](https://androidperformance.com/2025/02/08/Android-ANR-02-How-to-analysis-ANR/)

---

*持续学习中...*
