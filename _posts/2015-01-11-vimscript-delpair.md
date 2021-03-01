---
title: Vim 删除成对的字符
layout: post
categories: blog
tags:
  - Linux
  - Vim
  - Vim Script
  - Trick
  - VimL
---

今天为了偷懒又往 .vimrc 里面写了点东西，作用是在删除类似于`()`这种成对出现的字符对的前一个字符时同时删除后面那个...

下面是具体内容:
{% highlight vim %}
inoremap <BS> <c-r>=DelPair()<CR>

function DelPair()
    let currentline = getline('.')
    let prechar = currentline[col('.') - 2]
    let fochar = currentline[col('.') - 1]
    if (prechar == '(' && fochar == ')')
        \ || (prechar == '[' && fochar == ']')
        \ || (prechar == '<' && fochar == '>')
        \ || (prechar == '{' && fochar == '}')
        \ || (prechar == '"' && fochar == '"')
        \ || (prechar == "'" && fochar == "'")
        return "\<BS>\<Delete>"
    else
        return "\<BS>"
    endif
endf
{% endhighlight %}
