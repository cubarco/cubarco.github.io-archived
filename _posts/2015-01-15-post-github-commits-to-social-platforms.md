---
title: 在社交平台上发布匹配一定规则的 Github commit message
layout: post
categories: blog
tags:
    - Blog
    - Python
    - Github
modified: 2015-01-15
---

之前看到了 @fqj1994 juju 的这篇 blog: [用 Google App Script 實現博客更新時自動在社交網絡上發狀態分享](https://blog.fqj.me/posts/2013/08/google-app-script-share-blog-updates-with-social-network), 也感觉自己的 blog 根本没人访问，需要一个类似的东西。因为我的 blog 是用的 jekyll, 挂在 [Github](https://github.com/cubarco/cubarco.github.io) 上的，Github 又提供了一个叫 Webhook 的东西，就准备自己实现一种更加<s>优雅</s>的方式。

项目放在 [Github](https://github.com/cubarco/post-github-commits) 上，遵循 [GPLv2](http://www.gnu.org/licenses/gpl-2.0.html) 协议。整个流程很简单，就是接受 Webhook 发来的 json, 然后从中提取 commits message, 用一定的正则表达式取出标题，之后再发往各个社交平台。

昨天实现了 twitter 的部分(twitter 可以拿到不会过期的 access token)，看了下 OAuth 感觉要维护那些 token 的状态好麻烦，懒得弄... 我正在用的主要就是 twitter, Google+, 和 Facebook. Google+ 据说没给发 post 的 api, 所以作罢。接下来尽可能支持 Facebook.

> 如果腳本正常的話，理論上這則文章會很快被發佈到我常用的社交網絡。

嗯，就是这样。

###### Update 2015-01-15:
这个 blog 发出去之后发现 log 报错了(UnicodeEncodeError)，但是没时间修了<s>(出去玩了)</s>。晚上回来处理完各种事情之后才开始修。发现是 `urllib.urlencode()` 不支持 unicode, fix 已经推到 Github 上了... 感觉 python 还是学的不好啊。其实我一开始学 python 就是随手写个后台，没准备深入。现在又发觉 python 挺好用的，但是不知道怎么深入，有心无力的感觉哎。
