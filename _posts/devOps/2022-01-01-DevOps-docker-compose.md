---
layout: post
title: "[Docker] 도커 컴포즈 및 환경 변수 "
subtitle: "Docker Compose에서 환경 변수를 다루는 4가지 방법"    
comments: true
categories : DevOps
date: 2022-01-01
background: '/img/posts/mac.png'
---

## 1. 도커 컴포즈란?   

`docker compose란 여러개의 컨테이너로부터 이루어진 서비스를 구축, 실행하는
순서를 자동으로 관리하여 관리를 간단히 하는 기능이다.`    

`멀티 컨테이너 상황에서 쉽게 네트워크를 연결 시켜주기 위해서
docker compose를 이용하면 된다.`

`docker compose란 여러개의 컨테이너로부터 이루어진 서비스를 구축, 실행하는
순서를 자동으로 관리하여 관리를 간단히 하는 기능이다.`

`즉, docker compose에서는 compose 파일을 준비하여 커맨드를 1회 실행하는
것으로, 그 파일로부터 설정을 읽어들여 모든 컨테이너 서비스를
실행시키는 것이 가능하다.`

참고로, Dockerfile을 compose로 변환해주는 사이트가 있으니 참고하면
도움이 될 것이다.
[https://www.composerize.com/](https://www.composerize.com/) 사이트는
완벽하게 변환해주지는 않지만 처음 docker compose를 구성할 때 도움이 될 것이다.


- - - 

**Reference**    

<https://seongjin.me/environment-variables-in-docker-compose/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

