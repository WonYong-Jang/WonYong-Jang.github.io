---
layout: post
title: "[Spark] Adaptive Query Execution"   
subtitle: "Broadcast Hash Join / coalescing shuffle partitons, switching join strategies, optimizing skew joins"             
comments: true   
categories : Spark   
date: 2024-04-15   
background: '/img/posts/mac.png'   
---

## 1. Spark Adaptive Query Execution   

`spark 3.0 부터 지원하는 기능인 Spark AQE(Adaptive Query Execution) 은 
런타임시 발생하는 다양한 통계치를 수집해 성능 개선을 가능하게 하며 
아래와 같은 기능을 제공한다.`       

> 참고로 기존의 Spark SQL의 쿼리 옵티마이저는 spark 1.x 에서는 rule-based, spark 2.x 에서는 
rule-based 외에 cost-based 을 포함해 최적화를 실행하였다.    

기존 옵티마이저의 문제는 아래 같은 상황이다.  

- A 와 B 테이블을 Join하여 C 테이블 생성  
- D 와 E 테이블을 Join하여 F 테이블 생성  
- C 와 F 테이블을 Join하여 G 테이블 생성  

A, B, D, E 테이블의 경우 테이블에 기록된 통계 정보를 기반으로 join 최적화가 가능하지만, 
    이를 기반으로 런타임에 생성되는 C와 F 테이블의 정보는 유추가 불가능했다.   
그렇기 때문에 C 와 F 테이블이 join 되는 순간 최적화가 필요했고, `AQE는 
실행 전 한번만 최적화를 진행하지 않고, 런타임에 점진적으로 최적화를 수행한다.`      

이제 AQE 에서 제공하는 최적화 기법에 대해서 살펴보자.   

- Dynamically coalescing shuffle partitions   
- Dynamically switching join strategies   
- Dynamically optimizing skew joins   

### 1-1) Dynamically coalescing shuffle partitions   

데이터를 처리하는 Spark 환경에서 쿼리를 실행시킬때의 Shuffle은 
일반적으로 쿼리 성능에 중요한 영향을 미치게 된다.   
여기서 파티션 개수는 쿼리 성능에 매우 직접적인 연관을 가지고 있다.    

`따라서 AQE는 셔플 통계를 보고, 너무 많은 파티션 갯수를 사용할 경우 I/O를 
많이 유발할 수 있기 때문에 파티션들을 적절하게 합쳐주는 기능을 제공한다.`      

default로 spark.sql.shuffle.partitions 갯수는 200 이기 때문에 
기본적으로 shuffle 파티션이 200개가 생성된다.   
예를들어, reduceByKey를 할 때 각 key 값이 4개 밖에 없는데 
shuffle 파티션을 200개나 만들 필요가 없다.    
따라서, AQE를 통해 자동으로 shuffle 파티션을 줄여준다.   

아래 예제를 통해 이해해보자.   

기존 방식으로 셔플을 진행하면, 아래 그림과 같이 5개의 셔플 파티션이 생기고 
각 파티션마다 크기가 달라질 수 있다.   

<img width="700" alt="스크린샷 2024-04-16 오전 11 25 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/75be7ec5-a98a-48f2-afcf-3398b9d4b841">   

`아래 그림과 같이 AQE는 작은 크기의 파티션을 적절하게 합쳐서 비슷한 크기의 파티션 3개로 생성해 주어서 처리 속도를 올릴 수 있다.`            

<img width="700" alt="스크린샷 2024-04-16 오전 11 25 13" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/82972449-6109-442c-906e-b2dbb832d8cf">      

이제 여러 차례 shuffle 이 발생할 때, AQE가 어떻게 
개입하여 최적화 하는지 Spark UI의 SQL 탭에서 결과를 살펴보자.     

##### 첫번째 shuffle   

`Exchange에서 실제로 shuffle이 일어나고, AQEShuffleRead가 추가된 것을
확인할 수 있다.`

`AQE가 개입하여 partition의 크기를 기본 값 64MB에 근접하도록 
number of partitions을 10000에서 5000으로 줄여서 최적화 하였다.`   

> 하나의 파티션 기본 크기는 64MB 이다.  

