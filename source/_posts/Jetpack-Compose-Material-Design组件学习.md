---
title: Jetpack Compose Material Design组件学习
date: 2026-04-03 23:46:00
tags: [Android, Jetpack Compose, Material Design, UI组件]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Jetpack Compose 提供了 Material Design 的实现，后者是一个用于创建数字界面的综合设计系统。您可以使用可组合函数来实现 Material 组件。

## 一、Material Design 3

### 添加依赖

```gradle
dependencies {
    implementation("androidx.compose.material3:material3:1.3.1")
    implementation("androidx.compose.material3:material3-window-size-class:1.3.1")
}
```

### MaterialTheme

```kotlin
MaterialTheme {
    // 应用内容
}
```

## 二、常用组件

### Button

```kotlin
Button(onClick = { }) {
    Text("Button")
}

OutlinedButton(onClick = { }) {
    Text("Outlined Button")
}

TextButton(onClick = { }) {
    Text("Text Button")
}

FilledTonalButton(onClick = { }) {
    Text("Tonal Button")
}
```

### Card

```kotlin
Card(
    modifier = Modifier
        .fillMaxWidth()
        .padding(16.dp)
) {
    Column(
        modifier = Modifier.padding(16.dp)
    ) {
        Text("Card Title", style = MaterialTheme.typography.headlineSmall)
        Text("Card content")
    }
}
```

### TextField

```kotlin
var text by remember { mutableStateOf("") }

OutlinedTextField(
    value = text,
    onValueChange = { text = it },
    label = { Text("Label") },
    modifier = Modifier.fillMaxWidth()
)

TextField(
    value = text,
    onValueChange = { text = it },
    label = { Text("Label") }
)
```

### IconButton

```kotlin
IconButton(onClick = { }) {
    Icon(Icons.Default.Favorite, contentDescription = "Favorite")
}

IconToggleButton(checked = isChecked, onCheckedChange = { }) {
    Icon(Icons.Default.Favorite, contentDescription = "Favorite")
}
```

### FloatingActionButton

```kotlin
FloatingActionButton(onClick = { }) {
    Icon(Icons.Default.Add, contentDescription = "Add")
}

ExtendedFloatingActionButton(
    onClick = { },
    icon = { Icon(Icons.Default.Add, contentDescription = "Add") },
    text = { Text("Add") }
)
```

## 三、布局组件

### Scaffold

```kotlin
Scaffold(
    topBar = {
        TopAppBar(
            title = { Text("Title") }
        )
    },
    floatingActionButton = {
        FloatingActionButton(onClick = { }) {
            Icon(Icons.Default.Add, contentDescription = "Add")
        }
    }
) { padding ->
    Column(modifier = Modifier.padding(padding)) {
        Text("Content")
    }
}
```

### BottomNavigation

```kotlin
NavigationBar {
    items.forEach { item ->
        NavigationBarItem(
            icon = { Icon(item.icon, contentDescription = item.label) },
            label = { Text(item.label) },
            selected = item.selected,
            onClick = { }
        )
    }
}
```

### NavigationDrawer

```kotlin
ModalNavigationDrawer(
    drawerContent = {
        ModalDrawerSheet {
            Text("Drawer content")
        }
    }
) {
    // 主内容
}
```

## 四、对话框

### AlertDialog

```kotlin
AlertDialog(
    onDismissRequest = { },
    title = { Text("Title") },
    text = { Text("Message") },
    confirmButton = {
        TextButton(onClick = { }) {
            Text("Confirm")
        }
    },
    dismissButton = {
        TextButton(onClick = { }) {
            Text("Dismiss")
        }
    }
)
```

### DatePicker

```kotlin
val datePickerState = rememberDatePickerState()
DatePicker(
    state = datePickerState,
    modifier = Modifier.padding(16.dp)
)
```

## 五、信息展示

### Chip

```kotlin
FilterChip(
    selected = isSelected,
    onClick = { },
    label = { Text("Chip") }
)

InputChip(
    selected = isSelected,
    onClick = { },
    label = { Text("Input Chip") }
)

AssistChip(
    onClick = { },
    label = { Text("Assist Chip") }
)
```

### Badge

```kotlin
BadgedBox(
    badge = {
        Badge { Text("8") }
    }
) {
    Icon(Icons.Default.Mail, contentDescription = "Mail")
}
```

### ProgressIndicator

```kotlin
LinearProgressIndicator(
    modifier = Modifier.fillMaxWidth()
)

CircularProgressIndicator()

LinearProgressIndicator(
    progress = { 0.7f }
)
```

### Slider

```kotlin
var sliderValue by remember { mutableFloatStateOf(0f) }

Slider(
    value = sliderValue,
    onValueChange = { sliderValue = it },
    valueRange = 0f..100f
)
```

## 六、Switch

```kotlin
var checked by remember { mutableStateOf(false) }

Switch(
    checked = checked,
    onCheckedChange = { checked = it }
)

Checkbox(
    checked = checked,
    onCheckedChange = { checked = it }
)

RadioButton(
    selected = selected,
    onClick = { }
)
```

## 七、List 组件

### LazyColumn

```kotlin
LazyColumn {
    items(items) { item ->
        ListItem(
            headlineContent = { Text(item.title) },
            supportingContent = { Text(item.subtitle) },
            leadingContent = {
                Icon(Icons.Default.Person, contentDescription = null)
            },
            trailingContent = {
                Icon(Icons.Default.ArrowForward, contentDescription = null)
            }
        )
    }
}
```

### LazyRow

```kotlin
LazyRow {
    items(items) { item ->
        Card {
            Text(item.name)
        }
    }
}
```

## 八、主题配置

### Color Scheme

```kotlin
private val LightColorScheme = lightColorScheme(
    primary = Purple40,
    secondary = PurpleGrey40,
    tertiary = Pink40
)

private val DarkColorScheme = darkColorScheme(
    primary = Purple80,
    secondary = PurpleGrey80,
    tertiary = Pink80
)

MaterialTheme(
    colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
) {
    // 应用内容
}
```

### Typography

```kotlin
val Typography = Typography(
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.5.sp
    )
)

MaterialTheme(typography = Typography) {
    // 应用内容
}
```

## 九、最佳实践

1. **使用 MaterialTheme**：确保一致的设计
2. **合理使用组件**：根据场景选择合适的组件
3. **遵循 Material Design 指南**：保持设计一致性
4. **测试深色模式**：确保深色主题正常显示
5. **无障碍设计**：添加 contentDescription

## 学习资源

- [Material 组件 | Jetpack Compose | Android Developers](https://developer.android.com/develop/ui/compose/components?hl=zh-cn)
- [Material Design 3 for Jetpack Compose](https://m3.material.io/develop/android/jetpack-compose)
- [Compose 中的 Material Design 3](https://juejin.cn/post/7374343669208301577)

---

*持续学习中...*
