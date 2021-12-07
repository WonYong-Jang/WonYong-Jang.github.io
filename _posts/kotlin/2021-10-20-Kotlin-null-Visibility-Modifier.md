---
layout: post
title: "[Kotlin] 접근 제한자(Kotlin's Visibility Modifier)"     
subtitle: "public, private, internal, protected"    
comments: true
categories : Kotlin
date: 2021-10-19
background: '/img/posts/mac.png'
---

접근 제한자(Access modifier)란 객체가 공개되어야 하는 범위를 정해주는 역할을 한다.    
자바를 알고 있다면 접근 제한자 또는 접근 제어자라는 
표현이 어색하지 않을 것이다.    
`코틀린에서는 비슷하지만 다른 용어인 Visibility Modifier(가시성 제한자)`로 사용하고 있는데, 
    이 글에서는 한글로 접근제한자로 표현할 예정이다.      

[자바의 접근제한자](https://wonyong-jang.github.io/java/2020/03/23/Java-Access-Modifier.html)와 비교하여 
코틀린의 접근제한자에 대해서 살펴보자.   

- - - 

## Visibility Modifier 란?   

Visibility Modifier는 한 마디로 "누구에게 공개할 것인가?" 정도로 이해하면 된다.   
코틀린에서 접근 제한자를 가질 수 있는 요소로는 class, object, interface, constructor, function, property 등이 
있다.   

## 종류   

코틀린은 자바와 비슷하지만 다르기 때문에 정확하게 구분해주어야 한다.   
`코틀린의 접근 제한자는 4가지가 있으며 각각 public, private, protected, internal 이다.`   

아래와 같이 살펴보자.   

- public : 어디에서나 접근할 수 있다. 코틀린의 기본 접근 제한자이다.   

- private : 해당 파일 또는 클래스 내에서만 접근 가능하다.   

- protected : private과 같지만 같은 파일이 아니더라도 자식 클래스에서는 접근이 가능하다.   

- internal : 같은 모듈 내에서 어디서든 접근 가능하다.   

`자바와의 차이점이라면 자바에서는 접근 제한자를 아무것도 붙이지 않으면 
default 접근 제한자이지만 코틀린에서는 아무것도 붙이지 않으면 public이다.`   

또한, internal 이라는 생소한 키워드가 있는데 같은 모듈이라는 말이 
낯설 수 있다.   

코틀린 공식 문서에 따르면 internal이 말하는 같은 모듈은 아래 상황을 뜻한다.   

- IntelliJ IDEA Module  
- Maven Project   
- Gradle Source Set(with the exception that the test source set can access the 
        internal declarations of main)     
- a set of files compiled with one invocation of the kotlinc Ant task   

`위의 말이 어렵다면 같은 프로젝트 내에서 internal 제한자에 대해 접근 가능하다고 
보면 된다.`   



- - - 

**Reference**     

<https://readystory.tistory.com/128?category=815287>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

