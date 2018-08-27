---
title: SSL和TLS和HTTPS三者关系
date: 2018-05-23 17:43:37
tags: http
categories: 理论知识
---

# SSL和TLS和HTTPS三者关系

## 摘要

一句话概括：HTTPS是HTTP协议基于SSL/TLS协议产生的超文本传输安全协议

* HTTP：Hyper Text Transfer Protocol、 超文本传输协议
* SSL：Secure Sockets Layer、安全套接层
* TLS：Transport Layer Security、安全传输层
* HTTPS：Hyper Text Transfer Protocol Secure、超文本传输安全协议

## 详解

### HTTP

互联网发展过程中、HTTP是世界范围内应用最广泛的一种网络协议，它和HTML、URL两种技术构成了现在的WWW（world wide web、万维网）

目前使用最多主流版本的就是自1997年1月公布的HTTP/1.1版本（虽然很久了），当然也确实是有HTTP/1.0（1990年问世、1996年正式命名），最新的版本是HTTP/2.0

说到HTTP、就必须提一嘴TCP/IP了。这HTTP实际上只是TCP/IP协议族中的一员。关于TCP/IP、以及HTTP和TCP/IP的关系、后面有时间再叙

### SSL

就是一种安全协议、TLS标准化的前身、使用X.509认证，网景公司（Netscape）在1994年推出HTTPS协议，用SSL进行加密，这是SSL的起源。后面、IETF将SSL进行标准化、1999年公布第一版TLS标准文件。(CSS、JS也是网景发明的、是不是很厉害)

目前SSL有SSL1.0、SSL2.0、SSL3.0三个版本，但是有严重的安全问题、所以没人用了（没经历过、不知道多严重😂）

### TLS

IETF将SSL标准化后的产物，可以理解为SSL的升级版。TLS目前也有三个版本，TLS1.0、TLS1.1、TLS1.2，常用的是TLS1.2、服务器方面三个版本一般都会支持

比如Nginx的配置

```bash
...
ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
...
```

### HTTPS

看到这里、基本上知道了这几位（SSL/TLS和HTTPS）简单的关系了。对、不用怀疑！他们就是这个关系😂。

HTTPS是为了数据的安全性考虑、给HTTP协议用SSL/TLS协议加了个安全套。一开始是SSL、后来SSL被国际组织IETF标准化了、升级了、改名为TLS了。因为SSL不安全、所以没人用了，现在都用TLS1.1、1.2、1.3。

> IETF是什么？
>
> IETF 是一个国际组织、开放标准组织，全称： The Internet Engineering Task Force  ，中文就是：互联网工程任务组，是全球互联网最具权威的技术标准化组织

简单提一下对称加密和非对称加密

* 对称加密

  加密和解密使用的是同一个密码或秘钥

* 非对称加密

  看完对称加密后、基本就已经解了非对称加密的定义了，就是加密和解密使用的不是同一个密码或秘钥。

  这个理解起来相对于对称加密有点难度、到底是如何实现这种加密方式的、后面有时间再另起篇幅研究一下

