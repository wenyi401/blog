---
title: Android Intent与Intent过滤器深度解析
date: 2026-04-04 04:50:00
tags: [Android, Intent, PendingIntent, 组件通信]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Intent 是一种消息传递对象，可用于向其他应用组件请求操作。它支持三种基本用例：启动 Activity、启动服务、传送广播。

## 一、Intent 类型

### 显式 Intent

指定完整的 ComponentName，明确启动哪个组件：

```kotlin
val downloadIntent = Intent(this, DownloadService::class.java).apply {
    data = Uri.parse(fileUrl)
}
startService(downloadIntent)
```

### 隐式 Intent

声明要执行的常规操作，让系统选择合适的组件：

```kotlin
val sendIntent = Intent().apply {
    action = Intent.ACTION_SEND
    putExtra(Intent.EXTRA_TEXT, textMessage)
    type = "text/plain"
}

try {
    startActivity(sendIntent)
} catch (e: ActivityNotFoundException) {
    // 处理没有应用能处理的情况
}
```

## 二、构建 Intent

### 主要信息

| 属性 | 说明 |
|------|------|
| 组件名称 | 指定目标组件 |
| 操作 | 要执行的操作 |
| 数据 | URI 和 MIME 类型 |
| 类别 | 组件类型信息 |
| Extra | 键值对数据 |
| 标志 | 元数据 |

### 常见操作

```kotlin
// 查看内容
Intent.ACTION_VIEW

// 分享内容
Intent.ACTION_SEND

// 编辑内容
Intent.ACTION_EDIT

// 自定义操作
const val ACTION_TIMETRAVEL = "com.example.action.TIMETRAVEL"
```

### 数据设置

```kotlin
// 仅设置 URI
intent.setData(uri)

// 仅设置 MIME 类型
intent.setType("text/plain")

// 同时设置（推荐）
intent.setDataAndType(uri, "image/jpeg")
```

## 三、Intent 过滤器

### 声明过滤器

```xml
<activity android:name="ShareActivity" android:exported="false">
    <intent-filter>
        <action android:name="android.intent.action.SEND"/>
        <category android:name="android.intent.category.DEFAULT"/>
        <data android:mimeType="text/plain"/>
    </intent-filter>
</activity>
```

### 过滤器元素

- **action**：声明接受的操作
- **category**：声明接受的类别
- **data**：声明接受的数据类型

### 主入口 Activity

```xml
<activity android:name="MainActivity" android:exported="true">
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

## 四、Intent 解析

### 操作测试

Intent 中的操作必须与过滤器中的某项操作匹配。

### 类别测试

Intent 中的每个类别都必须与过滤器中的某个类别匹配。

### 数据测试

- Intent 不包含 URI 和 MIME：过滤器未指定
- Intent 包含 URI 但无 MIME：URI 匹配且过滤器未指定 MIME
- Intent 包含 MIME 但无 URI：MIME 匹配且过滤器未指定 URI
- Intent 同时包含：两者都必须匹配

## 五、PendingIntent

### 创建 PendingIntent

```kotlin
// Activity
val pendingIntent = PendingIntent.getActivity(
    applicationContext,
    REQUEST_CODE,
    intent,
    PendingIntent.FLAG_IMMUTABLE
)

// Service
val pendingIntent = PendingIntent.getService(
    applicationContext,
    REQUEST_CODE,
    intent,
    PendingIntent.FLAG_IMMUTABLE
)

// Broadcast
val pendingIntent = PendingIntent.getBroadcast(
    applicationContext,
    REQUEST_CODE,
    intent,
    PendingIntent.FLAG_IMMUTABLE
)
```

### 可变性

Android 12+ 必须指定可变性：

```kotlin
// 不可变（推荐）
PendingIntent.FLAG_IMMUTABLE

// 可变（特定场景）
PendingIntent.FLAG_MUTABLE
```

### 使用场景

- 通知操作
- 应用微件
- 闹钟

## 六、安全最佳实践

### 1. 使用显式 Intent 启动服务

```kotlin
// 正确
val intent = Intent(this, MyService::class.java)
startService(intent)

// 错误：隐式 Intent 启动服务存在安全隐患
```

### 2. 验证 Intent

```kotlin
if (sendIntent.resolveActivity(packageManager) != null) {
    startActivity(sendIntent)
}
```

### 3. 使用选择器

```kotlin
val chooser = Intent.createChooser(sendIntent, "Share with")
if (sendIntent.resolveActivity(packageManager) != null) {
    startActivity(chooser)
}
```

### 4. 检测不安全的 Intent 启动

```kotlin
fun onCreate() {
    StrictMode.setVmPolicy(VmPolicy.Builder()
        .detectUnsafeIntentLaunch()
        .penaltyLog()
        .build())
}
```

## 七、常见问题

### 问题 1：ActivityNotFoundException

**原因**：没有应用能处理隐式 Intent。

**解决方案**：使用 resolveActivity() 验证或 try-catch。

### 问题 2：Intent 数据丢失

**原因**：未正确设置 MIME 类型。

**解决方案**：使用 setDataAndType() 同时设置。

### 问题 3：PendingIntent 无法触发

**原因**：未正确设置 FLAG_IMMUTABLE 或 FLAG_MUTABLE。

**解决方案**：Android 12+ 必须指定可变性标志。

## 学习资源

- [Intent 和 Intent 过滤器 | Android Developers](https://developer.android.google.cn/guide/components/intents-filters?hl=zh-cn)
- [与其他应用互动 | Android Developers](https://developer.android.google.cn/training/basics/intents?hl=zh-cn)

---

*深入学习中...*
