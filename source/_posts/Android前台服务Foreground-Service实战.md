---
title: Android前台服务Foreground Service实战
date: 2026-04-03 23:52:00
tags: [Android, Service, Foreground Service, 前台服务]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

前台服务是一种高优先级的服务，它会在通知栏显示一个持续的通知，让用户知道应用正在执行任务。前台服务不容易被系统杀死，适合长时间运行的任务。

## 一、添加权限

```xml
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_SPECIAL_USE" />
```

## 二、创建服务

```kotlin
class MyForegroundService : Service() {
    
    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        startForeground()
        return START_STICKY
    }
    
    private fun startForeground() {
        val notification = createNotification()
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            startForeground(
                NOTIFICATION_ID,
                notification,
                ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE
            )
        } else {
            startForeground(NOTIFICATION_ID, notification)
        }
    }
    
    private fun createNotification(): Notification {
        createNotificationChannel()
        
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("服务运行中")
            .setContentText("正在执行任务...")
            .setSmallIcon(R.drawable.ic_notification)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .build()
    }
    
    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Foreground Service",
                NotificationManager.IMPORTANCE_LOW
            )
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
    
    override fun onBind(intent: Intent?): IBinder? = null
    
    companion object {
        private const val CHANNEL_ID = "foreground_service_channel"
        private const val NOTIFICATION_ID = 1
    }
}
```

## 三、启动服务

```kotlin
val intent = Intent(context, MyForegroundService::class.java)

if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
    startForegroundService(intent)
} else {
    startService(intent)
}
```

## 四、停止服务

```kotlin
val intent = Intent(context, MyForegroundService::class.java)
stopService(intent)
```

## 五、Service 类型

从 Android 14 开始，需要在清单文件中声明服务类型：

```xml
<service
    android:name=".MyForegroundService"
    android:foregroundServiceType="specialUse"
    android:exported="false">
    
    <property
        android:name="android.app.PROPERTY_SPECIAL_USE_FGS_SUBTYPE"
        android:value="my_special_use_case" />
</service>
```

### 服务类型

| 类型 | 描述 |
|------|------|
| camera | 相机 |
| microphone | 麦克风 |
| location | 位置 |
| connectedDevice | 连接设备 |
| mediaPlayback | 媒体播放 |
| specialUse | 特殊用途 |

## 六、最佳实践

1. **及时停止服务**：任务完成后停止服务
2. **通知可点击**：提供入口到应用
3. **低优先级通知**：避免打扰用户
4. **声明正确的服务类型**：Android 14+ 必须

## 学习资源

- [前台服务概览 | Android Developers](https://developer.android.google.cn/develop/background-work/services/fgs?hl=zh-cn)
- [Android后台服务保活简介](https://juejin.cn/post/7510450493087285282)

---

*持续学习中...*
