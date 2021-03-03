---
title: 'Writeup: CTFZone 2018 Quals'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, PWN]
modified: 2018-07-24
---

{% include toc %}

两道PWN题, 一个easypwn_strings, 一个Mobile Bank.

# easypwn_strings

### 问题

> You can try to use very interesting and strange string functions ;) Good luck. `nc pwn-03.v7frkwrfyhsjtbpfcppnu.ctfz.one 1234` And yes, there is no binary here

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

### 问题

> We bring your attention to a new, unique product: "Mobile Bank"! It's a completely secure banking server running on mobile platforms. Now the Bank is in your pocket! `nc pwn-04.v7frkwrfyhsjtbpfcppnu.ctfz.one 1337`
>
> [mobile_bank](https://ctf.bi.zone/files/mobile_bank.45115ff5f655d94fc26cb5244928b3fc)

下载二进制，checksec一下：

```
[*] '/pwn/bank/mobile_bank'
    Arch:     arm-32-little
    RELRO:    Partial RELRO
    Stack:    Canary found
    NX:       NX enabled
    PIE:      No PIE (0x10000)
```

是一个arm32的二进制。nc连上去看是什么内容：

```
         _._._                       _._._
        _|   |_                     _|   |_
        | ... |_._._._._._._._._._._| ... |
        | ||| |  o NATIONAL BANK o  | ||| |
        | """ |  """    """    """  | """ |
   ())  |[-|-]| [-|-]  [-|-]  [-|-] |[-|-]|  ())
  (())) |     |---------------------|     | (()))
 (())())| """ |  """    """    """  | """ |(())())
 (()))()|[-|-]|  :::   .-"-.   :::  |[-|-]|(()))()
 ()))(()|     | |~|~|  |_|_|  |~|~| |     |()))(()
    ||  |_____|_|_|_|__|_|_|__|_|_|_|_____|  ||
 ~ ~^^ @@@@@@@@@@@@@@/=======\@@@@@@@@@@@@@@ ^^~ ~
      ^~^~                                ~^~^
*******************$$$Menu$$$*******************
* 1 - info                                     *
* 2 - set account id                           *
* 3 - set account note                         *
* 4 - make transaction                         *
* 5 - print account info                       *
* 6 - enable debug                             *
* 0 - exit                                     *
************************************************
Your choice:
```

还是一道菜单题。大概意思是这是一个bank，选项1打印当前的账户id和debug是否开启；选项2设置当前操作的账户id；选项3设置这个账户的note；选项4给当前账户加上指定数额的金钱数；选项5打印当前账户的id、账户余额、账户note；选项6打开debug功能。

用IDA打开，看到有一个选项7，`debug_info`：

```c
      case 7:
        if ( debug_enabled )
          debug_info();
        else
          puts("Invalid command!");
        break;
```

这个debug_info的功能是，打印出所有16个账户的id、余额和note 。

### 漏洞

#### 1. account_id越界

```c
int set_id()
{
  int result; // r0@1

  printf("Enter account id: ");
  result = readint();
  if ( result <= 15 )
    account_id = result;
  else
    result = puts("Wrong account id!");
  return result;
}
```

这是选项2的实现，通过`readint`读入`int`型数据，若小于15便赋值给全局变量`account_id`. 漏洞在于这里是**可以输入负值**的，而这个`account_id`在多个选项中被当作数组下标来使用，所以会有下越界的问题。

这个漏洞可以实现什么？有四点：

1. **受限的任意地址读**（选项5）；
2. **受限的任意地址写**（选项4）；
3. 受限的任意地址读指针内容（选项5）；
4. 受限的任意地址赋值为堆上的指针（选项3）。

3、4两点这里用处不大，所以不讲。这里讲下1、2两点。虽然通过负值的`account_id`实现了一定程度的任意地址读写，但是毕竟还是受限的。

以下是选项5的实现：

```c
int account_info()
{
  void *v0; // r3@2
  int result; // r0@4
  char s; // [sp+Ch] [bp-158h]@4
  int v3; // [sp+15Ch] [bp-8h]@1

  v3 = _stack_chk_guard;
  if ( notes_arr[2 * account_id + 1] )
    v0 = notes_arr[2 * account_id + 1];
  else
    v0 = &unk_1196C;
  snprintf(&s, 0x150u, "id: %u, value: %d$, note:\"%s\"", account_id, notes_arr[2 * account_id], v0);
  result = puts(&s);
  if ( v3 != _stack_chk_guard )
    _stack_chk_fail(result);
  return result;
}
```

`notes_arr`是bss段上的数组，基址是0x22088，而输入的`account_id`必须要小于等于15，所以这里对需要读写的地址addr有3点限制：

1. addr到0x22088的offset必须是**8的倍数**；
2. addr+4的位置**必须为0**或是一个**合理的指针**；
3. 除非addr**小于`notes_arr`的地址**（比如GOT、.text、.data段），不然addr的值不能太小，`addr - notes_arr`的值在**无符号int32上必须表现为负数**。

#### 2. debug_info越界写

```c
int debug_info()
{
  size_t n; // ST14_4@4
  char *v1; // r3@5
  int result; // r0@6
  char *v3; // [sp+Ch] [bp-218h]@1
  char *v4; // [sp+Ch] [bp-218h]@3
  signed int i; // [sp+10h] [bp-214h]@1
  char *v6; // [sp+18h] [bp-20Ch]@3
  char s; // [sp+1Ch] [bp-208h]@1
  int v8; // [sp+21Ch] [bp-8h]@1

  v8 = _stack_chk_guard;
  memset(&s, 0, 0x200u);
  v3 = &s;
  for ( i = 0; i <= 15; ++i )
  {
    v4 = &v3[snprintf(v3, (char *)&v8 - v3, "%u\t%d$\t", i, notes_arr[2 * i])];
    v6 = (char *)notes_arr[2 * i + 1];
    if ( v6 )
    {
      n = strlen(v6);
      memcpy(v4, v6, n);
      v4 += n;
    }
    v1 = v4;
    v3 = v4 + 1;
    *v1 = '\n';
  }
```

`debug_info`直接拿`snprintf`返回值做数组下标，移动v3指针。这是对`snprintf`返回值的一个典型误用。

> RETURN VALUE
>
> The functions snprintf() and vsnprintf() do not write  more  than  size bytes  (including the terminating null byte ('\0')).  If the output was truncated due to this limit, then the return value  is  the  number  of characters  (excluding the terminating null byte) which **would have been** written to the final string if enough space had been available. Thus, a  return  value  of  size or more means that the output was truncated. (See also below under NOTES.)

看man文档其实就可以发现，snprintf返回的不是实际往目标buf里写了多少字节，而是**本应写多少字节**。这个漏洞利用后其实可以**越过stack cookie**写值，**绕过canary保护**，实现**ROP**攻击。但是**buf中不能出现null byte**，而且我对ARM下的ROP不熟，所以这个思路在赛间只是个备选项。

**P.S.** 这个debug选项可以通过上文的「受限的任意地址赋值为堆上的指针」来打开，这里不再赘述。

**P.S.S.** 其实我用qemu调这个二进制的时候，发现stack是rwx（可写可执行）的<del>（这个比赛真的有毒。。。）</del>。但是如果想要leak栈地址，其实还是需要一个任意地址读。可是回过头来，如果有了任意地址读，还需要做ROP这么复杂的利用吗？

### EXP

我的利用思路个人感觉比较清奇，需要绕个小弯，是在洗澡的时候想出来的<del>（又一次）</del>。

这个利用只用到了`account_id`越界这个漏洞，具体步骤是：

1. 通过受限的任意地址读，读`memcmp_got`的值（不管是不是已经被`dl-resolve`了，只是需要这个值来计算差值）；
2. 通过受限的任意地址写，把`printf_plt`的值写到`memcmp_got`上去（这一步需要计算`memcmp_got`到`printf_plt`的差值），**此时memcmp已经变成了printf**；
3. 选项6的`enable_debug`函数用到了memcmp，而且第一个参数就是用户输入的字符串，所以这里<del>强行</del>构造了一个FSB漏洞，可以精心构造Format String来实现任意地址读：
4. 利用pwntools的DynELF工具，结合在`enable_debug`构造的任意地址读（即leak），泄密libc上的`system`函数地址；
5. 通过受限的任意地址写，将`system`函数地址写到`memcmp_got`上，调用`enable_debug`，传入`/bin/sh`，getshell.

exp.py:

{% gist cubarco/9bfafbc77dd2c0330e3c0ef87013c6fa bank-exp.py %}
