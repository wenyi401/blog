---
title: Kotlin集合框架深度解析
date: 2026-04-04 02:50:00
tags: [Kotlin, Collections, List, Set, Map]
categories: Kotlin学习
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.6/img/other/comment-bg.png
---

## 前言

Kotlin 标准库提供了一套全面的集合管理工具。集合是一组可变数量的项目，包含三种基本类型：List、Set 和 Map。

## 一、集合类型概览

| 类型 | 特点 | 示例 |
|------|------|------|
| List | 有序，可重复 | 电话号码 |
| Set | 无序，唯一 | 彩票号码 |
| Map | 键值对，键唯一 | 员工 ID 与职位 |

## 二、只读与可变集合

Kotlin 为每种集合类型提供两个接口：
- **只读接口**：提供访问操作
- **可变接口**：扩展只读接口，提供写操作

### 只读集合是协变的

```kotlin
// 如果 Rectangle 继承 Shape
// 则 List<Rectangle> 是 List<Shape> 的子类型
fun printShapes(shapes: List<Shape>) {
    shapes.forEach { println(it) }
}

val rectangles: List<Rectangle> = listOf(Rectangle(), Rectangle())
printShapes(rectangles) // OK
```

### 可变集合不是协变的

```kotlin
// 错误：MutableList<Rectangle> 不是 MutableList<Shape> 的子类型
val rectangles: MutableList<Rectangle> = mutableListOf()
val shapes: MutableList<Shape> = rectangles // 编译错误！
```

## 三、Collection 接口

Collection 是集合层次结构的根接口：

```kotlin
fun printAll(strings: Collection<String>) {
    for (s in strings) print("$s ")
    println()
}

val stringList = listOf("one", "two", "one")
printAll(stringList) // one two one

val stringSet = setOf("one", "two", "three")
printAll(stringSet) // one two three
```

## 四、List

### 基本操作

```kotlin
val numbers = listOf("one", "two", "three", "four")

println("元素数量: ${numbers.size}")
println("第三个元素: ${numbers[2]}")
println("元素 two 的索引: ${numbers.indexOf("two")}")
```

### 元素相等性

```kotlin
data class Person(var name: String, var age: Int)

val bob = Person("Bob", 31)
val people = listOf(Person("Adam", 20), bob, bob)
val people2 = listOf(Person("Adam", 20), Person("Bob", 31), bob)

println(people == people2) // true
bob.age = 32
println(people == people2) // false
```

### MutableList

```kotlin
val numbers = mutableListOf(1, 2, 3, 4)
numbers.add(5)
numbers.removeAt(1)
numbers[0] = 0
numbers.shuffle()
println(numbers)
```

### List vs Array

| 特性 | List | Array |
|------|------|-------|
| 大小 | 可变 | 固定 |
| 类型 | 泛型 | 具体化 |
| 性能 | 稍慢 | 更快 |

**默认实现**：MutableList 默认使用 ArrayList。

## 五、Set

### 基本操作

```kotlin
val numbers = setOf(1, 2, 3, 4)

println("元素数量: ${numbers.size}")
if (numbers.contains(1)) println("1 在集合中")

val numbersBackwards = setOf(4, 3, 2, 1)
println("集合相等: ${numbers == numbersBackwards}") // true
```

### 唯一性

```kotlin
val numbers = setOf(1, 2, 3, 3, 4, 4)
println(numbers) // [1, 2, 3, 4]
```

### MutableSet

```kotlin
val numbers = mutableSetOf(1, 2, 3)
numbers.add(4)
numbers.remove(2)
println(numbers) // [1, 3, 4]
```

### 实现类型

- **LinkedHashSet**（默认）：保留插入顺序
- **HashSet**：不保证顺序，内存占用更少

```kotlin
val linkedSet = setOf(1, 2, 3, 4) // LinkedHashSet
val hashSet = hashSetOf(1, 2, 3, 4) // HashSet
```

## 六、Map

### 基本操作

```kotlin
val numbersMap = mapOf("key1" to 1, "key2" to 2, "key3" to 3, "key4" to 1)

println("所有键: ${numbersMap.keys}")
println("所有值: ${numbersMap.values}")

if ("key2" in numbersMap) {
    println("key2 的值: ${numbersMap["key2"]}")
}
```

### 相等性

```kotlin
val numbersMap = mapOf("key1" to 1, "key2" to 2, "key3" to 3)
val anotherMap = mapOf("key2" to 2, "key1" to 1, "key3" to 3)

println("Map 相等: ${numbersMap == anotherMap}") // true
```

### MutableMap

```kotlin
val numbersMap = mutableMapOf("one" to 1, "two" to 2)
numbersMap.put("three", 3)
numbersMap["one"] = 11
println(numbersMap)
```

### 实现类型

- **LinkedHashMap**（默认）：保留插入顺序
- **HashMap**：不保证顺序

## 七、ArrayDeque

ArrayDeque 是双端队列实现，可作为 Stack 和 Queue 使用：

```kotlin
val deque = ArrayDeque(listOf(1, 2, 3))

deque.addFirst(0)
deque.addLast(4)
println(deque) // [0, 1, 2, 3, 4]

println(deque.first()) // 0
println(deque.last()) // 4

deque.removeFirst()
deque.removeLast()
println(deque) // [1, 2, 3]
```

## 八、集合操作最佳实践

### 1. 使用 val 声明可变集合

```kotlin
val numbers = mutableListOf("one", "two", "three")
numbers.add("four") // OK
// numbers = mutableListOf("five") // 编译错误
```

### 2. 选择合适的集合类型

```kotlin
// 需要顺序访问 -> List
val items = listOf("a", "b", "c")

// 需要唯一性 -> Set
val uniqueIds = setOf(1, 2, 3)

// 需要键值对 -> Map
val userMap = mapOf("id" to 1, "name" to "Alice")
```

### 3. 使用只读集合提高安全性

```kotlin
// 公开只读集合
class DataManager {
    private val _items = mutableListOf<String>()
    val items: List<String> = _items
    
    fun addItem(item: String) {
        _items.add(item)
    }
}
```

### 4. 使用 Sequence 处理大数据集

```kotlin
// 懒加载，节省内存
val result = (1..1_000_000)
    .asSequence()
    .filter { it % 2 == 0 }
    .map { it * 2 }
    .take(10)
    .toList()
```

## 九、常见问题

### 问题 1：ConcurrentModificationException

**原因**：遍历时修改集合。

**解决方案****：使用迭代器的 remove() 或创建新集合。

### 问题 2：类型不匹配

**原因**：可变集合不是协变的。

**解决方案**：使用只读集合或显式转换。

### 问题 3：性能问题

**原因**：选择不合适的集合类型。

**解决方案**：根据使用场景选择合适的实现。

## 学习资源

- [Collections overview | Kotlin Documentation](https://kotlinlang.org/docs/collections-overview.html)
- [Kotlin 集合操作详解](https://juejin.cn/post/7078587415748673543)

---

*深入学习中...*
