---
layout: post
title: "[Spark] Structured Streaming 이란"   
subtitle: "Spark Streaming 비교 및 사용시 문제점 / Unbounded Table / OutputMode(Complete, Update, Append) "    
comments: true
categories : Spark
date: 2022-01-03
background: '/img/posts/mac.png'
---

이번 글에서는 DStream 기반의 Spark Streaming과 Structured Streaming을 
비교해 보면서 
Structured Streaming에 대해 자세히 살펴보자.   

- - -   

## 1. Pain points with DStream     

기존에 DStream 기반의 [Spark Streaming](https://wonyong-jang.github.io/spark/2021/04/12/Spark-Streaming.html)은 
외부 데이터 소스로 부터 데이터를 읽어와서 처리 후 그 결과를 
특정 파일 시스템 또는 RDBMS 등에 저장했다.   

`여기서 여러 연산 등이 이루어 질 텐데 엔진 차원에서 트랜잭션이 보장 되지는 
않는다.`      

Spark Streaming에서 보장되는 것은 at least once 적어도 한번 처리는 보장 된다.  

> 즉, 장애가 발생하게 되면 복구를 위해서 중복으로 처리 될 수도 있다.   

`하지만, 반드시 한번 처리(exactly once)는 보장되지 않는다.`   

`트랜잭션 처리 및 반드시 한번 처리를 진행하려면 개발자가 직접 
고려하여 개발해야 한다.`   

또한, `늦게 들어온 데이터에 대해서도 엔진 차원에서 보장해주지 않는다.`     
아래 예시를 살펴보자.   

모바일 앱에서 주기적으로 이벤트를 전달 받고 있고, 
    이벤트에는 id, time, action 등이 있다.   
이벤트 action 과 time 별로 counting을 한다고 가정해보자.   

<img width="800" alt="스크린샷 2023-07-26 오후 10 55 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7f7754a6-2278-457d-8ac0-c1b014e7e899">      

하지만, 위 집계 결과값을 보면 결과가 조금 이상한 것을 확인할 수 있다.   
2:00시에 open action 갯수는 1개인데, close 갯수는 2개 이다.  

> 정상적인 데이터라면 open 2개, close도 2개가 정상이다.   

해당 결과값이 실시간 대시보드 또는 RDBMS에 저장되어 리포팅 된다면 
문제가 발생할 수 있다.   

`open action과 2:00 시의 이벤트가 지연되어 들어온게 원인이며, 
     이때 필요한 것은 조금 기다려주는 것이다.`   

> 분산환경이기 때문에 반드시 순서가 바뀌어서 들어오는 경우는 발생한다.  

Spark Streaming에서는 이러한 부분을 지원해주지 않기 때문에, 
      직접 구현하여 upsert 하는 등의 로직을 추가해 주어야 한다.   
`즉, Spark Streaming은 실제 이벤트가 발생한 시간이 아닌 엔진이 
데이터를 수집한 시간 순으로 처리한다.`    

> 대부분의 비지니스는 실제 이벤트가 발생한 순서로 처리를 원한다.   

- - - 

## 2. Continuous Application   

위의 문제점들을 해결하기 위해 Structured Streaming을 사용하여 해결할 수 있다.   
Spark Streaming은 micro batch 개념을 통해 설정된 batch interval 마다 계속해서 
데이터를 처리하고 끝이였다면, Structured Streaming 컨셉은 아래와 같다.     

<img width="824" alt="스크린샷 2023-07-26 오후 11 12 15" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7ca2888a-73ae-4ae2-adc8-e975677c3666">    

`위 그림처럼 지속적으로 연산을 진행하며 동시에 트랜잭션을 엔진차원에서 보장해준다.`    
`즉, exactly once를 개발자가 고려하는게 아니라 엔진이 보장해준다.`     

`또한, 늦게 들어온 데이터 있다면 특정 시간 동안 기다려 주는 기능도 제공한다.`     

- - - 

## 3. Structured Streaming   

`Structured Streaming은 Spark SQL 엔진에서 실행되며 DataFrame, Dataset를 
사용한다.`   

> 당연히 Spark 에서 제공했던 fault tolerance, elastic scaling, in memory computing 등 동일하게 
제공한다.   

`엔진이 exactly once를 보장하며, SQL에서 제공하는 다양한 optimized 기능들을 
동일하게 제공한다.`   

컨셉은 Unbounded Table로 무한 확장될 수 있는 테이블이며 아래와 같다.   

<img width="718" alt="스크린샷 2023-07-29 오전 11 32 17" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/422fc2dd-226a-493a-a10e-3153ca76361a">   

DStream은 batch interval마다 들어온 데이터를 rdd로 만들고 
순차적으로 처리해 나가는 방식이였다.   

Structured Streaming은 들어온 데이터를 논리적으로 테이블에 계속 추가해 나간다.    

> 물론 물리적인 테이블에 계속 추가한다면 많은 디스크와 메모리 공간이 필요할 것인데, 
    실제로 이렇게 처리하진 않고 논리적으로 한계가 없는 테이블에 추가해 나간다.   

<img width="644" alt="스크린샷 2023-07-29 오전 11 42 08" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3f968e66-ac17-43d5-b942-ff6e87ab8f22">      

`위 그림에서 Input은 Unbounded Table을 의미하며, 논리적으로 데이터를 
추가하는 것을 보여주고 있다.`    
`Result는 추가된 데이터에 쿼리(집계 및 여러 연산)를 실행하여 
나온 결과값을 나타낸다.`       
`마지막으로 최종적인 결과를 뽑아 내는게 Output이다.`     

> t=1 일 때, Unbounded Table에서 나온 결과를 리턴하고, t=2 일 때 
동일하게 쿼리를 실행하여 결과를 리턴하는 방식이다.   

### 3-1) Output Mode

`Output Mode는 쿼리된 결과값을 어떻게 밖으로 쓸지에 대한 부분이다.`   

Output에 대해 더 자세히 살펴보면, 
    아래와 같이 3가지 종류가 있다.   

`주의해야 할 점은 모든 쿼리에 대해서 아래 output mode를 모두 사용할 수는 없다.`   

> 예를 들면 complete mode는 집계(aggregation) 쿼리가 아닌 단순 필터링이거나, 필터링 없는 
모든 데이터를 가져오는데 사용할 수 없다.   
> complete mode는 모든 결과를 가져오게 되는데 input 데이터를 모두 메모리에 가지고 
있을 수가 없기 때문이다.   
> 집계 쿼리는 모든 input 데이터가 아닌 결과값만 가지고 있으면 되기 때문에 complete mode를 
사용할 수 있다.   


##### Complete output   

`위에서 그림과 같이 매 시간마다 테이블의 모든 결과값을 리턴하는 output이다.`      

> 보통 집계 쿼리에 대해서 사용한다.   

##### Update output  

`아래 그림과 같이 update 된 것만 리턴한다.`  

> 예를들면 t=1 에서 집계 결과와 t=2 에서 집계 결과가 다른 값만 리턴한다.   

<img width="1138" alt="스크린샷 2023-07-29 오후 12 07 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/ce5859ef-c899-4a8c-8ad2-7ad19d03e0df">


##### Append output   

새로 추가된 값만 리턴하며, 이때 의미하는 것은 앞으로 절때 바뀌지 않는 
최종적인 결과값을 의미한다.   

> default 로 append mode 이다.   

`즉, 위에서 update output은 앞으로 바뀔 수도 있는 값을 의미하며 append output은 
절때 바뀌지 않을 최종적인 결과값이다.`   

- - - 

## 4. Continuous Aggregation   

Continuous Aggregation의 하나의 예를 살펴보자.

아래와 같이 카프카에서 데이터를 읽어 온 후 집계한다고 가정해보자.    

<img width="700" alt="스크린샷 2023-07-31 오후 10 18 56" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/a9be99b0-1788-40e8-9387-dfe10af69999">

카프카에서 해당 오프셋으로 읽어온 데이터를 집계하여 메모리에 저장한다.
이때 fault tolerance를 위해 WAL(write ahead log) 방식으로 hdfs에 저장해둔다.

<img width="700" alt="스크린샷 2023-07-31 오후 10 24 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f12bad80-0ca6-4839-8eb1-cde1db368476">

그 이후 들어온 데이터도 동일한 방식으로 진행하며,
    위에서 언급한 unbounded table에 대해 쿼리를 실행하면
    결과를 리턴해 줄 것이다.

만약 메모리에 결과값을 쌓아서 가지고 있다면 모든 데이터를 계속 메모리에 가지고 있는 것은 불가능 할 것이다.   
`따라서 unbounded table이라는 것은 논리적인 개념이며, 무한한 전체 테이블 처럼 보이지만 
실제로는 각각 나뉘어져 있다.`      

따라서, 위 그림처럼 Incremental Execution 1의 결과값을 Incremental Execution 2에 전달하여 전체 집계하면 
무한한 테이블에서 전체 쿼리한 것과 같은 결과값을 확인할 수 있다.   

- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

