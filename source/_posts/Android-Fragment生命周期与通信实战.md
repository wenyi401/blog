---
title: Android Fragment生命周期与通信实战
date: 2026-04-03 23:52:00
tags: [Android, Fragment, 生命周期, 通信]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Fragment 是 Android 中可复用的 UI 组件，具有自己的生命周期。理解 Fragment 的生命周期对于正确管理资源和避免内存泄漏至关重要。

## 一、生命周期回调

```kotlin
class MyFragment : Fragment() {
    override fun onAttach(context: Context) {
        super.onAttach(context)
        // 与 Activity 建立关联
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // 初始化非视图组件
    }
    
    override fun onCreateView(inflater: LayoutInflater, container: ViewGroup?, savedInstanceState: Bundle?): View {
        return inflater.inflate(R.layout.fragment_my, container, false)
    }
    
    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        // 初始化视图
    }
    
    override fun onStart() {
        super.onStart()
        // 可见时
    }
    
    override fun onResume() {
        super.onResume()
        // 可交互时
    }
}
```

## 二、Fragment 通信

### 向 Activity 传递数据

```kotlin
(activity as? MainActivity)?.onFragmentEvent(data)
```

### 使用 ViewModel

```kotlin
class SharedViewModel : ViewModel() {
    val data = MutableLiveData<String>()
}

// Fragment 中
val viewModel by activityViewModels<SharedViewModel>()
```

## 学习资源

- [fragment 生命周期 | Android Developers](https://developer.android.google.cn/guide/fragments/lifecycle?hl=zh-cn)
- [一文弄懂Fragment的生命周期](https://juejin.cn/post/7493111839438585871)

---

*持续学习中...*
