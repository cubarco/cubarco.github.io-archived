---
title: 'Writeup: CTFZone 2018 Quals'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, PWN]
share: true
modified: 2018-07-23
---

两道PWN题, 一个easypwn_strings, 一个Mobile Bank.

# easypwn_strings

### 问题

You can try to use very interesting and strange string functions ;) Good luck. `nc pwn-03.v7frkwrfyhsjtbpfcppnu.ctfz.one 1234` And yes, there is no binary here

这是一道**盲pwn**类型的题，没有提供二进制<del>(名义上的)</del>。

nc连上之后回显：

```
Let's choose string operation!
	1. StrLen
	2. SubStrRemove
	3. StrRemoveLastSymbols
```

第一个选项：输入一个字符串，回显字符串长度。

```
You choise - 1
	Use str
	good choise
123
	Result: 3
```

第二个选项显示未实现。

第三个选项：输入一个字符串，和一个数字，服务端移除末尾指定长度的字符串后打印出来。

```
You choise - 3
	Use str int
	good choise
	Set string:
1234567
	Set number:
3
	Delete 3 ending symbols
	Result:
1234
```

### 思路

既然是无ELF文件的盲pwn，那只能摸着石头过河。做题时有以下几个尝试：

1. <del>三个选项的输入是否有溢出；</del>
1. <del>未实现的选项2是否有隐藏功能；</del>
1. <del>选项3输入的数字是否可以为负数，可能造成字符串拷贝时的溢出或者泄密问题；</del>
1. ...

很多尝试以失败告终。最终找到的漏洞是功能3的**格式化字符串漏洞**：

```
You choise - 3
	Use str int
	good choise
	Set string:
%p %p %p
	Set number:
0
	Delete 3 ending symbols
	Result:
0xffe96350 0x8 0xf75fc1a4
```

我们可以利用这个格式化字符串漏洞构造一个任意地址读，然后把内存中的ELF dump下来。

怎么dump？可以参考YouTube上一个视频：[Format String to dump binary and gain RCE - 33c3ctf ESPR (pwn 150)](https://www.youtube.com/watch?v=XuzuFUGuQv0).

这道题和ESPR有两点区别：

1. ESPR的输入只限制了`\n`字符，但是这题的输入不能包含`\n`和`\x00`，猜测是用了`fgets`和`strcpy`。所以在dump下来的二进制中会有一些遗漏位，不过对这道题来说无伤大雅；
2. ESPR一个进程循环不断调用`printf`，但是这题进程只有一个流程，没有循环，所以需要不断与服务器创建连接，十分耗时。好在需要dump的是ELF，内容是固定的。

dump脚本：


{% gist cubarco/9bfafbc77dd2c0330e3c0ef87013c6fa strings-dump.py %}

### 漏洞（gets溢出）

把ELF dump下来之后跑一下`strings dump.raw`，看到一些有意思的字符串：

```shell
$ strings dump.raw
...
	Delete %i ending symbols
	Result:
https://ctf.bi.zone/files/babypwn
https://ctf.bi.zone/files/babylibc
main.c
Have a nice day!
ctfzone{1t_1s_$uP6r_F4k6_4H4H}
ctfzone{$uP6r_F4k6_4H4H4H_t00}
...
```

<del>除了有两行假装是flag的信息，还</del>有两行URL，看来是提供了二进制和libc的：

1. https://ctf.bi.zone/files/babypwn
2. https://ctf.bi.zone/files/babylibc

IDA打开babypwn，发现main函数还藏了两个菜单选项：

```c
  v3 = _IO_getc(stdin);
  _IO_getc(stdin);
  if ( v3 == '1' || v3 == '2' || v3 == '3' || v3 == 'X' || v3 == 'T' || v3 == 'S' )
  {
    printf("You choise - %c\r\n", v3);
    ...
  	if ( v3 != 'X' && v3 != 'T' )
	  ...
    else
    {
      puts("\tAre you surprised?? (y or n)\r");
      gets(gets_buf);
      v1 = strchr(gets_buf, 'y');
      if ( v1 )
        func_ptr(v1, 0, v2);
```

`gets`是明显的危险函数，`gets_buf`上存在溢出，再看溢出到哪：

```
.bss:080492E0 ; char gets_buf[256]
.bss:080492E0 gets_buf        db 100h dup(0)          ; DATA XREF: main+62↑o
.bss:080492E0                                         ; main+245↑o ...
.bss:080493E0 ; int (__cdecl *func_ptr)(_DWORD, _DWORD, _DWORD)
.bss:080493E0 func_ptr        dd 0                    ; DATA XREF: main+18F↑w
.bss:080493E0                                         ; main+1AE↑w ...
```

可以盖到`func_ptr`这个函数指针，所以这个溢出已经可以用来**劫持控制流**了。

### EXP

checksec一下babypwn文件:

```
[*] '/tmp/babypwn'
    Arch:     i386-32-little
    RELRO:    No RELRO
    Stack:    No canary found
    NX:       NX enabled
    PIE:      No PIE (0x8048000)
    RWX:      Has RWX segments
```

有RWX的段，用GDB挂上ELF看一下map:

```
gef> vmmap
Start      End        Offset     Perm Path
0x08048000 0x0804c000 0x00000000 rwx /tmp/babypwn
0x0804c000 0x0804d000 0x00000000 rw- [heap]
0xf7dbf000 0xf7f93000 0x00000000 r-x /usr/lib32/libc-2.27.so
0xf7f93000 0xf7f94000 0x001d4000 --- /usr/lib32/libc-2.27.so
...
```

整个ELF都是RWX的<del>(这题有毒...)</del>，那很简单了，之前溢出的`gets_buf`就在bss段上，可写可执行，还知道地址。只要把shellcode写到`gets_buf`上，然后溢出到`func_ptr`，指向`gets_buf`，就执行shellcode了。

利用脚本：

{% gist cubarco/9bfafbc77dd2c0330e3c0ef87013c6fa strings-exp.py %}

------

# Mobile Bank

<del>在写</del>
