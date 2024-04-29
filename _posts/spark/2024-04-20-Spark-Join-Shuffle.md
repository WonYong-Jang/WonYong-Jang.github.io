---
layout: post
title: "[Spark] Join Strategies 과 Shuffle"   
subtitle: "shuffle join, broadcast join / shuffle sort merge join, broadcast hash join"             
comments: true   
categories : Spark   
date: 2024-04-20   
background: '/img/posts/mac.png'   
---

## 1. 스파크의 조인 수행 방식    

일반적으로 join은 동일한 키의 데이터가 동일한 파티션 내에 있어야 하므로 비용이 비싼 작업이다.    
조인할 키의 데이터가 동일한 파티션에 있지 않다면 셔플이 필요하고, 이를 통해 동일한 
키의 데이터는 동일한 파티션에 위치하게 된다.   

즉, 조인의 비용은 키의 개수와 올바른 파티션으로 위치하기 위해 움직이는 규모에 비례해서 커진다.   

스파크는 조인 시 크게 두 가지 방식으로 조인을 진행한다.    

### 1-1) Shuffle join    

전체 노드간 네트워크 통신을 유발하는 shuffle join 방식이다.   
조인 키로 두 데이터 세트를 섞고 동일한 키를 가진 데이터를 동일한 노드로 
이동시킨다.   

<img width="400" alt="스크린샷 2024-04-29 오후 3 16 31" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/e556fbc5-8cea-4f54-93bd-21c8be36f18f">    

### 1-2) Broadcast join   

`작은 데이터 세트를 broadcast 변수로 driver에서 생성하여 
클러스터의 각 executor 별로 복제해 놓고 join 하는 방식이다.`   

따라서, broadcast 되는 대상 테이블이 크다면 driver의 메모리가 부족하여 
비정상 종료 될 수 있다.   

`driver에서 broadcast 변수로 생성하여 각 executor로 전송할 때 
네트워크 비용이 발생하지만, 그 이후 join을 진행할 때는 네트워크를 통한 
데이터 이동이 없기 때문에 join 속도가 매우 빠르다.`      

<img width="310" alt="스크린샷 2024-04-29 오후 3 16 37" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/268f4f1e-2a99-45f0-8126-1cb9f8924331">   

- - - 

## 2. 조인 전략    

### 2-1) Shuffle Sort Merge Join   

두 테이블이 모두 큰 경우 사용 되며, 두 테이블 모두 조인 키 기반으로 repartition 이 
발생한다.    

> default shuffle partition은 200 이기 때문에 200개의 셔플 파티션을 사용한다.    

spark 2.3 부터 shuffle hash join 보다 더 좋은 성능을 내는 
shuffle sort merge join 을 사용한다.   

`join 과저어에서 shuffle hash join 과 달리 memory가 아닌 dist를 이용할 수 있기 
때문에 OOM이 발생하지 않는다.`       

이를 확인하기 위해 아래 옵션을 이용하여 off 시키고 shuffle hash join을 
테스트 해볼 수 있다.     

```
spark.conf.set("spark.sql.join.preferSortMergeJoin","false")
```

shuffle sort merge join 은 조인 작업 전에 조인 키를 기준으로 shuffle 시켜 
정렬되며, 조인 키를 
기반으로 두 데이터 세트를 병합한다.   

<img width="700" alt="스크린샷 2024-04-20 오후 12 32 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/df897b0b-d54c-40d7-a974-1b8d491cc2ad">   

<img width="700" alt="스크린샷 2024-04-20 오후 12 32 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f4e469cc-08c6-4eb4-92df-04994aae2aa4">  

### 2-2) Hash Join   

해시 조인은 더 작은 테이블의 조인 키를 기반으로 해시 테이블을 생성한 다음 
해시된 조인 키 값과 일치하도록 더 큰 테이블을 반복하면서 수행한다.     


### 2-3) Broadcast Hash Join    

`위에서 설명한 broadcast 변수를 driver에서 생성하여 각 executor로 복제해 놓고, 해시 조인을 실행하는 방식이다.`       

<img width="700" alt="스크린샷 2024-04-21 오후 3 38 11" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/055eb343-b4f2-457d-8441-58d874a3c1b2">   

```
// default: 10MB
// -1로 설정하게 되면 broadcast는 비활성화 된다.
spark.conf.set("spark.sql.autoBroadcastJoinThreshold", [your threshold in Bytes])
```


위 설정과 같이 default로 10MB 이하의 데이터 셋이 broadcast 변수로 생성되며, 
    Spark 엔진 또는 [Adaptive Query Exectuion](https://wonyong-jang.github.io/spark/2024/04/15/Spark-Adaptive-Query-Execution.html)에 의해 
    Broadcast Hash join이 실행되지만 그렇지 못한 경우는 직접 명시를 해주어야 한다.   

```
import org.apache.spark.sql.functions.broadcast
  
val joinDF = bigDF.join(broadcast(smallDF), "joinKey")
```

### 2-4) Partial Manual Broadcast Hash Join     

소수의 키에 데이터가 크게 몰려 있어서 메모리에 올릴 수 없는 경우, 
    몰려 있는 키만 빼고 일반 키들만으로 braodcast join을 하는 방법도 
    고려해 볼 수 있다.   
각 키 별로 필터링하여 broadcast join과 일반적인 join을 나눠서 수행하고 union으로 
합치는 방법이다.   
이 방법은 다루기 힘든 심하게 skewed 된 데이터를 다룰 때 고려해 볼 수 있을 것이다.    


- - - 

**Reference**   

<https://mjs1995.tistory.com/227#article-1-1--%EC%A0%84%EC%B2%B4-%EB%85%B8%EB%93%9C%EA%B0%84-%ED%86%B5%EC%8B%A0%EC%9D%84-%EC%9C%A0%EB%B0%9C-%EC%85%94%ED%94%8C-%EC%A1%B0%EC%9D%B8(shuffle-join)>    

<https://jaemunbro.medium.com/apache-spark-%EC%A1%B0%EC%9D%B8-join-%EC%B5%9C%EC%A0%81%ED%99%94-c9e54d20ae06>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

