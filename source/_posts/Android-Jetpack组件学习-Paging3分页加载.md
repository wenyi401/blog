---
title: Android Jetpack组件学习-Paging3分页加载
date: 2026-04-03 22:47:00
tags: [Android, Jetpack, Paging3, Kotlin, 分页]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Paging 3 是 Android Jetpack 组件中用于高效分页加载数据的现代化方案，结合 Kotlin 协程和 Flow 特性，能够显著简化分页逻辑的实现。

## Paging 3 概述

### 核心优势

- **内置加载状态管理**：自动处理加载、刷新、错误状态
- **协程与 Flow 原生支持**：现代化异步编程
- **灵活的数据源支持**：网络、数据库、内存
- **高效的内存管理**：自动回收不可见的数据
- **可组合的架构**：与 RecyclerView 无缝集成

## 定义数据源

### PagingSource 类

PagingSource<Key, Value> 有两种类型参数：
- **Key**：用于加载数据的标识符
- **Value**：数据本身的类型

### 实现 PagingSource

```kotlin
class ExamplePagingSource(
    val backend: ExampleBackendService,
    val query: String
) : PagingSource<Int, User>() {
    
    override suspend fun load(
        params: LoadParams<Int>
    ): LoadResult<Int, User> {
        try {
            // 如果未定义，从第1页开始刷新
            val nextPageNumber = params.key ?: 1
            val response = backend.searchUsers(query, nextPageNumber)
            return LoadResult.Page(
                data = response.users,
                prevKey = null, // 只向前分页
                nextKey = response.nextPageNumber
            )
        } catch (e: Exception) {
            return LoadResult.Error(e)
        }
    }
    
    override fun getRefreshKey(state: PagingState<Int, User>): Int? {
        return state.anchorPosition?.let { anchorPosition ->
            val anchorPage = state.closestPageToPosition(anchorPosition)
            anchorPage?.prevKey?.plus(1) ?: anchorPage?.nextKey?.minus(1)
        }
    }
}
```

### LoadParams 和 LoadResult

**LoadParams** 包含：
- `key`：要加载的键
- `loadSize`：要加载的项数

**LoadResult** 包含：
- `LoadResult.Page`：加载成功
- `LoadResult.Error`：加载失败

## 创建 Pager

```kotlin
val flow = Pager(
    config = PagingConfig(
        pageSize = 20,
        prefetchDistance = 10,
        enablePlaceholders = false
    ),
    pagingSourceFactory = { ExamplePagingSource(backend, query) }
).flow
```

### PagingConfig 参数

| 参数 | 描述 | 默认值 |
|------|------|--------|
| pageSize | 每页加载的项数 | - |
| prefetchDistance | 预加载距离 | pageSize |
| enablePlaceholders | 是否启用占位符 | true |
| initialLoadSize | 初始加载数量 | pageSize * 3 |
| maxSize | 最大缓存数量 | Int.MAX_VALUE |

## 在 ViewModel 中使用

```kotlin
class MyViewModel(
    private val repository: MyRepository
) : ViewModel() {
    
    fun getItems(query: String): Flow<PagingData<Item>> {
        return repository.getItems(query)
            .cachedIn(viewModelScope)
    }
}
```

`cachedIn()` 用于缓存 PagingData，避免在配置更改时重新加载数据。

## 在 Activity/Fragment 中使用

```kotlin
@AndroidEntryPoint
class MyActivity : AppCompatActivity() {
    
    private val viewModel: MyViewModel by viewModels()
    private lateinit var adapter: MyPagingAdapter
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        adapter = MyPagingAdapter()
        recyclerView.adapter = adapter
        
        lifecycleScope.launch {
            viewModel.getItems("query")
                .collectLatest { pagingData ->
                    adapter.submitData(pagingData)
                }
        }
    }
}
```

## 创建 PagingDataAdapter

```kotlin
class MyPagingAdapter : PagingDataAdapter<Item, MyViewHolder>(DIFF_CALLBACK) {
    
    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): MyViewHolder {
        return MyViewHolder(
            LayoutInflater.from(parent.context)
                .inflate(R.layout.item_layout, parent, false)
        )
    }
    
    override fun onBindViewHolder(holder: MyViewHolder, position: Int) {
        val item = getItem(position)
        item?.let { holder.bind(it) }
    }
    
    companion object {
        private val DIFF_CALLBACK = object : DiffUtil.ItemCallback<Item>() {
            override fun areItemsTheSame(oldItem: Item, newItem: Item): Boolean {
                return oldItem.id == newItem.id
            }
            
            override fun areContentsTheSame(oldItem: Item, newItem: Item): Boolean {
                return oldItem == newItem
            }
        }
    }
}
```

## 处理加载状态

### 添加加载状态监听

```kotlin
adapter.addLoadStateListener { loadState ->
    when (loadState.refresh) {
        is LoadState.Loading -> {
            // 显示加载中
        }
        is LoadState.NotLoading -> {
            // 加载完成
        }
        is LoadState.Error -> {
            // 显示错误
        }
    }
}
```

### 显示加载状态

```kotlin
// 在 Adapter 中使用 withLoadStateHeaderAndFooter
adapter.withLoadStateHeaderAndFooter(
    header = LoadingStateAdapter { adapter.retry() },
    footer = LoadingStateAdapter { adapter.retry() }
)
```

## 刷新和重试

```kotlin
// 刷新数据
adapter.refresh()

// 重试失败的操作
adapter.retry()
```

## 与 Room 数据库集成

```kotlin
@Dao
interface ItemDao {
    @Query("SELECT * FROM items ORDER BY id ASC")
    fun getAllItems(): PagingSource<Int, Item>
}

class MyRepository(private val dao: ItemDao) {
    fun getItems(): Flow<PagingData<Item>> {
        return Pager(
            config = PagingConfig(pageSize = 20),
            pagingSourceFactory = { dao.getAllItems() }
        ).flow
    }
}
```

## 学习资源

- [加载并显示分页数据](https://developer.android.google.cn/topic/libraries/architecture/paging/v3-paged-data?hl=zh-cn)
- [Paging 3.0 + Kotlin 分页加载指南](https://juejin.cn/post/7502329326098219017)
- [Android Kotlin Paging3 Flow 完整教程](https://blog.51cto.com/u_14523369/6122236)

## 下一步

- 实践 Paging 3 与 Room 的集成
- 学习 RemoteMediator（网络 + 数据库）
- 探索 Paging 3 的性能优化

---

*持续学习中...*
