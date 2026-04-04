---
title: Android Navigation导航组件深度解析
date: 2026-04-04 03:20:00
tags: [Android, Navigation, 导航, Jetpack]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

导航是指允许用户跨越、进入和退出应用中不同内容片段的交互。Android Jetpack 的 Navigation 组件包含 Navigation 库、Safe Args Gradle 插件，以及可帮助您实现应用导航的工具。

## 一、核心概念

### 1. 导航宿主（Host）

包含当前导航目的地的界面元素。

- **Compose**：NavHost
- **Fragment**：NavHostFragment

### 2. 导航图（Graph）

定义应用中所有导航目的地及其连接方式的数据结构。

### 3. 导航控制器（Controller）

管理目的地之间导航的中央协调器，提供：
- 目的地之间导航
- 处理深层链接
- 管理返回堆栈

### 4. 目的地（Destination）

导航图中的节点，用户导航到此节点时显示内容。

### 5. 路线（Route）

唯一标识目的地及其所需数据，可使用任何可序列化的数据类型。

## 二、添加依赖

```gradle
// Kotlin
plugins {
    kotlin("plugin.serialization") version "2.0.21"
}

dependencies {
    val nav_version = "2.9.7"
    
    // Jetpack Compose 集成
    implementation("androidx.navigation:navigation-compose:$nav_version")
    
    // Views/Fragments 集成
    implementation("androidx.navigation:navigation-fragment:$nav_version")
    implementation("androidx.navigation:navigation-ui:$nav_version")
    
    // Feature module 支持
    implementation("androidx.navigation:navigation-dynamic-features-fragment:$nav_version")
    
    // 测试
    androidTestImplementation("androidx.navigation:navigation-testing:$nav_version")
    
    // JSON 序列化
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}
```

## 三、基本使用

### Compose 中的导航

```kotlin
@Serializable
object Home

@Serializable
data class Profile(val userId: String)

@Composable
fun NavExample() {
    val navController = rememberNavController()
    
    NavHost(navController = navController, startDestination = Home) {
        composable<Home> {
            HomeScreen(
                onNavigateToProfile = { userId ->
                    navController.navigate(Profile(userId))
                }
            )
        }
        
        composable<Profile> { backStackEntry ->
            val profile: Profile = backStackEntry.toRoute()
            ProfileScreen(
                userId = profile.userId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
}
```

### Fragment 中的导航

```xml
<!-- res/navigation/nav_graph.xml -->
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    app:startDestination="@id/home">
    
    <fragment
        android:id="@+id/home"
        android:name="com.example.HomeFragment" />
    
    <fragment
        android:id="@+id/profile"
        android:name="com.example.ProfileFragment">
        <argument
            android:name="userId"
            app:type="string" />
    </fragment>
</navigation>
```

```kotlin
// 在 Fragment 中导航
findNavController().navigate(R.id.profile, bundleOf("userId" to "123"))

// 返回
findNavController().popBackStack()
```

## 四、传递参数

### 类型安全参数

```kotlin
@Serializable
data class Profile(val userId: String, val showPosts: Boolean = true)

NavHost(navController, startDestination = Home) {
    composable<Profile> { backStackEntry ->
        val profile: Profile = backStackEntry.toRoute()
        ProfileScreen(
            userId = profile.userId,
            showPosts = profile.showPosts
        )
    }
}

// 导航时传递参数
navController.navigate(Profile(userId = "user123", showPosts = false))
```

### 可选参数

```kotlin
@Serializable
data class Search(
    val query: String? = null,
    val filters: List<String> = emptyList()
)

// 导航
navController.navigate(Search(query = "kotlin"))
```

## 五、深层链接

### 定义深层链接

```kotlin
@Serializable
data class Product(val productId: String)

NavHost(navController, startDestination = Home) {
    composable<Product>(
        deepLinks = listOf(
            navDeepLink {
                uriPattern = "https://example.com/product/{productId}"
            }
        )
    ) { backStackEntry ->
        val product: Product = backStackEntry.toRoute()
        ProductScreen(product.productId)
    }
}
```

### 处理深层链接

```xml
<activity>
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <data android:scheme="https" android:host="example.com" />
    </intent-filter>
</activity>
```

## 六、动画

```kotlin
composable<Profile>(
    enterTransition = { slideInHorizontally() },
    exitTransition = { slideOutHorizontally() },
    popEnterTransition = { fadeIn() },
    popExitTransition = { fadeOut() }
) { }
```

## 七、ViewModel 作用域

将 ViewModel 作用域限定为导航图：

```kotlin
@Composable
fun NavHost(navController: NavHostController) {
    NavHost(navController, startDestination = Home) {
        navigation<MainGraph>(startDestination = Home) {
            composable<Home> {
                val viewModel: SharedViewModel = hiltViewModel()
                HomeScreen(viewModel)
            }
            
            composable<Profile> {
                val viewModel: SharedViewModel = hiltViewModel()
                ProfileScreen(viewModel)
            }
        }
    }
}
```

## 八、最佳实践

### 1. 使用类型安全路由

```kotlin
// 推荐：类型安全
@Serializable
data class Profile(val userId: String)

navController.navigate(Profile("user123"))

// 不推荐：字符串路由
navController.navigate("profile/user123")
```

### 2. 单一 Activity 架构

将 Fragment 作为目的地，使用单一 Activity。

### 3. 使用 Safe Args

```gradle
// 使用 Safe Args Gradle 插件
id("androidx.navigation.safeargs.kotlin")
```

### 4. 处理返回按钮

```kotlin
// Compose
BackHandler(enabled = true) {
    navController.popBackStack()
}

// Activity
override fun onSupportNavigateUp(): Boolean {
    return navController.navigateUp() || super.onSupportNavigateUp()
}
```

## 九、常见问题

### 问题 1：导航状态丢失

**原因**：Activity 重建时 NavController 状态丢失。

**解决方案**：使用 rememberSaveable 或 ViewModel 保存状态。

### 问题 2：参数传递错误

**原因**：类型不匹配。

**解决方案**：使用类型安全路由。

### 问题 3：返回堆栈问题

**原因**：错误使用 popBackStack。

**解决方案**：使用 popUpTo 和 inclusive 参数。

## 学习资源

- [导航 | Android Developers](https://developer.android.google.cn/guide/navigation?hl=zh-cn)
- [创建导航控制器 | Android Developers](https://developer.android.google.cn/guide/navigation/navcontroller?hl=zh-cn)

---

*深入学习中...*
