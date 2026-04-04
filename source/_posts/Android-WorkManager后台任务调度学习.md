---
title: Android WorkManager后台任务调度学习
date: 2026-04-03 23:47:00
tags: [Android, WorkManager, 后台任务, 调度]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

WorkManager 是 Android Jetpack 组件中的后台任务调度框架，通过统一的 API 封装了不同 Android 版本的后台任务执行机制，提供了可靠的、可观察的后台任务执行方案。

## 一、WorkManager 概述

### 为什么使用 WorkManager？

- **兼容性**：自动适配不同 Android 版本
- **持久性**：应用重启后任务仍然执行
- **约束条件**：支持网络、电量等约束
- **可观察**：任务状态可观察
- **链式任务**：支持任务编排

### 适用场景

| 场景 | 适合 |
|------|------|
| 上传日志 | ✅ |
| 同步数据 | ✅ |
| 定期备份 | ✅ |
| 实时定位 | ❌（使用 Foreground Service） |

## 二、添加依赖

```gradle
dependencies {
    implementation("androidx.work:work-runtime-ktx:2.9.1")
}
```

## 三、创建 Worker

### 基本 Worker

```kotlin
class UploadWorker(
    context: Context,
    params: WorkerParameters
) : Worker(context, params) {
    
    override fun doWork(): Result {
        return try {
            // 执行任务
            uploadData()
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }
}
```

### CoroutineWorker

```kotlin
class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        return try {
            uploadData()
            Result.success()
        } catch (e: Exception) {
            Result.retry()  // 重试
        }
    }
}
```

## 四、提交任务

### OneTimeWorkRequest

```kotlin
val uploadWork = OneTimeWorkRequestBuilder<UploadWorker>()
    .build()

WorkManager.getInstance(context).enqueue(uploadWork)
```

### PeriodicWorkRequest

```kotlin
val periodicWork = PeriodicWorkRequestBuilder<UploadWorker>(
    repeatInterval = 1,
    repeatIntervalTimeUnit = TimeUnit.HOURS
).build()

WorkManager.getInstance(context).enqueue(periodicWork)
```

## 五、约束条件

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresCharging(true)
    .setRequiresDeviceIdle(false)
    .setRequiresStorageNotLow(true)
    .build()

val uploadWork = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(constraints)
    .build()
```

### 约束类型

| 约束 | 描述 |
|------|------|
| `NetworkType.CONNECTED` | 需要网络连接 |
| `NetworkType.UNMETERED` | 需要 Wi-Fi |
| `setRequiresBatteryNotLow` | 电量不足不执行 |
| `setRequiresCharging` | 需要充电 |
| `setRequiresDeviceIdle` | 设备空闲时执行 |
| `setRequiresStorageNotLow` | 存储不足不执行 |

## 六、输入输出数据

### 传递输入数据

```kotlin
val inputData = workDataOf(
    "file_path" to "/data/file.txt",
    "user_id" to 123
)

val uploadWork = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(inputData)
    .build()
```

### 在 Worker 中获取数据

```kotlin
class UploadWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        val filePath = inputData.getString("file_path")
        val userId = inputData.getInt("user_id", 0)
        
        // 执行任务
        
        return Result.success(
            workDataOf("result" to "success")
        )
    }
}
```

## 七、链式任务

```kotlin
val workManager = WorkManager.getInstance(context)

workManager
    .beginWith(OneTimeWorkRequestBuilder<FilterWorker>().build())
    .then(OneTimeWorkRequestBuilder<CompressWorker>().build())
    .then(OneTimeWorkRequestBuilder<UploadWorker>().build())
    .enqueue()
```

### 并行任务

```kotlin
val workManager = WorkManager.getInstance(context)

val filter1 = OneTimeWorkRequestBuilder<FilterWorker>().build()
val filter2 = OneTimeWorkRequestBuilder<FilterWorker>().build()
val compress = OneTimeWorkRequestBuilder<CompressWorker>().build()
val upload = OneTimeWorkRequestBuilder<UploadWorker>().build()

workManager
    .beginWith(listOf(filter1, filter2))
    .then(compress)
    .then(upload)
    .enqueue()
```

## 八、观察任务状态

### 观察 WorkInfo

```kotlin
WorkManager.getInstance(context)
    .getWorkInfoByIdLiveData(uploadWork.id)
    .observe(lifecycleOwner) { workInfo ->
        when (workInfo.state) {
            WorkInfo.State.ENQUEUED -> { }
            WorkInfo.State.RUNNING -> { }
            WorkInfo.State.SUCCEEDED -> { }
            WorkInfo.State.FAILED -> { }
            WorkInfo.State.BLOCKED -> { }
            WorkInfo.State.CANCELLED -> { }
        }
    }
```

### 观察进度

```kotlin
class ProgressWorker(
    context: Context,
    params: WorkerParameters
) : CoroutineWorker(context, params) {
    
    override suspend fun doWork(): Result {
        for (i in 0..100 step 10) {
            setProgress(workDataOf("progress" to i))
            delay(1000)
        }
        return Result.success()
    }
}

// 观察
WorkManager.getInstance(context)
    .getWorkInfoByIdLiveData(work.id)
    .observe(lifecycleOwner) { workInfo ->
        val progress = workInfo.progress.getInt("progress", 0)
        updateProgressBar(progress)
    }
```

## 九、取消任务

```kotlin
val workManager = WorkManager.getInstance(context)

// 取消单个任务
workManager.cancelWorkById(workId)

// 取消所有任务
workManager.cancelAllWork()

// 取消带标签的任务
workManager.cancelAllWorkByTag("upload")
```

## 十、最佳实践

1. **合理使用约束**：避免不必要的约束导致任务延迟
2. **正确处理失败**：使用 Result.retry() 或 Result.failure()
3. **及时取消任务**：避免任务重复执行
4. **避免耗时操作**：任务不应执行过长时间
5. **使用唯一任务**：避免任务重复入队

## 学习资源

- [WorkManager任务调度：Android后台任务的标准解决方案](https://blog.csdn.net/xwdrhgr/article/details/159764337)
- [Jetpack系列：精通WorkManager](https://juejin.cn/post/7524229392039542822)
- [任务调度 | Android Developers](https://developer.android.google.cn/develop/background-work/background-tasks/persistent?hl=zh-cn)

---

*持续学习中...*
