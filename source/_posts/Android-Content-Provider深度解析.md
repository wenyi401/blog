---
title: Android Content Provider深度解析
date: 2026-04-04 05:50:00
tags: [Android, Content Provider, ContentResolver, 数据共享]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

Content Provider 帮助应用管理对自身存储或由其他应用存储的数据的访问，并提供与其他应用共享数据的方法。它是将一个进程中的数据与另一个进程中运行的代码连接的标准接口。

## 一、Content Provider 的优势

### 1. 数据共享

配置 Content Provider 让其他应用安全地访问和修改您的应用数据。

### 2. 数据抽象

可以修改应用的数据存储实现，而不会影响依赖于访问数据的其他应用。

### 3. 精细权限控制

可以选择仅允许自己应用访问、授予其他应用一揽子权限，或配置不同的读写权限。

## 二、何时使用 Content Provider

### 必须使用

- 实现自定义搜索建议
- 向 widget 公开应用数据
- 将复杂的数据或文件复制粘贴到其他应用
- 使用 AbstractThreadedSyncAdapter
- 使用 CursorAdapter
- 使用 CursorLoader

### 可选使用

如果不需要共享数据，可以选择不使用，但使用它可以获得数据抽象的好处。

## 三、核心概念

### Content URI

格式：`content://authority/path/id`

```kotlin
// 查询所有用户
val uri = Uri.parse("content://com.example.app.provider/users")

// 查询单个用户
val uri = Uri.parse("content://com.example.app.provider/users/1")
```

### MIME 类型

```kotlin
// 单个项
val mimeType = "vnd.android.cursor.item/vnd.com.example.user"

// 集合
val mimeType = "vnd.android.cursor.dir/vnd.com.example.users"
```

## 四、创建 Content Provider

### 1. 定义 Provider

```kotlin
class MyProvider : ContentProvider() {
    
    override fun onCreate(): Boolean {
        // 初始化数据库
        return true
    }
    
    override fun query(
        uri: Uri,
        projection: Array<out String>?,
        selection: String?,
        selectionArgs: Array<out String>?,
        sortOrder: String?
    ): Cursor? {
        // 查询数据
        return null
    }
    
    override fun getType(uri: Uri): String? {
        // 返回 MIME 类型
        return null
    }
    
    override fun insert(uri: Uri, values: ContentValues?): Uri? {
        // 插入数据
        return null
    }
    
    override fun delete(uri: Uri, selection: String?, selectionArgs: Array<out String>?): Int {
        // 删除数据
        return 0
    }
    
    override fun update(uri: Uri, values: ContentValues?, selection: String?, selectionArgs: Array<out String>?): Int {
        // 更新数据
        return 0
    }
}
```

### 2. 注册 Provider

```xml
<provider
    android:name=".MyProvider"
    android:authorities="com.example.app.provider"
    android:exported="true" />
```

## 五、使用 Content Provider

### 查询数据

```kotlin
val uri = Uri.parse("content://com.example.app.provider/users")
val cursor = contentResolver.query(uri, null, null, null, null)

cursor?.use {
    while (it.moveToNext()) {
        val name = it.getString(it.getColumnIndexOrThrow("name"))
        println(name)
    }
}
```

### 插入数据

```kotlin
val values = ContentValues().apply {
    put("name", "Alice")
    put("age", 25)
}
val uri = contentResolver.insert(
    Uri.parse("content://com.example.app.provider/users"),
    values
)
```

### 更新数据

```kotlin
val values = ContentValues().apply {
    put("age", 26)
}
val count = contentResolver.update(
    Uri.parse("content://com.example.app.provider/users/1"),
    values,
    null,
    null
)
```

### 删除数据

```kotlin
val count = contentResolver.delete(
    Uri.parse("content://com.example.app.provider/users/1"),
    null,
    null
)
```

## 六、权限控制

### 声明权限

```xml
<permission
    android:name="com.example.READ_DATA"
    android:protectionLevel="normal" />
    
<permission
    android:name="com.example.WRITE_DATA"
    android:protectionLevel="dangerous" />
```

### 应用权限

```xml
<provider
    android:name=".MyProvider"
    android:authorities="com.example.app.provider"
    android:readPermission="com.example.READ_DATA"
    android:writePermission="com.example.WRITE_DATA"
    android:exported="true" />
```

## 七、最佳实践

### 1. 使用 UriMatcher

```kotlin
private val uriMatcher = UriMatcher(UriMatcher.NO_MATCH).apply {
    addURI("com.example.app.provider", "users", USERS)
    addURI("com.example.app.provider", "users/#", USER_ID)
}
```

### 2. 使用 Contract 类

```kotlin
object MyContract {
    const val AUTHORITY = "com.example.app.provider"
    
    object Users {
        val CONTENT_URI: Uri = Uri.parse("content://$AUTHORITY/users")
        const val _ID = "_id"
        const val NAME = "name"
        const val AGE = "age"
    }
}
```

### 3. 通知数据变化

```kotlin
context.contentResolver.notifyChange(uri, null)
```

## 八、常见问题

### 问题 1：权限拒绝

**原因**：未声明或请求权限。

**解决方案**：在清单中声明权限，并在运行时请求危险权限。

### 问题 2：Cursor 未关闭

**原因**：忘记关闭 Cursor。

**解决方案**：使用 use 扩展函数自动关闭。

### 问题 3：UI 线程阻塞

**原因**：在主线程执行查询。

**解决方案**：使用 CursorLoader 或协程。

## 学习资源

- [Content Provider | Android Developers](https://developer.android.google.cn/guide/topics/providers/content-providers?hl=zh-cn)
- [Content Provider 基础知识](https://developer.android.google.cn/guide/topics/providers/content-provider-basics?hl=zh-cn)

---

*深入学习中...*
