---
title: 'Writeup-Pwnable: tiny & tiny_easy'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, ROP]
share: true
---

## tiny_easy

#### 1. Brute force
这题的 bin 拿到之后开 gdb 看了一下 mapping, 发现 stack 是可执行的(如果 ELF 没有 GNU_STACK 这个 header, 则默认 stack 可执行[^1])。所以思路很明显了。

看一下反汇编:
{% highlight objdump %}
8048054:	58             pop %eax
8048055:	5a             pop %edx
8048056:	8b12           mov (%edx),%edx
8048058:	ffd2           call *%edx
{% endhighlight %}

然后用 gdb 断在 entry point, 观察一下栈:
{% highlight console %}
$ gdb tiny_easy
(gdb) b *0x8048054
Breakpoint 1 at 0x8048054
(gdb) r
Starting program: /home/tiny_easy/tiny_easy

Breakpoint 1, 0x08048054 in ?? ()
(gdb) x/32wx $esp
0xffd82d70: 0x00000001  0xffd84df5  0x00000000  0xffd84e0f
0xffd82d80: 0xffd84e1f  0xffd84e33  0xffd84e54  0xffd84e68
0xffd82d90: 0xffd84e77  0xffd84e83  0xffd84ed0  0xffd84ee9
0xffd82da0: 0xffd84ef8  0xffd84f0c  0xffd84f1d  0xffd84f63
0xffd82db0: 0xffd84f6c  0xffd84f81  0xffd84f89  0xffd84f99
0xffd82dc0: 0xffd84fab  0x00000000  0x00000020  0xf776bb50
0xffd82dd0: 0x00000021  0xf776b000  0x00000010  0x0fabfbff
0xffd82de0: 0x00000006  0x00001000  0x00000011  0x00000064
{% endhighlight %}

发现 $esp 位置是命令行参数的个数(即 argc)，后面借着的都是 argv[i], 以 NULL 结尾，再之后都是环境变量(即 envp)。

观察到这里，这题就有了一个很明显的解法，即在 argv[0] 里面放猜测的栈中的某个地址，然后跳到存在 argv[1...n] 里面的 shellcode. 但是由于 ASLR, 需要用很多 nop 来填充 stack, 来增加 bruteforce 的命中率。

###### exp.tiny_easy.c

{% gist cubarco/03fb090852a3303f58db pwnable-rookiss-tiny-easy.c %}

#### 2. vDSO[^2]

这个思路是在做 tiny 的时候得来的。简单来说就是利用 vdso 里面的 gadgets 准确的跳到 shellcode。虽然 ASLR 会导致 vdso 的加载位置随机，但是在 shell 中执行`ulimit -s unlimited`可以关掉随机 mmap[^3].

*vdso 可以在 gdb 调试的时候用 dump[^4] 命令导出。*

###### exp.tiny_easy.py

{% gist cubarco/03fb090852a3303f58db pwnable-rookiss-tiny-easy.py %}

## tiny

这题就是 tiny_easy 开 NX 的版本，只好 ROP. 能用的 gadgets 只有 vdso 和 text 段 6 个字节的指令(哭).

具体怎么构造 ROP, 绞尽脑汁想了很久。目的就是一个: `execv("/bin/sh")`，而执行这个系统调用需要将 eax 设置为 0xb，ebx 设置为字符串指针。前者很容易实现，只要控制 argc 为 11 就可以，麻烦的是 ebx.

一开始想怎么改 ebp 和 esp 的值，让 ret 指令返回地址能受我的控制，之后方便构造 ROP chain. 在草稿纸上写写画画试了很久没有成功，遂放弃。之后洗了个澡，回来重新看 stack 里面的内容，有了很重要的收获。

{% highlight text %}
(gdb) x/32wx $esp
...
0xffd82dc0: 0xffd84fab  0x00000000  0x00000020  0xf776bb50
0xffd82dd0: 0x00000021  0xf776b000  0x00000010  0x0fabfbff
...
{% endhighlight %}

截取了上文中的一部分 stack 数据，可以发现在 0xffd82dec 的位置有个 0xf776bb50, 看了一下，是 vdso 中`__kernel_vsyscall`的起始位置，如果可以 ret 到这里，就能调用系统调用了。

然后开始找 gadgets.

{% highlight objdump %}
5c8:	83 c4 3c             	add    $0x3c,%esp
5cb:	5b                   	pop    %ebx
5cc:	5e                   	pop    %esi
5cd:	5f                   	pop    %edi
5ce:	5d                   	pop    %ebp
5cf:	c3                   	ret
{% endhighlight %}

GOTCHA!!! 这里将栈指针增加了 0x3c, 然后`pop %ebx`顺便满足了 execv 系统调用的第二个要求。仔细观察了栈的内容，只要保证有 11 个命令行参数，5 个环境变量就能完成 execv 的调用，其中第四个环境变量的字符串是执行路径。

###### exp.tiny.sh
这个 exp 的核心是 C (其实就是一句`execle()`的事情), 用 shell 写只是为了方便，可以把`ulimit -s unlimited`这些命令放在一起(调试过程中还用到了其他命令，最后删的只剩 ulimit...)，而且用一个脚本解题本身是一件很酷的事情XD.

{% gist cubarco/d379e31c9487c8ee07f2 pwnable-hackerssecret-tiny.sh %}

## References

[^1]: [Causes of executable stack markings](https://wiki.gentoo.org/wiki/Hardened/GNU_stack_quickstart#Causes_of_executable_stack_markings)
[^2]: [vDSO](https://en.wikipedia.org/wiki/VDSO)
[^3]: [Address space layout randomization](http://security.cs.pub.ro/hexcellents/wiki/kb/exploiting/home#address-space-layout-randomization)
[^4]: [Debugging with GDB#Copy Between Memory and a File](https://sourceware.org/gdb/onlinedocs/gdb/Dump_002fRestore-Files.html)
