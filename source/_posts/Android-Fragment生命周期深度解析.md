---
title: Android Fragment生命周期深度解析
date: 2026-04-04 00:20:00
tags: [Android, Fragment, 生命周期, Lifecycle]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

每个 Fragment 实例都有自己的生命周期。Fragment 实现 LifecycleOwner 接口，公开可通过 getLifecycle() 方法访问的 Lifecycle 对象。本文将深入解析 Fragment 生命周期的核心概念。

## 一、生命周期状态

Fragment 的 Lifecycle.State 枚举包含以下状态：

| 状态 | 说明 |
|------|------|
| INITIALIZED | 已实例化，但未添加到 FragmentManager |
| CREATED | 已添加到 FragmentManager |
| STARTED | 可见但不可交互 |
| RESUMED | 可见且可交互 |
| DESTROYED | 已销毁 |

## 二、Fragment 和 FragmentManager

### 状态转换规则

FragmentManager 在确定 Fragment 的生命周期状态时会考虑：
1. Fragment 的状态极限由 FragmentManager 确定
2. 可以通过 setMaxLifecycle() 设置状态极限
3. Fragment 的状态不能超过其父级

### onAttach() 和 onDetach()

```kotlin
class MyFragment : Fragment() {
    override fun onAttach(context: Context) {
        super.onAttach(context)
        // Fragment 已附加到宿主 Activity
        // 此时处于活跃状态
    }
    
    override fun onDetach() {
        super.onDetach()
        // Fragment 已从宿主 Activity 分离
        // 不再处于活跃状态
    }
}
```

## 三、向上状态转换

### CREATED 状态

```kotlin
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // savedInstanceState 包含之前保存的状态
    // 首次创建时为 null，后续重建时非 null
}
```

**关键点**：
- Fragment 已添加到 FragmentManager
- onAttach() 已调用
- 可以通过 SavedStateRegistry 恢复状态
- 视图尚未创建

### CREATED，视图 INITIALIZED

```kotlin
// 方式一：使用构造函数传入布局
class MyFragment : Fragment(R.layout.fragment_my)

// 方式二：重写 onCreateView
override fun onCreateView(
    inflater: LayoutInflater,
    container: ViewGroup?,
    savedInstanceState: Bundle?
): View {
    return inflater.inflate(R.layout.fragment_my, container, false)
}

override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
    super.onViewCreated(view, savedInstanceState)
    // 视图已创建，可以初始化视图组件
    // 适合设置 RecyclerView 适配器、观察 LiveData
}
```

### CREATED，视图 CREATED

```kotlin
override fun onViewStateRestored(savedInstanceState: Bundle?) {
    super.onViewStateRestored(savedInstanceState)
    // 视图状态已恢复
    // 适合恢复与视图相关的状态
}
```

### STARTED 状态

```kotlin
override fun onStart() {
    super.onStart()
    // Fragment 可见但不可交互
    // 适合开始生命周期感知型组件
}
```

**最佳实践**：
- STARTED 状态最适合执行 FragmentTransaction
- 确保视图已创建且可用

### RESUMED 状态

```kotlin
override fun onResume() {
    super.onResume()
    // Fragment 可见且可交互
    // 所有动画和转场效果已完成
}
```

**注意**：
- 只有 RESUMED 状态才应手动设置焦点
- 只有 RESUMED 状态才应处理输入法可见性

## 四、向下状态转换

### STARTED 状态

```kotlin
override fun onPause() {
    super.onPause()
    // 用户开始离开 Fragment
    // Fragment 仍然可见
}
```

### CREATED 状态

```kotlin
override fun onStop() {
    super.onStop()
    // Fragment 不再可见
    // ON_STOP 事件是安全执行 FragmentTransaction 的最后时机
}
```

**API 级别差异**：

| API 级别 | onStop() 和 onSaveInstanceState() 顺序 |
|----------|----------------------------------------|
| API < 28 | onSaveInstanceState() 在 onStop() 之前 |
| API ≥ 28 | onStop() 在 onSaveInstanceState() 之前 |

### CREATED，视图 DESTROYED

```kotlin
override fun onDestroyView() {
    super.onDestroyView()
    // 视图已与窗口分离
    // 应移除对视图的所有引用，避免内存泄漏
}
```

### DESTROYED 状态

```kotlin
override fun onDestroy() {
    super.onDestroy()
    // Fragment 已被移除或 FragmentManager 已销毁
    // Fragment 生命周期结束
}
```

## 五、视图生命周期

Fragment 的视图有独立的生命周期：

```kotlin
// 获取视图生命周期所有者
val viewLifecycleOwner = viewLifecycleOwner

// 观察视图生命周期
viewLifecycleOwnerLiveData.observe(this) { lifecycleOwner ->
    // 视图生命周期变化
}
```

**使用场景**：
- 观察只在视图存在时有效的 LiveData
- 在视图中设置 RecyclerView 适配器
- 管理视图相关的资源

## 六、生命周期最佳实践

### 使用生命周期感知型组件

```kotlin
class LocationObserver : DefaultLifecycleObserver {
    override fun onStart(owner: LifecycleOwner) {
        // 开始监听位置
    }
    
    override fun onStop(owner: LifecycleOwner) {
        // 停止监听位置
    }
}

class MyFragment : Fragment() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        lifecycle.addObserver(LocationObserver())
    }
}
```

### 避免内存泄漏

```kotlin
class MyFragment : Fragment() {
    private var binding: FragmentMyBinding? = null
    
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        binding = FragmentMyBinding.inflate(inflater, container, false)
        return binding!!.root
    }
    
    override fun onDestroyView() {
        super.onDestroyView()
        binding = null  // 清除引用
    }
}
```

### 正确执行 FragmentTransaction

```kotlin
override fun onStop() {
    super.onStop()
    // ON_STOP 是安全执行 FragmentTransaction 的最后时机
    childFragmentManager.beginTransaction()
        .remove(childFragment)
        .commit()
}
```

## 七、常见问题

### 问题 1：FragmentTransaction 在错误的生命周期状态执行

**原因**：在 onSaveInstanceState() 之后执行事务。

**解决方案**：
- 在 ON_STOP 之前执行事务
- 使用 commitNowAllowingStateLoss()

### 问题 2：视图状态丢失

**原因**：未正确处理视图生命周期。

**解决方案**：
- 在 onViewStateRestored() 中恢复视图状态
- 使用 ViewModel 存储数据

### 问题 3：内存泄漏

**原因**：在 onDestroyView() 后仍持有视图引用。

**解决方案**：
- 在 onDestroyView() 中清除所有视图引用
- 使用 ViewBinding 并置为 null

## 学习资源

- [fragment 生命周期 | Android Developers](https://developer.android.google.cn/guide/fragments/lifecycle?hl=zh-cn)
- [一文弄懂Fragment的生命周期](https://juejin.cn/post/7493111839438585871)

---

*深入学习中...*
