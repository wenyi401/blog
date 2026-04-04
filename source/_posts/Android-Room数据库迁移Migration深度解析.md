---
title: Android Room数据库迁移Migration深度解析
date: 2026-04-04 00:10:00
tags: [Android, Room, Migration, 数据库迁移, 架构]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

当应用更新改变数据库架构时，需要保留设备上已有的用户数据。Room 支持自动迁移和手动迁移两种方式。本文将深入解析 Room 数据库迁移的核心概念、实战技巧和最佳实践。

## 一、为什么需要数据库迁移？

在应用开发过程中，数据库结构会随着业务需求不断变化：
- 添加新表
- 添加/删除/重命名列
- 添加/删除/重命名表
- 修改表之间的关系

如果直接修改 Entity 类而不处理迁移，应用会崩溃。因此，必须为每次数据库版本变更定义迁移策略。

## 二、自动迁移

Room 2.4.0-alpha01 及更高版本支持自动迁移。适用于大多数基本架构更改。

### 基本用法

```kotlin
// 更新前 - 版本 1
@Database(
    version = 1,
    entities = [User::class]
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}

// 更新后 - 版本 2
@Database(
    version = 2,
    entities = [User::class],
    autoMigrations = [
        AutoMigration(from = 1, to = 2)
    ]
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
}
```

### 自动迁移规范 AutoMigrationSpec

当 Room 无法自动确定迁移计划时，需要提供 AutoMigrationSpec。常见场景：
- 删除或重命名表
- 删除或重命名列

```kotlin
@Database(
    version = 2,
    entities = [AppUser::class],
    autoMigrations = [
        AutoMigration(
            from = 1,
            to = 2,
            spec = AppDatabase.MyAutoMigration::class
        )
    ]
)
abstract class AppDatabase : RoomDatabase() {
    @RenameTable(fromTableName = "User", toTableName = "AppUser")
    class MyAutoMigration : AutoMigrationSpec
    
    // 迁移完成后的回调
    @DeleteTable(tableName = "OldTable")
    class DeleteOldTableMigration : AutoMigrationSpec {
        override fun onPostMigrate(db: SupportSQLiteDatabase) {
            // 执行数据清理或其他操作
        }
    }
}
```

### 可用的迁移注解

| 注解 | 用途 |
|------|------|
| @DeleteTable | 删除表 |
| @RenameTable | 重命名表 |
| @DeleteColumn | 删除列 |
| @RenameColumn | 重命名列 |

## 三、手动迁移

对于复杂的架构更改，Room 无法自动生成迁移路径，需要手动定义。

