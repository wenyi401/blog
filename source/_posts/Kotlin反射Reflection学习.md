---
title: Kotlin反射Reflection学习
date: 2026-04-03 23:35:00
tags: [Kotlin, Reflection, 反射, KClass, KFunction]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

反射是一组语言和库特性，允许你在运行时内省程序结构。函数和属性在 Kotlin 中是一等公民，内省它们的能力（例如，在运行时学习属性或函数的名称或类型）在使用函数式或响应式风格时非常重要。

## 一、添加依赖

### Gradle

```kotlin
dependencies {
    implementation(kotlin("reflect"))
}
```

### Maven

```xml
<dependency>
    <groupId>org.jetbrains.kotlin</groupId>
    <artifactId>kotlin-reflect</artifactId>
    <version>2.3.20</version>
</dependency>
```

## 二、类引用

### 基本语法

```kotlin
val c = MyClass::class
```

### KClass 类型

```kotlin
val stringClass: KClass<String> = String::class
val listClass: KClass<List<*>> = List::class
```

### 绑定类引用

```kotlin
val widget: Widget = ...
val actualClass = widget::class  // 获取对象的实际类
```

## 三、函数引用

### 基本使用

```kotlin
fun isOdd(x: Int) = x % 2 != 0

val numbers = listOf(1, 2, 3)
println(numbers.filter(::isOdd))  // [1, 3]
```

### 函数类型

```kotlin
val predicate: (Int) -> Boolean = ::isOdd
// predicate 的类型是 (Int) -> Boolean
```

### 重载函数

```kotlin
fun isOdd(x: Int) = x % 2 != 0
fun isOdd(s: String) = s == "brillig" || s == "slithy"

val numbers = listOf(1, 2, 3)
println(numbers.filter(::isOdd))  // 引用 isOdd(x: Int)

val predicate: (String) -> Boolean = ::isOdd  // 引用 isOdd(s: String)
```

### 成员函数引用

```kotlin
val toCharArray = String::toCharArray
```

### 扩展函数引用

```kotlin
fun String.isEmail(): Boolean = this.contains("@")

val isEmailRef = String::isEmail
```

## 四、属性引用

### 顶层属性

```kotlin
val x = 1

fun main() {
    println(::x.get())    // 1
    println(::x.name)     // "x"
}
```

### KProperty 类型

```kotlin
val prop: KProperty0<Int> = ::x
```

### 成员属性

```kotlin
class Person(val name: String, val age: Int)

val person = Person("Alice", 25)

val nameProp = Person::name
println(nameProp.get(person))  // "Alice"
```

## 五、构造函数引用

### 基本使用

```kotlin
class Person(val name: String)

val factory: (String) -> Person = ::Person
val person = factory("Alice")
```

## 六、反射 API

### KClass

```kotlin
val cls = String::class

cls.simpleName      // "String"
cls.qualifiedName   // "kotlin.String"
cls.members         // 成员列表
cls.constructors    // 构造函数列表
```

### KFunction

```kotlin
fun add(a: Int, b: Int) = a + b

val func = ::add

func.name           // "add"
func.parameters     // 参数列表
func.returnType     // 返回类型
func.call(1, 2)     // 调用函数，返回 3
```

### KProperty

```kotlin
class Example {
    var value: Int = 0
}

val prop = Example::value

prop.name           // "value"
prop.getter         // getter 函数
prop.setter         // setter 函数
prop.isMutable      // true
```

## 七、实际应用

### 1. JSON 序列化

```kotlin
inline fun <reified T : Any> fromJson(json: String): T {
    val cls = T::class
    val constructor = cls.primaryConstructor!!
    // 解析 JSON 并创建实例
    return constructor.callBy(/* parameters */)
}
```

### 2. 依赖注入

```kotlin
class DIContainer {
    private val instances = mutableMapOf<KClass<*>, Any>()
    
    inline fun <reified T : Any> get(): T {
        val cls = T::class
        return instances.getOrPut(cls) {
            createInstance(cls)
        } as T
    }
}
```

### 3. 数据库映射

```kotlin
fun <T : Any> KClass<T>.toTableName(): String {
    return simpleName?.lowercase()?.plus("s") ?: ""
}

// User::class.toTableName() -> "users"
```

### 4. 验证框架

```kotlin
annotation class Validation(val rule: String)

class Validator {
    fun validate(obj: Any): List<String> {
        val errors = mutableListOf<String>()
        obj::class.members.forEach { member ->
            member.annotations.filterIsInstance<Validation>().forEach { 
                // 验证逻辑
            }
        }
        return errors
    }
}
```

## 八、性能考虑

### 反射开销

- 反射调用比直接调用慢
- 避免在性能敏感代码中使用反射
- 缓存反射结果

### 最佳实践

```kotlin
// ✅ 缓存 KClass
private val userClass = User::class

// ✅ 缓存 KFunction
private val createFunction = User::class.primaryConstructor!!
```

## 九、反射 vs 直接调用

| 特性 | 直接调用 | 反射调用 |
|------|----------|----------|
| **性能** | 快 | 慢 |
| **类型安全** | 编译时检查 | 运行时检查 |
| **灵活性** | 固定 | 动态 |
| **可读性** | 高 | 低 |

## 学习资源

- [Reflection | Kotlin Documentation](https://kotlinlang.org/docs/reflection.html)
- [Reflection with Kotlin | Baeldung](https://www.baeldung.com/kotlin/reflection)
- [KClass API](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.reflect/-k-class/)
- [KFunction API](https://kotlinlang.org/api/core/kotlin-stdlib/kotlin.reflect/-k-function/)

---

*持续学习中...*
