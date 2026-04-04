---
title: Android服务Service深度解析
date: 2026-04-04 08:20:00
tags: [Android, Service, 前台服务, 后台服务]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Service 是一种可在后台执行长时间运行的操作的应用组件，不提供界面。服务启动后，即使用户切换到其他应用，也可能继续运行。

## 一、服务类型

| 类型 | 说明 |
|------|------|
| 前台服务 | 用户明显可见，必须显示通知 |
| 后台服务 | 用户不会直接注意到 |
| 绑定服务 | 提供客户端-服务器接口 |

## 二、创建服务

```kotlin
class MyService : Service() {
    private var serviceLooper: Looper? = null
    private var serviceHandler: ServiceHandler? = null
    
    override fun onCreate() {
        HandlerThread("ServiceStartArguments", Process.THREAD_PRIORITY_BACKGROUND).apply {
            start()
            serviceLooper = looper
            serviceHandler = ServiceHandler(looper)
        }
    }
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        serviceHandler?.obtainMessage()?.also { msg ->
            msg.arg1 = startId
            serviceHandler?.sendMessage(msg)
        }
        return START_STICKY
    }
    
    override fun onBind(intent: Intent): IBinder? = null
    
    override fun onDestroy() {
        // 清理资源
    }
}
```

## 三、启动服务

```kotlin
startService(Intent(this, MyService::class.java))

// Android 8.0+ 前台服务
startForegroundService(Intent(this, MyService::class.java))
```

## 四、前台服务

```kotlin
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
        .setContentTitle("Service Running")
        .setContentText("Processing...")
        .build()
    
    startForeground(1, notification)
    return START_STICKY
}
```

## 五、生命周期

- onCreate()
- onStartCommand()
- onBind()
- onUnbind()
- onRebind()
- onDestroy()

## 六、最佳实践

### 1. 使用 WorkManager

大多数后台任务应使用 WorkManager。

### 2. 避免阻塞主线程

在服务中创建新线程。

### 3. 及时停止服务

完成后调用 stopSelf()。

## 学习资源

- [服务概览 | Android Developers](https://developer.android.google.cn/develop/background-work/services?hl=zh-cn)
- [前台服务 | Android Developers](https://developer.android.google.cn/develop/background-work/services/fgs?hl=zh-cn)

---

*深入学习中...*
