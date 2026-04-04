---
title: Android Jetpack组件学习-LiveData
date: 2026-04-03 16:21:00
tags: [Android, Jetpack, LiveData, ViewModel, Kotlin]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

LiveData 是 Android Jetpack 的核心组件之一，是一种可观察的数据存储器类，具有生命周期感知能力。

## LiveData 概述

LiveData 遵循观察者模式，当底层数据发生变化时，会通知 Observer 对象。它的生命周期感知能力确保 LiveData 仅更新处于活跃生命周期状态的应用组件观察者。

### 生命周期感知

如果观察者的生命周期处于 STARTED 或 RESUMED 状态，LiveData 会认为该观察者处于活跃状态。

## 使用 LiveData 的优势

1. **确保界面符合数据状态** - 当数据变化时自动通知 Observer 更新界面
2. **不会发生内存泄漏** - 观察者绑定到 Lifecycle 对象，生命周期销毁后自动清理
3. **不会因 Activity 停止而导致崩溃** - 非活跃状态不接收事件
4. **不再需要手动处理生命周期** - LiveData 自动管理
5. **数据始终保持最新状态** - 非活跃变为活跃时接收最新数据
6. **适当的配置更改** - 设备旋转后立即接收最新数据
7. **共享资源** - 可使用单例模式扩展 LiveData

## 使用步骤

1. 创建 LiveData 实例（通常在 ViewModel 中）
2. 创建 Observer 对象定义 onChanged() 方法
3. 使用 observe() 方法将 Observer 附加到 LiveData

## 创建 LiveData 对象

```kotlin
class NameViewModel : ViewModel() {
    // 创建一个包含 String 的 LiveData
    val currentName: MutableLiveData<String> by lazy {
        MutableLiveData<String>()
    }
    
    // 更新数据
    fun updateName(name: String) {
        currentName.value = name
    }
}
```

## 观察 LiveData 对象

### 在 Activity 中

```kotlin
class MainActivity : AppCompatActivity() {
    private val viewModel: NameViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // 观察 LiveData
        viewModel.currentName.observe(this, Observer { newName ->
            // 更新 UI
            textView.text = newName
        })
    }
}
```

### 在 Fragment 中

```kotlin
class MyFragment : Fragment() {
    private val viewModel: NameViewModel by viewModels()

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        
        viewModel.currentName.observe(viewLifecycleOwner, Observer { newName ->
            // 更新 UI
        })
    }
}
```

## MutableLiveData vs LiveData

- **LiveData** - 只读，只能观察
- **MutableLiveData** - 可修改，提供 setValue() 和 postValue() 方法

```kotlin
class MyViewModel : ViewModel() {
    // 私有可变 LiveData
    private val _data = MutableLiveData<String>()
    // 公开只读 LiveData
    val data: LiveData<String> = _data

    fun updateData(newValue: String) {
        _data.value = newValue  // 在主线程
        // 或 _data.postValue(newValue)  // 在后台线程
    }
}
```

## 与 Room 配合

Room 支持 LiveData 返回类型：

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): LiveData<List<User>>
}
```

当数据库数据变化时，LiveData 自动通知观察者。

## 转换 LiveData

### map

```kotlin
val userLiveData: LiveData<User> = ...
val nameLiveData: LiveData<String> = Transformations.map(userLiveData) {
    it.name
}
```

### switchMap

```kotlin
val userIdLiveData: LiveData<String> = ...
val userLiveData: LiveData<User> = Transformations.switchMap(userIdLiveData) {
    repository.getUser(it)
}
```

## 最佳实践

1. **在 ViewModel 中保存 LiveData 对象**
2. **暴露不可变的 LiveData 给 UI 层**
3. **在 onCreate() 中开始观察**
4. **使用 viewLifecycleOwner 观察 Fragment 中的 LiveData**

## 学习资源

- [LiveData 概览](https://developer.android.google.cn/topic/libraries/architecture/livedata?hl=zh-cn)
- [Room + ViewModel + LiveData 综合使用](https://blog.csdn.net/shulianghan/article/details/130816155)

## 下一步

- 学习 Room 数据库
- 学习 DataBinding
- 学习 Kotlin Flow（LiveData 的现代替代方案）

---

*持续学习中...*
