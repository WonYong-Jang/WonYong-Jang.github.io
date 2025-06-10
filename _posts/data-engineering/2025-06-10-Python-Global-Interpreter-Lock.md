---
layout: post
title: "[Python] GIL 과 메모리 관리"  
subtitle: "Global Interpreter Lock / Reference count 기반 메모리 관리"   
comments: true
categories : Data-Engineering   
date: 2025-06-10
background: '/img/posts/mac.png'
---

## 1. GIL(Global Interpreter Lock) 이란?   

`GIL은 파이썬에만 존재하는 독특한 개념으로 파이썬에서 멀티스레딩을 할 때 
다수의 스레드가 동시에 파이썬 바이트 코드를 실행하지 못하게 막는 
일종의 뮤텍스(Mutex)이다.`   

파이썬으로 작성된 프로세스는 한 시점에 하나의 스레드에만 모든 자원을 
할당하고 다른 스레드는 접근할 수 없게 막아버리는데, 이 역할을 GIL이 수행한다.   

즉, 멀티스레딩을 하더라도 파이썬에선 우리가 생각하는 것처럼 여러 스레드가 
동시에 작업을 하진 않는다.   

> 하지만, parallelism 하게 처리하진 않지만 다수의 스레드가 concurrency 하게 처리를 한다.       
> 따라서 멀티스레드라 하더라도 한 번에 하나의 스레드만 실행하면서 컨텍스트 스위칭을 하면서 
여러 스레드를 처리한다.  

`정리해보면, GIL 이 스레드끼리 공유하는 프로세스의 자원을 이름 그대로 Global 하게 
Lock을 해버리고 단 하나의 스레드에만 이 자원에 접근하는 것을 허용한다.`     


그렇다면 GIL 은 왜 필요할까?   

파이썬에 존재하는 모든 것은 객체이며, `이 객체들에 대해 
Reference count(참조 횟수)를 저장`하고 있다.  
이 값은 각 객체들이 참조되는 횟수를 나타내며, 참조 여부에 따라 알아서 증감된다.  
`어떤 객체에 대한 모든 참조가 해제되어 Reference count가 0이 된다면, 
    파이썬의 GC(Garbage Collector)가 그 객체를 메모리에서 삭제시킨다.`   

따라서 Reference count의 값은 항상 정확해야 적절하게 GC에서 처리할 수 있지만 
만약 여러 스레드에서 동시에 한 객체에 접근하게 되면 어떻게 될까?   
그렇게 되면 객체의 Reference count에 대해 레이스 컨디션(Race Condition)이 
발생하게 되고 이는 GC 진행함에 있어서 이슈가 발생할 수 있다.   

`즉, GIL은 Reference count 기반 메모리 관리가 멀티스레드에서 안전하지 않기 때문에 이를 lock을 통해 
안전하게 관리하도록 도입하였다.`          

> 참고로 java 와 대부분의 언어는 Reference count 기반 메모리 관리를 하지 않는다.   

- - -

<https://tibetsandfox.tistory.com/43>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







