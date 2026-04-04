---
title: Kotlin协程上下文与调度器深度解析
date: 2026-04-04 00:20:00
tags: [Kotlin, Coroutines, Dispatcher, 协程, 调度器]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

协程总是在某个上下文中执行，上下文由 CoroutineContext 类型表示。协程上下文是一组元素，主要包括协程的 Job 和调度器（Dispatcher）。本文将深入解析协程上下文和调度器的核心概念。

## 一、调度器与线程

协程调度器决定协程在哪个线程或线程池上执行。可以：
- 将协程限制在特定线程
- 分发到线程池
- 让其无限制运行

### 调度器类型

```kotlin
fun main() = runBlocking<Unit> {
    launch { // 继承父协程的上下文
        println("main runBlocking: ${Thread.currentThread().name}")
    }
    
    launch(Dispatchers.Unconfined) { // 不受限
        println("Unconfined: ${Thread.currentThread().name}")
    }
    
    launch(Dispatchers.Default) { // 默认调度器
        println("Default: ${Thread.currentThread().name}")
    }
    
    launch(newSingleThreadContext("MyOwnThread")) { // 自定义线程
        println("newSingleThreadContext: ${Thread.currentThread().name}")
    }
}
```

输出：
```
Unconfined: I'm working in thread main
Default: I'm working in thread DefaultDispatcher-worker-1
newSingleThreadContext: I'm working in thread MyOwnThread
main runBlocking: I'm working in thread main
```

### 调度器详解

| 调度器 | 用途 | 线程池 |
|--------|------|--------|
| Dispatchers.Default | CPU 密集型任务 | 共享后台线程池 |
| Dispatchers.IO | I/O 操作 | 按需创建线程 |
| Dispatchers.Main | UI 操作 | 主线程 |
| Dispatchers.Unconfined | 不限制 | 调用者线程 |

## 二、Unconfined vs 受限调度器

### Unconfined 行为

```kotlin
launch(Dispatchers.Unconfined) {
    println("Unconfined: ${Thread.currentThread().name}") // main
    delay(500)
    println("Unconfined: After delay in ${Thread.currentThread().name}") // DefaultExecutor
}

launch { // 继承 runBlocking 上下文
    println("main runBlocking: ${Thread.currentThread().name}") // main
    delay(1000)
    println("main runBlocking: After delay in ${Thread.currentThread().name}") // main
}
```

**关键点**：
- Unconfined 在调用者线程启动，直到第一个挂起点
- 挂起后，由挂起函数决定恢复线程
- 默认继承外部 CoroutineScope 的调度器

## 三、调试协程

### 使用 IDEA 调试器

Debug 工具窗口包含 Coroutines 标签，可以：
- 查看每个协程的状态
- 查看局部和捕获变量的值
- 查看完整的协程创建栈和调用栈
- 获取协程转储报告

### 使用日志调试

启用调试模式：`-Dkotlinx.coroutines.debug`

```kotlin
fun log(msg: String) = println("[${Thread.currentThread().name}] $msg")

fun main() = runBlocking<Unit> {
    val a = async {
        log("I'm computing a piece of the answer")
        6
    }
    val b = async {
        log("I'm computing another piece of the answer")
        7
    }
    log("The answer is ${a.await() * b.await()}")
}
```

输出：
```
[main @coroutine#2] I'm computing a piece of the answer
[main @coroutine#3] I'm computing another piece of the answer
[main @coroutine#1] The answer is 42
```

## 四、线程间跳转

```kotlin
fun main() {
    newSingleThreadContext("Ctx1").use { ctx1 ->
        newSingleThreadContext("Ctx2").use { ctx2 ->
            runBlocking(ctx1) {
                log("Started in ctx1")
                withContext(ctx2) {
                    log("Working in ctx2")
                }
                log("Back to ctx1")
            }
        }
    }
}
```

输出：
```
[Ctx1 @coroutine#1] Started in ctx1
[Ctx2 @coroutine#1] Working in ctx2
[Ctx1 @coroutine#1] Back to ctx1
```

**withContext** 用于切换上下文，执行完成后返回原调度器。

## 五、Job 在上下文中

```kotlin
fun main() = runBlocking<Unit> {
    println("My job is ${coroutineContext[Job]}")
}
```

输出（调试模式）：
```
My job is "coroutine#1":BlockingCoroutine{Active}@6d311334
```

`isActive` 是 `coroutineContext[Job]?.isActive == true` 的便捷快捷方式。