### 定义迁移

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 创建新表
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `Fruit` (
                `id` INTEGER PRIMARY KEY NOT NULL,
                `name` TEXT
            )
        """)
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 添加新列
        database.execSQL("ALTER TABLE Book ADD COLUMN pub_year INTEGER")
    }
}

// 注册迁移
Room.databaseBuilder(applicationContext, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()
```

### 混合使用自动和手动迁移

```kotlin
@Database(
    version = 3,
    entities = [User::class, Book::class],
    autoMigrations = [
        AutoMigration(from = 1, to = 2)  // 自动迁移
    ]
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun userDao(): UserDao
    abstract fun bookDao(): BookDao()
}

// 手动迁移
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 复杂的数据拆分逻辑
    }
}

// 如果同时定义了自动和手动迁移，Room 会使用手动迁移
```

## 四、导出架构

Room 可以在编译时将数据库架构导出为 JSON 文件，用于测试和版本控制。

### 使用 Room Gradle 插件（推荐）

```gradle
// build.gradle.kts
plugins {
    id("androidx.room")
}

room {
    schemaDirectory("$projectDir/schemas")
}
```

### 多变体配置

```gradle
room {
    // 只适用于 'demoDebug'
    schemaDirectory("demoDebug", "$projectDir/schemas/demoDebug")
    
    // 适用于 'demoDebug' 和 'demoRelease'
    schemaDirectory("demo", "$projectDir/schemas/demo")
    
    // 适用于 'demoDebug' 和 'fullDebug'
    schemaDirectory("debug", "$projectDir/schemas/debug")
    
    // 默认配置
    schemaDirectory("$projectDir/schemas")
}
```

### 使用注解处理器选项（旧版本）

```gradle
android {
    defaultConfig {
        javaCompileOptions {
            annotationProcessorOptions {
                compilerArgumentProviders(
                    RoomSchemaArgProvider(File(projectDir, "schemas"))
                )
            }
        }
    }
}

class RoomSchemaArgProvider(
    @get:InputDirectory
    @get:PathSensitive(PathSensitivity.RELATIVE)
    val schemaDir: File
) : CommandLineArgumentProvider {
    override fun asArguments(): Iterable<String> {
        return listOf("room.schemaLocation=${schemaDir.path}")
    }
}
```

## 五、测试迁移

迁移逻辑复杂，容易出错。Room 提供了测试工具来验证迁移。

### 添加测试依赖

```gradle
android {
    sourceSets {
        getByName("androidTest").assets.srcDir("$projectDir/schemas")
    }
}

dependencies {
    androidTestImplementation("androidx.room:room-testing:2.8.4")
}
```

### 测试单次迁移

```kotlin
@RunWith(AndroidJUnit4::class)
class MigrationTest {
    private val TEST_DB = "migration-test"
    
    @get:Rule
    val helper: MigrationTestHelper = MigrationTestHelper(
        InstrumentationRegistry.getInstrumentation(),
        AppDatabase::class.java.canonicalName,
        FrameworkSQLiteOpenHelperFactory()
    )
    
    @Test
    fun migrate1To2() {
        // 创建版本 1 的数据库
        var db = helper.createDatabase(TEST_DB, 1).apply {
            // 使用 SQL 插入测试数据
            execSQL("INSERT INTO User (id, name) VALUES (1, 'Alice')")
            close()
        }
        
        // 执行迁移到版本 2
        db = helper.runMigrationsAndValidate(TEST_DB, 2, true, MIGRATION_1_2)
        
        // 验证数据是否正确迁移
        // 注意：此时不能使用 DAO，因为 DAO 期望最新的架构
    }
}
```

### 测试所有迁移

```kotlin
@Test
fun migrateAll() {
    // 创建最早版本的数据库
    helper.createDatabase(TEST_DB, 1).apply {
        close()
    }
    
    // 打开最新版本，Room 会自动执行所有迁移并验证架构
    Room.databaseBuilder(
        InstrumentationRegistry.getInstrumentation().targetContext,
        AppDatabase::class.java,
        TEST_DB
    )
        .addMigrations(*ALL_MIGRATIONS)
        .build()
        .apply {
            openHelper.writableDatabase.close()
        }
}
```

## 六、处理缺失的迁移路径

如果 Room 找不到迁移路径，会抛出 IllegalStateException。

### 破坏性迁移（开发阶段）

```kotlin
Room.databaseBuilder(applicationContext, AppDatabase::class.java, "app.db")
    .fallbackToDestructiveMigration()  // 允许删除数据重建表
    .build()
```

### 最佳实践

1. **生产环境不要使用 fallbackToDestructiveMigration** - 会丢失用户数据
2. **开发阶段可以使用** - 快速迭代
3. **始终导出架构文件** - 用于测试和版本追踪
4. **测试所有迁移路径** - 确保数据完整性
5. **版本号连续** - 避免跳过版本

## 七、常见迁移场景

### 场景 1：添加新列

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE User ADD COLUMN age INTEGER NOT NULL DEFAULT 0")
    }
}
```

### 场景 2：创建新表

```kotlin
val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `Book` (
                `id` INTEGER PRIMARY KEY NOT NULL,
                `title` TEXT,
                `author` TEXT
            )
        """)
    }
}
```

### 场景 3：数据迁移

```kotlin
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(database: SupportSQLiteDatabase) {
        // 创建新表
        database.execSQL("""
            CREATE TABLE IF NOT EXISTS `User_New` (
                `id` INTEGER PRIMARY KEY NOT NULL,
                `first_name` TEXT,
                `last_name` TEXT
            )
        """)
        
        // 迁移数据
        database.execSQL("""
            INSERT INTO User_New (id, first_name, last_name)
            SELECT id, 
                   SUBSTR(name, 1, INSTR(name, ' ') - 1),
                   SUBSTR(name, INSTR(name, ' ') + 1)
            FROM User
        """)
        
        // 删除旧表
        database.execSQL("DROP TABLE User")
        
        // 重命名新表
        database.execSQL("ALTER TABLE User_New RENAME TO User")
    }
}
```

## 八、常见问题

### 问题 1：迁移后数据丢失

**原因**：使用了 fallbackToDestructiveMigration 或迁移逻辑错误。

**解决方案**：
1. 测试迁移逻辑
2. 不使用破坏性迁移
3. 备份数据

### 问题 2：IllegalStateException: A migration from X to Y was required

**原因**：缺少迁移路径。

**解决方案**：
1. 定义迁移
2. 或使用 fallbackToDestructiveMigration（仅开发阶段）

### 问题 3：编译错误：Cannot find the schema file

**原因**：未配置架构导出。

**解决方案**：
```gradle
room {
    schemaDirectory("$projectDir/schemas")
}
```

## 学习资源

- [迁移 Room 数据库 | Android Developers](https://developer.android.google.cn/training/data-storage/room/migrating-db-versions?hl=zh-cn)
- [Android Room 数据库自动升级与迁移策略](https://juejin.cn/post/7416651336361902119)
- [Room Gradle Plugin](https://developer.android.google.cn/jetpack/androidx/releases/room?hl=zh-cn#gradle-plugin)

---

*深入学习中...*
