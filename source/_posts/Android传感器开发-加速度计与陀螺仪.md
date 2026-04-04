---
title: Android传感器开发-加速度计与陀螺仪
date: 2026-04-03 23:52:00
tags: [Android, Sensor, 加速度, 陀螺仪, 传感器]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

Android 平台提供了多种传感器，可让您监控设备的运动。加速度计和陀螺仪是最常用的运动传感器，分别用于检测设备的加速度和角速度。

## 一、传感器类型

### 运动传感器

| 传感器 | 描述 |
|--------|------|
| TYPE_ACCELEROMETER | 加速度计 |
| TYPE_GYROSCOPE | 陀螺仪 |
| TYPE_GRAVITY | 重力传感器 |
| TYPE_LINEAR_ACCELERATION | 线性加速度 |
| TYPE_ROTATION_VECTOR | 旋转矢量 |

### 位置传感器

| 传感器 | 描述 |
|--------|------|
| TYPE_MAGNETIC_FIELD | 磁场传感器 |
| TYPE_PROXIMITY | 距离传感器 |

## 二、获取 SensorManager

```kotlin
private val sensorManager by lazy {
    getSystemService(Context.SENSOR_SERVICE) as SensorManager
}
```

## 三、加速度计

### 注册监听器

```kotlin
private var accelerometer: Sensor? = null
private var sensorListener: SensorEventListener? = null

override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)
    
    sensorListener = object : SensorEventListener {
        override fun onSensorChanged(event: SensorEvent) {
            val x = event.values[0]  // X 轴加速度
            val y = event.values[1]  // Y 轴加速度
            val z = event.values[2]  // Z 轴加速度
            
            Log.d(TAG, "Accelerometer: x=$x, y=$y, z=$z")
        }
        
        override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {
            Log.d(TAG, "Accuracy changed: $accuracy")
        }
    }
}

override fun onResume() {
    super.onResume()
    accelerometer?.also { sensor ->
        sensorManager.registerListener(sensorListener, sensor, SensorManager.SENSOR_DELAY_NORMAL)
    }
}

override fun onPause() {
    super.onPause()
    sensorManager.unregisterListener(sensorListener)
}
```

### 数据解读

```
设备平放屏幕朝上：
- x: 0
- y: 0
- z: 9.81 (重力加速度)

设备直立：
- x: 0
- y: 9.81
- z: 0
```

## 四、陀螺仪

### 注册监听器

```kotlin
private var gyroscope: Sensor? = null

gyroscope = sensorManager.getDefaultSensor(Sensor.TYPE_GYROSCOPE)

sensorListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
        val x = event.values[0]  // X 轴角速度 (rad/s)
        val y = event.values[1]  // Y 轴角速度
        val z = event.values[2]  // Z 轴角速度
        
        Log.d(TAG, "Gyroscope: x=$x, y=$y, z=$z")
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}
```

### 计算旋转角度

```kotlin
private var lastTimestamp = 0L
private var angleX = 0f
private var angleY = 0f
private var angleZ = 0f

override fun onSensorChanged(event: SensorEvent) {
    if (lastTimestamp != 0L) {
        val dt = (event.timestamp - lastTimestamp) * 1e-9f  // 转换为秒
        
        angleX += event.values[0] * dt * 180 / Math.PI
        angleY += event.values[1] * dt * 180 / Math.PI
        angleZ += event.values[2] * dt * 180 / Math.PI
        
        Log.d(TAG, "Angle: x=$angleX°, y=$angleY°, z=$angleZ°")
    }
    lastTimestamp = event.timestamp
}
```

## 五、传感器融合

### 互补滤波器

```kotlin
class SensorFusion {
    private var pitch = 0f
    private var roll = 0f
    private val ALPHA = 0.98f
    
    fun update(acc: FloatArray, gyro: FloatArray, dt: Float) {
        // 加速度计计算角度
        val accPitch = atan2(acc[1].toDouble(), acc[2].toDouble()).toFloat()
        val accRoll = atan2(-acc[0].toDouble(), sqrt(acc[1] * acc[1] + acc[2] * acc[2]).toDouble()).toFloat()
        
        // 陀螺仪积分
        pitch += gyro[0] * dt
        roll += gyro[1] * dt
        
        // 互补滤波
        pitch = ALPHA * pitch + (1 - ALPHA) * accPitch
        roll = ALPHA * roll + (1 - ALPHA) * accRoll
    }
}
```

## 六、计步器

```kotlin
val stepCounter = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)

sensorListener = object : SensorEventListener {
    override fun onSensorChanged(event: SensorEvent) {
        val steps = event.values[0].toLong()
        Log.d(TAG, "Total steps: $steps")
    }
    
    override fun onAccuracyChanged(sensor: Sensor, accuracy: Int) {}
}
```

## 七、最佳实践

1. **及时注销**：避免耗电
2. **选择合适采样率**：SENSOR_DELAY_NORMAL / UI / GAME / FASTEST
3. **低通滤波**：减少噪声
4. **坐标系理解**：设备坐标系 vs 世界坐标系
5. **传感器融合**：结合多个传感器提高精度

## 学习资源

- [移动传感器 | Android Developers](https://developer.android.google.cn/develop/sensors-and-location/sensors/sensors_motion?hl=zh-cn)
- [Android传感器融合开发](https://blog.csdn.net/weixin_29190651/article/details/159679524)
- [传感器专题——加速度/陀螺仪传感器](https://yingjuxia.com/archives/3651)

---

*持续学习中...*
