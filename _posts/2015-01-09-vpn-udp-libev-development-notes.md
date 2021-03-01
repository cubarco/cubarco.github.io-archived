---
title: vpn-udp-libev 开发总结
layout: post
categories: blog
tags:
  - Network
  - VPN
  - Linux
modified: 2015-01-10
---

最近又在看 UNIX 网络编程那本书，写了个 vpn 练手，代码和简单的介绍在 [Github](https://github.com/cubarco/network-programming-exp/tree/master/vpn-udp-libev "cubarco/network-programming-exp/vpn-udp-libev") 上<s>(好像效率还不错的样子)</s>。这里照例做一下总结，便于以后查阅。

#### 关于`recvfrom()`
{% highlight c %}
/* recvfrom() 的声明 */
ssize_t recvfrom(int sockfd, void *buf, size_t len, int flags,
                 struct sockaddr *src_addr, socklen_t *addrlen);
{% endhighlight %}
这个函数比较诡异的是它的最后一个参数`addrlen`.
{% highlight console %}
If  src_addr  is  not  NULL, and the underlying protocol provides the source
address of the message, that source address is placed in the buffer  pointed
to  by  src_addr.  In this case, addrlen is a value-result argument.  Before
the call, it should be initialized to the size of the buffer associated with
src_addr.  Upon return, addrlen is updated to contain the actual size of the
source address.  The returned address is truncated if the buffer provided is
too  small;  in this case, addrlen will return a value greater than was sup‐
plied to the call.
{% endhighlight %}
一开始用的时候没有仔细看 manpage，天真地以为既然传的是指针，它的用处应该就只储存返回值。但是昨天跟 @hexchain juju讨论之后，发现这个函数还是会用到`addrlen`的初始值的,目的大概是为了防止给`src_addr`传值的时候溢出。以后用库函数还是先查清楚参数的具体用处再用吧...

#### 同时兼容 IPv4 和 IPV6
服务器为了同时兼容两种协议，主要就是 addr 结构体的选择，`sockaddr_in`是为 IPv4 准备的，在我 x64 系统上它的结构体大小是 16B，而`sockaddr_in6`是为 IPv6 准备的，大小是28B，一开始我以为`sockaddr`是兼容二者的结构体，但是这货大小只有16B。在[ShadowVPN](https://github.com/clowwindy/ShadowVPN "ShadowVPN")代码里找了找，发现`sockaddr_storage`这个结构体，据说是兼容了所有 addr 结构，包括最大的 UNIX 套接字，大小有 128B。然后具体到 IP 地址的转换，可以用`inet_pton()`这个兼容两种IP协议的函数。

#### 关于 MTU
之前对 MTU 一直是云里雾里的，这次算是对它有了一点了解。[MTU(Maximum transmission unit)](http://en.wikipedia.org/wiki/Maximum_transmission_unit)指的就是通讯协议的`DATA`块的最大容量。一个 link 的 MTU 决定了通过它的 IP 包的最大体积。所以设置一个 tunnel 设备的 MTU 可以确保这些 IP 包在套上另一层 UDP + IP 的 header 之后不会被超出 MTU 被 fragment.

#### 关于压缩
最大(无损)压缩比例决定于信息熵。所以用`dd if=/dev/urandom bs=1M count=100 | gzip - | wc -c`这种方式测试压缩比例的结果往往是压缩比例大于1...

#### More
想到再写
