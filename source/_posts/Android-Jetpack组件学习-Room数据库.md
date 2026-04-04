---
title: Android Jetpack组件学习-Room数据库
date: 2026-04-03 16:24:00
tags: [Android, Jetpack, Room, SQLite, Kotlin]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Room 是 Android Jetpack 中的 SQLite 对象映射库，在 SQLite 上提供了一个抽象层，简化了数据库操作。

## Room 优势

- **编译时验证**：提供针对 SQL 查询的编译时验证
- **减少样板代码**：提供方便注解，最小化重复和容易出错的代码
- **简化迁移**：简化了数据库迁移路径

## 主要组件

Room 包含三个主要组件：

1. **数据库类** - 保存数据库并作为应用持久性数据底层连接的主要访问点
2. **数据实体** - 表示应用的数据库中的表
3. **数据访问对象 (DAO)** - 提供在数据库中查询、更新、插入和删除数据的方法

## 设置依赖

```gradle
dependencies {
    val room_version = "2.8.4"

    implementation("androidx.room:room-runtime:$room_version")
    ksp("androidx.room:room-compiler:$room_version")

    // Kotlin Extensions and Coroutines support
    implementation("androidx.room:room-ktx:$room_version")
}
```

## 数据实体

```kotlin
@Entity
data class User(
    @PrimaryKey val uid: Int,
    @ColumnInfo(name = "first_name") val firstName: String?,
    @ColumnInfo(name = "last_name") val lastName: String?
)
```

## 数据访问对象 (DAO)

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM user")
    fun getAll(): List<User>

    @Query("SELECT * FROM user WHERE uid IN (:userIds)")
    fun loadAllByIds(userIds: IntArray): List<User>

    @Query("SELECT * FROM user WHERE first_name LIKE :first AND " +
           "last_name LIKE :last LIMIT 1")
    fun findByName(first: String, last: String): User

    @Insert
    fun insertAll(vararg users: User)

    @Delete
    fun delete(user: User)

    @Update
    fun update(user: User)
}
```

## 数据库类

```kotlin
@Database(entities = [User::class], version = 1)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

## 使用

### 创建数据库实例

```kotlin
val db = Room.databaseBuilder(
    applicationContext,
    AppDatabase::class.java, "database-name"
).build()
```

### 操作数据

```kotlin
val userDao = db.userDao()

// 查询
val users: List<User> = userDao.getAll()

// 插入
userDao.insertAll(User(1, "John", "Doe"))

// 删除
userDao.delete(user)
```

## 与 LiveData 配合

Room 支持 LiveData 返回类型：

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM user")
    fun getAllLiveData(): LiveData<List<User>>
}
```

## 与 Flow 配合

```kotlin
@Dao
interface UserDao {
    @Query("SELECT * FROM user")
    fun getAllFlow(): Flow<List<User>>
}
```

## 与协程配合

```kotlin
@Dao
interface UserDao {
    @Insert
    suspend fun insert(user: User)

    @Delete
    suspend fun delete(user: User)

    @Query("SELECT * FROM user")
    suspend fun getAll(): List<User>
}
```

## 数据库迁移

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE user ADD COLUMN age INTEGER")
    }
}

val db = Room.databaseBuilder(
    applicationContext,
    AppDatabase::class.java, "database-name"
).addMigrations(MIGRATION_1_2).build()
```

## 最佳实践

1. **使用单例模式** - 每个 RoomDatabase 实例成本较高
2. **在后台线程执行** - 数据库操作不应在主线程
3. **使用 DAO 接口** - 封装数据库操作
4. **合理设计迁移** - 避免数据丢失

## 学习资源

- [使用 Room 将数据保存到本地数据库](https://developer.android.google.cn/training/data-storage/room?hl=zh-cn)
- [Room + ViewModel + LiveData 综合使用](https://blog.csdn.net/shulianghan/article/details/130816155)
- [Android Room 新手使用指南](https://juejin.cn/post/7485598788985847820)

## 下一步

- 学习 DataStore（SharedPreferences 替代方案）
- 学习 Paging 3（分页加载）
- 学习 Hilt（依赖注入）

---

*持续学习中...*
