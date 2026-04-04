---
title: Kotlin Multiplatform Ktor网络请求学习
date: 2026-04-03 23:40:00
tags: [Kotlin, KMP, Ktor, 网络请求, 跨平台]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Ktor HTTP 客户端可以在多平台项目中使用。本文将介绍如何在 Kotlin Multiplatform Mobile 应用中使用 Ktor 进行网络请求。

## 一、添加依赖

### 版本目录

```toml
# gradle/libs.versions.toml
[versions]
ktor = "3.4.2"
kotlinx-coroutines = "1.10.2"

[libraries]
ktor-client-core = { module = "io.ktor:ktor-client-core", version.ref = "ktor" }
ktor-client-okhttp = { module = "io.ktor:ktor-client-okhttp", version.ref = "ktor" }
ktor-client-darwin = { module = "io.ktor:ktor-client-darwin", version.ref = "ktor" }
kotlinx-coroutines-core = { module = "org.jetbrains.kotlinx:kotlinx-coroutines-core", version.ref = "kotlinx-coroutines" }
```

### 共享模块

```kotlin
// shared/build.gradle.kts
sourceSets {
    commonMain.dependencies {
        implementation(libs.ktor.client.core)
        implementation(libs.kotlinx.coroutines.core)
    }
    androidMain.dependencies {
        implementation(libs.ktor.client.okhttp)
    }
    iosMain.dependencies {
        implementation(libs.ktor.client.darwin)
    }
}
```

## 二、创建 HttpClient

### 基本配置

```kotlin
import io.ktor.client.HttpClient
import io.ktor.client.engine.okhttp.OkHttp

class Greeting {
    private val client = HttpClient()
    
    suspend fun greet(): String {
        val response = client.get("https://ktor.io/docs/")
        return response.bodyAsText()
    }
}
```

### 自定义配置

```kotlin
val client = HttpClient {
    install(ContentNegotiation) {
        json(Json {
            ignoreUnknownKeys = true
            prettyPrint = true
        })
    }
    install(Logging) {
        level = LogLevel.ALL
    }
    install(HttpTimeout) {
        requestTimeoutMillis = 30000
        connectTimeoutMillis = 10000
    }
}
```

## 三、发送请求

### GET 请求

```kotlin
suspend fun getUser(id: String): User {
    return client.get("https://api.example.com/users/$id").body()
}
```

### POST 请求

```kotlin
suspend fun createUser(user: User): User {
    return client.post("https://api.example.com/users") {
        contentType(ContentType.Application.Json)
        setBody(user)
    }.body()
}
```

### 带参数请求

```kotlin
suspend fun searchUsers(query: String): List<User> {
    return client.get("https://api.example.com/users") {
        parameter("q", query)
        parameter("limit", 10)
    }.body()
}
```

## 四、响应处理

### 基本响应

```kotlin
val response: HttpResponse = client.get("https://api.example.com/data")

// 状态码
val status = response.status

// 响应头
val headers = response.headers

// 响应体
val text = response.bodyAsText()
```

### JSON 解析

```kotlin
// 使用 ContentNegotiation 插件
val user: User = client.get("https://api.example.com/user/1").body()

// 列表
val users: List<User> = client.get("https://api.example.com/users").body()
```

## 五、错误处理

### 异常捕获

```kotlin
suspend fun safeRequest(): Result<User> = runCatching {
    client.get("https://api.example.com/user/1").body()
}

// 使用
when (val result = safeRequest()) {
    is Result.Success -> println(result.data)
    is Result.Failure -> println(result.exception)
}
```

### 响应验证

```kotlin
suspend fun fetchUser(id: String): User {
    val response = client.get("https://api.example.com/users/$id")
    
    if (!response.status.isSuccess()) {
        throw ApiException(response.status)
    }
    
    return response.body()
}
```

## 六、拦截器

### 请求拦截

```kotlin
val client = HttpClient {
    install(HttpSend) {
        intercept { request ->
            request.headers.append("Authorization", "Bearer $token")
            execute(request)
        }
    }
}
```

### 响应拦截

```kotlin
val client = HttpClient {
    responseInterceptor { response ->
        if (response.status == HttpStatusCode.Unauthorized) {
            // 刷新 token
        }
    }
}
```

## 七、Android 使用

```kotlin
// App.kt
@Composable
fun App() {
    var text by remember { mutableStateOf("Loading...") }
    
    LaunchedEffect(Unit) {
        text = Greeting().greet()
    }
    
    Text(text = text)
}
```

## 八、iOS 使用

```swift
// ContentView.swift
struct ContentView: View {
    @State private var text = "Loading..."
    
    var body: some View {
        Text(text)
            .onAppear {
                Greeting().greet { result in
                    DispatchQueue.main.async {
                        self.text = result
                    }
                }
            }
    }
}
```

## 九、最佳实践

1. **单例 HttpClient**：重用客户端实例
2. **依赖注入**：使用 Koin 或 Dagger 注入
3. **错误处理**：统一处理网络错误
4. **缓存策略**：合理使用缓存
5. **取消请求**：正确处理协程取消

## 学习资源

- [Creating a cross-platform mobile application | Ktor](https://ktor.io/docs/client-create-multiplatform-application.html)
- [Kotlin Multiplatform网络请求：Ktor集成与最佳实践](https://blog.csdn.net/gitblog_00184/article/details/154811908)
- [Building a Production-Ready Networking Layer in KMP](https://medium.com/@shivathapaa/kmp-networking-in-production-part-1-setting-up-ktor-the-right-way-91e7fdfd3c5b)

---

*持续学习中...*
