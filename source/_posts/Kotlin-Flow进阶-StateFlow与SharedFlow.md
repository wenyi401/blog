---
title: Kotlin Flow进阶-StateFlow与SharedFlow
date: 2026-04-03 23:10:00
tags: [Kotlin, Flow, StateFlow, SharedFlow, 协程]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Kotlin Flow 是协程库中用于处理异步数据流的核心组件。除了普通的冷流 Flow 之外，还提供了热流 StateFlow 和 SharedFlow，用于状态管理和事件分发。

## 一、冷流 vs 热流

### 冷流（Cold Flow）

- **定义**：只有当订阅者发起订阅时，事件的发送者才会开始发送事件
- **特点**：每个订阅者都会收到独立的数据流
- **代表**：`Flow`

```kotlin
fun produceFlow(): Flow<Int> = flow {
    for (i in 1..3) {
        delay(100)
        emit(i)
    }
}

// 每次收集都会重新执行
produceFlow().collect { println(it) } // 1, 2, 3
produceFlow().collect { println(it) } // 1, 2, 3
```

### 热流（Hot Flow）

- **定义**：不管订阅者是否存在，只要发送了事件就会被消费
- **特点**：多个订阅者共享同一个数据流
- **代表**：`StateFlow`、`SharedFlow`

---

## 二、StateFlow

### 定义

`StateFlow` 是一个状态容器式可观察数据流，用于存储当前状态并向其收集器发送更新。

### 特点

- **热流**：始终活跃，即使没有订阅者
- **必须有初始值**：构造时需要提供初始值
- **值唯一性**：只保留最新的值
- **线程安全**：可以在多线程环境中安全使用
- **去重**：只有值真正改变时才会发送更新

### 基本使用

```kotlin
class MainViewModel : ViewModel() {
    // 私有可变状态流
    private val _uiState = MutableStateFlow(UiState.Loading)
    
    // 公开只读状态流
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    fun updateState(newState: UiState) {
        _uiState.value = newState
    }
}

data class UiState(
    val isLoading: Boolean = false,
    val data: List<Item> = emptyList(),
    val error: String? = null
)
```

### 收集状态

```kotlin
lifecycleScope.launch {
    viewModel.uiState.collect { state ->
        when (state) {
            is UiState.Loading -> showLoading()
            is UiState.Success -> showData(state.data)
            is UiState.Error -> showError(state.error)
        }
    }
}
```

### StateFlow vs LiveData

| 特性 | StateFlow | LiveData |
|------|-----------|----------|
| **初始值** | 必须 | 可选 |
| **生命周期感知** | 需要手动配置 | 自动感知 |
| **线程安全** | 是 | 是 |
| **去重** | 是 | 否 |
| **协程支持** | 原生支持 | 需要扩展 |

---

## 三、SharedFlow

### 定义

`SharedFlow` 是一个热流，用于向多个订阅者发送事件。它缓存一定数量的最近值，并将新值发送给所有订阅者。

### 特点

- **热流**：始终活跃
- **可选初始值**：不需要初始值
- **缓存**：可以配置缓存大小（replay）
- **事件广播**：适合事件分发场景

### 基本使用

```kotlin
class EventBus {
    private val _events = MutableSharedFlow<Event>()
    val events: SharedFlow<Event> = _events.asSharedFlow()
    
    suspend fun sendEvent(event: Event) {
        _events.emit(event)
    }
}

// 订阅事件
lifecycleScope.launch {
    eventBus.events.collect { event ->
        handleEvent(event)
    }
}
```

### 配置参数

```kotlin
val sharedFlow = MutableSharedFlow<String>(
    replay = 1,           // 缓存最近的1个值给新订阅者
    extraBufferCapacity = 0,  // 额外缓冲区大小
    onBufferOverflow = BufferOverflow.DROP_OLDEST  // 缓冲区溢出策略
)
```

### replay 参数

| replay 值 | 行为 |
|-----------|------|
| `0` | 新订阅者不会收到之前的值 |
| `1` | 新订阅者收到最近的1个值 |
| `n` | 新订阅者收到最近的n个值 |

---

## 四、StateFlow vs SharedFlow

| 特性 | StateFlow | SharedFlow |
|------|-----------|------------|
| **初始值** | 必须 | 可选 |
| **用途** | 状态管理 | 事件分发 |
| **去重** | 自动去重 | 不去重 |
| **replay** | 固定为1 | 可配置 |
| **典型场景** | UI 状态 | 导航事件、Toast |

---

## 五、shareIn 和 stateIn

### shareIn - 将冷流转换为热流

```kotlin
val sharedFlow = flow {
    emit(1)
    emit(2)
    emit(3)
}.shareIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    replay = 1
)
```

### stateIn - 将冷流转换为 StateFlow

```kotlin
val stateFlow = flow {
    emit(1)
    emit(2)
    emit(3)
}.stateIn(
    scope = viewModelScope,
    started = SharingStarted.WhileSubscribed(5000),
    initialValue = 0
)
```

### SharingStarted 策略

| 策略 | 描述 |
|------|------|
| `Eagerly` | 立即开始，永不停止 |
| `Lazily` | 第一个订阅者出现时开始，永不停止 |
| `WhileSubscribed` | 有订阅者时开始，无订阅者时停止 |

---

## 六、最佳实践

### 使用 StateFlow 管理 UI 状态

```kotlin
class MainViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(UiState())
    val uiState: StateFlow<UiState> = _uiState.asStateFlow()
    
    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val data = repository.getData()
                _uiState.update { it.copy(isLoading = false, data = data) }
            } catch (e: Exception) {
                _uiState.update { it.copy(isLoading = false, error = e.message) }
            }
        }
    }
}
```

### 使用 SharedFlow 处理一次性事件

```kotlin
class MainViewModel : ViewModel() {
    private val _navigation = MutableSharedFlow<NavDestination>()
    val navigation: SharedFlow<NavDestination> = _navigation.asSharedFlow()
    
    fun navigateTo(destination: NavDestination) {
        viewModelScope.launch {
            _navigation.emit(destination)
        }
    }
}
```

---

## 学习资源

- [StateFlow and SharedFlow | Android Developers](https://developer.android.com/kotlin/flow/stateflow-and-sharedflow)
- [Kotlin Flow Deep Dive](https://medium.com/@mahesh31.ambekar/kotlin-flow-deep-dive-cold-vs-hot-streams-stateflow-sharedflow-backpressure-explained-8f56fd673212)
- [Kotlin中 Flow、SharedFlow与StateFlow区别](https://blog.csdn.net/chuyouyinghe/article/details/132586092)

---

*持续学习中...*
