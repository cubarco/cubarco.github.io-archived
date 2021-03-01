---
title: 如何用 Nginx 搭建简单的 DuckDuckGo 代理站
layout: post
categories: blog
tags:
  - Linux
  - GFW
  - DuckDuckGo
  - Proxy
---

最近感觉手机的网络环境经常变，在寝室 v6， 出门 v4，有的时候会懒得开代理。所以就用 cloudflare+nginx 搞了个简单的 [DuckDuckGo](https://duckduckgo.com) 代理站，方便随时掏出手机搜索。没有选择代理 Google 有几点原因，一个是 vps 连 Google 经常让输验证码，再就是 DuckDuckGo 不带 cookie 的搜索结果貌似比 Google 优(?)。

### Nginx

nginx 的配置文件如下。`domain.com` 改成具体的域名，`/path/to/`要改成 duck.domain.com 的证书路径。`/etc/letsencrypt/live/images.duck.domain.com/`是 Let's encrypt 生成证书的默认目录，稍后会提到。

{% gist cubarco/08e99fbf316a435b7935727810e40458 %}

### Cloudflare

duck.domain.com 可以用 Cloudflare 做 CDN，然后 crypto 策略选 Full(非strict) 的话在服务器上可以随便给 duck.domain.com 创建个证书用，具体参照[^1]。但是像 images.duck.domain.com 这种三级域名的话，Cloudflare 是没有给 SSL 证书的，所以只好自己在服务器上配，推荐用 Let's encrypt 签证书，方便快捷。

### Let's encrypt

Let's encrypt 的使用细节我就不赘述了，可以看官方给的 Guide[^2].

这里需要的三个证书可以用如下命令生成：

```console
./letsencrypt-auto certonly --manual -d images.duck.domain.com \
    -d icons.duck.domain.com \
    -d ac.duck.domain.com
```

### References
[^1]: [Create self-signed SSL certificate for Nginx](https://gist.github.com/jessedearing/2351836)
[^2]: [Getting Started @ Let's Encrypt](https://letsencrypt.org/getting-started/)
