---
title: Paf 开发总结
layout: post
categories: blog
tags:
  - FIFO
  - Linux
  - Pipe
modified: 2015-01-01
---

[Paf (Pipe as file)](https://github.com/cubarco/paf "Pipe as File Github Homepage") 并不是什么大项目，只是一时兴起为满足自己奇怪需求而开发的小工具。具体的介绍都摆在 Github 上了，这里就不赘述了。只是对开发过程中遇到的一些问题和技巧做一下总结。

#### EOF 的产生
`pipe`是有一定容量的[^1]，这一部分就是内核维护的缓冲区。当`pipe`的读端试图对文件描述符执行`read()`系统调用的时候，内核会先检查缓冲区是否有数据，有则返回; 若没有，则根据读端文件描述符具体是否以阻塞标志打开，如阻塞，则阻塞至缓冲区有数据，或者当对端已经关闭文件描述符的时候，读端的`read()`调用会返回0, 这就是所谓的`EOF`。对`pipe`的写端执行`close()`并不会刷新`pipe`的缓冲区，而且读端也并不能立即察觉到写端已经关闭。这引发了一个问题，也是我在开发过程中碰到的一个很大的问题。如果写端在关闭后，在`pipe`的缓冲区还没被读端读取完的时候，重新打开并写入数据，这部分数据会写入原先的缓冲区并被读端继续读取。

#### FIFO 的正确使用姿势
上文提到的`EOF`并未被读端及时响应还会造成另一个问题。如果写端关闭后立即执行`open()`系统调用，这个函数不会阻塞，因为读端确实正处于打开的状态。另一方面，读端关闭后立即执行也不会阻塞。这对程序的逻辑造成了致命的影响，它让读端误以为第二次打开的是一个新的文件，同时让写端误以为读端已经在请求新文件的数据。

所以`FIFO`的正确使用姿势应该是在写端`open()`之后立即`unlink()`然后再`mkfifo()`:
{% highlight c %}
wfd = open(filename, O_WRONLY, NULL);
unlink(filename);
mkfifo(filename, FIFO_MODE);
{% endhighlight %}
虽然对`FIFO`进行了`unlink()`, 文件已经不存在，但是内核实际上还在维护读写两端的文件描述符和对应的缓冲区。而第二次`mkfifo()`即使创建的`FIFO`的名字是一样的，内核会为它维护另一套空间。这样的话，无论是读端还是写端，连续的两次`open()`都会阻塞。而且打开后缓冲区是空的。

#### 二阶指针
二阶指针玩链表其实还是蛮有意思的嘛<s>(虽然只是少定义一个中间变量)</s>...

#### stdin, stdout, stderr and tty
`/dev/{stdin,stdout,stderr}`默认分别是`/proc/self/fd/{0,1,2}`的软链接，而`/proc/self/fd/{0,1,2}`默认都是`pts`或者`tty`的软链接，所以`stdin`, `stdout`, `stderr`默认就是终端设备。当`stdin`被 shell 用管道替换之后，可以用以下方式重新打开键盘输入(另外两个类似):
{% highlight c %}
#include <unistd.h> /* for dup2(), close() and STDIN_FILENO */
#include <fcntl.h> /* for open() and O_RDONLY */

int realstdin = open("/dev/tty", O_RDONLY);
dup2(realstdin, STDIN_FILENO);
close(realstdin);
{% endhighlight %}
`/dev/tty`总是当前终端设备

#### More
想到什么我再更新吧。

#### Reference
[^1]: [pipe(7) - Linux man page](http://linux.die.net/man/7/pipe)
