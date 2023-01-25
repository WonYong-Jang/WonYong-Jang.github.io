---
layout: post
title: "[Spark] 아파치 스파크 Persistence "
subtitle: "RDD Persistence / memory, disk cache"    
comments: true
categories : Spark
date: 2021-06-23
background: '/img/posts/mac.png'
---

## 1. RDD Persistence 이란?   

자주 사용하는 RDD는 메모리 또는 디스크에 캐싱하는게 성능 향상에 유리하다.   
`캐싱을하게 되면 반복적으로 action을 실행할 때마다 원본 파일로 부터 RDD 생성 및 
수많은 transformation을 진행하는 것이 아니라, 캐싱되어 있는 RDD 부터 
연산을 수행하게 된다.`      

즉, 반복적으로 사용되는 RDD가 있다면 메모리 및 디스크에 캐싱을 해 놓는다면 
여러 action 연산을 수행할 때 성능 향상을 할 수 있다.   

`또한, cache는 fault-tolerant 하다.`   
장애가 발생하여 캐시된 RDD가 손실되어도, 자동으로 다시 recomputation하여 캐싱 진행 및 
연산을 수행한다.   


- - - 

## 2. Storage Level

초장기 Spark은 메모리에만 캐싱을 진행했지만, 현재는 다양한 옵션을 제공한다.   

### 2-1) MEMORY_ONLY   

`default로 spark는 역직렬화된 형태로 RDD 데이터를 메모리에 캐싱하게 된다.`   
만약 메모리가 부족하다면 메모리에 캐싱을 하지 않는다.   

만약 RDD내에 파티션이 10개로 나뉘어져 있다고 가정해보고 예를 들어보자.   
이 중에서 메모리에 8개 파티션은 캐싱을 했고, 2개는 메모리가 부족하여 
캐싱을 진행하지 않았다.   
그렇다면 메모리에 올리지 않은 2개의 파티션은 
원본 파일로 부터 직접 계산을 수행하고 캐싱한 8개 파티션은 
캐시된 형태로 재사용하게 된다.   


### 2-2) MEMORY_AND_DISK   

`1차적으로 메모리에 캐싱을 진행하며, 메모리가 부족한 경우는 디스크에 캐싱을 한다.`  

> 여기서 디스크는 로컬 디스크라고 생각하면 된다.   


### 2-3) MEMORY_ONLY_SER (Java and Scala)   

java와 scala에서만 사용 가능하며, 
    파티션 마다 byte 배열의 직렬화 형태로 RDD 데이터를 저장한다.   

위에서 직렬화 형태로 RDD를 저장하는 것보다 효율적인 공간을 사용할 수 있게 되는 장점이 있다.   
단지, 캐싱된 데이터를 다시 연산을 할 때 역직렬화를 해주어야 함으로 더 많은 CPU를 쓰게 된다.      

> 메모리 공간을 훨씬 적게 사용하므로 상황에 따라 유용하게 사용 될 수 있다.   

### 2-4) MEMORY_AND_DISK_SER (Java and Scala)   

위와 마찬가지로 직렬화 형태로 RDD 데이터를 저장하며, 
    부족할 경우 디스크에 저장한다.   

### 2-5) DISK_ONLY

오직 디스크에만 캐싱을 진행하며, 보통 데이터가 TB, PB 이상으로 큰 경우 사용을 고려해보자.  

### 2-6) MEMORY_ONLY_2, MEMORY_AND_DISK_2   

위에서 캐시도 fault-tolerant 를 지원하여 데이터가 손실되어도, recomputation 된다고 언급했다.   
하지만 데이터 복구하는 과정에서 약간의 지연 시간이 발생할 수 있다.   
따라서 이를 방지하기 위해 처음부터 캐싱 데이터를 copy 하여서 장애 발생시 
recomputation 되는 것을 방지할 수 있다.   

### 2-7) OFF_HEAP (experimental)   

`보통 캐싱되는 곳은 executor의 메모리를 사용한다.`

하지만, 해당 옵션은 executor의 메모리가 아닌 별도의 메모리 관련 서비스를 이용하기 
위한 옵션이다.   



- - - 

**Reference**    

<https://blog.devgenius.io/a-neglected-fact-about-apache-spark-performance-comparison-of-coalesce-1-and-repartition-1-80bb4e30aae4>   
<https://jaemunbro.medium.com/apache-spark-partition-%EA%B0%9C%EC%88%98%EC%99%80-%ED%81%AC%EA%B8%B0-%EC%A0%95%ED%95%98%EA%B8%B0-3a790bd4675d>   
<https://m.blog.naver.com/syung1104/221103154997>    
<https://thebook.io/006908/part01/ch04/02-01/>  
<https://fastcampus.co.kr/data_online_spkhdp>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

