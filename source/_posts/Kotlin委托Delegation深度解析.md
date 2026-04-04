---
title: Kotlin委托Delegation深度解析
date: 2026-04-04 03:20:00
tags: [Kotlin, Delegation, 委托, by]
categories: Kotlin学习
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

委托模式已被证明是实现继承的良好替代方案。Kotlin 原生支持委托，无需任何样板代码。

## 一、接口委托

### 基本语法

```kotlin
interface Base {
    fun print()
}

class BaseImpl(val x: Int) : Base {
    override fun print() { print(x) }
}

class Derived(b: Base) : Base by b

fun main() {
    val base = BaseImpl(10)
    Derived(base).print() // 输出: 10
}
```

`by` 子句表示 Derived 将 Base 接口的所有公共成员委托给指定对象。

### 工作原理

编译器会生成 Base 的所有方法，并将调用转发给委托对象。

```kotlin
// 编译器生成的代码（简化）
class Derived(b: Base) : Base {
    private val delegate: Base = b
    
    override fun print() {
        delegate.print()
    }
}
```

## 二、覆盖委托成员

可以覆盖委托接口的成员：

```kotlin
interface Base {
    fun printMessage()
    fun printMessageLine()
}

class BaseImpl(val x: Int) : Base {
    override fun printMessage() { print(x) }
    override fun printMessageLine() { println(x) }
}

class Derived(b: Base) : Base by b {
    override fun printMessage() { print("abc") }
}

fun main() {
    val base = BaseImpl(10)
    Derived(base).printMessage()      // 输出: abc
    Derived(base).printMessageLine()  // 输出: 10
}
```

**注意**：覆盖的成员不会从委托对象的方法中调用：

```kotlin
interface Base {
    val message: String
    fun print()
}

class BaseImpl(x: Int) : Base {
    override val message = "BaseImpl: x = $x"
    override fun print() { println(message) }
}

class Derived(b: Base) : Base by b {
    override val message = "Message of Derived"
}

fun main() {
    val b = BaseImpl(10)
    val derived = Derived(b)
    derived.print()        // 输出: BaseImpl: x = 10
    println(derived.message) // 输出: Message of Derived
}
```

## 三、委托属性

Kotlin 支持委托属性，将属性的 getter 和 setter 委托给另一个对象。

### 基本语法

```kotlin
val/var <property name>: <Type> by <expression>
```

### 标准委托

#### 1. lazy

延迟初始化，只在首次访问时计算：

```kotlin
val heavyData: Data by lazy {
    // 只在首次访问时执行
    loadHeavyData()
}
```

#### 2. observable

属性变化时收到通知：

```kotlin
var name: String by Delegates.observable("初始值") { property, oldValue, newValue ->
    println("$property: $oldValue -> $newValue")
}

name = "新值" // 输出: var name: 初始值 -> 新值
```

#### 3. vetoable

条件性地设置属性值：

```kotlin
var age: Int by Delegates.vetoable(0) { property, oldValue, newValue ->
    newValue >= 0 // 只允许非负值
}

age = 25  // OK
age = -1  // 被拒绝
```

#### 4. notNull

确保属性在使用前已初始化：

```kotlin
var name: String by Delegates.notNull()

fun init() {
    name = "Alice"
}

fun printName() {
    println(name) // 如果未初始化，抛出 IllegalStateException
}
```

## 四、自定义属性委托

实现 ReadOnlyProperty 或 ReadWriteProperty：

```kotlin
import kotlin.reflect.KProperty

class LogDelegate<T>(private var value: T) : ReadWriteProperty<Any?, T> {
    override fun getValue(thisRef: Any?, property: KProperty<*>): T {
        println("Getting ${property.name}: $value")
        return value
    }
    
    override fun setValue(thisRef: Any?, property: KProperty<*>, value: T) {
        println("Setting ${property.name}: $value")
        this.value = value
    }
}

class User {
    var name: String by LogDelegate("Unknown")
    var age: Int by LogDelegate(0)
}

fun main() {
    val user = User()
    user.name = "Alice" // Setting name: Alice
    println(user.name)  // Getting name: Alice
}
```

## 五、Map 委托

使用 Map 作为属性委托：

```kotlin
class User(val map: Map<String, Any?>) {
    val name: String by map
    val age: Int by map
}

val user = User(mapOf(
    "name" to "Alice",
    "age" to 25
))

println(user.name) // Alice
println(user.age)  // 25
```

## 六、委托在 Android 中的应用

### 1. ViewBinding 委托

```kotlin
class MainActivity : AppCompatActivity() {
    private val binding: ActivityMainBinding by viewBinding()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding.textView.text = "Hello"
    }
}
```

### 2. Fragment Arguments 委托

```kotlin
class MyFragment : Fragment() {
    private val userId: String by argument()
    private val showDetails: Boolean by argument(default = false)
}
```

### 3. ViewModel 委托

```kotlin
class MyFragment : Fragment() {
    private val viewModel: MyViewModel by viewModels()
    private val sharedViewModel: SharedViewModel by activityViewModels()
}
```

### 4. SharedPreferences 委托

```kotlin
var SharedPreferences.userName: String by stringPreference("user_name", "")
var SharedPreferences.isLoggedIn: Boolean by booleanPreference("logged_in", false)

// 使用
preferences.userName = "Alice"
if (preferences.isLoggedIn) { }
```

## 七、委托 vs 继承

| 特性 | 委托 | 继承 |
|------|------|------|
| 灵活性 | 高 | 低 |
| 耦合度 | 低 | 高 |
| 代码复用 | 组合 | 继承 |
| 运行时行为 | 可变 | 固定 |

### 选择建议

- **使用委托**：需要组合多个行为、运行时改变行为
- **使用继承**：明确的 is-a 关系、需要多态

## 八、最佳实践

### 1. 使用委托实现组合

```kotlin
interface Logger {
    fun log(message: String)
}

class ConsoleLogger : Logger {
    override fun log(message: String) = println(message)
}

class FileLogger(private val file: File) : Logger {
    override fun log(message: String) = file.appendText(message)
}

class Service(logger: Logger) : Logger by logger {
    fun doSomething() {
        log("Doing something")
    }
}
```

### 2. 使用委托属性简化代码

```kotlin
// 不使用委托
class User {
    private var _name: String? = null
    
    var name: String
        get() = _name ?: throw IllegalStateException("Name not initialized")
        set(value) { _name = value }
}

// 使用委托
class User {
    var name: String by Delegates.notNull()
}
```

### 3. 使用 lazy 延迟初始化

```kotlin
class HeavyClass {
    val heavyResource: Resource by lazy {
        loadResource() // 只在需要时加载
    }
}
```

## 九、常见问题

### 问题 1：委托对象为 null

**原因**：委托对象未初始化。

**解决方案**：确保在使用前初始化委托对象。

### 问题 2：委托属性类型不匹配

**原因**：委托返回类型与属性类型不匹配。

**解决方案**：确保委托返回正确类型。

### 问题 3：覆盖委托成员无效果

**原因**：委托对象内部调用不会触发覆盖方法。

**解决方案**：理解委托的工作原理，必要时使用抽象类。

## 学习资源

- [Delegation | Kotlin Documentation](https://kotlinlang.org/docs/delegation.html)
- [Delegated Properties | Kotlin Documentation](https://kotlinlang.org/docs/delegated-properties.html)

---

*深入学习中...*
