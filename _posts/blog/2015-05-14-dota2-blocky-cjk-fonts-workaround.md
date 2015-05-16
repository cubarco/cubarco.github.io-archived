---
title: 一个解决 Linux 版 DotA2 中 CJK 字符显示成方块的 Workaround
layout: post
categories: blog
tags:
  - Linux
  - Steam
  - DotA2
  - Fonts
  - CJK
modified: 2015-05-15
---

不知道从什么时候开始，Linux 版本的 DotA2 中载入界面的 tips sentences 和 player name 中的中文会显示成方框，详见 [issue-1688](https://github.com/ValveSoftware/Dota-2/issues/1688)。V社基本没搭理这个 bug，只好自己动手修。

猜想是游戏内直接使用了某个字体，或者该字体不存在时调用了默认字体，但是他们不支持 CJK 字符，所以显示成方块。因为 SteamFonts 给的全是`Arial`字体，我猜 DotA2 那些文本使用的字体可能是`Arial`，开`FC_DEBUG`跑了一遍发现猜的没错。那么我们要做的就是用`fontconfig`把`Arial`替换成支持中文的字体。

## 解决办法
替换`Arial`的`fontconfig`配置是:
{% highlight xml %}
<match target="pattern">
  <test qual="any" name="family">
    <string>Arial</string>
  </test>
  <edit name="family" mode="assign" binding="same">
    <string>Noto Sans S Chinese</string>
  </edit>
</match>
{% endhighlight %}
我用的是`Noto Sans S Chinese`，如果用文泉驿正黑就改成`WenQuanYi Zen Hei`。

怎么使这个配置生效？有两个方法。

###### 环境变量 FONTCONFIG_FILE
这个方法需要一个为 DotA2 单独准备的`fontconfig_file`，姑且命名为`dota2-fontconfig.conf`。

文件内容如下:
{% highlight xml %}
<?xml version="1.0"?>
<!DOCTYPE fontconfig SYSTEM "fonts.dtd">
<fontconfig>
  <include ignore_missing="no">fonts.conf</include>

  <match target="pattern">
    <test qual="any" name="family">
      <string>Arial</string>
    </test>
    <edit name="family" mode="assign" binding="same">
      <string>Noto Sans S Chinese</string>
    </edit>
  </match>
</fontconfig>
{% endhighlight %}
然后用`FONTCONFIG_FILE`环境变量来传递。但是使用这个环境变量之后，`fontconfig`不会再加载`/etc/fonts/fonts.conf`，所以这里把这个文件也包含进来。[^1]

然后这样打开 Steam:
{% highlight sh %}
export FONTCONFIG_FILE=/path/to/dota2-fontconfig.conf
steam
{% endhighlight %}
再运行 DotA2 就不会有方块的困扰了。

###### 写进`fonts.conf`
直接把字体替换的配置写进`fonts.conf`，比如`~/.fonts.conf`或者`$XDG_CONFIG_HOME/fontconfig/fonts.conf`。

当然这个方法并不推荐，因为会影响到其他程序。

#### Reference
[^1]: [fonts-conf](http://www.freedesktop.org/software/fontconfig/fontconfig-user.html)
