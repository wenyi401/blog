---
title: Android Retrofit与OkHttp网络请求进阶
date: 2026-04-03 23:16:00
tags: [Android, Retrofit, OkHttp, 网络请求, 拦截器]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

在 Android 开发中，网络请求几乎是每个项目必不可少的功能模块。Retrofit + OkHttp 作为目前最主流、最稳定、最易扩展的网络请求组合，被广泛应用于各类项目中。

## 架构关系

### Retrofit vs OkHttp

| 框架 | 作用 | 关键特性 |
|------|------|----------|
| **Retrofit** | 封装网络接口 | 注解式定义、数据解析、协程支持 |
| **OkHttp** | 执行网络请求 | 连接池、缓存、拦截器、日志 |

### 关系图

```
Retrofit (上层封装)
    │
    ├── 注解解析（@GET、@POST 等）
    ├── 参数拼装（Request）
    ├── 结果解析（Converter）
    ▼
OkHttp (底层驱动)
    ├── 建立连接
    ├── 执行请求
    ├── 返回 Response
    ▼
Retrofit 将 Response 转换成 Java 对象
```

## 一、添加依赖

```kotlin
dependencies {
    // Retrofit 核心库
    implementation("com.squareup.retrofit2:retrofit:2.11.0")
    // Gson 转换器
    implementation("com.squareup.retrofit2:converter-gson:2.11.0")
    // OkHttp 核心库
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    // OkHttp 日志拦截器
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
}
```

## 二、定义 API 接口

```kotlin
interface ApiService {
    // GET 请求
    @GET("users/{id}")
    suspend fun getUser(@Path("id") id: String): UserResponse

    // POST 请求（表单）
    @FormUrlEncoded
    @POST("user/login")
    suspend fun login(
        @Field("username") username: String,
        @Field("password") password: String
    ): LoginResponse
    
    // POST 请求（JSON）
    @POST("user/register")
    suspend fun register(@Body request: RegisterRequest): RegisterResponse
}
```

## 三、构建 Retrofit 实例

```kotlin
object RetrofitClient {
    
    private const val BASE_URL = "https://api.example.com/"

    // OkHttpClient 构建
    private val okHttpClient: OkHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(10, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = HttpLoggingInterceptor.Level.BODY
            })
            .build()
    }

    // Retrofit 实例
    val instance: Retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }

    val api: ApiService by lazy { instance.create(ApiService::class.java) }
}
```

## 四、拦截器机制（核心）

### 1. 日志拦截器

```kotlin
val logging = HttpLoggingInterceptor().apply {
    level = HttpLoggingInterceptor.Level.BODY
}
```

### 2. Token 拦截器

```kotlin
class TokenInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val newRequest = chain.request().newBuilder()
            .addHeader("Authorization", "Bearer ${TokenManager.token}")
            .build()
        return chain.proceed(newRequest)
    }
}
```

### 3. 缓存拦截器

```kotlin
class CacheInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val request = chain.request()
        val response = chain.proceed(request)
        return response.newBuilder()
            .header("Cache-Control", "max-age=3600")
            .build()
    }
}
```

### 4. 错误处理拦截器

```kotlin
class ErrorInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val response = chain.proceed(chain.request())
        
        when (response.code) {
            401 -> // Token 过期，刷新 Token
            403 -> // 权限不足
            500 -> // 服务器错误
        }
        
        return response
    }
}
```

## 五、封装建议

### 安全 API 调用封装

```kotlin
object NetworkHelper {
    
    suspend fun <T> safeApiCall(call: suspend () -> T): Result<T> {
        return try {
            Result.success(call())
        } catch (e: HttpException) {
            Result.failure(Exception("网络错误: ${e.code()}"))
        } catch (e: IOException) {
            Result.failure(Exception("连接失败，请检查网络"))
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
```

### 使用示例

```kotlin
class UserViewModel : ViewModel() {
    
    private val _user = MutableStateFlow<UserResponse?>(null)
    val user: StateFlow<UserResponse?> = _user
    
    fun fetchUser(id: String) {
        viewModelScope.launch {
            val result = NetworkHelper.safeApiCall {
                RetrofitClient.api.getUser(id)
            }
            result.onSuccess { _user.value = it }
                .onFailure { /* 处理错误 */ }
        }
    }
}
```

## 六、性能优化

| 优化点 | 说明 |
|--------|------|
| ✅ 复用 OkHttpClient | 单例模式，不要每次都 new |
| ✅ 启用连接池 | Keep-Alive，减少 TCP 连接开销 |
| ✅ 开启缓存机制 | 为静态资源设置合理缓存 |
| ✅ 使用协程替代 Callback | 减少回调嵌套，提高可读性 |
| ✅ 拦截器链路分析 | 分析慢请求或 Header 问题 |

## 七、注解汇总

| 注解 | 描述 |
|------|------|
| `@GET` | GET 请求 |
| `@POST` | POST 请求 |
| `@PUT` | PUT 请求 |
| `@DELETE` | DELETE 请求 |
| `@Path` | 路径参数 |
| `@Query` | 查询参数 |
| `@Field` | 表单字段 |
| `@Body` | 请求体 |
| `@Header` | 请求头 |
| `@FormUrlEncoded` | 表单编码 |

## 学习资源

- [Retrofit 与 OkHttp 全面解析与实战使用](https://jishuzhan.net/article/1979876147216318465)
- [Retrofit 官方文档](https://square.github.io/retrofit/)
- [OkHttp 官方文档](https://square.github.io/okhttp/)

---

*持续学习中...*
