---
title: Android LiveData深度解析
date: 2026-04-04 02:50:00
tags: [Android, LiveData, ViewModel, 生命周期]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

LiveData 是一种可观察的数据存储器类，具有生命周期感知能力。它遵循其他应用组件的生命周期，确保仅更新处于活跃生命周期状态的观察者。

## 一、LiveData 的优势

### 1. 确保界面符合数据状态

LiveData 遵循观察者模式，当数据变化时自动通知观察者更新界面。

### 2. 不会发生内存泄漏

观察者绑定到 Lifecycle 对象，生命周期销毁后自动清理。

### 3. 不会因 Activity 停止而导致崩溃

非活跃状态的观察者不会接收 LiveData 事件。

### 4. 数据始终保持最新状态

生命周期从非活跃变为活跃时，会接收最新数据。

### 5. 适当的配置更改

配置更改后立即接收最新的可用数据。

## 二、创建 LiveData 对象

```kotlin
class NameViewModel : ViewModel() {
    val currentName: MutableLiveData<String> by lazy {
        MutableLiveData<String>()
    }
}
```

**注意**：LiveData 对象通常存储在 ViewModel 中。

## 三、观察 LiveData 对象

```kotlin
class NameActivity : AppCompatActivity() {
    private val model: NameViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val nameObserver = Observer<String> { newName ->
            nameTextView.text = newName
        }
        
        model.currentName.observe(this, nameObserver)
    }
}
```

**最佳实践**：在 onCreate() 中开始观察，避免冗余调用。

## 四、更新 LiveData 对象

### setValue() vs postValue()

```kotlin
// setValue() - 主线程调用
button.setOnClickListener {
    model.currentName.setValue("John Doe")
}

// postValue() - 后台线程调用
thread {
    model.currentName.postValue("John Doe")
}
```

### MutableLiveData

```kotlin
class NameViewModel : ViewModel() {
    private val _currentName = MutableLiveData<String>()
    val currentName: LiveData<String> = _currentName
    
    fun updateName(name: String) {
        _currentName.value = name
    }
}
```

## 五、LiveData 与 Room

Room 支持返回 LiveData 对象的可观察查询：

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM users")
    fun getAllUsers(): LiveData<List<User>>
}
```

当数据库更新时，Room 会自动更新 LiveData 对象。

## 六、LiveData 与协程

### liveData 构建器

```kotlin
val user: LiveData<User> = liveData {
    val data = database.loadUser()
    emit(data)
}
```

### emitSource

```kotlin
val user = liveData {
    emitSource(loading())
    try {
        emitSource(repository.getUser())
    } catch (e: Exception) {
        emitSource(error(e))
    }
}
```

## 七、应用架构中的 LiveData

### ViewModel 与 LiveData

ViewModel 是保留 LiveData 对象的最佳位置：

```kotlin
class UserProfileViewModel : ViewModel() {
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user
    
    fun loadUser(userId: String) {
        viewModelScope.launch {
            _user.value = repository.getUser(userId)
        }
    }
}
```

### 不要在 Repository 中使用 LiveData

```kotlin
// 错误：Repository 中不应该有 LiveData
class UserRepository {
    fun getUsers(): LiveData<List<User>> { ... }
}

// 正确：使用 Flow
class UserRepository {
    fun getUsers(): Flow<List<User>> { ... }
}

// ViewModel 中转换为 LiveData
class MyViewModel(private val repository: UserRepository) : ViewModel() {
    val users: LiveData<List<User>> = repository.getUsers().asLiveData()
}
```

## 八、扩展 LiveData

```kotlin
class StockLiveData(symbol: String) : LiveData<BigDecimal>() {
    private val stockManager = StockManager(symbol)
    
    private val listener = { price: BigDecimal ->
        value = price
    }
    
    override fun onActive() {
        stockManager.requestPriceUpdates(listener)
    }
    
    override fun onInactive() {
        stockManager.removeUpdates(listener)
    }
}
```

### 单例模式

```kotlin
class StockLiveData(symbol: String) : LiveData<BigDecimal>() {
    companion object {
        private lateinit var sInstance: StockLiveData
        
        @MainThread
        fun get(symbol: String): StockLiveData {
            sInstance = if (::sInstance.isInitialized) sInstance else StockLiveData(symbol)
            return sInstance
        }
    }
}
```

## 九、转换 LiveData

### Transformations.map()

```kotlin
val userLiveData: LiveData<User> = UserLiveData()
val userName: LiveData<String> = userLiveData.map { user ->
    "${user.name} ${user.lastName}"
}
```

### Transformations.switchMap()

```kotlin
class MyViewModel(private val repository: PostalCodeRepository) : ViewModel() {
    private val addressInput = MutableLiveData<String>()
    
    val postalCode: LiveData<String> = addressInput.switchMap { address ->
        repository.getPostCode(address)
    }
    
    fun setAddress(address: String) {
        addressInput.value = address
    }
}
```

## 十、合并多个 LiveData 源

### MediatorLiveData

```kotlin
class MyViewModel : ViewModel() {
    private val dbData = MutableLiveData<List<User>>()
    private val networkData = MutableLiveData<List<User>>()
    
    private val _allData = MediatorLiveData<List<User>>()
    val allData: LiveData<List<User>> = _allData
    
    init {
        _allData.addSource(dbData) { _allData.value = combineData() }
        _allData.addSource(networkData) { _allData.value = combineData() }
    }
    
    private fun combineData(): List<User> {
        return (dbData.value ?: emptyList()) + (networkData.value ?: emptyList())
    }
}
```

## 十一、最佳实践

### 1. 只在 ViewModel 中暴露不可变 LiveData

```kotlin
class MyViewModel : ViewModel() {
    private val _data = MutableLiveData<String>()
    val data: LiveData<String> = _data
}
```

### 2. 使用 Transformations 延迟计算

```kotlin
// 延迟计算，只有观察者活跃时才计算
val result = input.map { expensiveOperation(it) }
```

### 3. 使用 Flow 处理复杂数据流

```kotlin
class MyViewModel : ViewModel() {
    val data: LiveData<Result> = repository.getDataFlow()
        .map { transform(it) }
        .catch { emit(Result.Error(it)) }
        .asLiveData()
}
```

## 十二、常见问题

### 问题 1：LiveData 数据丢失

**原因**：LiveData 默认不保留历史数据。

**解决方案**：使用 ViewModel + SavedStateHandle。

### 问题 2：LiveData 转换阻塞主线程

**原因**：在 map/switchMap 中执行耗时操作。

**解决方案**：
- 使用 Flow 处理复杂数据流
- 在后台线程执行操作

### 问题 3：LiveData 与事件处理

**原因**：LiveData 会重新发送最新值，不适合一次性事件。

**解决方案**：使用 SingleLiveEvent 或 SharedFlow。

## 学习资源

- [LiveData 概览 | Android Developers](https://developer.android.google.cn/topic/libraries/architecture/livedata?hl=zh-cn)
- [ViewModel 和 LiveData：模式 + 反模式](https://medium.com/androiddevelopers/viewmodels-and-livedata-patterns-antipatterns-21efaef74a54)

---

*深入学习中...*