<img width="1100" alt="Image" src="https://github.com/user-attachments/assets/09df0a57-1421-47a1-b35b-dc91e729a7aa" />    

5000개의 partition이 생성되는 stage를 보면 위의 사진과 같이 
평균적으로 60MB 근처에서 partition의 크기가 결정되는 것을 알 수 있다.   

<img width="850" alt="스크린샷 2024-04-16 오후 2 03 09" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d955562e-9ee0-4c8c-8bcb-4d5a1d3751a5">  

##### 두번째 shuffle     

위의 shuffle 이후 두번째로 shuffle이 발생하며, 
    이번에는 join 전에 AQE가 개입하여 최적화를 진행하였다.   

<img width="1000" alt="Image" src="https://github.com/user-attachments/assets/3b3b9d80-3475-4c52-b290-dfcb78e1646d" />     

Exchange에서 shuffle이 일어나고 다음 AQEShuffleRead에서 partition의 수를 
10000 -> 358로 감소시킨다.   

여기서 흥미로운 점은 앞 단계에서 partition의 수를 5000으로 줄였지만 
다시 shuffle을 하면서 partition의 수가 10000이 되었다는 점이다.   

`spark.sql.shuffle.partitions의 값을 10000으로 설정했기 때문에 
shuffle이 발생할때 마다 partition의 수가 10000이 된다.`   

연관된 설정으로 spark.sql.adaptive.coalescePartitions.initialPartitionNum이 있는데 
default 값은 spark.sql.shuffle.partitions 값을 따라 간다.   

`두 옵션 모두 설정되어 있다면 spark.sql.adaptive.coalescePartitions.initialPartitionNum가 
우선적으로 적용된다.`    

##### 세번째 shuffle   

세 번째 shuffle에서 partition의 수가 10000 -> 118 로 줄어들었다.   

<img width="400" alt="Image" src="https://github.com/user-attachments/assets/2d50c0e6-cfac-4c95-8d9b-eb3454eda97c" />    

여기서도 한 가지 흥미로운 점은 partition 사이즈가 총 120MB 정도인데, 
    partition의 수가 2개가 아닌 118개가 되었다는 점이다.  

이와 관련된 설정값으로 spark.sql.adaptive.coalescePartitions.parallelismFirst가 있으며, 
    default로 true이다.   

`이 설정을 true로 설정할 경우 병렬성을 우선적으로 고려해서 할당한 코어를 
최대한 많이 사용하려고 한다.`   
`spark.sql.adaptive.advisoryPartitionSizeInBytes로 설정되는 최종 파티션 크기는 무시되며, 
    spark.sql.adaptive.coalescePartitions.minPartitionSize (default 1MB)로 최종 
    파티션 크기가 결정된다.`   

위에서 default 값으로 1MB이므로 120MB/1MB인 약 118개의 파티션이 생성된다.   

`default는 true이지만, spark 공식문서에서는 이 값을 false로 설정할 것을 권장하고 있다.`   

false로 설정할 경우 아래와 같이 2개의 파티션을 생성하는 것을 확인할 수 있다.  

<img width="795" alt="Image" src="https://github.com/user-attachments/assets/2e26cc8f-6105-422d-94fe-64bdeecf4313" />   


### 1-2) Dynamically switching join strategies      

Spark는 여러 조인 전략을 지원하며, 그 중 데이터가 많은 테이블과 적은 테이블을 
조인할 경우 Broadcast hash join을 사용할 수 있다.       
Broadcast hash join 을 사용할 경우 shuffle이 발생하지 않기 때문에 
성능이 좋으며 `AQE가 실행 계획을 확인하여 Broadcast hash join 이 
사용 가능한 경우 이를 적용시켜 준다.`     

> RDD를 조인할 때는 Map Side Join 또는 Replicated Join이라고도 부르며, 큰 테이블과 작은 테이블을
join할 때 성능을 향상시킬 수 있는 방법이다.     

