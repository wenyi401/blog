---
title: Kotlin Flow异步流深度解析
date: 2026-04-04 01:20:00
tags: [Kotlin, Flow, 异步流, 协程]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

挂起函数异步返回单个值，但如何返回多个异步计算的值？这就是 Kotlin Flow 的用武之地。Flow 是冷流，类似于序列，只有在被收集时才执行。

## 一、表示多个值

### 集合

```kotlin
fun simple(): List<Int> = listOf(1, 2, 3)

fun main() {
    simple().forEach { value -> println(value) }
}
```

### 序列

```kotlin
fun simple(): Sequence<Int> = sequence {
    for (i in 1..3) {
        Thread.sleep(100) // 阻塞
        yield(i)
    }
}
```

### 挂起函数

```kotlin
suspend fun simple(): List<Int> {
    delay(1000)
    return listOf(1, 2, 3)
}
```

### Flow

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100) // 不阻塞
        emit(i)
    }
}

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

**Flow 的关键特性**：
- flow { ... } 构建器
- 代码可以挂起
- 使用 emit() 发射值
- 使用 collect() 收集值

## 二、Flow 是冷的

Flow 是冷流，代码在 flow { ... } 构建器中不会运行，直到被收集：

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
    val flow = simple()
    println("Calling collect...")
    flow.collect { value -> println(value) }
    println("Calling collect again...")
    flow.collect { value -> println(value) }
}
```

输出：
```
Calling simple function...
Calling collect...
Flow started
1
2
3
Calling collect again...
Flow started
1
2
3
```

## 三、Flow 取消

Flow 遵循协程的协作式取消：

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100)
        println("Emitting $i")
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    withTimeoutOrNull(250) {
        simple().collect { value -> println(value) }
    }
    println("Done")
}
```

输出：
```
Emitting 1
1
Emitting 2
2
Done
```

## 四、Flow 构建器

```kotlin
// flowOf 构建器
flowOf(1, 2, 3)

// asFlow 扩展
(1..3).asFlow()
```

## 五、中间操作符

### map 和 filter

```kotlin
suspend fun performRequest(request: Int): String {
    delay(1000)
    return "response $request"
}

(1..3).asFlow()
    .map { request -> performRequest(request) }
    .collect { response -> println(response) }
```

### transform

最通用的转换操作符：

```kotlin
(1..3).asFlow()
    .transform { request ->
        emit("Making request $request")
        emit(performRequest(request))
    }
    .collect { response -> println(response) }
```

### 限制大小

```kotlin
fun numbers(): Flow<Int> = flow {
    try {
        emit(1)
        emit(2)
        println("This line will not execute")
        emit(3)
    } finally {
        println("Finally in numbers")
    }
}

numbers()
    .take(2)
    .collect { value -> println(value) }
```

输出：
```
1
2
Finally in numbers
```

## 六、终端操作符

```kotlin
// 转换为集合
val list = flow.toList()
val set = flow.toSet()

// 获取单个值
val first = flow.first()
val single = flow.single()

// 归约
val sum = (1..5).asFlow()
    .map { it * it }
    .reduce { a, b -> a + b }
```

## 七、Flow 是顺序的

默认情况下，每个值的处理是顺序的：

```kotlin
(1..5).asFlow()
    .filter {
        println("Filter $it")
        it % 2 == 0
    }
    .map {
        println("Map $it")
        "string $it"
    }
    .collect {
        println("Collect $it")
    }
```

输出：
```
Filter 1
Filter 2
Map 2
Collect string 2
Filter 3
Filter 4
Map 4
Collect string 4
Filter 5
```

## 八、Flow 上下文

### 上下文保留

Flow 收集总是在调用协程的上下文中执行：

```kotlin
fun simple(): Flow<Int> = flow {
    log("Started simple flow")
    for (i in 1..3) {
        emit(i)
    }
}

fun main() = runBlocking<Unit> {
    simple().collect { value -> log("Collected $value") }
}
```

### flowOn 操作符

使用 flowOn 改变 Flow 的发射上下文：

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        Thread.sleep(100)
        log("Emitting $i")
        emit(i)
    }
}.flowOn(Dispatchers.Default)

