---
title: Kotlin协程作用域CoroutineScope详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Coroutines, CoroutineScope, 作用域]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

CoroutineScope 是 Kotlin 协程结构化并发的基础，本质是一个包含 CoroutineContext 的接口。其核心作用为管理协程生命周期，确保父作用域取消时所有子协程自动终止。

## 一、CoroutineScope 定义

```kotlin
public interface CoroutineScope {
    public val coroutineContext: CoroutineContext
}
```

CoroutineScope 只有一个属性 coroutineContext，它是一个 CoroutineContext 类型，包含了协程的配置信息。

## 二、CoroutineContext 组成

| 元素 | 描述 |
|------|------|
| **Job** | 控制协程生命周期 |
| **Dispatcher** | 决定协程执行的线程 |
| **CoroutineName** | 协程名称，用于调试 |
| **CoroutineExceptionHandler** | 处理未捕获异常 |

## 三、作用域创建

### CoroutineScope()

```kotlin
val scope = CoroutineScope(Dispatchers.Default)
```

### MainScope()

```kotlin
val scope = MainScope()  // 使用 Dispatchers.Main
```

### lifecycleScope

```kotlin
lifecycleScope.launch {
    // 在 Activity/Fragment 中使用
}
```

### viewModelScope

```kotlin
viewModelScope.launch {
    // 在 ViewModel 中使用
}
```

### GlobalScope

```kotlin
GlobalScope.launch {
    // 不推荐使用，生命周期跟随应用
}
```

## 四、作用域函数

### coroutineScope

```kotlin
suspend fun loadData() = coroutineScope {
    launch {
        // 子协程 1
    }
    
    launch {
        // 子协程 2
    }
}
```

### supervisorScope

```kotlin
suspend fun loadData() = supervisorScope {
    launch {
        // 子协程 1，失败不影响其他子协程
    }
    
    launch {
        // 子协程 2
    }
}
```

### withContext

```kotlin
suspend fun loadData() = withContext(Dispatchers.IO) {
    // 切换到 IO 线程执行
}
```

## 五、取消作用域

### cancel()

```kotlin
val scope = CoroutineScope(Dispatchers.Default)

scope.launch {
    delay(1000)
    println("Completed")
}

scope.cancel()  // 取消作用域内所有协程
```

### 取消检查

```kotlin
scope.launch {
    for (i in 0..1000) {
        ensureActive()  // 检查是否取消
        processData(i)
    }
}
```

## 六、异常处理

### CoroutineExceptionHandler

```kotlin
val handler = CoroutineExceptionHandler { _, exception ->
    println("Caught $exception")
}

val scope = CoroutineScope(Dispatchers.Main + handler)

scope.launch {
    throw RuntimeException("Error")
}
```

### SupervisorJob

```kotlin
val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main)

scope.launch {
    throw RuntimeException("Error")
    // 不会影响其他子协程
}

scope.launch {
    // 仍然会执行
}
```

## 七、最佳实践

### 1. 结构化并发

```kotlin
suspend fun loadData() = coroutineScope {
    val data1 = async { fetchFromApi1() }
    val data2 = async { fetchFromApi2() }
    
    combine(data1.await(), data2.await())
}
```

### 2. 避免使用 GlobalScope

```kotlin
// ❌ 错误
GlobalScope.launch {
    // 无法控制生命周期
}

// ✅ 正确
lifecycleScope.launch {
    // 生命周期感知
}
```

### 3. 合理使用 Dispatcher

```kotlin
// 网络请求
withContext(Dispatchers.IO) {
    fetchData()
}

// CPU 密集型
withContext(Dispatchers.Default) {
    processData()
}

// UI 操作
withContext(Dispatchers.Main) {
    updateUI()
}
```

### 4. 异常隔离

```kotlin
supervisorScope {
    launch {
        // 可能失败的任务
    }
    
    launch {
        // 独立任务
    }
}
```

## 八、常见问题

### Q: coroutineScope vs supervisorScope

| 特性 | coroutineScope | supervisorScope |
|------|----------------|-----------------|
| 子协程失败 | 取消所有子协程 | 不影响其他子协程 |
| 异常传播 | 向上传播 | 隔离异常 |
| 使用场景 | 任务相关性强 | 任务独立性高 |

### Q: 何时创建自定义作用域？

- 需要自定义生命周期管理时
- 需要特定配置时
- 单元测试中

## 九、调试技巧

### 协程命名

```kotlin
launch(CoroutineName("DataLoader")) {
    // 调试时可以看到协程名称
}
```

### 协程调试器

在 Android Studio 中使用 Kotlin 协程调试器查看协程状态。

## 学习资源

- [Coroutine context and dispatchers | Kotlin Documentation](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)
- [在 Android 中使用协程的最佳实践](https://developer.android.google.cn/kotlin/coroutines/coroutines-best-practices?hl=zh-cn)
- [Kotlin CoroutineScope 详解](https://juejin.cn/post/7502329326097432585)

---

*持续学习中...*
