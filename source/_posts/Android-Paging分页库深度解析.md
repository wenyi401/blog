---
title: Android Paging分页库深度解析
date: 2026-04-04 03:50:00
tags: [Android, Paging, 分页, RecyclerView]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Paging 库帮助您一次加载和显示多个小的数据块。按需载入部分数据会减少网络带宽和系统资源的使用量。

## 一、添加依赖

```gradle
dependencies {
    val paging_version = "3.2.0"
    
    implementation("androidx.paging:paging-runtime:$paging_version")
    
    // 可选 - RxJava 支持
    implementation("androidx.paging:paging-rxjava2:$paging_version")
    
    // 可选 - Compose 支持
    implementation("androidx.paging:paging-compose:$paging_version")
}
```

## 二、核心组件

### 1. PagedList

PagedList 类用于加载应用数据块（页面）。随着所需数据的增多，系统会将其分页到现有的 PagedList 对象中。

### 2. DataSource

每个 PagedList 实例从对应的 DataSource 对象加载应用数据的最新快照。

### 3. PagedListAdapter

PagedList 使用 PagedListAdapter 将项加载到 RecyclerView。

## 三、基本使用

### 1. 定义 DataSource

```kotlin
@Dao
interface ConcertDao {
    @Query("SELECT * FROM concerts ORDER BY date DESC")
    fun concertsByDate(): DataSource.Factory<Int, Concert>
}
```

### 2. 创建 ViewModel

```kotlin
class ConcertViewModel(concertDao: ConcertDao) : ViewModel() {
    val concertList: LiveData<PagedList<Concert>> =
        concertDao.concertsByDate().toLiveData(pageSize = 50)
}
```

### 3. 创建 Adapter

```kotlin
class ConcertAdapter : PagedListAdapter<Concert, ConcertViewHolder>(DIFF_CALLBACK) {
    
    override fun onBindViewHolder(holder: ConcertViewHolder, position: Int) {
        val concert: Concert? = getItem(position)
        holder.bindTo(concert)
    }
    
    companion object {
        private val DIFF_CALLBACK = object : DiffUtil.ItemCallback<Concert>() {
            override fun areItemsTheSame(oldConcert: Concert, newConcert: Concert) =
                oldConcert.id == newConcert.id
            
            override fun areContentsTheSame(oldConcert: Concert, newConcert: Concert) =
                oldConcert == newConcert
        }
    }
}
```

### 4. 观察 PagedList

```kotlin
class ConcertActivity : AppCompatActivity() {
    private val viewModel: ConcertViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        val adapter = ConcertAdapter()
        viewModel.concertList.observe(this, adapter::submitList)
        recyclerView.adapter = adapter
    }
}
```

## 四、支持的数据架构

### 1. 仅限网络

使用同步版本的 Retrofit API，将信息加载到自定义 DataSource 对象中。

```kotlin
class NetworkDataSource(
    private val api: ConcertApi
) : PageKeyedDataSource<Int, Concert>() {
    
    override fun loadInitial(params: LoadInitialParams<Int>, callback: LoadInitialCallback<Int, Concert>) {
        val response = api.getConcerts(page = 1, pageSize = params.requestedLoadSize)
        callback.onResult(response.items, null, 2)
    }
    
    override fun loadAfter(params: LoadParams<Int>, callback: LoadCallback<Int, Concert>) {
        val response = api.getConcerts(page = params.key, pageSize = params.requestedLoadSize)
        callback.onResult(response.items, params.key + 1)
    }
}
```

### 2. 仅限数据库

使用 Room 持久性库，数据变更自动反映在 RecyclerView 中。

### 3. 网络和数据库

使用 PagedList.BoundaryCallback 监听数据库中的数据何时耗尽：

```kotlin
class ConcertBoundaryCallback(
    private val repository: ConcertRepository
) : PagedList.BoundaryCallback<Concert>() {
    
    override fun onZeroItemsLoaded() {
        // 数据库为空，从网络加载
        repository.fetchAndSaveConcerts()
    }
    
    override fun onItemAtEndLoaded(itemAtEnd: Concert) {
        // 到达数据库末尾，从网络加载更多
        repository.fetchAndSaveConcerts(itemAtEnd.id)
    }
}
```

## 五、处理网络连接错误

网络连接可能断断续续：

```kotlin
class ConcertViewModel : ViewModel() {
    private val _networkState = MutableLiveData<NetworkState>()
    val networkState: LiveData<NetworkState> = _networkState
    
    fun retry() {
        // 重试失败的请求
    }
}

// 在 Adapter 中显示重试按钮
when (state) {
    is NetworkState.Error -> {
        holder.retryButton.visibility = View.VISIBLE
        holder.retryButton.setOnClickListener { retry() }
    }
}
```

## 六、RxJava 支持

```kotlin
class ConcertViewModel(concertDao: ConcertDao) : ViewModel() {
    val concertList: Observable<PagedList<Concert>> =
        concertDao.concertsByDate().toObservable(pageSize = 50)
}

class ConcertActivity : AppCompatActivity() {
    private val disposable = CompositeDisposable()
    
    override fun onStart() {
        super.onStart()
        disposable.add(viewModel.concertList.subscribe(adapter::submitList))
    }
    
    override fun onStop() {
        super.onStop()
        disposable.clear()
    }
}
```

## 七、最佳实践

### 1. 选择合适的页面大小

```kotlin
// 根据列表项大小和设备屏幕选择合适的页面大小
val pageSize = if (isLargeScreen) 30 else 20
```

### 2. 使用占位符

```kotlin
// 在 PagedListAdapter 中处理 null
override fun onBindViewHolder(holder: ConcertViewHolder, position: Int) {
    val concert: Concert? = getItem(position)
    if (concert != null) {
        holder.bindTo(concert)
    } else {
        holder.showPlaceholder()
    }
}
```

### 3. 预取距离

```kotlin
// 设置预取距离
val config = PagedList.Config.Builder()
    .setPageSize(50)
    .setPrefetchDistance(100) // 距离末尾 100 项时开始加载
    .build()

val concertList = concertDao.concertsByDate().toLiveData(config)
```

## 八、常见问题

### 问题 1：列表滚动卡顿

**原因**：主线程执行耗时操作。

**解决方案**：使用异步数据源，避免在 onBindViewHolder 中执行耗时操作。

### 问题 2：数据重复

**原因**：DataSource 键不正确。

**解决方案**：确保 DataSource 正确处理分页键。

### 问题 3：内存泄漏

**原因**：未正确取消订阅。

**解决方案**：在 onStop 或 onDestroy 中取消订阅。

## 学习资源

- [Paging 库概览 | Android Developers](https://developer.android.google.cn/topic/libraries/architecture/paging?hl=zh-cn)
- [Android Paging Codelab](https://codelabs.developers.google.cn/codelabs/android-paging/)

---

*深入学习中...*
