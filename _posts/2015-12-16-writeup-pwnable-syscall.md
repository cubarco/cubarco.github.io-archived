---
title: 'Writeup-Pwnable: syscall'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, ARM]
---

{% highlight c %}
// adding a new system call : sys_upper

#include <linux/module.h>
#include <linux/kernel.h>
#include <linux/slab.h>
#include <linux/vmalloc.h>
#include <linux/mm.h>
#include <asm/unistd.h>
#include <asm/page.h>
#include <linux/syscalls.h>

#define SYS_CALL_TABLE		0x8000e348		// manually configure this address!!
#define NR_SYS_UNUSED		223

//Pointers to re-mapped writable pages
unsigned int** sct;

asmlinkage long sys_upper(char *in, char* out){
	int len = strlen(in);
	int i;
	for(i=0; i<len; i++){
		if(in[i]>=0x61 && in[i]<=0x7a){
			out[i] = in[i] - 0x20;
		}
		else{
			out[i] = in[i];
		}
	}
	return 0;
}

static int __init initmodule(void ){
	sct = (unsigned int**)SYS_CALL_TABLE;
	sct[NR_SYS_UNUSED] = sys_upper;
	printk("sys_upper(number : 223) is added\n");
	return 0;
}

static void __exit exitmodule(void ){
	return;
}

module_init( initmodule );
module_exit( exitmodule );
{% endhighlight %}

这题就是提供了一个可以`write-anything-anywhere`的系统调用(也不算anything，有点限制)，系统调用的地址存在`0x8000e348+223 = 0x8000e6c4`, flag在`/root/flag`.

按理说应该不难，但是我做了很久。后来想了一下，主要是内联汇编不熟(没有写好 clobbers 导致各种崩)。再就是没有深入理解 Linux 的权限控制机制，一开始想当然的觉得 kernel space 就肯定有 root 权限，后来发现就算用了系统调用，跑到奇怪的地址上执行，uid 还是这个进程的 uid[^1]. 所以尝试的 `open-read-write`, `chown()`各种都已失败告终，权限不够。直接在 kernel space `execve()`的我也是想多了。

其实思路还是挺简单的，首先修改 223 号系统调用的内容，然后调用这个修改过的 223 号系统调用，在 kernel space 把 uid 改掉，之后在 user space `execve()`就好了。

在现在版本的 Linux 内核修改 uid，需要通过`prepare_creds()`和`commit_creds()`两步[^2]。这两个函数的地址存在`/proc/kallsyms`:

{% highlight console %}
$ cat /proc/kallsyms | grep 'prepare_creds\|commit_creds'
8003f44c T prepare_creds
8003f56c T commit_creds
...
{% endhighlight %}

我参考 @acama 的版本[^3]写了一个( @acama 的版本`prepare_creds()`之后直接就`commit_creds()`, 这估计只在老版本可以).`prepare_creds()`返回的结构体定义可以看参考[^4].

{% gist cubarco/f582d787f04eca93f8eb cred.s %}

这个生成的指令是不能用原先的 223 号系统调用直接写进内存的，所以我准备了一个真正的`write-anything-anywhere`的跳板:

{% gist cubarco/f582d787f04eca93f8eb waa.s %}

先把 waa 写进内存，然后把 cred 写进内存。至于写到哪里，我随手写了两个地址: 0x83f5cafe, 0x83f6beee.

### exp.c

{% gist cubarco/f582d787f04eca93f8eb 1-pwnable-rookiss-syscall.c %}

### References

[^1]: [What is the relationship between root and kernel?](http://unix.stackexchange.com/questions/121715/what-is-the-relationship-between-root-and-kernel)
[^2]: [Syscall Hijacking: Simple Rootkit (kernel 2.6.x)](https://memset.wordpress.com/2010/12/28/syscall-hijacking-simple-rootkit-kernel-2-6-x/)
[^3]: [arm-evt/local_example/exploit/backdoor.asm](https://github.com/acama/arm-evt/blob/master/local_example/exploit/backdoor.asm)
[^4]: [Linux/include/linux/cred.h](http://lxr.free-electrons.com/source/include/linux/cred.h?v=3.11#L102)
