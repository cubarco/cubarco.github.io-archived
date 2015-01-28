---
title: 解决用 ldconfig 指定 libgl 库时 Steam 的异常 
layout: post
categories: blog
tags:
  - Linux
  - ldconfig
  - Steam
  - Graphics Card
---

刚考完试，有点无聊，开 Steam 准备玩点游戏，结果发现之前的一个脚本不能用了。我的机器的情况是 Intel 集显 + NVIDIA 独显。两个显卡的切换一直是件很蛋疼的事情，optirun s什么的性能实在太差，如果一直独显直出，耗电也是个大问题。这个学期初和 @hyrathb juju 一起研究了一下，用 ldconfig 尽可能减少切换显卡带来的麻烦(就是先关X, 然后跑个脚本开独显直出的X, 如果需要这个解决方案我可以单独po文). 

#### Steam 的坑
Steam 为了`Need to add /usr/lib32 to the library path to pick up libvdpau_nvidia.so on Ubuntu 12.04`把`/usr/lib32`加进了`LD_LIBRARY_PATH`变量，结果虽然在 ldconfig 中本来是 NVIDIA 的 libgl 库优先，但是`/usr/lib32`里面默认 mesa 的 libgl 库的链接却被优先加载了。导致 Steam 启动时会报`Not direct rendering`之类的错误。

#### 之前的解决办法
这个学期初是顺便解决了这个问题的，当时就是把 steam.sh 里面如下这行注释掉。
{% highlight sh %}
export LD_LIBRARY_PATH="$LD_LIBRARY_PATH:/usr/lib32"
{% endhighlight %}
但是 Steam 会在启动时检查文件完整性，第一次检查是检查大小，所以把文件删掉一个字节就好了。不过要在启动 Steam 后换回原文件，因为 Steam 会第二次检查文件完整性，这次大概是检查哈希值。我是写了个脚本，准备两个文件，原文件和修改后的文件，cp 两次。不过最近升级后，第一次检查的好像也是哈希值了。检查的那些步骤估计都是写进二进制的，想绕过也比较麻烦，这脚本就没救了。

#### 新发现
这次仔细读了一下 steam.sh, 这一块代码还是可以好好利用一下的:
{% highlight sh %}
# and launch steam
STEAM_DEBUGGER=$DEBUGGER
unset DEBUGGER # Don't use debugger if Steam launches itself recursively
if [ "$STEAM_DEBUGGER" == "gdb" ] || [ "$STEAM_DEBUGGER" == "cgdb" ]; then


    # Set the LD_PRELOAD varname in the debugger, and unset the global version.
    if [ "$LD_PRELOAD" ]; then
        echo set env LD_PRELOAD=$LD_PRELOAD >> "$ARGSFILE"
        echo show env LD_PRELOAD >> "$ARGSFILE"
        unset LD_PRELOAD
    fi

    $STEAM_DEBUGGER -x "$ARGSFILE" --args "$STEAMROOT/$STEAMEXEPATH" "$@"
    rm "$ARGSFILE"
elif [ "$STEAM_DEBUGGER" == "valgrind" ]; then
    DONT_BREAK_ON_ASSERT=1 G_SLICE=always-malloc G_DEBUG=gc-friendly valgrind --error-limit=no --undef-value-errors=no --suppressions=$PLATFORM/steam.supp $STEAM_VALGRIND "$STEAMROOT/$STEAMEXEPATH" "$@" 2>&1 | tee steam_valgrind.txt
elif [ "$STEAM_DEBUGGER" == "callgrind" ]; then
    valgrind --tool=callgrind --instr-atstart=no "$STEAMROOT/$STEAMEXEPATH" "$@"
elif [ "$STEAM_DEBUGGER" == "strace" ]; then
    strace -osteam.strace "$STEAMROOT/$STEAMEXEPATH" "$@"
else
    $STEAM_DEBUGGER "$STEAMROOT/$STEAMEXEPATH" "$@"
fi
{% endhighlight %}
只要`DEBUGGER`环境变量不匹配给定的字符串，最后 Steam 就会以下述方式执行:
{% highlight sh %}
$STEAM_DEBUGGER "$STEAMROOT/$STEAMEXEPATH" "$@"
{% endhighlight %}

#### 新的解决办法
随便创建个文件，只要名字不是gdb, cgdb, valgrind, strace. 内容是:
{% highlight sh %}
#!/bin/bash

export LD_LIBRARY_PATH=`echo $LD_LIBRARY_PATH | sed "s/:\/usr\/lib32//"`
exec "$@"
{% endhighlight %}
给执行权限。

然后这样启动 Steam 就行了。
{% highlight sh %}
# For example: env DEBUGGER=/usr/bin/STEAM_DEBUGGER steam
env DEBUGGER=/path/to/script steam
{% endhighlight %}
