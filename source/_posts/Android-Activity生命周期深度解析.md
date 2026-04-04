---
title: Android Activity生命周期深度解析
date: 2026-04-04 01:50:00
tags: [Android, Activity, 生命周期, Lifecycle]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

当用户浏览、退出和返回到应用时，Activity 实例会在其生命周期的不同状态间转换。Activity 类提供了许多回调，通知 Activity 状态何时发生变化。本文将深入解析 Activity 生命周期的核心概念。

## 一、生命周期概念

Activity 类提供六个核心回调：
- onCreate()
- onStart()
- onResume()
- onPause()
- onStop()
- onDestroy()

## 二、生命周期回调详解

### onCreate()

系统首次创建 Activity 时触发。Activity 进入"已创建"状态。

```kotlin
lateinit var textView: TextView
var gameState: String? = null

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    // 恢复实例状态
    gameState = savedInstanceState?.getString(GAME_STATE_KEY)
    
    // 设置布局
    setContentView(R.layout.main_activity)
    
    // 初始化视图
    textView = findViewById(R.id.text_view)
}
```

**关键点**：
- 执行基本的应用启动逻辑
- 在 Activity 整个生命周期内仅发生一次
- 收到 savedInstanceState 参数，包含之前保存的状态

### onStart()

Activity 进入"已启动"状态时调用。

```kotlin
override fun onStart() {
    super.onStart()
    // Activity 即将变为可见
}
```

**特点**：
- 应用准备 Activity 进入前台
- 界面已初始化
- Activity 不会保持"已启动"状态

### onResume()

Activity 进入"已恢复"状态，进入前台。

```kotlin
class CameraComponent : LifecycleObserver {
    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
    fun initializeCamera() {
        if (camera == null) {
            getCamera()
        }
    }
}
```

**关键点**：
- 应用与用户互动的状态
- 适合启动相机预览等前台功能
- 保持状态直到焦点转移

### onPause()

用户离开 Activity 的第一个指示。

```kotlin
class CameraComponent : LifecycleObserver {
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun releaseCamera() {
        camera?.release()
        camera = null
    }
}
```

**进入暂停状态的原因**：
- 中断事件（如来电）
- 多窗口模式下失去焦点
- 打开半透明 Activity

**注意事项**：
- 执行时间非常短
- 不适合保存数据、网络调用、数据库事务
- 已暂停的 Activity 在多窗口模式下可能仍然可见

### onStop()

Activity 不再对用户可见时调用。

```kotlin
override fun onStop() {
    super.onStop()
    
    // 保存草稿笔记
    val values = ContentValues().apply {
        put(NotePad.Notes.COLUMN_NAME_NOTE, getCurrentNoteText())
        put(NotePad.Notes.COLUMN_NAME_TITLE, getCurrentNoteTitle())
    }
    
    asyncQueryHandler.startUpdate(token, null, uri, values, null, null)
}
```

**用途**：
- 释放不需要的资源
- 执行 CPU 密集的关闭操作
- 保存数据到数据库

**注意**：Activity 停止后，系统可能销毁进程以恢复内存。

### onDestroy()

销毁 Activity 之前调用。

```kotlin
override fun onDestroy() {
    super.onDestroy()
    // 释放所有资源
}
```

**调用原因**：
- 用户完全关闭 Activity（finish()）
- 配置变更（旋转、多窗口模式）

**关键点**：
- 使用 ViewModel 管理数据
- 通过 isFinishing() 判断是否正在结束
- 最后一个生命周期回调

## 三、Activity 状态与进程优先级

| 系统终止可能性 | 进程状态 | Activity 状态 |
|---------------|----------|--------------|
| 最低 | 前台 | 已恢复 |
| 低 | 可见 | 已开始/已暂停 |
| 较高 | 背景 | 已停止 |
| 最高 | 未连接 | 已销毁 |

## 四、保存和恢复状态

### 实例状态

系统使用 Bundle 保存 Activity 的实例状态，用于在销毁后恢复。

