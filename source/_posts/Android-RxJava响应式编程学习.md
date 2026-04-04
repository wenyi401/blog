---
title: Android RxJava响应式编程学习
date: 2026-04-03 23:43:00
tags: [Android, RxJava, ReactiveX, 响应式编程]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

RxJava 是一个基于观察者模式的响应式编程库，能够简化 Android 应用中的异步操作，摆脱回调地狱。

## 一、核心概念

### 观察者模式

```
Observable（被观察者）
    │
    │ emit
    ▼
Observer（观察者）
    │
    ├── onNext()  发送数据
    ├── onError() 发送错误
    └── onComplete() 完成通知
```

### 添加依赖

```gradle
dependencies {
    implementation 'io.reactivex.rxjava3:rxjava:3.1.8'
    implementation 'io.reactivex.rxjava3:rxandroid:3.0.2'
}
```

## 二、创建 Observable

### just

```kotlin
Observable.just(1, 2, 3)
    .subscribe { println(it) }
```

### fromIterable

```kotlin
val list = listOf(1, 2, 3)
Observable.fromIterable(list)
    .subscribe { println(it) }
```

### create

```kotlin
Observable.create<Int> { emitter ->
    emitter.onNext(1)
    emitter.onNext(2)
    emitter.onComplete()
}.subscribe { println(it) }
```

### interval

```kotlin
Observable.interval(1, TimeUnit.SECONDS)
    .subscribe { println("Tick: $it") }
```

### range

```kotlin
Observable.range(1, 5)
    .subscribe { println(it) }
```

## 三、操作符

### map

```kotlin
Observable.just(1, 2, 3)
    .map { it * 2 }
    .subscribe { println(it) }  // 2, 4, 6
```

### filter

```kotlin
Observable.range(1, 10)
    .filter { it % 2 == 0 }
    .subscribe { println(it) }  // 2, 4, 6, 8, 10
```

### flatMap

```kotlin
Observable.just("A", "B", "C")
    .flatMap { s ->
        Observable.just("$s1", "$s2")
    }
    .subscribe { println(it) }
// A1, A2, B1, B2, C1, C2
```

### zip

```kotlin
val obs1 = Observable.just(1, 2, 3)
val obs2 = Observable.just("A", "B", "C")

Observable.zip(obs1, obs2) { num, str ->
    "$num$str"
}.subscribe { println(it) }  // 1A, 2B, 3C
```

### merge

```kotlin
val obs1 = Observable.just(1, 2)
val obs2 = Observable.just(3, 4)

Observable.merge(obs1, obs2)
    .subscribe { println(it) }  // 1, 2, 3, 4
```

## 四、线程控制

### Schedulers

| Scheduler | 描述 |
|-----------|------|
| `Schedulers.io()` | I/O 操作 |
| `Schedulers.computation()` | 计算密集型 |
| `Schedulers.newThread()` | 新线程 |
| `AndroidSchedulers.mainThread()` | Android 主线程 |

### subscribeOn / observeOn

```kotlin
Observable.create<String> { emitter ->
    // 在 IO 线程执行
    val data = fetchData()
    emitter.onNext(data)
    emitter.onComplete()
}
.subscribeOn(Schedulers.io())
.observeOn(AndroidSchedulers.mainThread())
.subscribe { data ->
    // 在主线程更新 UI
    updateUI(data)
}
```

## 五、Single / Completable / Maybe

### Single

```kotlin
Single.just("Hello")
    .subscribe(
        { success -> println(success) },
        { error -> println(error.message) }
    )
```

### Completable

```kotlin
Completable.fromAction { saveData() }
    .subscribe(
        { println("Complete") },
        { error -> println(error.message) }
    )
```

### Maybe

```kotlin
Maybe.just("Value")
    .subscribe(
        { success -> println(success) },
        { error -> println(error.message) },
        { println("Empty") }
    )
```

## 六、背压（Backpressure）

### Flowable

```kotlin
Flowable.range(1, 1000000)
    .onBackpressureLatest()
    .observeOn(Schedulers.io())
    .subscribe { println(it) }
```

### Backpressure 策略

| 策略 | 描述 |
|------|------|
| `onBackpressureBuffer` | 缓冲所有数据 |
| `onBackpressureDrop` | 丢弃超出数据 |
| `onBackpressureLatest` | 保留最新数据 |

## 七、错误处理

### onErrorReturn

```kotlin
Observable.just(1, 2, 0)
    .map { 10 / it }
    .onErrorReturn { -1 }
    .subscribe { println(it) }  // 10, 5, -1
```

### retry

```kotlin
Observable.create<String> { emitter ->
    emitter.onNext(fetchData())  // 可能失败
}
.retry(3)  // 重试 3 次
.subscribe { println(it) }
```

### onErrorResumeNext

```kotlin
Observable.just(1, 2, 0)
    .map { 10 / it }
    .onErrorResumeNext { Observable.just(-1) }
    .subscribe { println(it) }
```

## 八、实战应用

### 网络请求

```kotlin
fun fetchUser(id: Int): Single<User> {
    return Single.create { emitter ->
        try {
            val user = api.getUser(id)
            emitter.onSuccess(user)
        } catch (e: Exception) {
            emitter.onError(e)
        }
    }
        .subscribeOn(Schedulers.io())
        .observeOn(AndroidSchedulers.mainThread())
}

// 使用
fetchUser(1)
    .subscribe(
        { user -> updateUI(user) },
        { error -> showError(error) }
    )
```

### 搜索防抖

```kotlin
val searchSubject = PublishSubject.create<String>()

searchSubject
    .debounce(300, TimeUnit.MILLISECONDS)
    .distinctUntilChanged()
    .switchMap { query -> search(query) }
    .observeOn(AndroidSchedulers.mainThread())
    .subscribe { results -> updateResults(results) }

// 触发搜索
searchSubject.onNext("query")
```

### RxBinding

```kotlin
RxView.clicks(button)
    .throttleFirst(500, TimeUnit.MILLISECONDS)
    .subscribe { handleClick() }

RxTextView.textChanges(editText)
    .skipInitialValue()
    .debounce(300, TimeUnit.MILLISECONDS)
    .subscribe { text -> search(text.toString()) }
```

## 九、RxJava vs Flow

| 特性 | RxJava | Flow |
|------|--------|------|
| **协程支持** | 无 | 原生支持 |
| **背压** | Flowable | 内置支持 |
| **线程切换** | observeOn | flowOn |
| **学习曲线** | 较陡 | 较平缓 |
| **社区支持** | 成熟 | 快速发展 |

## 十、最佳实践

1. **及时 dispose**：避免内存泄漏
2. **合理使用操作符**：避免过度嵌套
3. **错误处理**：总是处理 onError
4. **线程控制**：注意 subscribeOn 和 observeOn
5. **考虑 Flow**：新项目优先使用 Kotlin Flow

## 学习资源

- [RxJava：响应式编程 - 知乎](https://zhuanlan.zhihu.com/p/1987240961458315467)
- [RxJava Android响应式编程：18个实战案例完整指南](https://blog.csdn.net/gitblog_01135/article/details/154374399)
- [ReactiveX/RxAndroid - GitHub](https://github.com/ReactiveX/RxAndroid)

---

*持续学习中...*
