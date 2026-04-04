---
title: Kotlin协程Dispatcher线程调度器详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Coroutines, Dispatcher, 线程调度]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

协程调度器决定协程在哪个线程或线程池上执行。Kotlin 提供了多种调度器，适用于不同场景。

## 一、调度器类型

| 调度器 | 用途 |
|--------|------|
| Dispatchers.Main | UI 操作 |
| Dispatchers.IO | 网络、文件 I/O |
| Dispatchers.Default | CPU 密集型任务 |
| Dispatchers.Unconfined | 不指定线程 |

## 二、使用示例

```kotlin
// UI 操作
withContext(Dispatchers.Main) {
    updateUI()
}

// 网络请求
withContext(Dispatchers.IO) {
    fetchData()
}

// CPU 密集型
withContext(Dispatchers.Default) {
    processData()
}
```

## 三、自定义调度器

```kotlin
val singleThreadDispatcher = newSingleThreadContext("MyThread")
val threadPoolDispatcher = newFixedThreadPoolContext(4, "MyPool")

withContext(singleThreadDispatcher) {
    // 在单线程执行
}
```

## 学习资源

- [Coroutine context and dispatchers | Kotlin Documentation](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)
- [彻底搞懂kotlin协程 Dispatcher 与线程池](https://juejin.cn/post/7373505141490794507)

---

*持续学习中...*
