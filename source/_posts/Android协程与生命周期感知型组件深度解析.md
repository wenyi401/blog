---
title: Android协程与生命周期感知型组件深度解析
date: 2026-04-04 00:50:00
tags: [Android, Coroutines, Lifecycle, viewModelScope, lifecycleScope]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Kotlin 协程提供了异步编程的 API，结合生命周期感知型组件，可以实现自动取消长时间运行的操作，避免内存泄漏。本文将深入解析协程与生命周期的集成。

## 一、添加 KTX 依赖

```gradle
// ViewModelScope
implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.4.0")

// LifecycleScope
implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.4.0")

// liveData
implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.4.0")
```

## 二、ViewModelScope

每个 ViewModel 都定义了 ViewModelScope。当 ViewModel 清除时，此范围内的协程自动取消。

### 基本使用

```kotlin
class MyViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            // 协程会在 ViewModel 清除时自动取消
            val data = repository.fetchData()
            _data.value = data
        }
    }
}
```

### 使用场景

- 为布局计算数据
- 网络请求
- 数据库操作
- 任何只需在 ViewModel 活动时完成的工作

## 三、LifecycleScope

每个 Lifecycle 对象都定义了 LifecycleScope。当 Lifecycle 销毁时，此范围内的协程自动取消。

### 基本使用

```kotlin
class MyFragment : Fragment() {
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewLifecycleOwner.lifecycleScope.launch {
            val params = TextViewCompat.getTextMetricsParams(textView)
            val precomputedText = withContext(Dispatchers.Default) {
                PrecomputedTextCompat.create(longTextContent, params)
            }
            TextViewCompat.setPrecomputedText(textView, precomputedText)
        }
    }
}
```

## 四、可重启生命周期感知型协程

### repeatOnLifecycle

在某些情况下，需要在 Lifecycle 处于特定状态时开始执行代码块，并在其处于其他状态时取消。例如：
- Lifecycle 处于 STARTED 状态时收集数据流
- Lifecycle 处于 STOPPED 状态时取消收集

```kotlin
class MyFragment : Fragment() {
    val viewModel: MyViewModel by viewModel()
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewLifecycleOwner.lifecycleScope.launch {
            // 当 Lifecycle 至少处于 STARTED 状态时运行
            // 当 Lifecycle 处于 STOPPED 状态时取消
            viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.someDataFlow.collect {
                    // 处理数据
                }
            }
        }
    }
}
```

### flowWithLifecycle

对于单个数据流的生命周期感知型收集，可以使用简化方法：

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    exampleProvider.exampleFlow()
        .flowWithLifecycle(viewLifecycleOwner.lifecycle, Lifecycle.State.STARTED)
        .collect {
            // 处理数据
        }
}
```

### 并行收集多个数据流

如果需要并行收集多个数据流，必须在不同的协程中收集：

```kotlin
viewLifecycleOwner.lifecycleScope.launch {
    viewLifecycleOwner.repeatOnLifecycle(Lifecycle.State.STARTED) {
        launch {
            flow1.collect { /* 处理数据 */ }
        }
        
        launch {
            flow2.collect { /* 处理数据 */ }
        }
    }
}
```

## 五、挂起生命周期感知型协程

有时需要暂停执行代码块，除非 Lifecycle 处于特定状态。例如：
- 运行 FragmentTransaction 需要等待 Lifecycle 至少为 STARTED

### whenCreated / whenStarted / whenResumed

```kotlin
class MyFragment : Fragment() {
    init {
        lifecycleScope.launch {
            whenStarted {
                // 只有当 Lifecycle 至少处于 STARTED 状态时才运行
                loadingView.visibility = View.VISIBLE
                
                val canAccess = withContext(Dispatchers.IO) {
                    checkUserAccess()
                }
                
                loadingView.visibility = View.GONE
                
                if (canAccess == false) {
                    findNavController().popBackStack()
                } else {
                    showContent()
                }
            }
        }
    }
}
```

### 自动取消

如果 Lifecycle 在协程活动时被销毁，协程会自动取消：

```kotlin
lifecycleScope.launchWhenStarted {
    try {
        // 调用挂起函数
    } finally {
        // Lifecycle 变为 DESTROYED 时执行
        if (lifecycle.state >= STARTED) {
            // 安全运行 FragmentTransaction
        }
    }
}
```

## 六、将协程与 LiveData 一起使用

### liveData 构建器

使用 liveData 构建器函数可以异步计算值：

```kotlin
val user: LiveData<User> = liveData {
    val data = database.loadUser() // loadUser 是挂起函数
    emit(data)
}
```

### 发出多个值

每次 emit() 调用都会挂起代码块的执行：

```kotlin
val user: LiveData<Result> = liveData {
    emit(Result.loading())
    try {
        emit(Result.success(fetchUser()))
    } catch(ioException: Exception) {
        emit(Result.error(ioException))
    }
}
```

### 与 Transformations 结合

```kotlin
class MyViewModel : ViewModel() {
    private val userId: LiveData<String> = MutableLiveData()
    
    val user = userId.switchMap { id ->
        liveData(context = viewModelScope.coroutineContext + Dispatchers.IO) {
            emit(database.loadUserById(id))
        }
    }
}
```

### emitSource

从 LiveData 中发出多个值：

```kotlin
class MyRepository {
    fun getUser(id: String) = liveData<User> {
        val disposable = emitSource(
            userDao.getUser(id).map {
                Result.loading(it)
            }
        )
        
        try {
            val user = webservice.fetchUser(id)
            disposable.dispose()
            userDao.insert(user)
            
            emitSource(
                userDao.getUser(id).map {
                    Result.success(it)
                }
            )
        } catch(exception: IOException) {
            emitSource(
                userDao.getUser(id).map {
                    Result.error(exception, it)
                }
            )
        }
    }
}
```

## 七、最佳实践

### 1. 使用正确的 Scope

| 场景 | 推荐 Scope |
|------|-----------|
| ViewModel 中的操作 | viewModelScope |
| Fragment/Activity 中的 UI 操作 | lifecycleScope |
| 需要重启的操作 | repeatOnLifecycle |
| 需要暂停的操作 | whenStarted/whenResumed |

### 2. 选择正确的生命周期状态

| 状态 | 适用场景 |
|------|---------|
| STARTED | 收集数据流、更新 UI |
| RESUMED | 用户交互、焦点处理 |

### 3. 避免内存泄漏

```kotlin
class MyFragment : Fragment() {
    private val mainScope = MainScope()
    
    override fun onDestroy() {
        super.onDestroy()
        mainScope.cancel()  // 手动取消
    }
}
```

## 八、常见问题

### 问题 1：协程在配置更改后重启

**原因**：ViewModel 在配置更改时保留，但协程可能在 ViewModel 清除前被取消。

**解决方案**：使用 viewModelScope，它会自动处理生命周期。

### 问题 2：Flow 收集导致应用崩溃

**原因**：在 Lifecycle 处于错误状态时收集数据流。

**解决方案**：使用 repeatOnLifecycle 或 flowWithLifecycle。

### 问题 3：FragmentTransaction 异常

**原因**：在 Lifecycle 状态不正确时执行事务。

**解决方案**：使用 whenStarted 或 whenResumed。

## 学习资源

- [将 Kotlin 协程与生命周期感知型组件一起使用 | Android Developers](https://developer.android.google.cn/topic/libraries/architecture/coroutines?hl=zh-cn)
- [Android 上的协程：应用模式](https://medium.com/androiddevelopers/coroutines-on-android-part-iii-real-work-2ba8a2ec2f45)

---

*深入学习中...*
