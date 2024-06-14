---
layout: post
title: "[Spark] Dynamic Partition Pruning / Speculative Execution"   
subtitle: "filter push down / dimension 테이블과 fact 테이블 조인시 쿼리 성능 최적화"             
comments: true   
categories : Spark   
date: 2024-05-15   
background: '/img/posts/mac.png'   
---

이번 글에서는 Spark 3.0 부터 제공되는 최적화 기법 중 하나인 
Dynamic Partition Pruning에 대해서 살펴보자.   

- - -    

## 1. Dynamic Partition Pruning      

`Dynamic Partition Pruning 의 핵심은 full scan을 피하기 위해 
내가 필요한 데이터만 골라서(pruning) 읽는 것이다.`   

```
// default: true 로 되어 있다.   
spark.sql.optimizer.dynamicPartitionPruning.enabled=true
```

> 여기서 pruning의 의미는 내가 필요로 하지 않는 데이터를 읽지 않도록 가지치기 하여 스킵하는 것이다.  

`쿼리를 최적화를 하는 여러가지 방법(column pruning, constant folding, filter push down)이 있는데, 
    Dynamic Partition Pruning은 filter push down을 사용한 최적화 기법이다.`      

filter push down을 아래 쿼리로 이해해보자.   

```
select * from student where subject = 'English';
```

이러한 쿼리를 처리할 때 보통 데이터 베이스 > full scan > filter 순으로 처리를 한다.   

<img width="150" alt="스크린샷 2024-05-18 오후 12 33 52" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/102a15f4-54a3-4d8d-9dd4-cea1bcae3467">   

`filter push down 이란 필터를 scan 보다 먼저 둬서, 미리 필터링한 값을 scan 하기 때문에 
full scan을 피하고 원하는 값만 로드하여 성능향상을 시킨다.`           

<img width="150" alt="스크린샷 2024-05-18 오후 12 33 57" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/72f6d1d4-b5e6-4512-8669-77ca9672c38e">   

### 1-1) Static Partition Pruning   

먼저, Static Partition Pruning(SPP)는 말그대로 정적으로 파티션을 pruning 하는 것이다.  
아래와  같은 이미지에서 좌측은 scan이 먼저 발생하여 모든 데이터를 
스캔하는 반면에, 필터를 pushdown한 우측과 같은 경우 원하는 데이터를 
가지고 있는 부분만 추린 이후에 스캔하기 때문에 
후자는 전자에 비해 적은 데이터를 스캔한다.   
이는 성능으로 이어지게 된다.   

<img width="380" alt="스크린샷 2024-05-18 오후 1 10 17" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/5076270b-a08e-4721-9a5a-4620925ba5c4">   

위에서 간략히 그린 Data라는 부분을 스파크의 환경에서 구체적으로 살펴보면, 
    스파크는 데이터를 논리적으로 여러 파티션으로 인식한다.   

`따라서 pruning은 파티션 단위로 결정된다.`   

<img width="400" alt="스크린샷 2024-05-18 오후 1 12 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/e47bfebd-1778-4374-8cfb-b84e03cfe753">   

위와 같이 단일한 형태라면 SPP로도 충분하다. 하지만 실제 데이터 환경에서는 
아래와 같이 join이 추가된 형태의 쿼리가 자주 발생하게 된다.   

```
select * from sales join date on sales.day = date.day 
where date.day_of_week = 'Mon'
```

<img width="346" alt="스크린샷 2024-05-18 오후 1 20 33" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/93b4141d-35dc-4352-98a3-11f0124de1f5">    

위와 같은 경우 date 테이블에 대해서는 진행된 SPP가 join으로 이어진 sales에는 
적용되지 못하는 것을 알 수 있다.   
`이러한 Fact - Dimension 테이블 간의 조인은 데이터 분석에서 
흔한 패턴인데, Fact 테이블의 사이즈가 보통 매우 크기 때문에 
위와 같은 Fact 테이블의 SPP의 부재는 많은 양의 데이터 스캔을 발생 시킨다.`       

### 1-2) Dynamic Partition Pruning   

DPP는 위와 같은 상황에서 아래 이미지와 같이 런타임 시에 
동적으로 생성된 Partition Pruning이 적용되도록 하는 기능이다.   

<img width="345" alt="스크린샷 2024-05-18 오후 1 28 07" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/01dcbe1f-2f98-4c26-8197-a2b0d79ce8ca">     

`즉, dimension table(작은 테이블)의 필터링 결과를 fact table(큰 테이블) 에 
적용하여 큰 테이블에서 full scan을 하지 않고 필요한 데이터만 필터링하여 
읽도록 하는 방법이다.`       

아래 그림과 같이 파티셔닝 된 데이터 셋(큰 크기의 fact 테이블)과 
파티셔닝 되지 않은 데이터 셋(작은 크기의 dimension 테이블) 이 있다고 
가정해보자.     

> 왼쪽 fact 테이블은 분할된 파티션들을 색으로 표현했다.     

<img width="432" alt="스크린샷 2024-05-18 오후 10 28 51" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/381c71dc-c482-4487-aefb-d8589799073b">    

조인에 필요한 파티션이 빨간색과 노란색이라고 했을 때, 위 그림처럼 필터를 
적용하여 full scan을 피하게 된다.    

이 때 [broadcast hash join](https://wonyong-jang.github.io/spark/2024/04/20/Spark-Join-Shuffle.html)을 이용하게 된다.   
dimension 테이블의 값들을 hash 테이블로 변환하고 각 executor로 전달 후 
fact 테이블과 조인을 하여 shuffle 없이 성능을 최적화 한다.   




- - - 

## 2. Speculative Execution     

`task가 fault worker node로 인해 완료되지 않는 것으로 의심되면 
다른 node에서 해당 작업을 동시에 실행한다.`      
`둘 중 하나의 task가 완료되면 나머지 task는 kill 시킨다.`      

하지만, Speculative Execution은 overhead를 동반하기 때문에 대다수의 경우 선호되지 않는다.   

<img width="600" alt="스크린샷 2024-06-14 오후 10 54 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/959ed9c4-26e8-4332-8998-38fcfb9a3e7d">

`장점으로는 slow tasks들에 대해서 다시 시작시켜서 전체 처리시간을 
단축시킬 수 있지만, 오직 hardware problems, overload 에 대해서만 
효과가 있다.`    

`또한, data skew, insufficient memory에 대해서는 해결할 수 없다.`   


```
spark.speculation=false     // default: false  
spark.speculation.interval  // slow tasks 를 확인하는 주기, default: 100ms
spark.speculation.quantile  // 전체 task가 해당 비율을 넘어가면 Speculative Execution을 고려   
```


- - - 

**Reference**   

<https://www.slideshare.net/slideshow/dynamic-partition-pruning-in-apache-spark/188385762>   
<https://kadensungbincho.tistory.com/88>  
<https://eyeballs.tistory.com/248>   
<https://medium.com/@nethaji.bhuma/spark-speculative-execution-02e8bcb03f39>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

