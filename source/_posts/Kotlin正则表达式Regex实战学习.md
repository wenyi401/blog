---
title: Kotlin正则表达式Regex实战学习
date: 2026-04-03 23:47:00
tags: [Kotlin, Regex, 正则表达式, 匹配]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

正则表达式是文本处理的强大工具。Kotlin 提供了简洁易用的 Regex 类，相比 Java 的 Pattern 和 Matcher 更加优雅。

## 一、创建 Regex

### 使用 Regex 构造函数

```kotlin
val regex = Regex("[a-z]+")
```

### 使用 String.toRegex()

```kotlin
val regex = "[a-z]+".toRegex()
```

### 使用正则表达式字面量

```kotlin
val regex = Regex("""\d+""")  // 原始字符串，无需转义
```

## 二、匹配方法

### matches() - 完全匹配

```kotlin
val regex = Regex("[a-z]+")

println(regex.matches("hello"))  // true
println(regex.matches("Hello"))  // false
println(regex.matches("hello123"))  // false
```

### containsMatchIn() - 部分匹配

```kotlin
val regex = Regex("[a-z]+")

println(regex.containsMatchIn("hello123"))  // true
println(regex.containsMatchIn("123"))  // false
```

### find() - 查找第一个匹配

```kotlin
val regex = Regex("[0-9]+")
val result = regex.find("abc123def456")

println(result?.value)  // 123
println(result?.range)  // 3..5
```

### findAll() - 查找所有匹配

```kotlin
val regex = Regex("[0-9]+")
val results = regex.findAll("abc123def456")

results.forEach {
    println(it.value)  // 123, 456
}
```

## 三、替换方法

### replace() - 替换所有匹配

```kotlin
val regex = Regex("[0-9]+")
val result = regex.replace("abc123def456", "X")

println(result)  // abcXdefX
```

### replaceFirst() - 替换第一个匹配

```kotlin
val regex = Regex("[0-9]+")
val result = regex.replaceFirst("abc123def456", "X")

println(result)  // abcXdef456
```

### 使用 Lambda 替换

```kotlin
val regex = Regex("[0-9]+")
val result = regex.replace("abc123def456") { 
    "[${it.value}]" 
}

println(result)  // abc[123]def[456]
```

## 四、分割方法

### split()

```kotlin
val regex = Regex("\\s+")
val parts = regex.split("hello  world   kotlin")

println(parts)  // [hello, world, kotlin]
```

## 五、分组捕获

### 基本分组

```kotlin
val regex = Regex("(\\d{4})-(\\d{2})-(\\d{2})")
val text = "2026-04-03"

val match = regex.find(text)
if (match != null) {
    val (year, month, day) = match.destructured
    println("Year: $year, Month: $month, Day: $day")
}
```

### 命名分组

```kotlin
val regex = Regex("(?<year>\\d{4})-(?<month>\\d{2})-(?<day>\\d{2})")
val text = "2026-04-03"

val match = regex.find(text)
if (match != null) {
    val groups = match.groups as? MatchNamedGroupCollection
    val year = groups?.get("year")?.value
    val month = groups?.get("month")?.value
    val day = groups?.get("day")?.value
    
    println("Year: $year, Month: $month, Day: $day")
}
```

## 六、常用正则表达式

### 邮箱验证

```kotlin
val emailRegex = Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")

println(emailRegex.matches("user@example.com"))  // true
```

### 手机号验证

```kotlin
val phoneRegex = Regex("1[3-9]\\d{9}")

println(phoneRegex.matches("13812345678"))  // true
```

### URL 验证

```kotlin
val urlRegex = Regex("https?://[\\w.-]+\\.[a-zA-Z]{2,}(/.*)?")

println(urlRegex.matches("https://example.com/path"))  // true
```

### IP 地址验证

```kotlin
val ipRegex = Regex("\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}")

println(ipRegex.matches("192.168.1.1"))  // true
```

## 七、正则表达式语法

| 表达式 | 描述 |
|--------|------|
| `.` | 任意字符 |
| `\\d` | 数字 |
| `\\w` | 字母、数字、下划线 |
| `\\s` | 空白字符 |
| `^` | 行首 |
| `$` | 行尾 |
| `*` | 0 次或多次 |
| `+` | 1 次或多次 |
| `?` | 0 次或 1 次 |
| `{n}` | 恰好 n 次 |
| `{n,}` | 至少 n 次 |
| `{n,m}` | n 到 m 次 |
| `[]` | 字符集 |
| `()` | 分组 |
| `|` | 或 |

## 八、实战应用

### 1. 提取邮箱地址

```kotlin
val text = "联系我们: support@example.com 或 sales@example.org"
val emailRegex = Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")

val emails = emailRegex.findAll(text).map { it.value }.toList()
println(emails)  // [support@example.com, sales@example.org]
```

### 2. 验证密码强度

```kotlin
fun isStrongPassword(password: String): Boolean {
    val hasUpperCase = Regex("[A-Z]").containsMatchIn(password)
    val hasLowerCase = Regex("[a-z]").containsMatchIn(password)
    val hasDigit = Regex("\\d").containsMatchIn(password)
    val hasSpecial = Regex("[!@#\$%^&*]").containsMatchIn(password)
    val isLongEnough = password.length >= 8
    
    return hasUpperCase && hasLowerCase && hasDigit && hasSpecial && isLongEnough
}
```

### 3. 解析 CSV

```kotlin
val csv = "name,age,city\nAlice,25,Beijing\nBob,30,Shanghai"

val rows = csv.split("\n").drop(1)  // 跳过表头
rows.forEach { row ->
    val columns = row.split(",")
    println("Name: ${columns[0]}, Age: ${columns[1]}, City: ${columns[2]}")
}
```

## 九、性能考虑

### 预编译正则表达式

```kotlin
// ❌ 错误：每次都创建新的 Regex
fun isValidEmail(email: String) = 
    Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}").matches(email)

// ✅ 正确：预编译
val emailRegex = Regex("[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}")

fun isValidEmail(email: String) = emailRegex.matches(email)
```

## 十、最佳实践

1. **使用原始字符串**：避免双重转义
2. **预编译正则表达式**：提高性能
3. **命名分组**：提高可读性
4. **合理使用量词**：避免贪婪匹配
5. **测试边界情况**：确保正则表达式正确

## 学习资源

- [Kotlin 正则表达式 - 极客教程](https://geek-docs.com/kotlin/kotlin-tutorial/regularexpressions.html)
- [Regex | Kotlin API](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.text/-regex/)
- [Kotlin：正则Regex原来这么方便](https://juejin.cn/post/7250009145914835004)

---

*持续学习中...*
