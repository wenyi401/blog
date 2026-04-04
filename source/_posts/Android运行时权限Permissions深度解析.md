---
title: Android运行时权限Permissions深度解析
date: 2026-04-04 07:50:00
tags: [Android, Permissions, 权限, 运行时权限]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Android 应用在沙盒中运行，需要权限才能访问沙盒外的资源。危险权限需要在运行时请求。

## 一、权限工作流

1. 声明权限
2. 检查权限
3. 说明理由
4. 请求权限
5. 处理结果

## 二、检查权限

```kotlin
if (ContextCompat.checkSelfPermission(
        this, Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED) {
    // 权限已授予
}
```

## 三、说明理由

```kotlin
if (ActivityCompat.shouldShowRequestPermissionRationale(
        this, Manifest.permission.ACCESS_FINE_LOCATION)) {
    // 显示解释界面
}
```

## 四、请求权限

```kotlin
val requestPermissionLauncher = registerForActivityResult(
    ActivityResultContracts.RequestPermission()
) { isGranted ->
    if (isGranted) {
        // 权限已授予
    } else {
        // 权限被拒绝
    }
}

requestPermissionLauncher.launch(Manifest.permission.ACCESS_FINE_LOCATION)
```

## 五、位置权限

### 前台位置

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

### 后台位置

```xml
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

## 六、单次授权

Android 11+ 提供单次授权选项，权限在应用进入后台后撤消。

## 七、最佳实践

### 1. 在需要时请求

在用户触发需要权限的功能时请求。

### 2. 降级处理

权限被拒绝时，提供降级体验。

### 3. 不强制用户

尊重用户的选择。

## 学习资源

- [请求运行时权限 | Android Developers](https://developer.android.google.cn/training/permissions/requesting?hl=zh-cn)
- [权限概览 | Android Developers](https://developer.android.google.cn/guide/topics/permissions/overview?hl=zh-cn)

---

*深入学习中...*
