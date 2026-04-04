---
title: Android Room数据库进阶-迁移策略
date: 2026-04-03 23:07:00
tags: [Android, Room, 数据库, 迁移, SQLite]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

当您在应用中添加和更改功能时，需要修改 Room 实体类和底层数据库表以反映这些更改。如果应用更新更改了数据库架构，那么保留设备内置数据库中已有的用户数据就非常重要。Room 同时支持以自动和手动方式进行的增量迁移。

## 一、自动迁移

### 使用 @AutoMigration 注解

如需声明两个数据库版本之间的自动迁移，请将 `@AutoMigration` 注解添加到 `@Database` 中的 `autoMigrations` 属性：

```kotlin
// 数据库版本更新前
@Database(
    version = 1,
    entities = [User::class]
)
abstract class AppDatabase : RoomDatabase() {
    // ...
}

// 数据库版本更新后
@Database(
    version = 2,
    entities = [User::class],
    autoMigrations = [
        AutoMigration(from = 1, to = 2)
    ]
)
abstract class AppDatabase : RoomDatabase() {
    // ...
}
```

### 自动迁移规范

如果 Room 检测到架构更改不明确，则会抛出编译时间错误并要求您实现 `AutoMigrationSpec`。这往往出现在迁移涉及以下情形之一时：

- 删除或重命名表
- 删除或重命名列

### AutoMigrationSpec 注解

| 注解 | 描述 |
|------|------|
| `@DeleteTable` | 删除表 |
| `@RenameTable` | 重命名表 |
| `@DeleteColumn` | 删除列 |
| `@RenameColumn` | 重命名列 |

### 示例

```kotlin
@Database(
    version = 2,
    entities = [User::class],
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
    
    // 迁移完成后执行
    class MyAutoMigration : AutoMigrationSpec {
        override fun onPostMigrate(db: SupportSQLiteDatabase) {
            // 迁移完成后的额外工作
        }
    }
}
```

---

## 二、手动迁移

如果迁移涉及复杂的架构更改，Room 可能无法自动生成适当的迁移路径。在这类情况下，您必须通过实现 `Migration` 类来手动定义迁移路径。

### 实现 Migration 类

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("CREATE TABLE `Fruit` (`id` INTEGER, `name` TEXT, PRIMARY KEY(`id`))")
    }
}

val MIGRATION_2_3 = object : Migration(2, 3) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE Book ADD COLUMN pub_year INTEGER")
    }
}
```

### 添加到数据库构建器

```kotlin
Room.databaseBuilder(applicationContext, MyDb::class.java, "database-name")
    .addMigrations(MIGRATION_1_2, MIGRATION_2_3)
    .build()
```

### 混合使用自动和手动迁移

如果您为同一版本同时定义了自动迁移和手动迁移，则 Room 会使用手动迁移。

---

## 三、测试迁移

迁移通常十分复杂，迁移定义错误可能会导致应用崩溃。Room 提供了 `room-testing` Maven 工件，以协助完成自动和手动迁移的测试过程。

### 导出架构

Room 可以在编译时将数据库的架构信息导出为 JSON 文件。

### 使用 Room Gradle 插件

```groovy
plugins {
    id 'androidx.room'
}

room {
    schemaDirectory "$projectDir/schemas"
}
```

### Kotlin DSL

```kotlin
plugins {
    id("androidx.room")
}

room {
    schemaDirectory("$projectDir/schemas")
}
```

---

## 四、迁移最佳实践

| 实践 | 描述 |
|------|------|
| **优先使用自动迁移** | 适用于大多数基本架构更改 |
| **测试所有迁移路径** | 使用 room-testing 工件 |
| **导出架构文件** | 存储在版本控制系统中 |
| **保留用户数据** | 确保迁移不会丢失数据 |
| **处理回退** | 考虑降级场景 |

---

## 学习资源

- [迁移 Room 数据库 | Android Developers](https://developer.android.google.cn/training/data-storage/room/migrating-db-versions?hl=zh-cn)
- [Room 数据库自动升级与迁移策略](https://juejin.cn/post/7416651336361902119)
- [Room数据库进阶指南](https://www.develop.fan/Static/article/detail?id=376f997a90cd4edebf8e98d89edb8fe6)

---

*持续学习中...*
