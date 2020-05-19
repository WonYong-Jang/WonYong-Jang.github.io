---
layout: post
title: "[Spring] Inversion Of Control"
subtitle: "제어의 역전"
comments: true
categories : Spring
date: 2020-05-19
background: '/img/posts/spring.png'
---

# Inversion Of Control

제어의 역전이라는 뜻으로 스프링 컨테이너를 의미한다. 개발자들이 직접 new 연산자를 통해 생성하던 
객체제어를 스프링 컨테이너가 가져감으로써 애플리케이션 내에서 사용되는 객체의 생성과 소멸(LifeCycle)을 
프레임워크가 담당하겠다는 것이다.   

`스프링이 모든 의존성 객체를 스프링이 실행될때 다 만들어주고 필요한 곳에 
주입시켜줌으로써 Bean들은 싱글턴 패턴의 특징을 가지며, 제어의 흐름을 사용자가 
컨트롤 하는 것이 아니라 스프링에게 맡겨 작업을 처리하게 된다!`

> IoC란 객체의 생성에서 생명주기의 관리까지 모든 객체에 대한 제어권이 바뀌었다는 것 

<img width="495" alt="스크린샷 2020-05-19 오후 10 14 17" src="https://user-images.githubusercontent.com/26623547/82330753-33625480-9a1e-11ea-89e2-6c7066a6c3f7.png">

위 처럼 미리 객체를 IoC 컨테이너에 만들어 놓고 그 객체를 주입받아서 사용 한다면, 
    객체끼리의 불필요한 의존성을 없애거나 줄일 수 있게 된다.

## IoC(Inversion of Control) Container


[http://www.newlecture.com](http://www.newlecture.com)


{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

