---
title: Android BLE低功耗蓝牙开发实战
date: 2026-04-03 23:52:00
tags: [Android, BLE, 蓝牙, 低功耗]
categories: Android开发
photos: https://images.unsplash.com/photo-1578632767115-351597cf2477?w=800
---

## 前言

Android 内置了对低功耗蓝牙 (BLE) 的平台支持，使应用能够发现设备、查询服务并高效传输少量数据，适用于近距离感应和健康监控等场景。

## 一、BLE 概述

### BLE vs 经典蓝牙

| 特性 | BLE | 经典蓝牙 |
|------|-----|----------|
| **功耗** | 极低 | 较高 |
| **传输速率** | 低 | 高 |
| **连接时间** | 毫秒级 | 秒级 |
| **适用场景** | 传感器、健康设备 | 音频、文件传输 |

### 角色

- **中央设备 (Central)**：扫描并连接外设
- **外设 (Peripheral)**：广播并接受连接

## 二、添加权限

```xml
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 三、扫描设备

### 获取 BluetoothAdapter

```kotlin
private val bluetoothAdapter: BluetoothAdapter by lazy {
    val bluetoothManager = getSystemService(Context.BLUETOOTH_SERVICE) as BluetoothManager
    bluetoothManager.adapter
}
```

### 开始扫描

```kotlin
private val leScanCallback = object : ScanCallback() {
    override fun onScanResult(callbackType: Int, result: ScanResult) {
        val device = result.device
        val rssi = result.rssi
        Log.d(TAG, "Found device: ${device.name} - ${device.address}")
    }
    
    override fun onScanFailed(errorCode: Int) {
        Log.e(TAG, "Scan failed: $errorCode")
    }
}

private fun startScan() {
    val filters = listOf(
        ScanFilter.Builder()
            .setDeviceName("MyDevice")
            .build()
    )
    
    val settings = ScanSettings.Builder()
        .setScanMode(ScanSettings.SCAN_MODE_LOW_LATENCY)
        .build()
    
    bluetoothAdapter.bluetoothLeScanner.startScan(filters, settings, leScanCallback)
}

private fun stopScan() {
    bluetoothAdapter.bluetoothLeScanner.stopScan(leScanCallback)
}
```

## 四、连接设备

### BluetoothGattCallback

```kotlin
private val gattCallback = object : BluetoothGattCallback() {
    override fun onConnectionStateChange(gatt: BluetoothGatt, status: Int, newState: Int) {
        when (newState) {
            BluetoothProfile.STATE_CONNECTED -> {
                Log.d(TAG, "Connected to GATT server")
                gatt.discoverServices()
            }
            BluetoothProfile.STATE_DISCONNECTED -> {
                Log.d(TAG, "Disconnected from GATT server")
            }
        }
    }
    
    override fun onServicesDiscovered(gatt: BluetoothGatt, status: Int) {
        if (status == BluetoothGatt.GATT_SUCCESS) {
            val services = gatt.services
            Log.d(TAG, "Discovered ${services.size} services")
        }
    }
}
```

### 连接

```kotlin
private var bluetoothGatt: BluetoothGatt? = null

private fun connect(device: BluetoothDevice) {
    bluetoothGatt = device.connectGatt(this, false, gattCallback)
}

private fun disconnect() {
    bluetoothGatt?.disconnect()
    bluetoothGatt?.close()
    bluetoothGatt = null
}
```

## 五、读写特征值

### 读取特征值

```kotlin
private fun readCharacteristic(characteristic: BluetoothGattCharacteristic) {
    bluetoothGatt?.readCharacteristic(characteristic)
}

override fun onCharacteristicRead(
    gatt: BluetoothGatt,
    characteristic: BluetoothGattCharacteristic,
    status: Int
) {
    if (status == BluetoothGatt.GATT_SUCCESS) {
        val value = characteristic.value
        Log.d(TAG, "Read value: ${String(value)}")
    }
}
```

### 写入特征值

```kotlin
private fun writeCharacteristic(
    characteristic: BluetoothGattCharacteristic,
    value: ByteArray
) {
    characteristic.value = value
    bluetoothGatt?.writeCharacteristic(characteristic)
}

override fun onCharacteristicWrite(
    gatt: BluetoothGatt,
    characteristic: BluetoothGattCharacteristic,
    status: Int
) {
    if (status == BluetoothGatt.GATT_SUCCESS) {
        Log.d(TAG, "Write successful")
    }
}
```

## 六、启用通知

```kotlin
private fun enableNotification(characteristic: BluetoothGattCharacteristic) {
    bluetoothGatt?.setCharacteristicNotification(characteristic, true)
    
    val descriptor = characteristic.getDescriptor(UUID_DESCRIPTOR)
    descriptor.value = BluetoothGattDescriptor.ENABLE_NOTIFICATION_VALUE
    bluetoothGatt?.writeDescriptor(descriptor)
}

override fun onCharacteristicChanged(
    gatt: BluetoothGatt,
    characteristic: BluetoothGattCharacteristic
) {
    val value = characteristic.value
    Log.d(TAG, "Received: ${String(value)}")
}
```

## 七、GATT 服务结构

```
Service (UUID)
├── Characteristic (UUID)
│   ├── Value
│   ├── Properties (Read/Write/Notify)
│   └── Descriptor (UUID)
└── Characteristic (UUID)
    └── ...
```

## 八、最佳实践

1. **权限检查**：运行时权限请求
2. **超时处理**：设置连接和操作超时
3. **队列管理**：串行化 GATT 操作
4. **错误重试**：合理重试失败的请求
5. **资源释放**：及时关闭 GATT 连接

## 学习资源

- [低功耗蓝牙 | Android Developers](https://developer.android.google.cn/develop/connectivity/bluetooth/ble/ble-overview?hl=zh-cn)
- [Android开发低功耗蓝牙BLE扫描连接与通信](https://developer.aliyun.com/article/1295768)
- [Android 蓝牙开发——BLE（附完整Demo）](https://blog.csdn.net/qq_38950819/article/details/103067487)

---

*持续学习中...*
