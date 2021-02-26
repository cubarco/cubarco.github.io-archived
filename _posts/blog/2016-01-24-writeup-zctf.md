---
title: 'Writeup: ZCTF'
layout: post
categories: blog
tags: [Hack, CTF, Writeup, Exploitation, PWN]
share: false
modified: 2016-01-28
---

> 2016 年第一篇 blog!

这次只做出两道 pwn, 好忧伤...

## guess

在最近的 32c3ctf 中出现过一道类似的 readme[^1]. 就是把`argv[1]`改成目的字符串位置，可以在 libc 打出错误信息的时候，被当作文件名打印出来。

{% gist cubarco/cbbd4ab5462c2f0f287b %}

## note1

这题的 note 是以链表形式储存的，堆溢出（edit 存在溢出漏洞）之后可以覆盖地址更改链表结构。我的 exp 思路就是先把一个 note 指向`setvbuf()`的 got, 然后用 show 把地址 leak 出来，这样可以 offset 到`system()`. 然后再将另一个 note 地址改到`strcmp()`的 got, 通过 edit 把内容改成`system()`的地址。最后调用`strcmp()`, title 填`/bin/sh`就可以了。

{% gist cubarco/30a44a61252f448964c4 %}

## <del>note2</del>

这题在赛时没找到漏洞，赛后看了 FlappyPig 的 Writeup[^2], 只是简单的 fastbin, 感觉好可惜... 360 安全播报给的代码没缩进根本不能看，自己重新写了个。

{% gist cubarco/9752fbbe78a071b04b37 %}

## <del>note3</del>

这题同样是没有在赛时做出来，但是与 note2 相反，这题我是找到了两个可以利用的漏洞的(一个是 integer overflow, 另一个是可以增加第八个 note), 但是不知道如何利用。我在比赛的时候一直想着怎么 fastbin, 因为我觉得 unlink 这么古老的 exp 肯定已经不能用了... 没想到这题的环境刚好适合 unlink, 有点可惜。赛后看了 FlappyPig 的 Writeup[^2], 自己重新写了个 exp, 也算是复习一下 unlink.

{% gist cubarco/ababdac123a4762c0180 %}

## References

[^1]: [write-ups-2015/32c3-ctf-2015/pwn/readme-200/ @ GitHub](https://github.com/ctfs/write-ups-2015/tree/master/32c3-ctf-2015/pwn/readme-200)
[^2]: [ZCTF Writeup @ 360 安全播报](http://bobao.360.cn/ctf/detail/158.html)
