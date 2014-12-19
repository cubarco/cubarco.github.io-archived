---
layout: page
title: "How do you read source code?"
categories: notes
---

>Originally posted [here](http://himmele.blogspot.com/2012/01/how-do-you-read-source-code.html)

If [software is eating the world](http://online.wsj.com/article/SB10001424053111903480904576512250915629460.html) as Marc Andreessen and I think, how do you [r]ea(d\|t) source code?

Well, let's first answer why you should be good at reading source code at all.

First it's always great fun to figure out how things work. By reading source code one is exactly doing that to learn about interesting software systems and projects.

Another reason for reading source code may be to get better (and faster) at reading and writing software by learning from others and sometimes also from their mistakes.

If you join a new software company or an open source project you are probably going to work on a huge existing codebase and therefore you should be able to get into it quickly, e.g. to implement tests and features or to fix bugs.

The primary goal of reading source code always is to be able to think and reason about all aspects of a software system's codebase. In this article I put together some advise and patterns for reading source code which made my life as software engineer a lot easier :-).

Now the big question is: **How do you read source code?**

Before you begin to dive deep into the source code of a software project you should make sure to have enough domain specific knowledge to understand the particular piece of software. Hence, you should start to get the big picture by reading documentation and computer science literature about the software platform/product or field of computer science (e.g. Windows apps, Mac OS X and iOS apps, Android apps, operating systems, computer networks, browsers, search engines, databases, etc.).

You don't have to know everything about the topic, but you have to **understand the core abstractions and the basic building blocks** of the software platform/product. E.g. you should know what processes, threads, semaphores, etc. are before you write your own scheduling algorithm for Linux (see [Modern Operating Systems](http://www.amazon.com/Modern-Operating-Systems-Andrew-Tanenbaum/dp/0136006639/ref=sr_1_1?ie=UTF8&amp;qid=1323008055&amp;sr=8-1) by Andrew S. Tanenbaum). You should also know about Linux specific process management before doing this (see [Linux Kernel Development](http://www.amazon.com/Linux-Kernel-Development-Robert-Love/dp/0672329468/ref=sr_1_1?s=books&amp;ie=UTF8&amp;qid=1323008100&amp;sr=1-1) by Robert Love and [Linux Kernel Architecture](http://www.amazon.com/Professional-Linux-Kernel-Architecture-Programmer/dp/0470343435/ref=sr_1_1?s=books&amp;ie=UTF8&amp;qid=1323008158&amp;sr=1-1) by Wolfgang Mauerer).

But most probably you have already done this before investigating a particular piece of software. So let's get started...

For starters, all software systems or at least all subsystems of huge software systems have some basic building blocks and core abstractions that you will notice all over the place. These components (e.g. classes, modules, actors, data structures, etc.) are also known as **hubs**. The hubs are simultaneously part of various aspects or subsystems of the whole codebase. **Therefore the hubs interlink the subsystems and yet make huge codebases look like small worlds**.

**Hubs form the contexts around which software engineers build the software architecture**. They also implement quite a lot of the core features and functionality. As software systems grow, more and more other components will depend on the hubs. Therefore look for the hubs first and learn about their responsibilities. Usually even huge software systems only have a relatively small number of hubs. Hence, you don't have to fear millions of lines of source code because the hubs will guide you through the codebase. E.g. if we take a look at Google's Android OS, I would say that the following classes (active objects and processes) are the hubs: Zygote, ActivityManagerService, WindowManagerService, PackageManagerService, ConnectivityService and the SurfaceFlinger. You see, just 6 components :-).

You can also repeat the game at a smaller scale, e.g. for Android's widget framework where the View, ViewGroup and ViewRoot classes are the hubs upon which a lot of other UI components build.

This [reductionist](http://en.wikipedia.org/wiki/Reductionism) approach also works for other software systems such as operating systems, filesystems, networking stacks, web backend platforms, etc.

For more details on hubs and network theory I suggest Albert-Laszlo Barabasi's book [Linked](http://www.amazon.com/Linked-Everything-Connected-Else-Means/dp/0452284392).

Next, after identifying the hubs you should try to **understand the interaction patterns between the hubs**. The interactions may rely on different mechanisms like pure API calls or [message passing](http://en.wikipedia.org/wiki/Message_passing) (e.g. message queues or IPC calls). To get the idea of how hubs depend on each other I suggest to just **draw some pictures of the hubs, their dependencies and their interactions**.

As an example just take a look at one of my previous blog posts about [Andoid Architecture Patterns](http://himmele.blogspot.com/2010/02/android-architecture-patterns.html).

On the 7th slide there is a picture about how Android starts activities, services and content providers within their own Linux OS processes. It does so by several interactions between the ActivityManagerService, the Zygote process and the app's process.

As you see, getting the big picture is done by identifying the hubs and understanding their interactions using a top-down approach. To dig deep into specific parts or aspects of software systems we have to change our source code reading patterns. Therefore we will switch to a bottom-up approach to inspect modules, classes, data structures, methods, functions, etc. Later we are able to combine both code reading approches. **This strategy of summarizing the findings of the top-down and the bottom-up approach is called [downward causation](http://pespmc1.vub.ac.be/DOWNCAUS.html)**.

<div>

</div>
I think the bottom-up approach works best by starting with the active entities (threads, actors, processes) that breathe life into the hubs. This is because to be able to think and reason about some piece of source code you really need to understand the environment in which the hubs run.

So **always make sure which active entities run which parts of a system's source code** and try to understand how and when they interact with each other. This will help you to achieve the primary goal of reading source code, that is to be able to think and reason about all aspects of a software system's codebase (solely with your brain and without the help of external tools like a debugger :-)).

Getting into the details of some piece of source code always starts with **trying things out**. I do that by adding some logging code or by making assumptions about the code's behavior which I verify with tests afterwards. Another method is to do modifications to the source code just to check how the code behaves under the new circumstances. Breaking or damaging the code may also help you to learn about it ;-).

While reading source code always ask yourself: "How does it work?" and "Why have the developers done it that way?". This will most probably cause you some sleepless nights but it will also make you a better software engineer and software architect.

Everything you do to get better at thinking and reasoning about the source code will help you to develop stronger debugging and analytical skills which in turn enable you to implement new features, fix bugs or do refactorings.

By thinking and reflecting about the source code you are reading you will learn a lot about how to write software systems and platforms. Besides, from bad software you will also learn what to avoid when developing software systems.

Furthermore, there are two great articles about **how to write great source code and software systems**. Rich Hickey's talk about ["Simple made easy"](http://www.infoq.com/presentations/Simple-Made-Easy) at InfoQ and [Erlang's programming rules and conventions](http://www.erlang.se/doc/programming_rules.shtml). These two guides are outstanding no matter which programming language you use.

So, reading code really is fun. Maybe next time instead of reading another software engineering book just read some source code. (GitHub is really great for that.)

Since you need some staying power to get into a huge codebase I suggest to pick a software project that provides some fun and purpose along the way :-). Maybe the list below contains an interesting software project for you...

**Software projects**

*   [Google Android](http://source.android.com/source/downloading.html)
*   [Minix](http://git.minix3.org/?p=minix.git;a=tree) (Monolithic OSes are not here to stay forever :-))
*   [Linux Kernel](http://www.kernel.org/)
*   [Microsoft Singularity](http://singularity.codeplex.com/releases/view/19428)
*   [Erlang](https://github.com/erlang/otp)
*   [CouchDB](https://github.com/apache/couchdb)
*   [Google Chrome](http://src.chromium.org/viewvc/chrome/)
*   [Microsoft ASP.NET MVC](http://aspnet.codeplex.com/SourceControl/changeset/view/72551)
*   [TinyVM](https://github.com/GenTiradentes/tinyvm)
*   [Ext4 FS](http://git.kernel.org/?p=linux/kernel/git/torvalds/linux.git;a=tree;f=fs/ext4;h=10fc5796018ce1f8611a94eb3801c33119b185f1;hb=HEAD)
*   TCP/IP networking stacks: [NetBSD](http://www.netbsd.org/), [lwIP](http://git.savannah.gnu.org/cgit/lwip.git/tree/)
*   [Apache Lucene](http://lucene.apache.org/java/docs/developer-resources.html#source)
*   [Apache Hadoop](http://hadoop.apache.org/mapreduce/version_control.html#Anonymous+Access+%28read-only%29)
*   [Microsoft .NET Bio](http://bio.codeplex.com/documentation)
*   [LLVM](http://llvm.org/)
*   [QNX Neutrino RTOS](http://www.qnx.com/developers/docs/6.4.1/neutrino/sys_arch/about.html) (Sadly the QNX Neutrino RTOS is not shared source anymore, but hopefully a great software company will buy QNX Software Systems some day and make this great OS really huge :-))
*   ...
