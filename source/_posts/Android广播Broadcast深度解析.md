---
title: Android广播Broadcast深度解析
date: 2026-04-04 05:20:00
tags: [Android, Broadcast, 广播, BroadcastReceiver]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Android 应用与 Android 系统和其他 Android 应用之间可以相互收发广播消息，类似于发布-订阅设计模式。系统会在发生各种系统事件时发送广播，应用也可以发送自定义广播。

## 一、系统广播

系统会在发生各种系统事件时自动发送广播：
- 系统启动或关机
- 设备开始或停止充电
- 屏幕亮起或关闭
- 飞行模式切换

### 常见系统广播操作

```kotlin
// 飞行模式变化
Intent.ACTION_AIRPLANE_MODE_CHANGED

// 网络状态变化
ConnectivityManager.CONNECTIVITY_ACTION

// 屏幕亮起
Intent.ACTION_SCREEN_ON

// 屏幕关闭
Intent.ACTION_SCREEN_OFF

// 电池电量变化
Intent.ACTION_BATTERY_CHANGED
```

## 二、接收广播

### 上下文注册的接收器

只要注册上下文有效，就会接收广播：

```kotlin
class MyActivity : AppCompatActivity() {
    private val myBroadcastReceiver = MyBroadcastReceiver()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val filter = IntentFilter("com.example.ACTION_UPDATE_DATA")
        val flags = ContextCompat.RECEIVER_NOT_EXPORTED
        
        ContextCompat.registerReceiver(this, myBroadcastReceiver, filter, flags)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        unregisterReceiver(myBroadcastReceiver)
    }
}
```

### 清单声明的接收器

```xml
<receiver
    android:name=".MyBroadcastReceiver"
    android:exported="true">
    <intent-filter>
        <action android:name="com.example.ACTION_UPDATE_DATA" />
    </intent-filter>
</receiver>
```

```kotlin
class MyBroadcastReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "com.example.ACTION_UPDATE_DATA") {
            val data = intent.getStringExtra("data")
            // 处理数据
        }
    }
}
```

### 选择合适的注册方式

| 方式 | 特点 | 适用场景 |
|------|------|----------|
| 上下文注册 | 生命周期绑定上下文 | 应用运行时接收 |
| 清单声明 | 系统启动应用 | 始终接收 |

## 三、发送广播

### 常规广播

```kotlin
val intent = Intent("com.example.ACTION_UPDATE_DATA").apply {
    putExtra("data", newData)
    setPackage("com.example") // 限定到特定应用
}
context.sendBroadcast(intent)
```

### 有序广播

```kotlin
val intent = Intent("com.example.ACTION_ORDERED")
context.sendOrderedBroadcast(intent, null)
```

接收器可以：
- 向下一个接收器传递结果
- 完全中止广播

```kotlin
class MyOrderedReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // 处理数据
        val data = intent.getStringExtra("data")
        
        // 向下一个接收器传递结果
        setResultData(processedData)
        
        // 或中止广播
        abortBroadcast()
    }
}
```

## 四、权限限制

### 发送时指定权限

```kotlin
context.sendBroadcast(intent, Manifest.permission.ACCESS_COARSE_LOCATION)
```

### 接收时指定权限

```xml
<receiver
    android:name=".MyReceiver"
    android:permission="android.permission.ACCESS_COARSE_LOCATION"
    android:exported="true">
    <intent-filter>
        <action android:name="com.example.ACTION_UPDATE_DATA" />
    </intent-filter>
</receiver>
```

## 五、本地广播

使用 LocalBroadcastManager 发送只在应用内传递的广播：

```kotlin
// 注册
LocalBroadcastManager.getInstance(context).registerReceiver(
    myReceiver,
    IntentFilter("com.example.LOCAL_ACTION")
)

// 发送
val intent = Intent("com.example.LOCAL_ACTION")
LocalBroadcastManager.getInstance(context).sendBroadcast(intent)

// 注销
LocalBroadcastManager.getInstance(context).unregisterReceiver(myReceiver)
```

## 六、最佳实践

### 1. 避免在清单中注册过多接收器

会导致系统启动大量应用，影响性能。

### 2. 使用最小作用域注册

```kotlin
// Compose 中使用 LifecycleStartEffect
LifecycleStartEffect(true) {
    ContextCompat.registerReceiver(context, receiver, filter, flags)
    onStopOrDispose { context.unregisterReceiver(receiver) }
}
```

### 3. 避免长时间运行

```kotlin
class MyReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        // 使用 goAsync() 执行长时间操作
        val pendingResult = goAsync()
        
        Thread {
            try {
                // 执行长时间操作
            } finally {
                pendingResult.finish()
            }
        }.start()
    }
}
```

### 4. 不在接收器中启动 Activity

显示通知代替：

```kotlin
override fun onReceive(context: Context, intent: Intent) {
    val notification = NotificationCompat.Builder(context, CHANNEL_ID)
        .setContentTitle("标题")
        .setContentText("内容")
        .build()
    
    NotificationManagerCompat.from(context).notify(1, notification)
}
```

## 七、常见问题

### 问题 1：接收器内存泄漏

**原因**：未在适当时机注销接收器。

**解决方案**：在 onDestroy 或 onStop 中注销。

### 问题 2：Android 8.0+ 无法接收隐式广播

**原因**：系统限制清单声明的接收器。

**解决方案**：使用上下文注册。

### 问题 3：接收器执行超时

**原因**：onReceive() 执行超过 10 秒。

**解决方案**：使用 goAsync() 或 JobScheduler。

## 学习资源

- [广播概览 | Android Developers](https://developer.android.google.cn/develop/background-work/background-tasks/broadcasts?hl=zh-cn)
- [系统权限 | Android Developers](https://developer.android.google.cn/guide/topics/security/permissions?hl=zh-cn)

---

*深入学习中...*
