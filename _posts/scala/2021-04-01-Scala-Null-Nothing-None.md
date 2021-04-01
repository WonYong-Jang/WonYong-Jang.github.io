---
layout: post
title: "[Scala] Null, null, Nil, Nothing, None, and Unit"
subtitle: "Empty value을 표현하는 방법과 사용 목적"    
comments: true
categories : Scala
date: 2021-03-31
background: '/img/posts/mac.png'
---

스칼라에서 Empty values는 Null, null, Nil, Nothing, None, Unit 이 있다. 
`이 모든 키워드가 값이 없음을 나타내는데 사용되는 것처럼 보일 수 있지만 
각 키워드에는 고유한 목적이 있다.`    
각각 차이점과 특징에 대해 확인 해보자.    

## null   

String과 Object과 같이 레퍼런스 타입(AnyRef)이 null이 될 수 있고 Int, Double, Long, 등의 
value 타입(AnyVal)은 null이 될 수 없다.    
스칼라에서 null은 Null의 인스턴스이고 자바의 null과 비슷하다.    

```
val num: Int = null // error 
```

## Null   

Trait 이고 모든 레퍼런스 타입(AnyRef를 상속한 모든 클래스)의 서브클래스이다. 값 타입과는 호완성이 없다.   


## Nothing   

Trait이며 모든 클래스를 상속받을 수 있다. 즉, 바닥 타입(bottom type)이라 한다.   

## Nil    

아무것도 없는 List를 나타낸다.    

```
println(Nil == List())  // true 
```

## None   

아무것도 없다는 리턴 값을 표현하기 위해 사용한다. null 포인트 예외를 회피 하기 
위해 Option[T]의 자식클래스로 사용된다.    

## Unit    

아무것도 리턴 하지 않는 메서드의 리턴타입으로 사용한다.

- - - 

**Reference**    

<https://www.geeksforgeeks.org/scala-null-null-nil-nothing-none-and-unit/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

