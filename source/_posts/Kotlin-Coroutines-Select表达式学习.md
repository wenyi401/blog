---
title: Kotlin Coroutines Select表达式学习
date: 2026-04-03 23:37:00
tags: [Kotlin, Coroutines, Select, 并发, 多路复用]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Select 表达式允许同时等待多个挂起函数，并选择第一个可用的。类似于 IO 多路复用，在 Kotlin 协程中提供了强大的并发选择能力。

## 一、基本概念

### 什么是 Select？

Select 表达式是 kotlinx.coroutines 的实验性功能，允许：
- 同时等待多个挂起函数
- 选择第一个可用的结果
- 实现多路复用模式

## 二、从通道中选择

### 基本示例

```kotlin
fun CoroutineScope.fizz() = produce<String> {
    while (true) {
        delay(500)
        send("Fizz")
    }
}

fun CoroutineScope.buzz() = produce<String> {
    while (true) {
        delay(1000)
        send("Buzz!")
    }
}

suspend fun selectFizzBuzz(fizz: ReceiveChannel<String>, buzz: ReceiveChannel<String>) {
    select<Unit> {
        fizz.onReceive { value ->
            println("fizz -> '$value'")
        }
        buzz.onReceive { value ->
            println("buzz -> '$value'")
        }
    }
}
```

### 运行结果

```
fizz -> 'Fizz'
buzz -> 'Buzz!'
fizz -> 'Fizz'
fizz -> 'Fizz'
buzz -> 'Buzz!'
fizz -> 'Fizz'
fizz -> 'Fizz'
```

## 三、Select 偏向性

### 第一个子句优先

当多个子句同时可选时，选择第一个：

```kotlin
suspend fun selectAorB(a: ReceiveChannel<String>, b: ReceiveChannel<String>): String =
    select<String> {
        a.onReceiveCatching { it ->
            val value = it.getOrNull()
            if (value != null) "a -> '$value'" else "Channel 'a' is closed"
        }
        b.onReceiveCatching { it ->
            val value = it.getOrNull()
            if (value != null) "b -> '$value'" else "Channel 'b' is closed"
        }
    }
```

### 结果分析

```
a -> 'Hello 0'  // a 优先
a -> 'Hello 1'  // a 优先
b -> 'World 0'  // a 被挂起，b 可用
a -> 'Hello 2'
a -> 'Hello 3'
b -> 'World 1'
Channel 'a' is closed
Channel 'a' is closed
```

## 四、处理通道关闭

### onReceiveCatching

```kotlin
select<String> {
    channel.onReceiveCatching { result ->
        val value = result.getOrNull()
        if (value != null) {
            "Received: $value"
        } else {
            "Channel is closed"
        }
    }
}
```

### 关闭处理

```kotlin
suspend fun handleChannelClose(channel: ReceiveChannel<String>) {
    select<Unit> {
        channel.onReceiveCatching { result ->
            result.getOrNull()?.let { 
                println("Received: $it") 
            } ?: println("Channel closed")
        }
    }
}
```

## 五、Select 子句类型

| 子句 | 描述 |
|------|------|
| `onReceive` | 接收通道数据 |
| `onReceiveCatching` | 接收数据或处理关闭 |
| `onSend` | 发送数据到通道 |
| `onAwait` | 等待 Deferred 结果 |

## 六、onSend 子句

### 发送数据

```kotlin
suspend fun sendToFirstAvailable(
    channel1: SendChannel<String>,
    channel2: SendChannel<String>,
    value: String
) {
    select<Unit> {
        channel1.onSend(value) {
            println("Sent to channel1")
        }
        channel2.onSend(value) {
            println("Sent to channel2")
        }
    }
}
```

## 七、onAwait 子句

### 等待 Deferred

```kotlin
suspend fun selectFromDeferred(
    deferred1: Deferred<String>,
    deferred2: Deferred<String>
): String = select<String> {
    deferred1.onAwait { result ->
        "Deferred1: $result"
    }
    deferred2.onAwait { result ->
        "Deferred2: $result"
    }
}
```

## 八、实际应用

### 1. 超时控制

```kotlin
suspend fun withTimeoutSelect(
    deferred: Deferred<String>,
    timeoutMs: Long
): String? = select<String?> {
    deferred.onAwait { it }
    
    onTimeout(timeoutMs) {
        deferred.cancel()
        null
    }
}
```

### 2. 快速响应

```kotlin
suspend fun fetchFromMultipleSources(
    source1: suspend () -> String,
    source2: suspend () -> String
): String = coroutineScope {
    val deferred1 = async { source1() }
    val deferred2 = async { source2() }
    
    select<String> {
        deferred1.onAwait { it }
        deferred2.onAwait { it }
    }
}
```

### 3. 取消处理

```kotlin
suspend fun processUntilCancelled(
    channel: ReceiveChannel<String>,
    cancellationToken: CancellationToken
) {
    while (true) {
        select<Unit> {
            channel.onReceive { value ->
                process(value)
            }
            cancellationToken.onCancel {
                return  // 退出循环
            }
        }
    }
}
```

## 九、注意事项

### 1. 实验性功能

```kotlin
// 需要添加 @OptIn
@OptIn(ExperimentalCoroutinesApi::class)
suspend fun useSelect() {
    select<Unit> {
        // ...
    }
}
```

### 2. 性能考虑

- Select 有一定的性能开销
- 避免在紧密循环中使用
- 考虑使用 Flow 替代

### 3. 错误处理

```kotlin
select<String> {
    channel.onReceiveCatching { result ->
        result.exceptionOrNull()?.let { 
            throw it 
        }
        result.getOrNull() ?: "Closed"
    }
}
```

## 十、Select vs Flow

| 特性 | Select | Flow |
|------|--------|------|
| **用途** | 单次选择 | 流式处理 |
| **语法** | 命令式 | 声明式 |
| **性能** | 较低开销 | 更高开销 |
| **场景** | 多路复用 | 数据流转换 |

## 学习资源

- [Select expression | Kotlin Documentation](https://kotlinlang.org/docs/select-expression.html)
- [破解 Kotlin 协程（10）：Select 篇](https://www.bennyhuo.com/2020/02/03/coroutine-select/)
- [Kotlin协程select函数实现多路复用](https://cloud.tencent.com/developer/article/2254060)

---

*持续学习中...*