## 六、协程的子级

当在另一个协程的 CoroutineScope 中启动协程时：
- 通过 CoroutineScope.coroutineContext 继承上下文
- 新协程的 Job 成为父协程 Job 的子级
- 父协程取消时，所有子协程递归取消

### 覆盖父子关系

```kotlin
val request = launch {
    launch(Job()) { // 独立 Job
        println("job1: I run in my own Job")
        delay(1000)
        println("job1: I am not affected by cancellation")
    }
    launch { // 继承父上下文
        delay(100)
        println("job2: I am a child of the request coroutine")
        delay(1000)
        println("job2: I will not execute if parent is cancelled")
    }
}
delay(500)
request.cancel()
```

输出：
```
job1: I run in my own Job and execute independently!
job2: I am a child of the request coroutine
main: Who has survived request cancellation?
job1: I am not affected by cancellation of the request
```

## 七、父协程的责任

父协程总是等待所有子协程完成：

```kotlin
val request = launch {
    repeat(3) { i ->
        launch {
            delay((i + 1) * 200L)
            println("Coroutine $i is done")
        }
    }
    println("request: I'm done")
}
request.join()
println("Now processing is complete")
```

输出：
```
request: I'm done
Coroutine 0 is done
Coroutine 1 is done
Coroutine 2 is done
Now processing is complete
```

## 八、命名协程

```kotlin
fun main() = runBlocking(CoroutineName("main")) {
    log("Started main coroutine")
    val v1 = async(CoroutineName("v1coroutine")) {
        delay(500)
        log("Computing v1")
        6
    }
    val v2 = async(CoroutineName("v2coroutine")) {
        delay(1000)
        log("Computing v2")
        7
    }
    log("The answer for v1 * v2 = ${v1.await() * v2.await()}")
}
```

输出：
```
[main @main#1] Started main coroutine
[main @v1coroutine#2] Computing v1
[main @v2coroutine#3] Computing v2
[main @main#1] The answer for v1 * v2 = 42
```

## 九、组合上下文元素

使用 + 运算符组合多个上下文元素：

```kotlin
launch(Dispatchers.Default + CoroutineName("test")) {
    println("I'm working in thread ${Thread.currentThread().name}")
}
```

输出：
```
I'm working in thread DefaultDispatcher-worker-1 @test#2
```

## 十、协程作用域

### Activity 生命周期管理

```kotlin
class Activity {
    private val mainScope = MainScope()
    
    fun destroy() {
        mainScope.cancel()
    }
    
    fun doSomething() {
        repeat(10) { i ->
            mainScope.launch {
                delay((i + 1) * 200L)
                println("Coroutine $i is done")
            }
        }
    }
}

fun main() = runBlocking<Unit> {
    val activity = Activity()
    activity.doSomething()
    println("Launched coroutines")
    delay(500L)
    println("Destroying activity!")
    activity.destroy()
    delay(1000)
}
```

输出：
```
Launched coroutines
Coroutine 0 is done
Coroutine 1 is done
Destroying activity!
```

## 十一、线程局部数据

使用 ThreadLocal.asContextElement() 在协程间传递线程局部数据：

```kotlin
val threadLocal = ThreadLocal<String?>()

fun main() = runBlocking<Unit> {
    threadLocal.set("main")
    println("Pre-main, thread local: '${threadLocal.get()}'")
    
    val job = launch(Dispatchers.Default + threadLocal.asContextElement(value = "launch")) {
        println("Launch start, thread local: '${threadLocal.get()}'")
        yield()
        println("After yield, thread local: '${threadLocal.get()}'")
    }
    
    job.join()
    println("Post-main, thread local: '${threadLocal.get()}'")
}
```

输出：
```
Pre-main, current thread: Thread[main @coroutine#1,5,main], thread local value: 'main'
Launch start, current thread: Thread[DefaultDispatcher-worker-1 @coroutine#2,5,main], thread local value: 'launch'
After yield, current thread: Thread[DefaultDispatcher-worker-2 @coroutine#2,5,main], thread local value: 'launch'
Post-main, current thread: Thread[main @coroutine#1,5,main], thread local value: 'main'
```

## 学习资源

- [Coroutine context and dispatchers | Kotlin Documentation](https://kotlinlang.org/docs/coroutine-context-and-dispatchers.html)
- [彻底搞懂kotlin协程 Dispatcher 与线程池](https://juejin.cn/post/7373505141490794507)

---

*深入学习中...*
