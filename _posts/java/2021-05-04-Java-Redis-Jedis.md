---
layout: post
title: "[Java] Redis"
subtitle: ""       
comments: true
categories : Java
date: 2021-03-12
background: '/img/posts/mac.png'
---

## Redis 설치 및 실행    

##### Redis 설치    

```
$brew install redis
```

##### Redis 서비스 실행, 중지, 재시작  

```
$brew services start redis

$brew services stop redis

$brew services restart redis
```

##### Redis 설정    

```
# Accept connections on the specified port, default is 6379.

# If port 0 is specified Redis will not listen on a TCP socket.
port  6379   [포트번호 변경]

# Warning: since Redis is pretty fast an outside user can try up to
# 150k passwords per second against a good box. This means that you should
# use a very strong password otherwise it will be very easy to break.
#
requirepass password  [주석제거하고 패스워드 입력]

# By default Redis listens for connections from all the network interfaces
# available on the server. It is possible to listen to just one or multiple
# interfaces using the "bind" configuration directive, followed by one or
# more IP addresses.
#
# Examples:
#
# bind 192.168.1.100 10.0.0.1  
bind 127.0.0.1 192.168.0.101   [외부에서 접근 가능하도록 IP 추가 가능]
```

##### Redis 실행     

```
$redis-server
```


- - - 

**Reference**   

<https://velog.io/@kwj1270/Lambda>    
<https://www.notion.so/758e363f9fb04872a604999f8af6a1ae>   
<https://www.notion.so/a875fcd046db4ddd8dce01bf61743f5e>   
<https://yadon079.github.io/2021/java%20study%20halle/week-15>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
