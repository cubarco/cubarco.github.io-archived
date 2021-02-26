---
title: 通过DNS隧道绕过portal认证
layout: post
categories: blog
modified: 2014-12-18
tags:
  - Amazing
  - Android
  - HustWireless
  - iodine
  - Linux
  - Portal
---

>         Portal在英语中是入口的意思。Portal认证通常也称为Web认证，一般将Portal认证网站称为门户网站。未认证用户上网时，设备强制用户登录到特定站点，用户可以免费访问其中的服务。当用户需要使用互联网中的其它信息时，必须在门户网站进行认证，只有认证通过后才可以使用互联网资源。用户可以主动访问已知的Portal认证网站，输入用户名和密码进行认证，这种开始Portal认证的方式称作主动认证。反之，如果用户试图通过HTTP访问其他外网，将被强制访问Portal认证网站，从而开始Portal认证过程，这种方式称作强制认证。

比如说：华某科校园网(无线端), Chinanet, CMCC, China-Unicom

（华某科校园网升级后，DNS隧道被一定程度限用，处于半残状态。基本无法使用。）

portal认证不同于pppoe，它已经通过DHCP对Client分发IP，但是在完成认证前会强制重定向url到protal认证界面，只有登录后才能顺利的访问网络。不过portal认证<span style="text-decoration: underline;"><em>并没有阻止DNS查询</em></span>的请求，通过一定手段可以绕过portal认证，直接访问internet。我们需要的软件就是iodine

> iodine lets you tunnel IPv4 data through a DNS server. This can be usable in different situations where internet access is firewalled, but DNS queries are allowed.
> 
> <p style="text-align: right;">
>   <!--more-->
> </p>

为了构建DNS隧道，一台服务器和一个域名是必须的。你需要在DNS服务器添加两条记录，这一步尤为重要。一条是NS记录，a.yourdomain.com，纪录值是&#8221;b.yourdomain.com.&#8221;(不要忘了最后一个dot)，另一条是A记录，b.yourdomain.com，记录值是server端的公网IP（example: 123.456.789.123）。设置好了以后可以在<a title="http://code.kryo.se/iodine/check-it/" href="http://code.kryo.se/iodine/check-it/" target="_blank">http://code.kryo.se/iodine/check-it/</a>输入a.yourdomain.com测试是否配置成功。

<span style="text-decoration: underline;"><em>使用iodine必须要保证server端和client端的iodine版本相同</em></span>，所以我这里选择的是编译安装，源码是git版本。

## Server端

{% highlight console %}
$ git clone https://github.com/yarrick/iodine.git
$ cd iodine
$ make
# make install
{% endhighlight %}

编译安装完毕，在server端使用的是iodined。

{% highlight sh %}
Usage: iodined [-v] [-h] [-c] [-s] [-f] [-D] [-u user] [-t chrootdir] [-d device] [-m mtu] [-z context] [-l ip address to listen on] [-p port] [-n external ip] [-b dnsport] [-P password] [-F pidfile] tunnel_ip[/netmask] topdomain
{% endhighlight %}

一般只需要两个可选参数c和P，测试阶段可以使用f。

{% highlight sh %}
-c to disable check of client IP/port on each request
-P password used for authentication (max 32 chars will be used)
-f to keep running in foreground

tunnel_ip is the IP number of the local tunnel interface.
#代码执行后，服务器会多出一个虚拟网卡，ip为此参数设定值
netmask sets the size of the tunnel network.
topdomain is the FQDN that is delegated to this server.
#上文提到的a.yourdomain.com
{% endhighlight %}


接下来执行以下命令：

{% highlight console %}
# iodined -c -f -P yourpassword 192.168.99.1 a.yourdomain.com
{% endhighlight %}

会看到以下输出，表示server端设置完毕。

{% highlight sh %}
Opened dns0
Setting IP of dns0 to 192.168.99.1
Setting MTU of dns0 to 1130
Opened IPv4 UDP socket
Listening to dns for domain a.yourdomain.com
{% endhighlight %}

##  Client端（linux）

iodine的安装同Server端，不再赘述。

需要连接server时只需要执行以下命令：

{% highlight console %}
# iodine a.yourdomain.com
{% endhighlight %}

接下来交互式输入刚才在server端设置的密码，你会看到以下输出

{% highlight sh %}
Opened dns0
Opened IPv4 UDP socket
Sending DNS queries for a.yourdomain.com to 8.8.8.8  
#8.8.8.8是你client端的主DNS
Autodetecting DNS query type (use -T to override).
Using DNS type NULL queries
Version ok, both using protocol v 0x00000502. You are user #0
Setting IP of dns0 to 192.168.99.2
Setting MTU of dns0 to 1130
Server tunnel IP is 192.168.99.1
Testing raw UDP data to the server (skip with -r)
Server is at 123.456.789.123, trying raw login: OK
Sending raw traffic directly to 123.456.789.123
Connection setup complete, transmitting data.
Detaching from terminal...
{% endhighlight %}

这样iodine就在client端开启了一个虚拟网卡，IP为192.168.99.2，与刚才在server端设置的192.168.99.1处于同一个网段，至此便可以用192.168.99.1这个新的IP与server段通信了，然后可以采用socks代理、http代理之类的方法连通internet。ping一下试试吧。

## Client端（Android）

可以在pc上下载ndk（ndk的配置请自行求助搜索引擎XD），然后在android环境编译安装，方法其实都写在了README里面，我转述一发好了。

{% highlight sh %}
$ cd ./iodine/src
$ make base64u.h base64u.c
$ ndk-build NDK_PROJECT_PATH=. APP_BUILD_SCRIPT=Android.mk
{% endhighlight %}

然后新鲜出炉的android端iodine就出现在了iodine/src/libs/armeabi/iodine，用adb拉到手机里面就行了（附件提供了已编译的iodine文件）

但是在android端运行iodine还需要必不可少的tun.ko，可以直接在应用市场搜“tun.ko”，很多app能方便地安装tun.ko。

接下来的使用就和在linux下一样了。

## Client端（windows）

<del><em>呵呵 </em></del>

## 附件

* tun.ko installer : <a href="https://play.google.com/store/apps/details?id=com.aed.tun.installer" target="_blank">Google Play</a>
* iodine for android (20140211 ) ： <a href="https://drive.google.com/file/d/0B4Uhz2CREiHoTmd6NGxONmRfY1E/edit?usp=sharing" target="_blank">Google Docs</a>     <a href="http://pan.baidu.com/s/1qW0LNUO" target="_blank">百度网盘</a>
* <del>如果不嫌弃，可以将这个VPS提供给各位测试使用。</del>(53端口移作他用，就不提供测试使用了。)

## 参考

* iodine作者的README：<a title="https://github.com/yarrick/iodine" href="https://github.com/yarrick/iodine" target="_blank">https://github.com/yarrick/iodine</a>
* 《<a href="http://loosky.net/1934.html" target="_blank">有DNS的地方就能上网</a>》——自由的风
* 《<a href="http://www.h3c.com.cn/Products___Technology/Technology/Security_Encrypt/Other_technology/Technology_recommend/200812/624142_30003_0.htm" target="_blank">Portal技术介绍</a>》——H3C
