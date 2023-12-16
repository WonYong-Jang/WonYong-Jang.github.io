---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL 의 Tungsten Project"
subtitle: "Spark SQL 사용시 하드웨어(cpu, memory 등) 최적화 제공"    
comments: true
categories : Spark
date: 2021-05-04
background: '/img/posts/mac.png'
---

[저번 글](https://wonyong-jang.github.io/spark/2021/05/03/Spark-DataFrame-Catalyst-Optimizer.html)에서는 
살펴봤던 Catalyst Optimizer은 실행계획 차원(소프트웨어)에서 Spark 성능을 끌어 올리기 
위한 방법이며, Tungsten Project 는 하드웨어(cpu, memory 등)를 효율적으로 
사용할 수 있도록 하기 위한 방법이다.   

- - - 

## 1. Apache Spark Tungsten 란?   

`Project Tungsten은 Apache Spark의 성능을 책임지고 있는 아주 중요한 
프로젝트 중 하나이며, 메모리와 cpu 성능 개선에 많은 중점을 두고 있다.`      
`Apache Spark 2.x 으로 업그레이드 되면서 Phase 2 Tungsten Engine을 탑재했다.`   

Spark의 병목 현상의 원인 중 하나는 cpu이며, 그 이유는 데이터를 
compress, decompress 하거나 serialize, deserialize 하는 작업이 
cpu 자원을 많이 사용하기 때문이다.   

예를 들어 parquet와 같은 압축 포맷을 사용하면 I/O는 줄어 들 수 있지만 
데이터를 압축하거나 풀 때 cpu를 많이 사용한다.   
또한, Spark는 JVM을 기반으로 하는 scala로 개발되어 있어 
반드시 java object로 변환이 되어야 한다.   
디스크에서 읽은 데이터를 byte buffer에서 java object로 deserialize 해야 하는 
작업이 필요하다.   

이러한 이유로 Tungsten이 집중적으로 개선시키고자 하는 부분은 3가지이다.   

- Memory Management and Binary Processing   

- Cache aware computation  

- Code Generation   

### 1-1) Memory Management and Binary Processing   



- - - 

<img width="737" alt="스크린샷 2023-12-16 오후 5 42 16" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d011ab90-7484-49bd-b341-c7d4406a41c2">   



- - - 

**Reference**    

<https://yeo0.tistory.com/entry/Spark-Core-of-Spark-SQL-Engine-Catalyst-Optimizer-Tungsten>   
<https://younggyuchun.wordpress.com/2017/01/31/spark-%EC%84%B1%EB%8A%A5%EC%9D%98-%ED%95%B5%EC%8B%AC-project-tungsten-%ED%86%BA%EC%95%84%EB%B3%B4%EA%B8%B0/>   
<https://fastcampus.co.kr/courses/209522/clips/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

