---
layout: post
title: "do {…} while (0) — What is it good for?"
categories: notes
---

>Originally posted in [stackoverflow][stackoverflow]

It's the only construct in C that you can use to `#define` a multistatement operation, put a semicolon after, and still use within an `if` statement. An example might help:
{% highlight c %}
#define FOO(x) foo(x); bar(x)

if (condition)
    FOO(x);
else // syntax error here
    ...;
{% endhighlight %}

Even using braces doesn't help:
{% highlight c %}
#define FOO(x) { foo(x); bar(x); }
{% endhighlight %}

Using this in an `if` statement would require that you omit the semicolon, which is counterintuitive:
{% highlight c %}
if (condition)
    FOO(x)
else
    ...
{% endhighlight %}

If you define FOO like this:
{% highlight c %}
#define FOO(x) do { foo(x); bar(x); } while (0)
{% endhighlight %}

Then the following is syntactically correct:
{% highlight c %}
if (condition)
    FOO(x);
else
    ....
{% endhighlight %}

[stackoverflow]:    http://stackoverflow.com/questions/257418/do-while-0-what-is-it-good-for
