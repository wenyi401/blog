---
title: Android Jetpack组件学习-Hilt依赖注入
date: 2026-04-03 22:44:00
tags: [Android, Jetpack, Hilt, 依赖注入, Kotlin]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Hilt 是 Android 的依赖项注入库，可减少在项目中执行手动依赖项注入的样板代码。它在热门 DI 库 Dagger 的基础上构建而成，提供了编译时正确性、运行时性能和可伸缩性。

## Hilt 概述

### 为什么使用依赖项注入？

- **代码可重用性**：依赖项与使用它们的类解耦
- **易于重构**：依赖项在一个地方管理
- **易于测试**：可以轻松替换依赖项进行测试

### Hilt 优势

- 减少样板代码
- 自动管理生命周期
- 编译时验证
- 与 Android 类无缝集成

## 添加依赖项

### 1. 添加 Gradle 插件

**项目级 build.gradle:**
```gradle
plugins {
    id("com.google.dagger.hilt.android") version "2.57.1" apply false
}
```

**app/build.gradle:**
```gradle
plugins {
    id("com.google.devtools.ksp")
    id("com.google.dagger.hilt.android")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.57.1")
    ksp("com.google.dagger:hilt-android-compiler:2.57.1")
}
```

### 2. 启用 Java 8

```gradle
android {
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
}
```

## Hilt 应用类

所有使用 Hilt 的应用都必须包含一个带有 `@HiltAndroidApp` 注解的 Application 类：

```kotlin
@HiltAndroidApp
class ExampleApplication : Application() { ... }
```

这会触发 Hilt 的代码生成操作，生成应用级依赖项容器。

## 将依赖项注入 Android 类

### 使用 @AndroidEntryPoint

```kotlin
@AndroidEntryPoint
class ExampleActivity : AppCompatActivity() {
    @Inject lateinit var analytics: AnalyticsAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // analytics 已自动注入
    }
}
```

### 支持的 Android 类

| 类 | 注解 |
|----|------|
| Application | @HiltAndroidApp |
| ViewModel | @HiltViewModel |
| Activity | @AndroidEntryPoint |
| Fragment | @AndroidEntryPoint |
| View | @AndroidEntryPoint |
| Service | @AndroidEntryPoint |
| BroadcastReceiver | @AndroidEntryPoint |

## 定义 Hilt 绑定

### 构造函数注入

在类的构造函数中使用 `@Inject` 注解：

```kotlin
class AnalyticsAdapter @Inject constructor(
    private val service: AnalyticsService
) { ... }
```

## Hilt 模块

当类型不能通过构造函数注入时（如接口、外部库类），使用 Hilt 模块。

### 使用 @Binds 注入接口实例

```kotlin
interface AnalyticsService {
    fun analyticsMethods()
}

class AnalyticsServiceImpl @Inject constructor() : AnalyticsService { ... }

@Module
@InstallIn(ActivityComponent::class)
abstract class AnalyticsModule {
    @Binds
    abstract fun bindAnalyticsService(
        analyticsServiceImpl: AnalyticsServiceImpl
    ): AnalyticsService
}
```

### 使用 @Provides 注入实例

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    fun provideAnalyticsService(): AnalyticsService {
        return Retrofit.Builder()
            .baseUrl("https://example.com")
            .build()
            .create(AnalyticsService::class.java)
    }
}
```

## 组件作用域

| 组件 | 作用域 | 生命周期 |
|------|--------|----------|
| SingletonComponent | @Singleton | 应用生命周期 |
| ActivityComponent | @ActivityScoped | Activity 生命周期 |
| FragmentComponent | @FragmentScoped | Fragment 生命周期 |
| ViewModelComponent | @ViewModelScoped | ViewModel 生命周期 |

## 为同一类型提供多个绑定

使用限定符（Qualifier）区分不同的绑定：

```kotlin
@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class AuthInterceptorOkHttpClient

@Qualifier
@Retention(AnnotationRetention.BINARY)
annotation class OtherInterceptorOkHttpClient

@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @AuthInterceptorOkHttpClient
    @Provides
    fun provideAuthInterceptorOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().build()
    }
    
    @OtherInterceptorOkHttpClient
    @Provides
    fun provideOtherInterceptorOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().build()
    }
}
```

## ViewModel 注入

```kotlin
@HiltViewModel
class MyViewModel @Inject constructor(
    private val repository: MyRepository
) : ViewModel() {
    // ...
}

@AndroidEntryPoint
class MyActivity : AppCompatActivity() {
    private val viewModel: MyViewModel by viewModels()
}
```

## 测试

### 设置测试环境

```kotlin
@HiltAndroidTest
class ExampleTest {
    @get:Rule
    var hiltRule = HiltAndroidRule(this)
    
    @Inject
    lateinit var analytics: AnalyticsService
    
    @Test
    fun testSomething() {
        // 使用注入的依赖项
    }
}
```

## 最佳实践

1. **优先使用构造函数注入**
2. **为模块选择正确的作用域**
3. **使用限定符区分同一类型的多个绑定**
4. **在测试中使用 @HiltAndroidTest**

## 学习资源

- [使用 Hilt 实现依赖项注入](https://developer.android.google.cn/training/dependency-injection/hilt-android?hl=zh-cn)
- [Android Hilt Codelab](https://developers.google.com/codelabs/android-hilt?hl=zh-cn)
- [Hilt 和 Dagger](https://developer.android.google.cn/training/dependency-injection/dagger-basics?hl=zh-cn)

## 下一步

- 学习 Paging 3（分页加载）
- 实践 Hilt 在完整项目中的应用
- 探索 Hilt 与其他 Jetpack 组件的集成

---

*持续学习中...*
