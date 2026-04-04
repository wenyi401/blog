---
title: Android依赖注入框架对比-Hilt vs Koin
date: 2026-04-03 23:44:00
tags: [Android, 依赖注入, Hilt, Koin, Dagger]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

在现代 Android 开发中，依赖注入（Dependency Injection）已成为大型项目的基石。Google 官方推出的 Hilt 和社区热门框架 Koin 是两个主流选择。

## 一、依赖注入概述

### 什么是依赖注入？

依赖注入是一种设计模式，通过外部提供对象依赖而非内部创建。

### 为什么需要依赖注入？

- **解耦代码**：降低模块间依赖
- **提高可测试性**：方便 Mock 测试
- **提高可维护性**：集中管理依赖
- **提高复用性**：依赖可复用

## 二、Hilt vs Koin 对比

| 特性 | Hilt | Koin |
|------|------|------|
| **类型** | 编译时 | 运行时 |
| **语法** | 注解 | DSL |
| **性能** | 编译时验证 | 运行时解析 |
| **学习曲线** | 较陡 | 较平缓 |
| **错误检测** | 编译时 | 运行时 |
| **与 Jetpack 集成** | 深度集成 | 需要配置 |
| **适用场景** | 大型项目 | 中小型项目 |

## 三、Hilt 使用

### 添加依赖

```gradle
plugins {
    id("com.google.dagger.hilt.android")
}

dependencies {
    implementation("com.google.dagger:hilt-android:2.57.1")
    kapt("com.google.dagger:hilt-compiler:2.57.1")
}
```

### Application 配置

```kotlin
@HiltAndroidApp
class MyApplication : Application()
```

### Activity 注入

```kotlin
@AndroidEntryPoint
class MainActivity : AppCompatActivity() {
    
    @Inject lateinit var viewModel: MyViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.doSomething()
    }
}
```

### Module 定义

```kotlin
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder().build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(client: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .client(client)
            .baseUrl("https://api.example.com")
            .build()
    }
}
```

### ViewModel 注入

```kotlin
@HiltViewModel
class MyViewModel @Inject constructor(
    private val repository: MyRepository
) : ViewModel() {
    // ...
}
```

## 四、Koin 使用

### 添加依赖

```gradle
dependencies {
    implementation("io.insert-koin:koin-android:4.0.0")
}
```

### 初始化

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        startKoin {
            androidContext(this@MyApplication)
            modules(appModule)
        }
    }
}
```

### Module 定义

```kotlin
val appModule = module {
    single { OkHttpClient.Builder().build() }
    single { 
        Retrofit.Builder()
            .client(get())
            .baseUrl("https://api.example.com")
            .build()
    }
    single { MyRepository(get()) }
    viewModel { MyViewModel(get()) }
}
```

### Activity 注入

```kotlin
class MainActivity : AppCompatActivity() {
    
    private val viewModel: MyViewModel by viewModel()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel.doSomething()
    }
}
```

## 五、作用域对比

### Hilt 作用域

| 作用域 | 生命周期 |
|--------|----------|
| @Singleton | 应用级别 |
| @ActivityScoped | Activity 生命周期 |
| @FragmentScoped | Fragment 生命周期 |
| @ViewModelScoped | ViewModel 生命周期 |

### Koin 作用域

```kotlin
// 单例
single { MyRepository() }

// Factory（每次创建新实例）
factory { MyUseCase() }

// ViewModel
viewModel { MyViewModel(get()) }

// Scoped
scope<MainActivity> {
    scoped { MyComponent() }
}
```

## 六、测试支持

### Hilt 测试

```kotlin
@HiltAndroidTest
class MyTest {
    
    @get:Rule
    var hiltRule = HiltAndroidRule(this)
    
    @Inject
    lateinit var repository: MyRepository
    
    @Test
    fun testSomething() {
        // 使用注入的依赖
    }
}
```

### Koin 测试

```kotlin
class MyTest : KoinTest {
    
    private val repository: MyRepository by inject()
    
    @Before
    fun setup() {
        startKoin {
            modules(testModule)
        }
    }
    
    @Test
    fun testSomething() {
        // 使用注入的依赖
    }
}
```

## 七、选择建议

### 选择 Hilt 的场景

- ✅ 大型企业项目
- ✅ 需要编译时验证
- ✅ 与 Jetpack 深度集成
- ✅ 团队熟悉 Dagger

### 选择 Koin 的场景

- ✅ 中小型项目
- ✅ 追求开发效率
- ✅ 团队偏好 Kotlin DSL
- ✅ 需要跨平台支持

## 八、性能对比

| 指标 | Hilt | Koin |
|------|------|------|
| **编译时间** | 较长 | 较短 |
| **运行时性能** | 相当 | 相当 |
| **启动时间** | 相当 | 相当 |

## 九、迁移建议

### 从 Dagger 迁移到 Hilt

- 使用 @HiltAndroidApp 替代 Application 组件
- 使用 @InstallIn 替代 @Module
- 使用 @AndroidEntryPoint 标注 Android 类

### 从 Koin 迁移到 Hilt

- 将 module 转换为 @Module 类
- 使用注解替代 DSL
- 添加编译器插件

## 十、最佳实践

1. **统一风格**：项目中选择一个框架
2. **模块化**：按功能划分 Module
3. **作用域合理**：选择合适的作用域
4. **测试覆盖**：确保 DI 配置正确
5. **文档完善**：记录依赖关系

## 学习资源

- [现代 Android 依赖注入之战：Koin 与 Hilt 如何选？](https://zhuanlan.zhihu.com/p/1944327065231921509)
- [现代Android依赖注入之战：选择 Koin 还是 Hilt](https://blog.csdn.net/vitaviva/article/details/150941451)
- [Android 中依赖注入（Dagger和Hit）的用法与原理](https://cloud.tencent.com/developer/article/2595884)

---

*持续学习中...*
