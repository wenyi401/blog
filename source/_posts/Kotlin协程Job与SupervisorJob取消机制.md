---
title: Kotlin协程Job与SupervisorJob取消机制
date: 2026-04-03 23:46:00
tags: [Kotlin, Coroutines, Job, SupervisorJob, 取消]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

在 Kotlin 协程中，Job 和 SupervisorJob 是管理协程生命周期的核心组件。理解它们的取消机制和异常传播规则对于编写健壮的异步代码至关重要。

## 一、Job 概述

### 什么是 Job？

Job 是协程的生命周期控制器，代表一个可取消的工作单元。

```kotlin
val job = launch {
    // 协程体
}

job.cancel()  // 取消协程
job.join()    // 等待协程完成
```

### Job 状态

| 状态 | 描述 |
|------|------|
| New | 新建 |
| Active | 活跃 |
| Completing | 完成中 |
| Completed | 已完成 |
| Cancelling | 取消中 |
| Cancelled | 已取消 |
| Failed | 失败 |

## 二、Job 异常传播

### "连坐"机制

当一个子协程因未捕获的异常而失败时：
1. 向上传播异常到父协程
2. 父协程取消所有其他子协程
3. 父协程自己也失败

```kotlin
val scope = CoroutineScope(Job())

scope.launch {
    launch {
        delay(100)
        throw RuntimeException("Child 1 failed")
    }
    
    launch {
        delay(200)
        println("Child 2")  // 不会执行
    }
}

// 结果：Child 1 失败，Child 2 也被取消
```

### 示例代码

```kotlin
fun main() = runBlocking {
    val parentJob = launch {
        launch {
            println("Child 1 started")
            delay(100)
            throw RuntimeException("Child 1 failed")
        }
        
        launch {
            println("Child 2 started")
            delay(200)
            println("Child 2 finished")
        }
    }
    
    parentJob.join()
    println("Parent state: ${parentJob.isCancelled}")  // true
}
```

## 三、SupervisorJob

### 什么是 SupervisorJob？

SupervisorJob 是 Job 的变体，它不会因为子协程的失败而取消其他子协程。

```kotlin
val scope = CoroutineScope(SupervisorJob())

scope.launch {
    launch {
        delay(100)
        throw RuntimeException("Child 1 failed")
    }
    
    launch {
        delay(200)
        println("Child 2 finished")  // 会执行
    }
}
```

### 创建 SupervisorJob

```kotlin
// 方式一：直接创建
val supervisorJob = SupervisorJob()

// 方式二：使用 supervisorScope
supervisorScope {
    launch {
        // 子协程
    }
}
```

## 四、Job vs SupervisorJob

| 特性 | Job | SupervisorJob |
|------|-----|---------------|
| **子协程失败** | 取消所有子协程 | 不影响其他子协程 |
| **异常传播** | 向上传播 | 隔离异常 |
| **使用场景** | 任务相关性强 | 任务独立性高 |

## 五、取消机制

### cancel()

```kotlin
val job = launch {
    repeat(10) {
        delay(100)
        println("Working $it")
    }
}

delay(300)
job.cancel()  // 取消协程
```

### cancelAndJoin()

```kotlin
val job = launch {
    repeat(10) {
        delay(100)
        println("Working $it")
    }
}

delay(300)
job.cancelAndJoin()  // 取消并等待完成
```

### 协作式取消

协程不会立即停止，需要检查取消状态：

```kotlin
val job = launch {
    for (i in 1..100000) {
        // 检查取消状态
        ensureActive()
        
        // 或
        if (isActive) {
            // 继续工作
        }
    }
}
```

## 六、Timeout

### withTimeout

```kotlin
try {
    withTimeout(1000) {
        // 超过 1 秒抛出 TimeoutCancellationException
        delay(2000)
    }
} catch (e: TimeoutCancellationException) {
    println("Timeout")
}
```

### withTimeoutOrNull

```kotlin
val result = withTimeoutOrNull(1000) {
    delay(2000)
    "Result"
}

println(result)  // null
```

## 七、异常处理

### try-catch

```kotlin
val job = scope.launch {
    try {
        throw RuntimeException("Error")
    } catch (e: Exception) {
        println("Caught: $e")
    }
}
```

### CoroutineExceptionHandler

```kotlin
val handler = CoroutineExceptionHandler { _, exception ->
    println("Caught: $exception")
}

val scope = CoroutineScope(SupervisorJob() + handler)

scope.launch {
    throw RuntimeException("Error")
}
```

## 八、实战应用

### 1. 并行网络请求

```kotlin
suspend fun fetchAll(): List<Data> = coroutineScope {
    val deferred1 = async { fetchFromSource1() }
    val deferred2 = async { fetchFromSource2() }
    
    listOf(deferred1.await(), deferred2.await())
}
```

### 2. 独立任务

```kotlin
supervisorScope {
    launch {
        // 任务 A
    }
    
    launch {
        // 任务 B，即使 A 失败也会执行
    }
}
```

### 3. 超时控制

```kotlin
suspend fun fetchWithTimeout(): Data? {
    return withTimeoutOrNull(5000) {
        fetchData()
    }
}
```

## 九、最佳实践

1. **使用 SupervisorJob**：当子协程独立性高时
2. **处理异常**：使用 CoroutineExceptionHandler
3. **协作式取消**：定期检查 isActive
4. **合理使用 Timeout**：避免无限等待
5. **结构化并发**：使用 coroutineScope 管理作用域

## 学习资源

- [SupervisorJob | kotlinx.coroutines](https://kotlinlang.org/api/kotlinx.coroutines/kotlinx-coroutines-core/kotlinx.coroutines/-supervisor-job.html)
- [Job vs. SupervisorJob：Kotlin协程的异常处理哲学](https://juejin.cn/post/7470010568830713866)
- [Kotlin 协程实践：深入理解 SupervisorJob、CoroutineScope、Dispatcher 与取消机制](https://jishuzhan.net/article/1983704997159305217)

---

*持续学习中...*
