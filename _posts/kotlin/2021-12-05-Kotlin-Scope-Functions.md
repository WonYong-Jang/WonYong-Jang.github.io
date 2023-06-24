---
layout: post
title: "[Kotlin] let, with, run, apply, also 차이 비교 정리"     
subtitle: "Scope Functions"      
comments: true
categories : Kotlin
date: 2021-12-05
background: '/img/posts/mac.png'
---

코틀린에서 아래와 같이 생긴 확장함수들이 있다.   
객체를 사용할 때 명령문들을 블록 { } 으로 묶어서 
간결하게 사용할수 있게 해주는 함수들이다.    

이번 글에서는 비슷하면서 다른 각 함수들의 차이점에 대해서 살펴보자.   

> let, with, run, apply, also   

- - - 

## 1. 일반적인 사용 방식   

일반적으로 객체를 변경하려면 아래와 같이 사용한다.   

```kotlin
data class Person(var name: String, var age: Int)

val person = Person("", 0)
person.name = "James"
person.age = 56
println("$person")

// Person(name=James, age=56)
```

위 코드를 블럭으로 묶어서 간결한 코드로 만들 수 있는데, 
    Scope Functions에 대해서 자세히 살펴보자.   

- - - 

## 2. Scope Functions   

`Scope Functions은 객체를 사용할 때 Scope(범위, 영역)를 일시적으로 만들어서 속성(property)나 
함수를 처리하는 용도로 사용되는 함수이다.`   

### 2-1) let   

```kotlin
fun <T, R> T.let(block: (T) -> R): R
```



- - - 

**Reference**    

<https://blog.yena.io/studynote/2020/04/15/Kotlin-Scope-Functions.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

