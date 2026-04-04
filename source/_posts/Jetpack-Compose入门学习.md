---
title: Jetpack Compose入门学习
date: 2026-04-03 16:38:00
tags: [Android, Jetpack, Compose, Kotlin, UI]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Jetpack Compose 是用于构建原生 Android 界面的现代工具包。它使用更少的代码、强大的工具和直观的 Kotlin API，可以帮助简化并加快 Android 界面开发。

## Compose 概述

### 特点

- **声明式 UI**：只需描述应用界面的外观，不必关注构建过程
- **更少的代码**：不需要 XML 布局文件
- **直观的 Kotlin API**：使用 Kotlin 语言构建 UI
- **强大的工具**：Android Studio 提供实时预览
- **多设备支持**：手机、平板、折叠屏、ChromeOS、Wear OS

### 知名应用使用

Airbnb、Lyft、Reddit、Twitter、Dropbox、Medium 等都在使用 Compose。

## 第1课：可组合函数

### 添加文本元素

```kotlin
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.material3.Text

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            Text("Hello world!")
        }
    }
}
```

### 定义可组合函数

使用 `@Composable` 注解定义可组合函数：

```kotlin
import androidx.compose.runtime.Composable

@Composable
fun MessageCard(name: String) {
    Text(text = "Hello $name!")
}
```

### 预览函数

使用 `@Preview` 注解在 Android Studio 中预览：

```kotlin
import androidx.compose.ui.tooling.preview.Preview

@Preview
@Composable
fun PreviewMessageCard() {
    MessageCard("Android")
}
```

## 第2课：布局

### 数据类

```kotlin
data class Message(val author: String, val body: String)
```

### 使用 Column 垂直排列

```kotlin
import androidx.compose.foundation.layout.Column

@Composable
fun MessageCard(msg: Message) {
    Column {
        Text(text = msg.author)
        Text(text = msg.body)
    }
}
```

### 使用 Row 水平排列

```kotlin
import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.Row
import androidx.compose.ui.res.painterResource

@Composable
fun MessageCard(msg: Message) {
    Row {
        Image(
            painter = painterResource(R.drawable.profile_picture),
            contentDescription = "Contact profile picture",
        )
        Column {
            Text(text = msg.author)
            Text(text = msg.body)
        }
    }
}
```

### 配置布局（Modifier）

```kotlin
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp

@Composable
fun MessageCard(msg: Message) {
    Row(modifier = Modifier.padding(all = 8.dp)) {
        Image(
            painter = painterResource(R.drawable.profile_picture),
            contentDescription = "Contact profile picture",
            modifier = Modifier
                .size(40.dp)
                .clip(CircleShape)
        )
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Column {
            Text(text = msg.author)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = msg.body)
        }
    }
}
```

## 布局组件

| 组件 | 描述 |
|------|------|
| Column | 垂直排列元素 |
| Row | 水平排列元素 |
| Box | 堆叠元素 |
| Spacer | 添加间距 |

## Modifier 常用方法

| 方法 | 描述 |
|------|------|
| padding() | 添加内边距 |
| size() | 设置大小 |
| width() | 设置宽度 |
| height() | 设置高度 |
| clip() | 裁剪形状 |
| background() | 设置背景 |

## 学习资源

- [Android Compose 教程](https://developer.android.google.cn/develop/ui/compose/tutorial?hl=zh-cn)
- [Jetpack Compose 官方文档](https://developer.android.google.cn/jetpack/compose?hl=zh-cn)
- [7个实战案例掌握Jetpack Compose](https://blog.csdn.net/gitblog_00430/article/details/154010806)

## 下一步

- 学习 Compose 状态管理
- 学习 Compose 动画
- 学习 Material Design 3 集成

---

*持续学习中...*
