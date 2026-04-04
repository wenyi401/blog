---
title: Kotlin异常处理try-catch与runCatching详解
date: 2026-04-03 23:52:00
tags: [Kotlin, Exception, try-catch, runCatching]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 将所有异常视为非受检异常，简化了异常处理流程。除了传统的 try-catch，Kotlin 还提供了 runCatching 等函数式异常处理方式。

## 一、try-catch-finally

```kotlin
try {
    val result = riskyOperation()
    println(result)
} catch (e: IOException) {
    println("IO Error: ${e.message}")
} catch (e: Exception) {
    println("Error: ${e.message}")
} finally {
    cleanup()
}
```

## 二、runCatching

```kotlin
val result = runCatching {
    riskyOperation()
}

result.onSuccess { value ->
    println("Success: $value")
}.onFailure { error ->
    println("Failed: ${error.message")
}
```

## 三、getOrNull / getOrElse

```kotlin
val value = result.getOrNull()
val value = result.getOrElse { defaultValue }
```

## 学习资源

- [Exception and error handling | Kotlin Documentation](https://kotlinlang.org/docs/exceptions.html)
- [Kotlin 异常处理新玩法：runCatching 与 try-catch 的"华山论剑"](https://juejin.cn/post/7528183432443904035)

---

*持续学习中...*
