---
title: Kotlin协程学习笔记
date: 2026-04-03 15:11:00
tags: [Kotlin, Android, Coroutines, 异步编程]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

协程是 Android 上进行异步编程的推荐解决方案。它可以简化异步执行的代码，管理长时间运行的任务，防止应用无响应。

## 特点

- **轻量**：可以在单个线程上运行多个协程，支持挂起，不会阻塞线程
- **内存泄漏更少**：使用结构化并发在一个范围内运行多项操作
- **内置取消支持**：取消操作自动传播
- **Jetpack 集成**：许多 Jetpack 库都包含协程支持

## 基本使用

### 依赖项

```gradle
dependencies {
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.3.9")
}
```

### 在后台线程执行

```kotlin
class LoginViewModel(
    private val loginRepository: LoginRepository
): ViewModel() {

    fun login(username: String, token: String) {
        // 创建新协程，移出 UI 线程
        viewModelScope.launch(Dispatchers.IO) {
            val jsonBody = "{ username: \"$username\", token: \"$token\"}"
            loginRepository.makeLoginRequest(jsonBody)
        }
    }
}
```

### 关键概念

- **viewModelScope**：预定义的 CoroutineScope，包含在 ViewModel KTX 扩展中
- **launch**：创建协程并分派执行的函数
- **Dispatchers.IO**：指示协程应在 I/O 操作线程上执行

### 主线程安全

使用 `withContext()` 将协程执行移至其他线程：

```kotlin
class LoginRepository(...) {
    suspend fun makeLoginRequest(jsonBody: String): Result<LoginResponse> {
        // 将协程执行移至 I/O 调度器
        return withContext(Dispatchers.IO) {
            // 阻塞网络请求代码
        }
    }
}
```

### 挂起函数

使用 `suspend` 关键字标记挂起函数：

```kotlin
suspend fun makeLoginRequest(jsonBody: String): Result<LoginResponse> {
    return withContext(Dispatchers.IO) {
        // 网络请求
    }
}
```

## 在主线程中处理结果

```kotlin
class LoginViewModel(
    private val loginRepository: LoginRepository
): ViewModel() {

    fun login(username: String, token: String) {
        // 在主线程创建协程
        viewModelScope.launch {
            val jsonBody = "{ username: \"$username\", token: \"$token\"}"
            
            // 发起网络请求并挂起执行直到完成
            val result = loginRepository.makeLoginRequest(jsonBody)
            
            // 显示结果
            when (result) {
                is Result.Success<LoginResponse> -> // 成功
                else -> // 显示错误
            }
        }
    }
}
```

## 异常处理

```kotlin
fun login(username: String, token: String) {
    viewModelScope.launch {
        val jsonBody = "{ username: \"$username\", token: \"$token\"}"
        val result = try {
            loginRepository.makeLoginRequest(jsonBody)
        } catch(e: Exception) {
            Result.Error(Exception("Network request failed"))
        }
        when (result) {
            is Result.Success<LoginResponse> -> // 成功
            else -> // 显示错误
        }
    }
}
```

## 学习资源

- [Android 上的 Kotlin 协程](https://developer.android.google.cn/kotlin/coroutines?hl=zh-cn)
- [协程概览 (JetBrains)](https://kotlinlang.org/docs/coroutines-overview.html)
- [协程指南 (JetBrains)](https://kotlinlang.org/docs/coroutines-guide.html)

## 下一步

- 学习协程高级特性（Flow、Channel）
- 实践协程在 Android 项目中的应用
- 研究 Jetpack 与协程的集成

---

*持续学习中...*
