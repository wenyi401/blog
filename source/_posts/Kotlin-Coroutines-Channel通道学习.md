---
title: Kotlin Coroutines Channel通道学习
date: 2026-04-03 23:13:00
tags: [Kotlin, Coroutines, Channel, 协程, 并发]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Deferred values 提供了一种便捷的方式在协程之间传输单个值。Channel 提供了一种在流中传输值的方法。

## 一、Channel 基础

### 概念

`Channel` 在概念上与 `BlockingQueue` 非常相似。一个关键区别是，它用挂起的 `send` 替代了阻塞的 `put` 操作，用挂起的 `receive` 替代了阻塞的 `take` 操作。

### 基本使用

```kotlin
import kotlinx.coroutines.*
import kotlinx.coroutines.channels.*

fun main() = runBlocking {
    val channel = Channel<Int>()
    launch {
        for (x in 1..5) channel.send(x * x)
    }
    repeat(5) { println(channel.receive()) }
    println("Done!")
}
```

**输出：**
```
1
4
9
16
25
Done!
```

---

## 二、关闭和迭代

### 关闭通道

与队列不同，通道可以关闭以表示不再有元素到来。

```kotlin
val channel = Channel<Int>()
launch {
    for (x in 1..5) channel.send(x * x)
    channel.close() // 发送完毕
}
// 使用 for 循环接收元素
for (y in channel) println(y)
println("Done!")
```

### 关闭的保证

迭代会在接收到关闭令牌时停止，保证所有在关闭之前发送的元素都会被接收。

---

## 三、构建通道生产者

### 生产者-消费者模式

生产协程产生元素序列是一个非常常见的模式。

### produce 构建器

```kotlin
fun CoroutineScope.produceSquares(): ReceiveChannel<Int> = produce {
    for (x in 1..5) send(x * x)
}

fun main() = runBlocking {
    val squares = produceSquares()
    squares.consumeEach { println(it) }
    println("Done!")
}
```

### consumeEach

替代 for 循环的消费端扩展函数。

---

## 四、管道

### 概念

管道是一种模式，一个协程产生（可能是无限的）值流：

```kotlin
fun CoroutineScope.produceNumbers() = produce<Int> {
    var x = 1
    while (true) send(x++) // 无限流
}
```

另一个协程消费该流，进行处理，并产生其他结果：

```kotlin
fun CoroutineScope.square(numbers: ReceiveChannel<Int>): ReceiveChannel<Int> = produce {
    for (x in numbers) send(x * x)
}
```

### 使用管道

```kotlin
fun main() = runBlocking {
    val numbers = produceNumbers()
    val squares = square(numbers)
    repeat(5) {
        println(squares.receive())
    }
    println("Done!")
    coroutineContext.cancelChildren()
}
```

---

## 五、素数管道示例

### 生成数字流

```kotlin
fun CoroutineScope.numbersFrom(start: Int) = produce<Int> {
    var x = start
    while (true) send(x++)
}
```

### 过滤管道

```kotlin
fun CoroutineScope.filter(numbers: ReceiveChannel<Int>, prime: Int) = produce<Int> {
    for (x in numbers) if (x % prime != 0) send(x)
}
```

### 生成素数

```kotlin
fun main() = runBlocking {
    var cur = numbersFrom(2)
    repeat(10) {
        val prime = cur.receive()
        println(prime)
        cur = filter(cur, prime)
    }
    coroutineContext.cancelChildren()
}
```

**输出：**
```
2
3
5
7
11
13
17
19
23
29
```

---

## 六、Channel 类型

| 类型 | 描述 |
|------|------|
| `Channel<T>()` | 无限容量的通道 |
| `Channel<T>(capacity)` | 指定容量的通道 |
| `RendezvousChannel` | 容量为 0，发送和接收必须同时进行 |
| `ArrayChannel` | 固定容量的通道 |
| `ConflatedChannel` | 只保留最新值，旧值会被覆盖 |

### 指定容量

```kotlin
// 容量为 10 的通道
val channel = Channel<Int>(10)

// 只有最新值的通道
val conflatedChannel = Channel<Int>(Channel.CONFLATED)
```

---

## 七、缓冲和溢出策略

### BufferOverflow 策略

| 策略 | 描述 |
|------|------|
| `SUSPEND` | 挂起发送者（默认） |
| `DROP_OLDEST` | 丢弃最旧的元素 |
| `DROP_LATEST` | 丢弃最新的元素 |

```kotlin
val channel = Channel<Int>(
    capacity = 10,
    onBufferOverflow = BufferOverflow.DROP_OLDEST
)
```

---

## 八、Select 表达式

### 从多个通道接收

```kotlin
suspend fun selectFromChannels() {
    val channel1 = Channel<Int>()
    val channel2 = Channel<String>()
    
    select<Unit> {
        channel1.onReceive { value ->
            println("Received from channel1: $value")
        }
        channel2.onReceive { value ->
            println("Received from channel2: $value")
        }
    }
}
```

---

## 九、Channel vs Flow

| 特性 | Channel | Flow |
|------|---------|------|
| **类型** | 热流 | 冷流 |
| **多个消费者** | 每个消费者收到不同元素 | 每个消费者重新执行 |
| **状态** | 有状态 | 无状态 |
| **使用场景** | 并发通信、事件流 | 数据流转换 |
| **背压** | 支持 | 支持 |

---

## 十、最佳实践

1. **及时关闭通道**：避免资源泄漏
2. **使用 produce 构建器**：简化生产者代码
3. **处理异常**：使用 try-catch 或 catch
4. **取消协程**：使用 cancelChildren() 或作用域
5. **选择合适的容量**：根据需求选择 Channel 类型

---

## 学习资源

- [Channels | Kotlin Documentation](https://kotlinlang.org/docs/channels.html)
- [通道 · Kotlin 官方文档 中文版](https://book.kotlincn.net/text/channels.html)
- [告别回调地狱：Kotlin协程Channel实战指南](https://blog.csdn.net/gitblog_00076/article/details/147286309)

---

*持续学习中...*
