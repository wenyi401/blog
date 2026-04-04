---
title: Android Room数据库迁移Migration实战
date: 2026-04-03 23:52:00
tags: [Android, Room, Migration, 数据库迁移]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

当应用更新改变数据库架构时，需要保留设备上已有的用户数据。Room 支持自动迁移和手动迁移两种方式。

## 一、自动迁移

```kotlin
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

## 二、手动迁移

```kotlin
val MIGRATION_1_2 = object : Migration(1, 2) {
    override fun migrate(database: SupportSQLiteDatabase) {
        database.execSQL("ALTER TABLE User ADD COLUMN age INTEGER")
    }
}

Room.databaseBuilder(context, AppDatabase::class.java, "app.db")
    .addMigrations(MIGRATION_1_2)
    .build()
```

## 三、迁移规范

```kotlin
@AutoMigration(
    from = 1,
    to = 2,
    spec = MyAutoMigration::class
)
@DeleteTable(tableName = "OldTable")
class MyAutoMigration : AutoMigrationSpec {
    override fun onPostMigrate(db: SupportSQLiteDatabase) {
        // 迁移完成后的操作
    }
}
```

## 学习资源

- [迁移 Room 数据库 | Android Developers](https://developer.android.google.cn/training/data-storage/room/migrating-db-versions?hl=zh-cn)
- [Android Room 数据库自动升级与迁移策略](https://juejin.cn/post/7416651336361902119)

---

*持续学习中...*
