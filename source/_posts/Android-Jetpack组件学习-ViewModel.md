---
title: Android Jetpack组件学习-ViewModel
date: 2026-04-03 15:36:00
tags: [Android, Jetpack, ViewModel, LiveData, Kotlin]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

ViewModel 是 Android Jetpack 的核心组件之一，用于管理 UI 相关的数据，避免因配置变更（如屏幕旋转）导致数据丢失。

## ViewModel 概述

ViewModel 类是一种业务逻辑或屏幕级状态容器，用于：
- 将状态公开给界面
- 封装相关的业务逻辑

### 主要优点

- **持久性**：在配置更改（如屏幕旋转）后持久保留状态
- **业务逻辑访问**：提供对业务逻辑的访问权限

## 实现 ViewModel

### 基本示例

```kotlin
data class DiceUiState(
    val firstDieValue: Int? = null,
    val secondDieValue: Int? = null,
    val numberOfRolls: Int = 0,
)

class DiceRollViewModel : ViewModel() {
    // 暴露屏幕 UI 状态
    private val _uiState = MutableStateFlow(DiceUiState())
    val uiState: StateFlow<DiceUiState> = _uiState.asStateFlow()

    // 处理业务逻辑
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
        // 使用 'by viewModels()' Kotlin 属性委托
        val viewModel: DiceRollViewModel by viewModels()
        
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.uiState.collect {
                    // 更新 UI 元素
                }
            }
        }
    }
}
```

### 在 Jetpack Compose 中使用

```kotlin
import androidx.lifecycle.viewmodel.compose.viewModel

@Composable
fun DiceRollScreen(
    viewModel: DiceRollViewModel = viewModel()
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    // 更新 UI 元素
}
```

## ViewModel 生命周期

ViewModel 的生命周期与其作用域直接关联：
- **对于 activity**：在 activity 完成时销毁
- **对于 fragment**：在 fragment 分离时销毁
- **对于 Navigation 条目**：在 Navigation 条目从返回堆栈中移除时销毁

## 作用域

实例化 ViewModel 时，向其传递实现 `ViewModelStoreOwner` 接口的对象：
- ComponentActivity
- Fragment
- NavBackStackEntry

## SavedStateHandle

`SavedStateHandle` 允许在进程重新创建过程中持久保留数据：
- 配置更改后持久保留数据
- 进程重新创建后持久保留数据
- 即使用户关闭应用再打开，界面状态也能保持

## 协程支持

ViewModel 支持 Kotlin 协程：

```kotlin
class MyViewModel : ViewModel() {
    fun loadData() {
        viewModelScope.launch {
            // 异步操作
        }
    }
}
```

## 与 LiveData 配合

```kotlin
class MyViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data

    fun updateData(newValue: String) {
        _data.value = newValue
    }
}
```

## 最佳实践

1. **不要在 ViewModel 中持有 Activity/Fragment 引用**
2. **使用 viewModelScope 管理协程**
3. **使用 StateFlow 或 LiveData 暴露状态**
4. **将业务逻辑放在 ViewModel 中**

## 学习资源

- [ViewModel 概览](https://developer.android.google.cn/topic/libraries/architecture/viewmodel?hl=zh-cn)
- [Room + ViewModel + LiveData 综合使用](https://blog.csdn.net/shulianghan/article/details/130816155)
- [将 Kotlin 协程与 Android 架构组件一起使用](https://developer.android.google.cn/topic/libraries/architecture/coroutines?hl=zh-cn)

## 下一步

- 学习 LiveData 数据观察
- 学习 Room 数据库
- 学习 Navigation 导航组件

---

*持续学习中...*
