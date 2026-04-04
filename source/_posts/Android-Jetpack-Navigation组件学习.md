---
title: Android Jetpack Navigation组件学习
date: 2026-04-03 23:11:00
tags: [Android, Jetpack, Navigation, 导航]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

导航是指允许用户跨越、进入和退出应用中不同内容片段的交互。Android Jetpack 的 Navigation 组件包含 Navigation 库、Safe Args Gradle 插件，以及可帮助您实现应用导航的工具。

## 主要概念

| 概念 | 目的 | 类型 |
|------|------|------|
| **宿主** | 包含当前导航目的地的界面元素 | NavHost / NavHostFragment |
| **图表** | 定义应用中的所有导航目的地 | NavGraph |
| **控制器** | 管理目的地之间导航的中央协调器 | NavController |
| **目的地** | 导航图中的节点 | NavDestination |
| **路线** | 唯一标识目的地 | 可序列化的数据类型 |

---

## 一、添加依赖

### Kotlin DSL

```kotlin
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

    // Feature module support for Fragments
    implementation("androidx.navigation:navigation-dynamic-features-fragment:$nav_version")

    // Testing Navigation
    androidTestImplementation("androidx.navigation:navigation-testing:$nav_version")

    // JSON serialization library
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
```

---

## 二、Jetpack Compose 导航

### 创建 NavController

```kotlin
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = "home"
    ) {
        composable("home") { HomeScreen(navController) }
        composable("detail/{itemId}") { backStackEntry ->
            val itemId = backStackEntry.arguments?.getString("itemId")
            DetailScreen(itemId, navController)
        }
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

### 类型安全导航

```kotlin
// 定义路线
@Serializable
data class DetailRoute(val itemId: String)

// 在 NavHost 中使用
NavHost(navController, startDestination = "home") {
    composable<DetailRoute> { backStackEntry ->
        val route = backStackEntry.toRoute<DetailRoute>()
        DetailScreen(route.itemId)
    }
}

// 导航
navController.navigate(DetailRoute("123"))
```

---

## 三、Fragment 导航

### 创建导航图

在 `res/navigation/nav_graph.xml` 中定义：

```xml
<?xml version="1.0" encoding="utf-8"?>
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
        android:label="Detail">
        
        <argument
            android:name="itemId"
            app:type="string" />
    </fragment>
</navigation>
```

### 在 Activity 中使用

```xml
<androidx.fragment.app.FragmentContainerView
    android:id="@+id/nav_host_fragment"
    android:name="androidx.navigation.fragment.NavHostFragment"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    app:defaultNavHost="true"
    app:navGraph="@navigation/nav_graph" />
```

### 在 Fragment 中导航

```kotlin
class HomeFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        binding.button.setOnClickListener {
            findNavController().navigate(R.id.action_home_to_detail)
        }
    }
}
```

---

## 四、传递参数

### 使用 Bundle

```kotlin
// 发送
val bundle = bundleOf("itemId" to "123")
navController.navigate(R.id.detailFragment, bundle)

// 接收
val itemId = arguments?.getString("itemId")
```

### 使用 Safe Args

在 `build.gradle` 中添加插件：

```kotlin
plugins {
    id("androidx.navigation.safeargs.kotlin")
}
```

生成的代码：

```kotlin
// 发送
val action = HomeFragmentDirections.actionHomeToDetail("123")
findNavController().navigate(action)

// 接收
val args: DetailFragmentArgs by navArgs()
val itemId = args.itemId
```

---

## 五、深层链接

### 定义深层链接

```xml
<fragment
    android:id="@+id/detailFragment"
    android:name="com.example.DetailFragment">
    
    <deepLink
        android:id="@+id/deepLink"
        app:uri="myapp://detail/{itemId}" />
</fragment>
```

### 处理深层链接

```kotlin
// 在 Activity 中
navController.handleDeepLink(intent)
```

---

## 六、底部导航

```kotlin
@Composable
fun MainScreen() {
    val navController = rememberNavController()
    
    Scaffold(
        bottomBar = {
            NavigationBar {
                items.forEach { item ->
                    NavigationBarItem(
                        selected = currentRoute == item.route,
                        onClick = { navController.navigate(item.route) },
                        icon = { Icon(item.icon, contentDescription = item.title) },
                        label = { Text(item.title) }
                    )
                }
            }
        }
    ) { padding ->
        NavHost(
            navController = navController,
            startDestination = "home",
            modifier = Modifier.padding(padding)
        ) {
            // ... destinations
        }
    }
}
```

---

## 七、ViewModel 支持

将 ViewModel 的作用域限定为导航图：

```kotlin
@Composable
fun SharedViewModelScreen(navController: NavController) {
    val viewModel: SharedViewModel = hiltViewModel()
    
    // ViewModel 在导航图范围内共享
}
```

---

## 八、优点和功能

| 功能 | 描述 |
|------|------|
| **动画和过渡** | 标准化资源支持 |
| **深层链接** | 直接跳转到目的地 |
| **界面模式** | 抽屉式导航栏、底部导航 |
| **类型安全** | 安全的参数传递 |
| **ViewModel 支持** | 导航图范围的 ViewModel |
| **Fragment 事务** | 自动处理事务 |
| **返回和向上** | 默认正确处理 |

---

## 学习资源

- [导航 | Android Developers](https://developer.android.google.cn/guide/navigation?hl=zh-cn)
- [创建导航控制器](https://developer.android.google.cn/guide/navigation/navcontroller?hl=zh-cn)
- [创建导航图](https://developer.android.google.cn/guide/navigation/design?hl=zh-cn)
- [了解 Jetpack Navigation Codelab](https://developer.android.google.cn/codelabs/android-navigation?hl=zh-cn)

---

*持续学习中...*
