---
title: 'Writeup-Seccon CTF: FSB:TreeWalker'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, FSB]
share: false
modified: 2015-12-13
---

### printf()

因为这题直接把 FSB 写在题名里，我一拿到题就直接跑去找能利用 FSB 的点了。

利用点在这里：
{% highlight objdump %}
400881:	0f 1f 80 00 00 00 00 	nopl   0x0(%rax)
400888:	4c 8b 05 f9 09 20 00 	mov    0x2009f9(%rip),%r8        # 601288 <stdin@@GLIBC_2.2.5>
40088f:	48 8d 7c 24 50       	lea    0x50(%rsp),%rdi
400894:	ba 01 00 00 00       	mov    $0x1,%edx
400899:	be 00 10 00 00       	mov    $0x1000,%esi
40089e:	e8 fd fe ff ff       	callq  4007a0 <__fread_chk@plt>
4008a3:	48 39 44 24 08       	cmp    %rax,0x8(%rsp)
4008a8:	0f 85 81 00 00 00    	jne    40092f <main+0x14f>
4008ae:	48 8d 74 24 50       	lea    0x50(%rsp),%rsi
4008b3:	bf 01 00 00 00       	mov    $0x1,%edi
4008b8:	31 c0                	xor    %eax,%eax
4008ba:	e8 d1 fe ff ff       	callq  400790 <__printf_chk@plt>
4008bf:	48 8b 0d c2 09 20 00 	mov    0x2009c2(%rip),%rcx        # 601288 <stdin@@GLIBC_2.2.5>
4008c6:	48 8d 7c 24 08       	lea    0x8(%rsp),%rdi
4008cb:	ba 01 00 00 00       	mov    $0x1,%edx
4008d0:	be 08 00 00 00       	mov    $0x8,%esi
4008d5:	e8 36 fe ff ff       	callq  400710 <fread@plt>
4008da:	48 83 f8 01          	cmp    $0x1,%rax
4008de:	75 1e                	jne    4008fe <main+0x11e>
4008e0:	48 8b 4c 24 08       	mov    0x8(%rsp),%rcx
4008e5:	48 81 f9 00 10 00 00 	cmp    $0x1000,%rcx
4008ec:	77 10                	ja     4008fe <main+0x11e>
4008ee:	48 85 c9             	test   %rcx,%rcx
4008f1:	75 95                	jne    400888 <main+0xa8>
{% endhighlight %}

在 0x4008ba 会有 printf 输出缓冲区，其内容来自用户输入，此处可以构造 format string 来 leak 内存或者是其他非法操作(利用%n)。

这一部分的具体输入规则是，先输入`'\x00\x10\x00\x00'`，然后输入 0x1000 个字符(format string)… 两步循环。

### Where's the flag?

一开始找到 FSB，我想可能很简单，直接打印栈中的 flag 就好了。但是有这样一段代码把 flag 给覆盖了：
{% highlight objdump %}
40084d:	48 b8 cc cc cc cc cc 	movabs $0xcccccccccccccccc,%rax
400854:	cc cc cc
400857:	48 89 44 24 10       	mov    %rax,0x10(%rsp)
40085c:	48 89 44 24 18       	mov    %rax,0x18(%rsp)
400861:	48 89 44 24 20       	mov    %rax,0x20(%rsp)
400866:	48 89 44 24 28       	mov    %rax,0x28(%rsp)
40086b:	48 89 44 24 30       	mov    %rax,0x30(%rsp)
400870:	48 89 44 24 38       	mov    %rax,0x38(%rsp)
400875:	48 89 44 24 40       	mov    %rax,0x40(%rsp)
40087a:	48 89 44 24 48       	mov    %rax,0x48(%rsp)
{% endhighlight %}

还是老老实实看 construct_tree() 吧。

### construct_tree()

IDA decompile 的 C 代码:
{% highlight c %}
struct s0 {
    signed char f0;
    signed char[7] pad8;
    struct s0* f8;
    struct s0* f16;
};

/* .calloc */
struct s0* calloc(int64_t rdi, int64_t rsi);

/* .strlen */
uint64_t strlen(signed char* rdi, int64_t rsi);

struct s0* construct_tree(signed char* rdi) {
    signed char* r14_2;
    uint64_t r13_3;
    struct s0* rax4;
    struct s0* r15_5;
    struct s0* rbp6;
    uint64_t rax7;
    uint32_t r12d8;
    int32_t ebx9;
    struct s0* rax10;
    uint64_t rax11;

    r14_2 = rdi;
    *(int32_t*)&r13_3 = 0;
    *((int32_t*)&r13_3 + 1) = 0;
    rax4 = calloc(1, 24);
    r15_5 = rax4;
    rbp6 = rax4;
    rax7 = strlen(r14_2, 24);
    if (0 < rax7) {
        do {
            r12d8 = (uint32_t)(unsigned char)*r14_2;
            ebx9 = 7;
            while (1) {
                rbp6->f0 = 73;
                rax10 = calloc(1, 24);
                if ((int1_t)(r12d8 >> ebx9)) {
                    --ebx9;
                    rbp6->f8 = rax10;
                    rbp6 = rax10;
                    if (ebx9 == -1)
                        break;
                } else {
                    --ebx9;
                    rbp6->f16 = rax10;
                    rbp6 = rax10;
                    if (ebx9 == -1)
                        break;
                }
            }
            ++r13_3;
            rax11 = strlen(r14_2, 24);
        } while (r13_3 < rax11);
    }
    rbp6->f0 = 76;
    return r15_5;
}
{% endhighlight %}

这段代码很简单，就是依据 flag 中各个字符每个 bit 的值构造一个二叉树。然后这个树的根的的地址会在 main 函数中打印出来。

### exp.py

我在比赛中用的 leak 一次只能 leak 一个字符，赛后重写改进了一下，能 leak 4 个字符，稍微加快一点。

{% gist cubarco/a3ce8d93cb4860500090 %}

一开始我准备用`"%31$s"`直接 printf, 但是会报`*** invalid %N$ use detected ***`. 这是由于 Glibc 的 FORTIFY_SOURCE, 可以绕过，具体方法看[这篇文章][1]。

### The end?

其实 FSB 最严重的问题是用类似`%N$n`的 format string 能够实现将任意值写入指定 offset 的栈中。但是 Glibc 的 FORTIFY_SOURCE 解决(?)了这个问题。但是[这篇文章][1]好像还是有办法绕过<del>虽然我还没成功</del>。

###### Update 2015-12-13

phrack 上的那篇[文章][1]是 2010 年的，之后在 2012 年，glibc 打了一个 [patch][2], 用`width_arg`盖掉`stdout->_flags2`上`_IO_FLAGS2_FORTIFY`标志位的办法已经行不通了。

### References
1. [A Eulogy for Format Strings][1]
2. [glibc.git / commit / 7c1f4834d398163d1ac8101e35e9c36fc3176e6e][2]

[1]: http://phrack.org/issues/67/9.html
[2]: http://repo.or.cz/glibc.git/commit/7c1f4834d398163d1ac8101e35e9c36fc3176e6e
