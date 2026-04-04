---
title: Android ViewModel深度解析
date: 2026-04-04 02:20:00
tags: [Android, ViewModel, Jetpack, 状态管理]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

ViewModel 类是业务逻辑或屏幕级状态容器，用于将状态公开给界面，并封装相关的业务逻辑。它的主要优点是可以缓存状态，并可在配置更改后持久保留相应状态。

## 一、ViewModel 的优势

### 1. 持久性

ViewModel 允许数据在配置更改（如屏幕旋转）后持久存在，无需重新提取数据。

### 2. 业务逻辑访问

ViewModel 是在界面层处理业务逻辑的正确位置，负责处理事件并委托给其他层。

## 二、ViewModel 作用域

实例化 ViewModel 时，向其传递实现 ViewModelStoreOwner 接口的对象：
- Navigation 目的地
- Navigation 图表
- Activity
- Fragment

ViewModel 会一直保留在内存中，直到其 ViewModelStoreOwner 永久消失。

## 三、实现 ViewModel

### 基本 Kotlin 实现

```kotlin
data class DiceUiState(
    val firstDieValue: Int? = null,
    val secondDieValue: Int? = null,
    val numberOfRolls: Int = 0,
)

class DiceRollViewModel : ViewModel() {
    private val _uiState = MutableStateFlow(DiceUiState())
    val uiState: StateFlow<DiceUiState> = _uiState.asStateFlow()
    
    fun rollDice() {
        _uiState.update { currentState ->
            currentState.copy(
                firstDieValue = Random.nextInt(from = 1, until = 7),
                secondDieValue = Random.nextInt(from = 1, until = 7),
                numberOfRolls = currentState.numberOfRolls + 1,
            )
        }
    }
}
```

### 在 Activity 中使用

```kotlin
import androidx.activity.viewModels

class DiceRollActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val viewModel: DiceRollViewModel by viewModels()
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect {
                    // 更新 UI
                }
            }
        }
    }
}
```

### 在 Compose 中使用

```kotlin
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun DiceRollScreen(
    viewModel: DiceRollViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // 更新 UI
}
```

## 四、SavedStateHandle

SavedStateHandle 允许在进程重新创建过程中持久保留数据：

```kotlin
class MyViewModel(
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val _data = savedStateHandle.getMutableStateFlow("key", defaultValue)
    val data: StateFlow<String> = _data
    
    fun updateData(newValue: String) {
        savedStateHandle["key"] = newValue
    }
}
```

## 五、ViewModel 生命周期

ViewModel 的生命周期与其作用域直接关联：
- **Activity**：在 activity 完成时销毁
- **Fragment**：在 fragment 分离时销毁
- **Navigation 条目**：在从返回堆栈移除时销毁

### onCleared() 方法

ViewModel 销毁时调用，用于清理资源：

```kotlin
class MyViewModel(
    private val coroutineScope: CoroutineScope =
        CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
) : ViewModel() {
    
    override fun onCleared() {
        coroutineScope.cancel()
    }
}
```

### 使用 Closeable

从 Lifecycle 2.5 开始，可以传递 Closeable 对象：

```kotlin
class CloseableCoroutineScope(
    context: CoroutineContext = SupervisorJob() + Dispatchers.Main.immediate
) : Closeable, CoroutineScope {
    override val coroutineContext: CoroutineContext = context
    override fun close() {
        coroutineContext.cancel()
    }
}

class MyViewModel(
    private val coroutineScope: CoroutineScope = CloseableCoroutineScope()
) : ViewModel(coroutineScope) {
    // ViewModel 逻辑
}
```

## 六、ViewModel 与协程

### viewModelScope

ViewModel 内置的 CoroutineScope，自动遵循 ViewModel 生命周期：

```kotlin
class MyViewModel : ViewModel() {
    init {
        viewModelScope.launch {
            // 协程会在 ViewModel 清除时自动取消
        }
    }
}
```

## 七、最佳实践

### 1. 用作屏幕级状态容器

ViewModel 应该作为屏幕级状态容器，不要用于可复用的 UI 组件。

```kotlin
// 正确：屏幕级 ViewModel
class UserProfileViewModel : ViewModel()

// 错误：不要为可复用组件创建 ViewModel
class ChipViewModel : ViewModel() // 不推荐
```

### 2. 不暴露 UI 实现细节

使用通用名称，适应不同设备类型：

```kotlin
// 推荐
class ProfileViewModel : ViewModel() {
    sealed class State {
        object Loading : State()
        data class Success(val data: UserProfile) : State()
        data class Error(val message: String) : State()
    }
}

// 不推荐
class PhoneProfileViewModel : ViewModel() // 设备特定
```

### 3. 避免内存泄漏

ViewModel 不应保留 Context 或 Resources 的引用：

```kotlin
// 错误：持有 Context 引用
class MyViewModel(private val context: Context) : ViewModel()

// 正确：使用 Application Context 或依赖注入
class MyViewModel(private val application: Application) : ViewModel()
```

### 4. 不要传递 ViewModel

ViewModel 应该靠近平台管理：

```kotlin
// 错误：传递 ViewModel
fun someFunction(viewModel: MyViewModel) { }

// 正确：在需要的地方获取 ViewModel
class MyActivity : AppCompatActivity() {
    private val viewModel: MyViewModel by viewModels()
}
```

## 八、常见问题

### 问题 1：ViewModel 在配置更改后丢失数据

**原因**：未正确使用 ViewModel。

**解决方案**：确保 ViewModel 作用域正确，使用 by viewModels() 委托。

### 问题 2：ViewModel 内存泄漏

**原因**：ViewModel 持有 Context 或其他生命周期敏感对象的引用。

**解决方案**：
- 使用 Application Context
- 使用依赖注入框架
- 在 onCleared() 中清理引用

### 问题 3：ViewModel 与 Compose 配合问题

**原因**：将 ViewModel 作用域限定为可组合项。

**解决方案**：将 ViewModel 作用域限定为 Navigation 目的地或 Activity。

## 学习资源

- [ViewModel 概览 | Android Developers](https://developer.android.google.cn/topic/libraries/architecture/viewmodel?hl=zh-cn)
- [界面层 | Android Developers](https://developer.android.google.cn/topic/architecture/ui-layer?hl=zh-cn)

---

*深入学习中...*
