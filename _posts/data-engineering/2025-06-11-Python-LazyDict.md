---
layout: post
title: "[Python] LazyDict"  
subtitle: ""   
comments: true
categories : Data-Engineering   
date: 2025-06-11
background: '/img/posts/mac.png'
---

## 1. LazyDict 란?   

딕셔너리처럼 동작하지만, 값을 처음 접근하는 순간에만 계산하거나 로딩하는 패턴이다.   
미리 다 만들어놓는 대신, 필요할 때 만든다는 것이 핵심이다.   

예를 들어 앱을 시작할 때 DB 연결, Redis 연결 등 전부 미리 해두면 시작이 느리며, 모든 연결 정보를 
사용하지 않을 수도 있기 때문에 LazyDict을 통해 필요한 상황일 때만 연결하고 저장해둔다.   
두 번째 요청부터는 저장된 정보를 바로 전달해주게 된다.   

### 1-1) Fast Path vs Slow Path   

이 두 단어는 LazyDict 만이 아니라 코드 어디서든 쓰이는 개념이다.   
Slow Path는 처음 접근할 때 타는 경로이며, 캐시에 값이 없으니까 직접 만들어야 한다.   
DB를 쿼리하거나, 파일을 읽거나, 외부 API를 호출하는 작업이 여기서 일어난다.   
비용이 크고 시간이 걸리지만 최초 1회만 발생한다.  

Fast Path는 두 번째 접근부터 타는 경로이다. 이미 값이 캐시에 있으니까 딕셔너리에서 
꺼내기만 하면 된다. 사실상 즉시 반환이고 추가 비용이 없다.   

LazyDict의 목표는 결국 Slow Path를 최대한 줄이고, 최대한 빨리 Fast Path로 진입하는 
것이다. Slow Path는 막을 수 없지만 그 결과를 반드시 저장해서 다음 요청이 다시 Slow Path를 
타지 않도록 하는게 핵심이다.   

### 1-2) Fast Path에서 발생할 수 있는 버그    

{**



- - -

Reference

<https://denev6.tistory.com/entry/Generator-coroutine>   
<https://tibetsandfox.tistory.com/43>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







