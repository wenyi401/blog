---
title: Android位置服务GPS定位开发实战
date: 2026-04-03 23:52:00
tags: [Android, Location, GPS, 定位]
categories: Android开发
photos: https://cdn.jsdelivr.net/gh/honjun/cdn@1.4/img/banner/about.jpg
---

## 前言

在移动应用开发中，定位功能是实现 LBS（基于位置服务）的核心基础，广泛应用于地图导航、本地生活服务、社交签到等场景。

## 一、添加权限

```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 二、获取位置

### 使用 FusedLocationProviderClient

```kotlin
private lateinit var fusedLocationClient: FusedLocationProviderClient

override fun onCreate(savedInstanceState: Bundle?) {
    fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
}

@SuppressLint("MissingPermission")
private fun getLastLocation() {
    fusedLocationClient.lastLocation
        .addOnSuccessListener { location ->
            location?.let {
                val latitude = it.latitude
                val longitude = it.longitude
                Log.d(TAG, "Location: $latitude, $longitude")
            }
        }
}
```

## 三、位置更新

```kotlin
private val locationCallback = object : LocationCallback() {
    override fun onLocationResult(locationResult: LocationResult) {
        locationResult.lastLocation?.let {
            Log.d(TAG, "New location: ${it.latitude}, ${it.longitude}")
        }
    }
}

@SuppressLint("MissingPermission")
private fun startLocationUpdates() {
    val locationRequest = LocationRequest.Builder(
        Priority.PRIORITY_HIGH_ACCURACY,
        10000  // 10秒更新一次
    ).build()
    
    fusedLocationClient.requestLocationUpdates(
        locationRequest,
        locationCallback,
        Looper.getMainLooper()
    )
}

private fun stopLocationUpdates() {
    fusedLocationClient.removeLocationUpdates(locationCallback)
}
```

## 四、检查权限

```kotlin
private fun checkLocationPermission(): Boolean {
    return ContextCompat.checkSelfPermission(
        this,
        Manifest.permission.ACCESS_FINE_LOCATION
    ) == PackageManager.PERMISSION_GRANTED
}

private fun requestLocationPermission() {
    ActivityCompat.requestPermissions(
        this,
        arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ),
        LOCATION_PERMISSION_REQUEST_CODE
    )
}
```

## 学习资源

- [Android GPS定位功能实现详解](https://blog.csdn.net/weixin_35734408/article/details/147524443)
- [Android 定位技术全解析](https://jishuzhan.net/article/1959467704158564354)

---

*持续学习中...*
