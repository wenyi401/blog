---
title: Android Handler消息机制学习
date: 2026-04-03 23:23:00
tags: [Android, Handler, Looper, MessageQueue, 消息机制]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Android 的消息机制基于 Handler、Looper、MessageQueue 实现，用于同一进程内的线程间通信。其核心目的是将任务切换到指定线程执行（如子线程更新 UI）。

## 一、核心组件

### 组件关系

| 组件 | 描述 |
|------|------|
| **Handler** | 处理者，发送和处理消息 |
| **Looper** | 循环器，消息循环 |
| **MessageQueue** | 消息队列，存储消息 |
| **Message** | 消息，传递的数据 |

### 工作流程

```
Thread A (发送消息)
    │
    │ Handler.sendMessage()
    ▼
MessageQueue (消息队列)
    │
    │ Looper.loop() 循环取出
    ▼
Thread B (处理消息)
    │
    │ Handler.handleMessage()
    ▼
处理完成
```

## 二、Handler 基本使用

### 发送消息

```kotlin
class MainActivity : AppCompatActivity() {
    
    private val handler = Handler(Looper.getMainLooper())
    
    private fun sendMessage() {
        val message = Message.obtain()
        message.what = 1
        message.obj = "Hello"
        handler.sendMessage(message)
    }
    
    private fun sendMessageDelayed() {
        handler.sendMessageDelayed(Message.obtain().apply {
            what = 2
        }, 1000) // 延迟 1 秒
    }
    
    private fun postRunnable() {
        handler.post {
            // 在主线程执行
            updateUI()
        }
    }
}
```

### 处理消息

```kotlin
private val handler = object : Handler(Looper.getMainLooper()) {
    override fun handleMessage(msg: Message) {
        when (msg.what) {
            1 -> {
                val data = msg.obj as String
                println("Received: $data")
            }
            2 -> {
                println("Message 2")
            }
        }
    }
}
```

## 三、Looper 详解

### 主线程 Looper

```kotlin
// 主线程默认有 Looper
val mainLooper = Looper.getMainLooper()

// 检查当前线程是否是主线程
if (Looper.myLooper() == Looper.getMainLooper()) {
    // 是主线程
}
```

### 子线程 Looper

```kotlin
class WorkerThread : Thread("WorkerThread") {
    lateinit var handler: Handler
    
    override fun run() {
        Looper.prepare() // 创建 Looper
        handler = Handler(Looper.myLooper()!!)
        Looper.loop() // 开始循环
    }
    
    fun quit() {
        Looper.myLooper()?.quit()
    }
}
```

### HandlerThread

```kotlin
val handlerThread = HandlerThread("BackgroundThread")
handlerThread.start()

val backgroundHandler = Handler(handlerThread.looper)

backgroundHandler.post {
    // 在后台线程执行
}

// 退出
handlerThread.quit()
```

## 四、MessageQueue 详解

### 消息入队

```kotlin
// MessageQueue 内部使用单链表
// 按时间排序（延迟消息）
fun enqueueMessage(msg: Message, when: Long): Boolean
```

### 消息出队

```kotlin
// Looper.loop() 不断调用 next()
fun next(): Message?
```

### 同步屏障

```kotlin
// 插入同步屏障，优先处理异步消息
val token = messageQueue.postSyncBarrier()

// 移除同步屏障
messageQueue.removeSyncBarrier(token)
```

## 五、Message 对象池

### 获取 Message

```kotlin
// 从对象池获取（推荐）
val message = Message.obtain()

// 指定 Handler 和 what
val message = handler.obtainMessage(1)
```

### 回收 Message

```kotlin
// 自动回收：Looper 处理完消息后自动调用
message.recycle()

// 手动回收（通常不需要）
message.recycleUnchecked()
```

### 对象池优势

- 避免频繁创建对象
- 减少 GC 压力
- 提高性能

## 六、内存泄漏问题

### 泄漏原因

```kotlin
// ❌ 错误：非静态内部类持有外部类引用
class MainActivity : AppCompatActivity() {
    private val handler = Handler(Looper.getMainLooper()) {
        // 持有 Activity 引用
        updateUI()
        true
    }
}
```

### 解决方案

```kotlin
// ✅ 正确：使用静态内部类 + 弱引用
class MainActivity : AppCompatActivity() {
    
    private static class SafeHandler(
        private val activity: WeakReference<MainActivity>
    ) : Handler(Looper.getMainLooper()) {
        
        override fun handleMessage(msg: Message) {
            activity.get()?.updateUI()
        }
    }
    
    private val handler = SafeHandler(WeakReference(this))
    
    override fun onDestroy() {
        super.onDestroy()
        handler.removeCallbacksAndMessages(null) // 移除所有消息
    }
}
```

### 使用 lifecycleScope

```kotlin
// ✅ 推荐：使用协程替代 Handler
lifecycleScope.launch {
    delay(1000)
    updateUI()
}
```

## 七、Handler vs 协程

| 特性 | Handler | 协程 |
|------|---------|------|
| **延迟执行** | sendMessageDelayed | delay |
| **线程切换** | post | withContext |
| **取消** | removeCallbacks | cancel |
| **生命周期** | 需手动管理 | 自动管理 |
| **代码风格** | 回调 | 同步代码 |

## 八、面试题

### Q1: Looper 死循环为什么不会 ANR？

**答：** Looper.loop() 中的 MessageQueue.next() 会阻塞等待消息，但这是正常的阻塞。ANR 是因为主线程在处理消息时超时（如 onClick 执行超过 5 秒），而不是等待消息。

### Q2: MessageQueue 是队列吗？

**答：** 不是传统队列，是单链表结构，按消息执行时间排序（优先级队列）。

### Q3: 为什么主线程可以 new Handler？

**答：** ActivityThread.main() 中调用了 Looper.prepareMainLooper()，为主线程创建了 Looper。

## 九、最佳实践

1. **使用 Message.obtain()**：从对象池获取消息
2. **及时移除消息**：onDestroy 中移除回调
3. **避免内存泄漏**：使用静态内部类或协程
4. **合理使用 HandlerThread**：需要后台线程 Looper 时
5. **优先使用协程**：现代 Android 开发推荐

## 学习资源

- [Android 消息机制：Handler、Looper、MessageQueue](https://juejin.cn/post/7503716790616195108)
- [Android Handler 机制原理详解](https://cloud.tencent.com/developer/article/2586039)
- [Android消息机制源码解析](https://www.cnblogs.com/eqgis/articles/18222913)

---

*持续学习中...*
