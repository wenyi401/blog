---
title: Android RecyclerView DiffUtil高效列表更新
date: 2026-04-03 23:52:00
tags: [Android, RecyclerView, DiffUtil, 列表更新]
categories: Android开发
photos: https://images.unsplash.com/photo-1579566346927-c68383817a25?w=800
---

## 前言

DiffUtil 是 RecyclerView 的工具类，用于计算新旧列表的差异，实现高效的增量更新，避免全局刷新。

## 一、基本使用

```kotlin
class UserDiffCallback(
    private val oldList: List<User>,
    private val newList: List<User>
) : DiffUtil.Callback() {
    
    override fun getOldListSize(): Int = oldList.size
    
    override fun getNewListSize(): Int = newList.size
    
    override fun areItemsTheSame(oldPos: Int, newPos: Int): Boolean {
        return oldList[oldPos].id == newList[newPos].id
    }
    
    override fun areContentsTheSame(oldPos: Int, newPos: Int): Boolean {
        return oldList[oldPos] == newList[newPos]
    }
}
```

## 二、应用差异

```kotlin
val diffResult = DiffUtil.calculateDiff(UserDiffCallback(oldList, newList))
adapter.updateList(newList)
diffResult.dispatchUpdatesTo(adapter)
```

## 三、DiffUtil.ItemCallback

```kotlin
class UserDiffCallback : DiffUtil.ItemCallback<User>() {
    override fun areItemsTheSame(oldItem: User, newItem: User): Boolean {
        return oldItem.id == newItem.id
    }
    
    override fun areContentsTheSame(oldItem: User, newItem: User): Boolean {
        return oldItem == newItem
    }
}
```

## 学习资源

- [DiffUtil in RecyclerView in Android - GeeksforGeeks](https://www.geeksforgeeks.org/android/diffutil-in-recyclerview-in-android/)
- [RecyclerView 刷新方式全解析：从 notifyDataSetChanged 到 DiffUtil](https://juejin.cn/post/7579451710303469594)

---

*持续学习中...*
