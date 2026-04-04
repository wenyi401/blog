---
title: Android组件化架构学习-ARouter路由框架
date: 2026-04-03 23:39:00
tags: [Android, 组件化, ARouter, 路由, 模块化]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

ARouter 是阿里巴巴开源的 Android 组件化路由框架，通过解耦模块依赖，实现跨模块跳转与服务调用。

## 一、为什么需要 ARouter？

### 组件化的问题

- 模块间无法直接引用
- Intent 跳转耦合严重
- 服务调用困难

### ARouter 解决方案

- 路由跳转
- 参数自动注入
- 服务发现
- 拦截器机制

## 二、添加依赖

```gradle
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                arguments = [AROUTER_MODULE_NAME: project.getName()]
            }
        }
    }
}

dependencies {
    implementation 'com.alibaba:arouter-api:1.5.2'
    kapt 'com.alibaba:arouter-compiler:1.5.2'
}
```

## 三、基本使用

### 初始化

```kotlin
class MyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        ARouter.init(this)
    }
}
```

### 定义路由

```kotlin
@Route(path = "/user/profile")
class ProfileActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_profile)
    }
}
```

### 路由跳转

```kotlin
// 简单跳转
ARouter.getInstance()
    .build("/user/profile")
    .navigation()

// 带参数跳转
ARouter.getInstance()
    .build("/user/profile")
    .withString("userId", "123")
    .withInt("age", 25)
    .navigation()

// 获取跳转结果
ARouter.getInstance()
    .build("/user/profile")
    .navigation(this, object : NavigationCallback {
        override fun onFound(postcard: Postcard) {}
        override fun onLost(postcard: Postcard) {}
        override fun onArrival(postcard: Postcard) {}
        override fun onInterrupt(postcard: Postcard) {}
    })
```

## 四、参数自动注入

### 定义字段

```kotlin
@Route(path = "/user/detail")
class UserDetailActivity : AppCompatActivity() {
    
    @Autowired
    lateinit var userId: String
    
    @Autowired
    var age: Int = 0
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ARouter.getInstance().inject(this)
        
        println("userId: $userId, age: $age")
    }
}
```

## 五、服务发现

### 定义服务接口

```kotlin
interface IUserService : IProvider {
    fun getUserName(): String
}
```

### 实现服务

```kotlin
@Route(path = "/service/user")
class UserServiceImpl : IUserService {
    override fun getUserName(): String {
        return "Alice"
    }
    
    override fun init(context: Context) {}
}
```

### 使用服务

```kotlin
// 通过路径获取
val userService = ARouter.getInstance()
    .build("/service/user")
    .navigation() as IUserService

// 通过类获取
val userService = ARouter.getInstance()
    .navigation(IUserService::class.java)
```

## 六、拦截器

### 定义拦截器

```kotlin
@Interceptor(priority = 1, name = "LoginInterceptor")
class LoginInterceptor : IInterceptor {
    override fun process(postcard: Postcard, callback: InterceptorCallback) {
        if (isLogin()) {
            callback.onContinue(postcard)
        } else {
            callback.onInterrupt(null)
        }
    }
    
    override fun init(context: Context) {}
}
```

### 使用拦截器

```kotlin
@Route(path = "/user/profile", extras = Consts.REQUIRE_LOGIN)
class ProfileActivity : AppCompatActivity() {
    // ...
}
```

## 七、路由组

```kotlin
@Route(path = "/user/profile", group = "user")
class ProfileActivity : AppCompatActivity()

@Route(path = "/order/list", group = "order")
class OrderListActivity : AppCompatActivity()
```

## 八、最佳实践

1. **统一路径管理**：使用常量类管理路由路径
2. **拦截器优先级**：合理设置拦截器优先级
3. **服务单例**：服务实现应为单例模式
4. **错误处理**：实现 NavigationCallback 处理跳转失败

## 学习资源

- [ARouter GitHub](https://github.com/alibaba/ARouter)
- [ARouter终极指南](https://blog.csdn.net/gitblog_00315/article/details/151470189)
- [Android组件化路由框架原理深入解析](https://juejin.cn/post/7527204643325050907)

---

*持续学习中...*
