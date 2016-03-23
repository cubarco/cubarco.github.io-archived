---
title: 利用非标准端口 DNS 服务器避免 DNS 劫持
layout: post
categories: blog
tags:
  - Linux
  - DNS
  - GFW
  - Dnsmasq
  - OpenDNS
---

> GFW的DNS劫持原理: 说起来挺简单,GFW对境外DNS的劫持,是在发现你请求敏感域名的DNS记录时,伪装成你请求的DNS返回一个污染的数据包给你的解析器,但并不会丢弃你向境外DNS的请求,也不会丢弃境外DNS返回的正确解析结果,他只是让错误的数据抢先回来欺骗了你的解析器而已,毕竟他直接从国内给你发污染数据怎么都比国外DNS返回正确数据要快.而解析器在先收到了欺骗数据包之后,就不会再管后面返回的正确数据了,这样你就被 DNS劫持了.[^1]

很久以前我是用这篇 blog[^1]提供的方法，就是用 iptables drop 掉 GFW 的假 DNS 解析包。但是 2015 年 GFW 开始采用随机 IP 污染的方式，这种黑名单的解决方案已经不可用了。后来换了 [dnscrypt-proxy](https://github.com/jedisct1/dnscrypt-proxy)，还算是比较好用的。但是最近不明原因，dnscrypt-proxy 在使用一段时间之后老是卡住。尝试解决无果，就想办法找替代的方案。

前几天发现 GFW 没有劫持非标准端口的 DNS 服务器，于是想到了下面两种方法避免劫持。

### iptables
将 dport 是 53 的包转发给 OpenDNS 443 端口，但是要避开 lo 的包。
```console
# iptables -t nat -A OUTPUT ! -o lo -p udp --dport 53 \
    -j DNAT --to 208.67.222.222:443
```

### dnsmasq
以下是采用 OpenDNS 443 端口的示例配置。
```conf
port=53
no-resolv
# For IPv6
# server=2620:0:ccc::2#443
server=208.67.222.222#443
listen-address=127.0.0.1
```

Dnsmasq 的具体使用，可以看 ArchWiki[^2].

**用腾讯云的 vps 随便搭了个无污染的 DNS，IP 是`119.29.121.228`，随意用。**

### References
[^1]: [无需VPN的OpenWRT DNS防污染方法](https://www.lifetyper.com/2014/06/anti-dns-poison-without-vpn.html)
[^2]: [dnsmasq @ ArchWiki](https://wiki.archlinux.org/index.php/Dnsmasq)
