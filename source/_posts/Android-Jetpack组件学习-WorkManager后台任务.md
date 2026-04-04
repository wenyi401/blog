---
title: Android Jetpack组件学习-WorkManager后台任务
date: 2026-04-03 18:28:00
tags: [Android, Jetpack, WorkManager, Kotlin, 后台任务]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

WorkManager 是 Android 推荐的后台任务调度程序，用于处理可延迟的、需要保证执行的后台工作。它解决了 Android 后台任务的各种极端情况和兼容性问题。

## WorkManager 概述

### 特点

- **保证执行**：即使应用退出或设备重启，任务也会执行
- **约束条件**：支持网络、充电、存储等约束
- **灵活调度**：支持一次性任务和周期性任务
- **链式任务**：支持任务编排和依赖
- **兼容性**：兼容 Android 4.0+（API 14）

### 适用场景

- 数据同步
- 日志上传
- 图片处理
- 定期备份

## 设置依赖

```gradle
dependencies {
    val work_version = "2.11.2"
    
    // Kotlin + coroutines
    implementation("androidx.work:work-runtime-ktx:$work_version")
    
    // optional - RxJava2 support
    implementation("androidx.work:work-rxjava2:$work_version")
    
    // optional - Test helpers
    androidTestImplementation("androidx.work:work-testing:$work_version")
}
```

## 定义工作

### 创建 Worker

```kotlin
class UploadWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : Worker(appContext, workerParams) {
    
    override fun doWork(): Result {
        // 执行后台任务
        uploadImages()
        
        // 返回结果
        return Result.success()
    }
}
```

### 返回结果

- `Result.success()` - 工作成功完成
- `Result.failure()` - 工作失败
- `Result.retry()` - 工作失败，应根据重试政策重试

## 创建 WorkRequest

### 一次性任务

```kotlin
val uploadWorkRequest: WorkRequest =
    OneTimeWorkRequestBuilder<UploadWorker>()
        .build()
```

### 周期性任务

```kotlin
val periodicWorkRequest: WorkRequest =
    PeriodicWorkRequestBuilder<UploadWorker>(1, TimeUnit.HOURS)
        .build()
```

### 带约束的任务

```kotlin
val constraints = Constraints.Builder()
    .setRequiredNetworkType(NetworkType.CONNECTED)
    .setRequiresBatteryNotLow(true)
    .setRequiresCharging(true)
    .build()

val workRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setConstraints(constraints)
    .build()
```

## 提交任务

```kotlin
WorkManager
    .getInstance(context)
    .enqueue(uploadWorkRequest)
```

## 传递数据

### 输入数据

```kotlin
val inputData = workDataOf(
    "image_uri" to imageUri.toString(),
    "user_id" to userId
)

val workRequest = OneTimeWorkRequestBuilder<UploadWorker>()
    .setInputData(inputData)
    .build()
```

### 在 Worker 中获取数据

```kotlin
class UploadWorker(
    appContext: Context,
    workerParams: WorkerParameters
) : Worker(appContext, workerParams) {
    
    override fun doWork(): Result {
        val imageUri = inputData.getString("image_uri")
        val userId = inputData.getString("user_id")
        
        // 执行任务...
        
        return Result.success()
    }
}
```

### 输出数据

```kotlin
override fun doWork(): Result {
    // 执行任务...
    
    val outputData = workDataOf(
        "result" to "success",
        "bytes_uploaded" to 1024
    )
    
    return Result.success(outputData)
}
```

## 链式任务

```kotlin
WorkManager.getInstance(context)
    .beginWith(workA)
    .then(workB)
    .then(workC)
    .enqueue()
```

## 观察任务状态

```kotlin
WorkManager.getInstance(context)
    .getWorkInfoByIdLiveData(workRequest.id)
    .observe(lifecycleOwner) { workInfo ->
        when (workInfo?.state) {
            WorkInfo.State.SUCCEEDED -> {
                // 任务成功
            }
            WorkInfo.State.FAILED -> {
                // 任务失败
            }
            WorkInfo.State.RUNNING -> {
                // 任务运行中
            }
            else -> {}
        }
    }
```

## 取消任务

```kotlin
// 取消单个任务
WorkManager.getInstance(context).cancelWorkById(workRequest.id)

// 取消所有任务
WorkManager.getInstance(context).cancelAllWork()

// 按标签取消
WorkManager.getInstance(context).cancelAllWorkByTag("upload")
```

## 最佳实践

1. **使用约束**：只在满足条件时执行任务
2. **合理设置重试**：避免无限重试
3. **传递小数据**：输入/输出数据限制在 10KB 以内
4. **使用唯一任务**：避免重复任务

## 学习资源

- [WorkManager 使用入门](https://developer.android.google.cn/develop/background-work/background-tasks/persistent/getting-started?hl=zh-cn)
- [精通WorkManager](https://juejin.cn/post/7524229392039542822)
- [WorkManager Codelab](https://developer.android.google.cn/codelabs/android-workmanager?hl=zh-cn)

## 下一步

- 学习 Hilt（依赖注入）
- 学习 Paging 3（分页加载）
- 实践完整项目

---

*持续学习中...*