작은 테이블의 경우는 [Broadcast 변수](https://wonyong-jang.github.io/spark/2021/07/08/Spark-broadcast-accumulator.html)를 driver에서 만들어서 
각 executor로 보내주게 되며, 이를 통해 shuffle을 피하여 join을 할 수 있게 된다.     

`명시적으로 broadcast hash join을 사용한 쿼리와는 다르게 AQE에서 제공하는 
broadcast hash join 은 shuffle이 발생한다.`   
`shuffle을 해야 실제 데이터가 얼마나 작은지 확인이 가능하기 때문이며, 대신 
sort 단계를 없앨수 있기 때문에 상대적으로 빠르다.`      

<img width="700" alt="스크린샷 2024-04-16 오후 3 07 31" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/929038a7-4fc3-469a-b1b2-5084666db9cc">     

`AQE는 런타임에 최적화를 진행하기 때문에 처음 실행 계획과 달라질 수 있다.`    

예를 들어 조인 대상의 두 테이블이 처음에는 큰 데이터여서 Sort Merge Join 으로 실행 계획이 세워졌다.   
`하지만 아래와 같이 where 조건으로 한쪽의 테이블의 데이터가 줄어 들게 되었을 때 AQE가 
이를 개입하여 Broadcast hash join을 진행한다.`       

> 실행계획에서는 데이터가 얼마나 필터 될 것인지 알지 못하고 실행 해봐야 알기 때문에 
처음 실행계획은 Sort Merge Join으로 세워진다.     

```
df_2006
    .where(df_2006("UniqueCarrier") === "TZ")
    .join(df_2007, df_2006("FlightNum") == df_2007("FlightNum"))
    .show()
```


`Default로 Spark의 작은 데이터셋이 10MB 이하일 때 Broadcast Join을 사용할 수 있다.`        

하지만, 아래 옵션 변경을 통해 Broadcast 될 데이터셋의 크기를 변경해줄 수 있다.      

```scala
// default: 10MB
// -1로 설정하게 되면 broadcast는 비활성화 된다.
spark.sql.autoBroadcastJoinThreshold
```




### 1-3) Dynamically optimizing skew joins   

데이터 스큐는 클러스터의 파티션 간에 데이터가 고르지 않게 분포될 때 발생한다.   
하나의 파티션에 데이터가 몰려있는 상황은 특히 조인의 경우 쿼리 성능을 
크게 저하시킬 수 있다.      

<img width="650" alt="스크린샷 2024-04-16 오전 11 44 12" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/2d1e24dd-7c21-4550-9ea5-f00f1dc74d83">     

테이블 A와 테이블 B를 서로 조인하는 상황이고, 테이블 A의 A0 파티션에 데이터가 
몰려있는 상황이다.     
A와 B를 조인하는 과정에서 A0과 B0이 조인하는 시간이 A1,2,3 과 B1,2,3 이 조인하는 
시간보다 오래 걸리므로 전체 처리 속도가 떨어지게 된다.   

`AQE 에서는 이러한 skew 데이터를 감지하고 skew 데이터를 더 작은 하위 파티션으로 나누게 된다.`   

<img width="650" alt="스크린샷 2024-04-16 오전 11 44 20" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/8c521a94-0da6-4e7b-b8de-b3e9f545d728">    

`예제에서는 A0 를 A0-0 와 A0-1 로 나누고 A0의 나눈 수 만큼 B0도 복제한다.`       
그 뒤 서로 조인을 진행하게 되면 A0과 B0의 조인 시간이 줄어들고 전체적인 처리 속도가 향상된다.   

- - - 

## 2. AQE 활성화   

Spark 3.x 이후 버전에서는 아래와 같이 [AQE](https://spark.apache.org/docs/latest/sql-performance-tuning.html#adaptive-query-execution)를 활성화 할 수 있다.  

> Spark 3.2 부터는 default로 활성화 되어 있다.   

아래 옵션들은 모두 해당 옵션이 활성화 되어 있어야 사용이 가능하다.   

```
spark.conf.set("spark.sql.adaptive.enabled",true)
```

### 2-1) coalescing shuffle partitions 활성화   

아래와 같이 활성화 가능하다.   

```scala
// spark.sql.adaptive.enabled 옵션과 모두 true라면 shuffle 이후의 partition의 크기를 
// spark.sql.adative.advisoryPartitionSizeInBytes에 맞추도록 하여 너무 작고 많은 partiton의 생성을 방지한다.   
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled",true)
```

`shuffle partition 개수는 아래 설정으로 가능하며, 설정되어 있지 않으면 spark.sql.shuffle.partitions 값을 
따라가게 된다.`  

> spark.sql.shuffle.partitions 의 default 값은 200이다.   

```scala
spark.sql.adaptive.coalescePartitions.initialPartitionNum // default: none
```

하나의 파티션 설정은 아래 옵션으로 크기가 결정되며, 기본값 64 MB 크기에 
가깝게 파티션 수가 정해진다.   
`spark coalesces small shuffle partitions or splits skewed shuffle partition 등은 
해당 옵션에 모두 영향을 끼치기 때문에 이 옵션을 먼저 확인 및 튜닝을 해야 한다.`   

```scala
spark.sql.adaptive.advisoryPartitionSizeInBytes // default: 64 MB   
```

그 외에 옵션은 아래와 같다.   

```scala
// true일 경우 병렬성을 최대화하기 위해(코어를 더 많이 사용하기 위해) 파티션의 크기를 
// spark.sql.adaptive.advisoryPartitionSizeInBytes를 무시하고, 
// spark.sql.adaptive.coalescePartitions.minPartitionSize를 우선적으로 고려한다.   
// 스파크 공식 문서에서는 이 값을 false로 설정할 것을 권장한다.   
spark.sql.adaptive.coalescePartitions.parallelismFirst	


// 파티션의 최소 크기를 지정한다.   
// 이 값은 spark.sql.adative.advisoryPartitionSizeInBytes의 최대 20%까지 지정할 수 있다.   
// 이 값은 spark.sql.adaptive.advisoryPartitionSizeInBytes가 무시될 때 사용된다.   
spark.sql.adaptive.coalescePartitions.minPartitionSize
```


### 2-2) skew join 활성화   

활성화 옵션은 아래와 같다.   

```scala
spark.conf.set("spark.sql.adaptive.enabled",true)
spark.conf.set("spark.sql.adaptive.skewJoin.enabled",true)
```

아래 옵션에 해당 된다면, `skew join으로 간주하여 여러 작은 task로 
나누어 처리하도록 한다.`      
따라서 skew join이 발생한다면 아래 옵션들을 조절하면서 튜닝을 해야 한다.  

```python
# default: 5.0
# 다른 파티션들 중 median partition size 에서 factor 값을 곱한 것보다 크며,
# spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes 보다 클 경우 skew 파티션으로 간주   
spark.sql.adaptive.skewJoin.skewedPartitionFactor=5.0 (compared to medium partition size)


# default: 256MB
# skewedPartitionFactor를 median partition size에 곱한 값보다 커야하며, 
# skewedPartitionThresholdInBytes 보다 크다면 skew 파티션으로 간주   
# spark.sql.adaptive.advisoryPartitionSizeInBytes 보다 크게 설정되어야 한다.   
spark.sql.adaptive.skewJoin.skewedPartitionThresholdInBytes=256MB


# default: false
# true로 설정하면, 추가로 shuffle을 발생시키더라도 skew join을 위한 optimize를 진행한다.   
spark.sql.adaptive.forceOptimizeSkewedJoin=true
```

AQE에 의해 skew로 감지되려면 skewedPartitionThresholdInBytes 와 skewedPartitionFactor 옵션 모두 
만족해야 한다.   

`파티션 크기가 skewedPartitionThresholdInBytes 보다 커야하며, 파티션 크기의 
중앙값과 skewedPartitionFactor 곱 한 값보다 커야 한다.`   

> 여기서 중앙값(median)은 모든 파티션들을 오름차순 해놓고 중간 값을 선정한다.  
> 홀수 개의 파티션이면 중간 값이며, 짝수 개의 파티션이면 중간 두개의 평균 값이다.   

- - - 

**Reference**   

<https://sunrise-min.tistory.com/entry/Apache-Spark-Join-strategy>   
<https://bomwo.cc/posts/sparkaqe/>    
<https://tech.kakao.com/2022/01/18/aqe-coalescing-post-shuffle-partitions/>   
<https://www.databricks.com/blog/2020/05/29/adaptive-query-execution-speeding-up-spark-sql-at-runtime.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