```kotlin
// 保存状态
override fun onSaveInstanceState(outState: Bundle?) {
    outState?.run {
        putInt(STATE_SCORE, currentScore)
        putInt(STATE_LEVEL, currentLevel)
    }
    super.onSaveInstanceState(outState)
}

// 恢复状态 - 在 onCreate 中
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    if (savedInstanceState != null) {
        currentScore = savedInstanceState.getInt(STATE_SCORE)
        currentLevel = savedInstanceState.getInt(STATE_LEVEL)
    }
}

// 恢复状态 - 在 onRestoreInstanceState 中
override fun onRestoreInstanceState(savedInstanceState: Bundle?) {
    super.onRestoreInstanceState(savedInstanceState)
    savedInstanceState?.run {
        currentScore = getInt(STATE_SCORE)
        currentLevel = getInt(STATE_LEVEL)
    }
}
```

**注意**：
- onRestoreInstanceState() 仅在有保存状态时调用
- 默认实现保存视图层次结构状态
- 每个 View 必须有唯一的 android:id

### ViewModel + onSaveInstanceState

对于复杂状态，应结合使用：
- **ViewModel**：保存大量数据，在配置变更时保留
- **onSaveInstanceState**：保存少量关键数据，在进程终止时恢复

## 五、Activity 间导航

### startActivity()

```kotlin
// 启动已知 Activity
val intent = Intent(this, SignInActivity::class.java)
startActivity(intent)

// 隐式 Intent
val intent = Intent(Intent.ACTION_SEND).apply {
    putExtra(Intent.EXTRA_EMAIL, recipientArray)
}
startActivity(intent)
```

### startActivityForResult()

```kotlin
// 启动并等待结果
startActivityForResult(
    Intent(Intent.ACTION_PICK, Uri.parse("content://contacts")),
    PICK_CONTACT_REQUEST
)

// 处理结果
override fun onActivityResult(requestCode: Int, resultCode: Int, intent: Intent?) {
    when (requestCode) {
        PICK_CONTACT_REQUEST ->
            if (resultCode == RESULT_OK) {
                startActivity(Intent(Intent.ACTION_VIEW, intent?.data))
            }
    }
}
```

### Activity 协调

Activity A 启动 Activity B 的顺序：
1. Activity A 的 onPause() 执行
2. Activity B 的 onCreate()、onStart()、onResume() 依次执行
3. 如果 Activity A 不再可见，onStop() 执行

## 六、最佳实践

### 1. 使用生命周期感知型组件

```kotlin
class CameraComponent : LifecycleObserver {
    @OnLifecycleEvent(Lifecycle.Event.ON_RESUME)
    fun initializeCamera() { }
    
    @OnLifecycleEvent(Lifecycle.Event.ON_PAUSE)
    fun releaseCamera() { }
}

// 在 Activity 中使用
lifecycle.addObserver(CameraComponent())
```

### 2. 避免在 onPause() 中执行耗时操作

```kotlin
// 错误：在 onPause() 中保存数据
override fun onPause() {
    super.onPause()
    saveToDatabase()  // 可能在完成前被终止
}

// 正确：在 onStop() 中保存数据
override fun onStop() {
    super.onStop()
    saveToDatabase()
}
```

### 3. 正确处理多窗口模式

```kotlin
// 考虑多窗口模式下的资源管理
override fun onPause() {
    super.onPause()
    // 在多窗口模式下，Activity 可能仍然可见
    // 谨慎释放相机等资源
}
```

### 4. 使用 ViewModel 管理数据

```kotlin
class MyViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data
    
    override fun onCleared() {
        // 清理资源
    }
}
```

## 七、常见问题

### 问题 1：配置变更后数据丢失

**解决方案**：
- 使用 ViewModel 保留数据
- 在 onSaveInstanceState() 中保存关键状态

### 问题 2：内存泄漏

**原因**：在 Activity 销毁后仍持有引用。

**解决方案**：
- 使用弱引用
- 在 onDestroy() 中清除引用
- 使用生命周期感知型组件

### 问题 3：在错误的生命周期状态执行操作

**解决方案**：
- 理解每个回调的作用
- 在正确的时机初始化和释放资源

## 学习资源

- [activity 生命周期 | Android Developers](https://developer.android.google.cn/guide/components/activities/activity-lifecycle?hl=zh-cn)
- [保存界面状态 | Android Developers](https://developer.android.google.cn/topic/libraries/architecture/saving-states?hl=zh-cn)

---

*深入学习中...*
