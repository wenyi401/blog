---
title: Android ContentProvider内容提供者实战
date: 2026-04-03 23:52:00
tags: [Android, ContentProvider, 内容提供者]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

ContentProvider 是 Android 四大组件之一，用于跨应用数据共享，提供标准化的增删改查接口。

## 一、定义 ContentProvider

```kotlin
class MyProvider : ContentProvider() {
    override fun onCreate(): Boolean {
        return true
    }
    
    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        return null
    }
    
    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        return null
    }
    
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int {
        return 0
    }
    
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int {
        return 0
    }
    
    override fun getType(uri: Uri): String? {
        return null
    }
}
```

## 二、注册 Provider

```xml
<provider
    android:name=".MyProvider"
    android:authorities="com.example.myprovider"
    android:exported="false" />
```

## 学习资源

- [ContentProvider | Android Developers](https://developer.android.com/reference/android/content/ContentProvider)
- [Content provider 基础知识](https://developer.android.google.cn/guide/topics/providers/content-provider-basics?hl=zh-cn)

---

*持续学习中...*