fun main() = runBlocking<Unit> {
    simple().collect { value ->
        log("Collected $value")
    }
}
```

输出：
```
[DefaultDispatcher-worker-1 @coroutine#2] Emitting 1
[main @coroutine#1] Collected 1
[DefaultDispatcher-worker-1 @coroutine#2] Emitting 2
[main @coroutine#1] Collected 2
[DefaultDispatcher-worker-1 @coroutine#2] Emitting 3
[main @coroutine#1] Collected 3
```

## 九、缓冲

### buffer 操作符

当发射器和收集器都较慢时，使用缓冲：

```kotlin
fun simple(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100)
        emit(i)
    }
}

// 无缓冲：约 1200 ms
simple().collect { value ->
    delay(300)
    println(value)
}

// 有缓冲：约 1000 ms
simple()
    .buffer()
    .collect { value ->
        delay(300)
        println(value)
    }
```

### conflate 操作符

跳过中间值，只处理最新的：

```kotlin
simple()
    .conflate()
    .collect { value ->
        delay(300)
        println(value)
    }
```

输出：
```
1
3
```

### collectLatest 操作符

取消慢收集器并重启：

```kotlin
simple()
    .collectLatest { value ->
        println("Collecting $value")
        delay(300)
        println("Done $value")
    }
```

输出：
```
Collecting 1
Collecting 2
Collecting 3
Done 3
```

## 十、组合多个 Flow

### zip

组合两个 Flow 的对应值：

```kotlin
val nums = (1..3).asFlow()
val strs = flowOf("one", "two", "three")

nums.zip(strs) { a, b -> "$a -> $b" }
    .collect { println(it) }
```

输出：
```
1 -> one
2 -> two
3 -> three
```

### combine

当任一 Flow 发射时重新计算：

```kotlin
val nums = (1..3).asFlow().onEach { delay(300) }
val strs = flowOf("one", "two", "three").onEach { delay(400) }

nums.combine(strs) { a, b -> "$a -> $b" }
    .collect { println(it) }
```

## 十一、展平 Flow

### flatMapConcat

顺序展平：

```kotlin
fun requestFlow(i: Int): Flow<String> = flow {
    emit("$i: First")
    delay(500)
    emit("$i: Second")
}

(1..3).asFlow()
    .flatMapConcat { requestFlow(it) }
    .collect { println(it) }
```

### flatMapMerge

并发展平：

```kotlin
(1..3).asFlow()
    .flatMapMerge { requestFlow(it) }
    .collect { println(it) }
```

### flatMapLatest

取消前一个 Flow：

```kotlin
(1..3).asFlow()
    .flatMapLatest { requestFlow(it) }
    .collect { println(it) }
```

## 十二、Flow 异常

### try-catch

```kotlin
try {
    simple().collect { value ->
        println(value)
        check(value <= 1) { "Collected $value" }
    }
} catch (e: Throwable) {
    println("Caught $e")
}
```

### catch 操作符

```kotlin
simple()
    .catch { e -> emit("Caught $e") }
    .collect { value -> println(value) }
```

**注意**：catch 只捕获上游异常。

## 十三、Flow 完成

### finally 块

```kotlin
try {
    simple().collect { value -> println(value) }
} finally {
    println("Done")
}
```

### onCompletion 操作符

```kotlin
simple()
    .onCompletion { cause ->
        if (cause != null) println("Flow completed exceptionally")
    }
    .catch { cause -> println("Caught exception") }
    .collect { value -> println(value) }
```

## 十四、启动 Flow

### launchIn 操作符

在单独的协程中启动 Flow 收集：

```kotlin
fun events(): Flow<Int> = (1..3).asFlow().onEach { delay(100) }

events()
    .onEach { event -> println("Event: $event") }
    .launchIn(this)

println("Done")
```

输出：
```
Done
Event: 1
Event: 2
Event: 3
```

## 十五、Flow 取消检查

### 自动检查

flow 构建器在每个发射值时检查取消：

```kotlin
fun foo(): Flow<Int> = flow {
    for (i in 1..5) {
        println("Emitting $i")
        emit(i)
    }
}

foo().collect { value ->
    if (value == 3) cancel()
    println(value)
}
```

### cancellable 操作符

对于繁忙循环，使用 cancellable：

```kotlin
(1..5).asFlow()
    .cancellable()
    .collect { value ->
        if (value == 3) cancel()
        println(value)
    }
```

## 学习资源

- [Asynchronous Flow | Kotlin Documentation](https://kotlinlang.org/docs/flow.html)
- [彻底搞懂Kotlin Flow](https://juejin.cn/post/7078587415748673543)

---

*深入学习中...*
