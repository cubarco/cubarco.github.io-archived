---
title: 解决 C 中 cast from pointer to smaller type 'int' loses information 的 warning
layout: post
categories: blog
tags:
    - C
---

今天在敲 C 代码，遇到类似`(int)p`的语句会报`cast from pointer to smaller type 'int' loses information`的warning(p 是某结构体指针), 强迫症留着 warning 感觉有点难受。
搜了一下，原来把`(int)p`换成`*(int *)p`就好了，这个 trick 有点意思, 记录一下。
