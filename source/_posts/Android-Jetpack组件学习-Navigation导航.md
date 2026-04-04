---
title: Android Jetpack组件学习-Navigation导航
date: 2026-04-03 16:41:00
tags: [Android, Jetpack, Navigation, Kotlin]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Navigation 组件是 Android Jetpack 的一部分，用于简化应用内的导航逻辑，统一管理 Fragment、Activity 的切换和回退栈。

## 主要概念

| 概念 | 描述 | 类型 |
|------|------|------|
| **宿主** | 包含当前导航目的地的界面元素 | NavHost（Compose）、NavHostFragment（Fragment） |
| **图表** | 定义应用中所有导航目的地及其连接关系 | NavGraph |
| **控制器** | 管理目的地之间导航的中央协调器 | NavController |
| **目的地** | 导航图中的节点 | NavDestination |
| **路线** | 唯一标识目的地及其所需数据 | 可序列化的数据类型 |

## 优点和功能

- **动画和过渡**：提供标准化资源
- **深层链接**：直接跳转到目的地
- **界面模式**：支持抽屉式导航栏和底部导航
- **类型安全**：在目的地之间传递类型安全的数据
- **ViewModel 支持**：将 ViewModel 作用域限定为导航图
- **Fragment 事务**：全面支持和处理
- **返回和向上**：默认正确处理

## 设置依赖

```gradle
plugins {
    kotlin("plugin.serialization") version "2.0.21"
}

dependencies {
    val nav_version = "2.9.7"

    // Jetpack Compose integration
    implementation("androidx.navigation:navigation-compose:$nav_version")

    // Views/Fragments integration
    implementation("androidx.navigation:navigation-fragment:$nav_version")
    implementation("androidx.navigation:navigation-ui:$nav_version")
}
```

## Compose 中使用 Navigation

### 创建 NavController

```kotlin
val navController = rememberNavController()
```

### 创建 NavHost

```kotlin
NavHost(
    navController = navController,
    startDestination = "home"
) {
    composable("home") { HomeScreen() }
    composable("detail/{itemId}") { backStackEntry ->
        DetailScreen(
            itemId = backStackEntry.arguments?.getString("itemId")
        )
    }
}
```

### 导航到目的地

```kotlin
// 简单导航
navController.navigate("detail")

// 带参数导航
navController.navigate("detail/123")

// 返回
navController.popBackStack()
```

## Fragment 中使用 Navigation

### 创建导航图

在 `res/navigation/nav_graph.xml`：

```xml
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    app:startDestination="@id/homeFragment">

    <fragment
        android:id="@+id/homeFragment"
        android:name="com.example.HomeFragment"
        android:label="Home">
        <action
            android:id="@+id/action_home_to_detail"
            app:destination="@id/detailFragment" />
    </fragment>

    <fragment
        android:id="@+id/detailFragment"
        android:name="com.example.DetailFragment"
        android:label="Detail" />
</navigation>
```

### 在 Activity 中使用 NavHostFragment

```xml
<androidx.fragment.app.FragmentContainerView
    android:id="@+id/nav_host_fragment"
    android:name="androidx.navigation.fragment.NavHostFragment"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:navGraph="@navigation/nav_graph" />
```

### 导航操作

```kotlin
// 导航
findNavController().navigate(R.id.action_home_to_detail)

// 返回
findNavController().navigateUp()
```

## 传递参数

### 安全参数传递

```kotlin
// 定义参数
composable(
    "detail/{itemId}",
    arguments = listOf(navArgument("itemId") { type = NavType.StringType })
) { backStackEntry ->
    val itemId = backStackEntry.arguments?.getString("itemId")
    DetailScreen(itemId = itemId)
}

// 导航
navController.navigate("detail/item_123")
```

## 学习资源

- [Navigation 官方文档](https://developer.android.google.cn/guide/navigation?hl=zh-cn)
- [Kotlin导航组件深度指南](https://blog.csdn.net/CodePulse/article/details/153922730)
- [Android Jetpack Navigation 详解](https://juejin.cn/post/7486000831100338187)

## 下一步

- 学习深层链接实现
- 学习类型安全导航
- 学习 Navigation 与 ViewModel 配合

---

*持续学习中...*
