---
title: Android通知Notification与Channel实战
date: 2026-04-03 23:52:00
tags: [Android, Notification, Channel, 通知]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

通知是 Android 应用与用户交互的重要方式，用于告知用户重要事件、下载进度等。从 Android 8.0 开始，通知必须设置 Channel。

## 一、创建通知渠道

```kotlin
private fun createNotificationChannel() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
        val channel = NotificationChannel(
            CHANNEL_ID,
            "Channel Name",
            NotificationManager.IMPORTANCE_DEFAULT
        ).apply {
            description = "Channel Description"
        }
        
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)
    }
}
```

## 二、发送通知

```kotlin
private fun sendNotification() {
    val notification = NotificationCompat.Builder(this, CHANNEL_ID)
        .setSmallIcon(R.drawable.ic_notification)
        .setContentTitle("Title")
        .setContentText("Content")
        .setPriority(NotificationCompat.PRIORITY_DEFAULT)
        .build()
    
    NotificationManagerCompat.from(this)
        .notify(NOTIFICATION_ID, notification)
}
```

## 三、点击跳转

```kotlin
val intent = Intent(this, MainActivity::class.java).apply {
    flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
}

val pendingIntent = PendingIntent.getActivity(
    this, 0, intent, PendingIntent.FLAG_IMMUTABLE
)

val notification = NotificationCompat.Builder(this, CHANNEL_ID)
    .setContentIntent(pendingIntent)
    .build()
```

## 学习资源

- [NotificationChannel | Android Developers](https://developer.android.com/reference/android/app/NotificationChannel)
- [Android 通知用法详解](https://juejin.cn/post/7489302960176169014)

---

*持续学习中...*
