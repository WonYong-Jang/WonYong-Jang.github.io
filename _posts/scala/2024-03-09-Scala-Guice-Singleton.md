---
layout: post
title: "[Scala] Guice의 Singleton 사용"
subtitle: "Scala 언어를 이용하여 Dependency Injection 구조 만들기"    
comments: true
categories : Scala
date: 2024-03-09
background: '/img/posts/mac.png'
---

Spark 를 사용할 때 주로 Scala 언어로 작성하게 되며, 
      스프링 프레임워크를 사용하지 않기 때문의 의존성 주입(Dependency Injection)을 
      통해 객체 간의 결합도를 낮추고 유연성을 확보하기 
      어려운 부분이 있다.   

따라서 업무에서 코드가 복잡해 질수록 객체간의 강결합이 발생하며 
테스트 코드 작성이 어려워져서 결국 테스트 코드 작성을 못하고 
배포하는 경우가 발생하였다.   

이번 글에서는 [google guice](https://github.com/google/guice)를 사용하여 
DI 구조로 코드를 작성해 볼 예정이다.   

- - -

## 1. Google Guice 란?  

Guice는 자바 의존성 주입(Dependency Injection) 프레임워크로,
    의존성 관리를 편리하게 해주는 많은 기능을 제공한다.

 

아래와 같이 의존성을 추가하고, Google Guice를 이용하여 
DI 구조를 만들어보자.   

```gradle
implementation 'com.google.inject:guice:7.0.0'
```

## 2. Google Guice 를 통해 DI 구조 만들기       


### 2-1) AbstractModule(바인딩)    

`Google Guice를 사용하기 위해서는 AbstractModule를 구현한 설정 클래스를 
만들어서 주입하고자 하는 클래스의 정보를 등록해주어야 한다.`      




### 2-2) @Singletone 어노테이션 사용   

Singleton으로 설정된 객체는 호출될 때, 기존의 객체가 있는 경우 
그 객체를 계속해서 사용하게 된다.  






- - - 

**Reference**    

<https://github.com/google>   
<https://github.com/google/guice/wiki/JSR330>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

