---
title: Android应用资源Resource深度解析
date: 2026-04-04 06:50:00
tags: [Android, Resource, 资源, 限定符]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

资源是代码使用的附加文件和静态内容，例如位图、布局定义、界面字符串等。将应用资源与代码分离，便于独立维护和为特定设备配置提供备用资源。

## 一、资源类型

| 目录 | 资源类型 |
|------|----------|
| animator/ | 属性动画 |
| anim/ | 补间动画 |
| color/ | 颜色状态列表 |
| drawable/ | 位图、形状等 |
| mipmap/ | 启动器图标 |
| layout/ | 界面布局 |
| menu/ | 应用菜单 |
| raw/ | 原始文件 |
| values/ | 字符串、颜色、维度等 |
| xml/ | 任意 XML 文件 |
| font/ | 字体文件 |

## 二、提供备用资源

使用配置限定符为不同设备提供备用资源：

```
res/
  drawable/
    icon.png
  drawable-hdpi/
    icon.png
  drawable-en/
    icon.png
```

## 三、配置限定符

### 常用限定符

| 限定符 | 说明 |
|--------|------|
| en, fr | 语言 |
| port, land | 屏幕方向 |
| hdpi, xhdpi | 屏幕密度 |
| sw600dp | 最小宽度 |
| night, notnight | 夜间模式 |

### 命名规则

- 多个限定符用短划线分隔
- 必须按优先级顺序排列

## 四、访问资源

### 在代码中

```kotlin
val string = getString(R.string.hello)
val drawable = getDrawable(R.drawable.icon)
setContentView(R.layout.main)
```

### 在 XML 中

```xml
<TextView
    android:text="@string/hello"
    android:background="@drawable/icon" />
```

## 五、最佳实践

### 1. 始终提供默认资源

```xml
<!-- 正确 -->
values/strings.xml
values-en/strings.xml

<!-- 错误：缺少默认资源 -->
values-en/strings.xml
values-fr/strings.xml
```

### 2. 使用 dp 而非 px

```xml
android:layout_margin="16dp"
```

### 3. 使用别名资源

```xml
<resources>
    <drawable name="icon">@drawable/icon_ca</drawable>
</resources>
```

## 学习资源

- [应用资源概览 | Android Developers](https://developer.android.google.cn/guide/topics/resources/providing-resources?hl=zh-cn)
- [资源类型概览](https://developer.android.google.cn/guide/topics/resources/available-resources?hl=zh-cn)

---

*深入学习中...*
