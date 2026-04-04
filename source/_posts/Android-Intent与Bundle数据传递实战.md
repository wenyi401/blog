---
title: Android Intent与Bundle数据传递实战
date: 2026-04-03 23:52:00
tags: [Android, Intent, Bundle, 数据传递]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Intent 和 Bundle 是 Android 组件间通信的核心工具，掌握它们的使用技巧对于开发高质量应用至关重要。

## 一、Intent 基本传递

```kotlin
// 发送
val intent = Intent(this, DetailActivity::class.java).apply {
    putExtra("name", "Alice")
    putExtra("age", 25)
}
startActivity(intent)

// 接收
val name = intent.getStringExtra("name")
val age = intent.getIntExtra("age", 0)
```

## 二、Bundle 打包传递

```kotlin
val bundle = Bundle().apply {
    putString("name", "Alice")
    putInt("age", 25)
}
intent.putExtras(bundle)
```

## 三、传递对象

```kotlin
// 实现 Parcelable
@Parcelize
data class User(val name: String, val age: Int) : Parcelable

// 发送
intent.putExtra("user", User("Alice", 25))

// 接收
val user = intent.getParcelableExtra<User>("user")
```

## 学习资源

- [Android 开发中，Intent 和 Bundle 组件间传递数据的几种方式](https://blog.csdn.net/wu_android/article/details/148613105)
- [Intent之复杂数据的传递 - 菜鸟教程](https://www.runoob.com/w3cnote/android-tutorial-intent-pass-data.html)

---

*持续学习中...*
