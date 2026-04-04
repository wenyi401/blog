---
title: Kotlin Flow异步数据流学习
date: 2026-04-03 19:09:00
tags: [Kotlin, Flow, 协程, 异步编程]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Kotlin Flow 是一种异步数据流处理方式，用于表示多个异步计算的值。它是 Kotlin 协程的重要组成部分，提供了一种简洁、类型安全的方式来处理异步数据流。

## Flow 概述

### 为什么需要 Flow？

- ** suspending 函数**：返回单个异步值
- **集合**：返回多个同步值
- **Flow**：返回多个异步值

### 基本使用

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*

fun simple(): Flow<Int> = flow { // flow 构建器
    for (i in 1..3) {
        delay(100) // 模拟异步操作
        emit(i) // 发射值
    }
}

fun main() = runBlocking<Unit> {
    simple().collect { value -> println(value) }
}
```

## Flow 特点

### 1. 冷流（Cold Stream）

Flow 是冷流，代码在收集时才运行：

```kotlin
fun simple(): Flow<Int> = flow {
    println("Flow started")
    for (i in 1..3) {
        delay(100)
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    println("Calling simple function...")
    val flow = simple() // 此时不会执行
    println("Calling collect...")
    flow.collect { value -> println(value) } // 此时才执行
}
```

### 2. 不阻塞主线程

Flow 可以在不阻塞主线程的情况下处理异步数据：

```kotlin
fun main() = runBlocking<Unit> {
    launch {
        for (k in 1..3) {
            println("I'm not blocked $k")
            delay(100)
        }
    }
    simple().collect { value -> println(value) }
}
```

### 3. 协程取消支持

Flow 遵循协程的取消机制：

```kotlin
fun main() = runBlocking<Unit> {
    withTimeoutOrNull(250) {
        simple().collect { value -> println(value) }
    }
    println("Done")
}
```

## Flow 构建器

### 1. flow { ... }

最基本的构建器：

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        emit(i)
    }
}
```

### 2. flowOf()

定义固定值的 Flow：

```kotlin
flowOf(1, 2, 3).collect { value -> println(value) }
```

### 3. asFlow()

将集合/序列转换为 Flow：

```kotlin
(1..3).asFlow().collect { value -> println(value) }
listOf(1, 2, 3).asFlow().collect { value -> println(value) }
```

## Flow 操作符

### 中间操作符

```kotlin
fun main() = runBlocking<Unit> {
    (1..10).asFlow()
        .filter { it % 2 == 0 } // 过滤偶数
        .map { it * it } // 平方
        .collect { value -> println(value) }
}
```

### 常用操作符

| 操作符 | 描述 |
|--------|------|
| map | 转换每个值 |
| filter | 过滤值 |
| take | 取前 n 个值 |
| drop | 丢弃前 n 个值 |
| onEach | 对每个值执行操作 |
| onStart | Flow 开始时执行 |
| onCompletion | Flow 完成时执行 |
| catch | 捕获异常 |
| retry | 重试 |

## 终端操作符

### collect

收集 Flow 中的所有值：

```kotlin
flow.collect { value -> println(value) }
```

### toList

将 Flow 转换为 List：

```kotlin
val list = flow.toList()
```

### first / last

获取第一个/最后一个值：

```kotlin
val first = flow.first()
val last = flow.last()
```

### collectLatest

只收集最新的值：

```kotlin
flow.collectLatest { value ->
    delay(100)
    println(value)
}
```

## 背压处理

### buffer

使用缓冲区处理背压：

```kotlin
flow
    .buffer(10)
    .collect { value -> println(value) }
```

### conflate

只保留最新值：

```kotlin
flow
    .conflate()
    .collect { value -> println(value) }
```

## 冷流 vs 热流

### 冷流（Flow）

- 每次收集都会重新执行
- 没有订阅者时不产生数据

### 热流（SharedFlow, StateFlow）

- 多个订阅者共享同一个流
- 没有订阅者时也可能产生数据

```kotlin
val sharedFlow = MutableSharedFlow<Int>()
sharedFlow.emit(1)

val stateFlow = MutableStateFlow(0)
stateFlow.value = 1
```

## 学习资源

- [Kotlin Flow 官方文档](https://kotlinlang.org/docs/flow.html)
- [Kotlin 协程：Channel 与 Flow 深度对比](https://jishuzhan.net/article/1941771856213749761)
- [Flow 与 Channel 驯服异步数据流](https://juejin.cn/post/7597623395907829806)

## 下一步

- 学习 Kotlin Channel
- 学习 SharedFlow 和 StateFlow
- 实践 Flow 在 Android 项目中的应用

---

*持续学习中...*
