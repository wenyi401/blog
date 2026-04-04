---
title: Android Data Binding数据绑定库深度解析
date: 2026-04-04 04:20:00
tags: [Android, Data Binding, 数据绑定, Jetpack]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

数据绑定库是一个支持库，使您能够使用声明式方法将布局中的界面组件绑定到应用中的数据源，而不是以编程方式。

## 一、启用数据绑定

```gradle
android {
    buildFeatures {
        dataBinding true
    }
}
```

## 二、布局和绑定表达式

### 基本布局

```xml
<layout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto">
    
    <data>
        <variable
            name="user"
            type="com.example.User" />
    </data>
    
    <LinearLayout
        android:layout_width="match_parent"
        android:layout_height="match_parent"
        android:orientation="vertical">
        
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@{user.name}" />
        
        <TextView
            android:layout_width="wrap_content"
            android:layout_height="wrap_content"
            android:text="@{String.valueOf(user.age)}" />
    </LinearLayout>
</layout>
```

### 表达式语言

```xml
<!-- 算术运算符 -->
android:text="@{user.age + 10}"

<!-- 字符串连接 -->
android:text="@{`Hello, ` + user.name}"

<!-- 三元运算符 -->
android:text="@{user.isAdmin ? `Admin` : `User`}"

<!-- 空安全 -->
android:text="@{user.name ?? `Unknown`}"

<!-- 属性引用 -->
android:text="@{user.name}"

<!-- 方法引用 -->
android:onClick="@{handler::onClick}"

<!-- 监听器绑定 -->
android:onClick="@{() -> handler.onUserClick(user)}"
```

## 三、可观察的数据对象

### ObservableField

```kotlin
class User {
    val firstName = ObservableField<String>()
    val lastName = ObservableField<String>()
    val age = ObservableInt()
}

// 使用
user.firstName.set("John")
val name = user.firstName.get()
```

### ObservableList 和 ObservableMap

```kotlin
val list = ObservableArrayList<String>()
list.add("item")

val map = ObservableArrayMap<String, String>()
map["key"] = "value"
```

### 可观察属性

```kotlin
class User : BaseObservable() {
    @get:Bindable
    var firstName: String = ""
        set(value) {
            field = value
            notifyPropertyChanged(BR.firstName)
        }
}
```

## 四、绑定适配器

### 自定义绑定适配器

```kotlin
@BindingAdapter("app:imageUrl")
fun loadImage(view: ImageView, url: String?) {
    Glide.with(view).load(url).into(view)
}

@BindingAdapter("app:goneUnless")
fun goneUnless(view: View, visible: Boolean) {
    view.visibility = if (visible) View.VISIBLE else View.GONE
}
```

### 多属性适配器

```kotlin
@BindingAdapter(value = ["imageUrl", "placeholder"], requireAll = false)
fun loadImage(view: ImageView, url: String?, placeholder: Drawable?) {
    Glide.with(view)
        .load(url)
        .placeholder(placeholder)
        .into(view)
}
```

## 五、双向数据绑定

```xml
<EditText
    android:layout_width="match_parent"
    android:layout_height="wrap_content"
    android:text="@={user.name}" />
```

### 自定义双向绑定

```kotlin
@BindingAdapter("app:rating")
fun setRating(view: RatingBar, rating: Float) {
    if (view.rating != rating) {
        view.rating = rating
    }
}

@InverseBindingAdapter(attribute = "app:rating", event = "app:ratingAttrChanged")
fun getRating(view: RatingBar): Float {
    return view.rating
}

@BindingAdapter("app:ratingAttrChanged")
fun setRatingListeners(view: RatingBar, listener: InverseBindingListener?) {
    view.onRatingBarChangeListener = if (listener != null) {
        RatingBar.OnRatingBarChangeListener { _, _, _ ->
            listener.onChange()
        }
    } else {
        null
    }
}
```

## 六、与 ViewModel 配合

```kotlin
class UserViewModel : ViewModel() {
    private val _user = MutableLiveData<User>()
    val user: LiveData<User> = _user
    
    fun loadUser() {
        viewModelScope.launch {
            _user.value = repository.getUser()
        }
    }
}

// 布局
<layout>
    <data>
        <variable
            name="viewModel"
            type="com.example.UserViewModel" />
    </data>
    
    <TextView
        android:text="@{viewModel.user.name}" />
</layout>

// Activity
class UserActivity : AppCompatActivity() {
    private lateinit var binding: ActivityUserBinding
    private val viewModel: UserViewModel by viewModels()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = DataBindingUtil.setContentView(this, R.layout.activity_user)
        binding.viewModel = viewModel
        binding.lifecycleOwner = this
    }
}
```

## 七、最佳实践

### 1. 避免在表达式中执行复杂逻辑

```xml
<!-- 不推荐 -->
<TextView
    android:text="@{user.isAdmin ? user.name.toUpperCase() + ` (Admin)` : user.name}" />

<!-- 推荐：在 ViewModel 中处理 -->
<TextView
    android:text="@{viewModel.userDisplayName}" />
```

### 2. 使用 include 重用布局

```xml
<include
    layout="@layout/user_card"
    app:user="@{user}" />
```

### 3. 使用 BindingAdapter 封装复杂操作

```kotlin
@BindingAdapter("app:formattedDate")
fun setFormattedDate(view: TextView, date: Date?) {
    view.text = date?.format() ?: "No date"
}
```

## 八、常见问题

### 问题 1：BR 类未生成

**原因**：未正确配置 dataBinding 或布局文件格式错误。

**解决方案**：确保 buildFeatures.dataBinding = true 且布局使用 <layout> 根元素。

### 问题 2：表达式语法错误

**原因**：使用了不支持的操作符或语法。

**解决方案**：检查表达式语法，将复杂逻辑移到 ViewModel。

### 问题 3：内存泄漏

**原因**：未正确设置 lifecycleOwner。

**解决方案**：`binding.lifecycleOwner = this`。

## 学习资源

- [数据绑定库 | Android Developers](https://developer.android.google.cn/topic/libraries/data-binding?hl=zh-cn)
- [布局和绑定表达式 | Android Developers](https://developer.android.google.cn/topic/libraries/data-binding/expressions?hl=zh-cn)

---

*深入学习中...*
