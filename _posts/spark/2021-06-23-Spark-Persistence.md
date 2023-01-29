---
layout: post
title: "[Spark] Persistence 와 Data Locality"
subtitle: "RDD Persistence / memory, disk cache / locality level(PROCESS LOCAL, NODE LOCAL, RACK LOCAL)"    
comments: true
categories : Spark
date: 2021-06-23
background: '/img/posts/mac.png'
---

## 1. RDD Persistence 이란?   

자주 사용하는 RDD는 메모리 또는 디스크에 캐싱하는게 성능 향상에 유리하다.   
`캐싱을 하게 되면 반복적으로 action을 실행할 때마다 원본 파일로 부터 RDD 생성 및 
수 많은 transformation을 진행하는 것이 아니라, 캐싱되어 있는 RDD 부터 
연산을 수행하게 된다.`      

즉, 반복적으로 사용되는 RDD가 있다면 메모리 및 디스크에 캐싱을 해 놓는다면 
여러 action 연산을 수행할 때 성능 향상을 할 수 있다.   

`또한, cache는 fault-tolerant 하다.`   
장애가 발생하여 캐시된 RDD가 손실되어도, 자동으로 다시 recomputation하여 캐싱 진행 및 
연산을 수행한다.   

아래 예시를 통해 자세히 이해해 보자.   

<img width="1100" alt="스크린샷 2023-01-28 오후 4 02 56" src="https://user-images.githubusercontent.com/26623547/215252151-5ca53b86-7aac-4209-8c11-ea4f30f8cd6f.png">      

driver 1대와 worker 노드 3대로 구성된 클러스터에서 log mining 작업을 진행하려고 한다.  
각 worker당 1개의 executor가 실행되도록 설정하였고, 
    데이터는 hdfs에서 가져와서 작업을 한다.   

> 기본적으로 hdfs는 block 단위로 파일을 분산하여 저장한다.   

우선 driver는 대상 데이터의 위치와 크기를 확인한다.   
`위 예제에서 hdfs의 경우 block 단위로 3개가 저장되어 있는 것을 확인하고, 
    block 당 1개의 task를 생성하여 각 executor에게 전달한다.`   

최종적으로 executor마다 task를 처리하고 결과값을 driver에게 전달한다.    

> 위의 예시에는 count action이 실행되면, 각 executor마다 분산 처리하여 
count 값을 driver에게 전달하게 된다.    

<img width="424" alt="스크린샷 2023-01-28 오후 4 08 07" src="https://user-images.githubusercontent.com/26623547/215252341-b41207a5-385f-48da-acd6-2427773350a1.png">  


그럼 이번에는 아래와 같이 count action을 한번 더 실행하면 
어떻게 될까?   

<img width="900" alt="스크린샷 2023-01-28 오후 4 09 45" src="https://user-images.githubusercontent.com/26623547/215252413-87d84569-f675-4741-b2ae-fd53d13e9756.png">   
 
`Spark는 action을 수행할 때마다 새로운 job을 실행한다.`   
`해당 job은 데이터를 처음부터 hdfs에서 읽어와서 순차적으로 처리하게 된다.`   

> 이 글에서는 hdfs에 원본 데이터가 존재하지만 s3, 외부 db 등이 될 수도 있다.   

`즉, 위의 동일한 transformation 작업이 반복적으로 발생하게 된다.`    

그럼 이번에는 성능향상을 위해 RDD 데이터를 `메모리에 캐싱`해서 동일한 작업을 해보자.   

<img width="1322" alt="스크린샷 2023-01-28 오후 4 20 16" src="https://user-images.githubusercontent.com/26623547/215252913-1529bc1e-c4e7-4296-b527-d0ef9e547a0d.png">    

위와 같이 반복적으로 사용하는 rdd를 cache() 함수를 통해서 캐싱하였다.     
`각 executor마다 rdd가 캐싱되며, 반복적으로 action이 발생하였을 때 hdfs에서 
읽어 처음부터 연산을 하는 것이 아닌 캐싱된 rdd 부터 작업을 시작하여 성능 향상을 할 수 있다.`      

> 1TB 데이터 기준으로 캐싱을 사용하지 않는 경우 170초가 걸리는 반면, 캐싱을 했을 경우 5~7초가 
소요된다.   

- - - 

## 2. Behavior with Less RAM  

만약 executor의 메모리가 부족하다면 어떻게 될까?   

`꼭 기억해야할 부분은 캐시는 RDD의 파티션 단위로 처리 된다.`   
`하나의 파티션 데이터를 메모리에 모두 캐싱하기에 부족하다면, 
    일부 메모리 여유가 있더라도 파티션 데이터 모두 캐싱되지 않는다.`   

`즉, 하나의 파티션 데이터 모두가 캐싱되거나 되지 않거나 이다.`   

캐시되지 않는 파티션 데이터는 원본 데이터를 읽어서 
처음부터 연산을 수행한다.   
메모리에 여유가 생겨 해당 파티션을 캐시하기 전까지는 
action 수행시마다 원본 데이터를 읽어 반복적으로 다시 처리된다.   


- - - 

## 3. Storage Level

초장기 Spark은 메모리에만 캐싱을 진행했지만, 현재는 다양한 옵션을 제공한다.   

### 3-1) MEMORY_ONLY   

`default로 spark는 역직렬화된 형태로 RDD 데이터를 메모리에 캐싱하게 된다.`   
만약 메모리가 부족하다면 메모리에 캐싱을 하지 않는다.   

만약 RDD내에 파티션이 10개로 나뉘어져 있다고 가정해보고 예를 들어보자.   
이 중에서 메모리에 8개 파티션은 캐싱을 했고, 2개는 메모리가 부족하여 
캐싱을 진행하지 않았다.   
그렇다면 메모리에 올리지 않은 2개의 파티션은 
원본 파일로 부터 직접 계산을 수행하고 캐싱한 8개 파티션은 
캐시된 형태로 재사용하게 된다.   


### 3-2) MEMORY_AND_DISK   

`1차적으로 메모리에 캐싱을 진행하며, 메모리가 부족한 경우는 디스크에 캐싱을 한다.`  

> 여기서 디스크는 로컬 디스크라고 생각하면 된다.   


### 3-3) MEMORY_ONLY_SER (Java and Scala)   

java와 scala에서만 사용 가능하며, 
    파티션 마다 byte 배열의 직렬화 형태로 RDD 데이터를 저장한다.   

위에서 역직렬화 형태로 RDD를 저장하는 것보다 효율적인 공간을 사용할 수 있게 되는 장점이 있다.   
단지, 캐싱된 데이터를 다시 연산을 할 때 역직렬화를 해주어야 함으로 더 많은 CPU를 쓰게 된다.      

> 메모리 공간을 훨씬 적게 사용하므로 상황에 따라 유용하게 사용 될 수 있다.   

### 3-4) MEMORY_AND_DISK_SER (Java and Scala)   

위와 마찬가지로 직렬화 형태로 RDD 데이터를 저장하며, 
    부족할 경우 디스크에 저장한다.   

### 3-5) DISK_ONLY

오직 디스크에만 캐싱을 진행하며, 보통 데이터가 TB, PB 이상으로 큰 경우 사용을 고려해보자.  

### 3-6) MEMORY_ONLY_2, MEMORY_AND_DISK_2   

위에서 캐시도 fault-tolerant 를 지원하여 데이터가 손실되어도, recomputation 된다고 언급했다.   
하지만 데이터 복구하는 과정에서 약간의 지연 시간이 발생할 수 있다.   
따라서 이를 방지하기 위해 처음부터 캐싱 데이터를 copy 하여서 장애 발생시 
recomputation 되는 것을 방지할 수 있다.   

### 3-7) OFF_HEAP (experimental)   

`보통 캐싱되는 곳은 executor의 메모리를 사용한다.`

하지만, 해당 옵션은 executor의 메모리가 아닌 별도의 메모리 관련 서비스를 이용하기 
위한 옵션이다.   

- - -   

## 4. Web UI 을 통해 확인해보기   

캐싱을 하고 모니터링을 위한 Spark Web UI에서 확인해보자.   

기본적으로 `캐시는 Storage 탭`에서 확인할 수 있다.   

<img width="1300" alt="스크린샷 2023-01-28 오후 9 14 43" src="https://user-images.githubusercontent.com/26623547/215265915-5bc1d863-4a9a-454e-aa7f-bdd95e896693.png">   

위 그림은 55개 파티션에 대해서 100% 캐시가 이루어진 것을 확인할 수 있으며,  
    캐시된 데이터 크기도 확인할 수 있다.   

이번에는 jobs탭에서 job의 DAG도 확인해보자.   

<img width="1057" alt="스크린샷 2023-01-28 오후 9 16 44" src="https://user-images.githubusercontent.com/26623547/215266011-e8322d08-e5fe-47f0-976e-15ebaecc2b32.png">      

위 그림에서 `연두색 점이 캐싱이 되었다는 표시`이며, 해당 파티션과 input 크기를 
확인할 수 있다.   
stoarage 탭에서 살펴봤던 메모리 크기와 동일한 것을 확인할 수 있다.   
즉, `해당 job은 캐싱된 데이터를 이용하여 연산을 수행`하였고 수행 시간이 단축되었다.   


이번에는, `executor의 메모리 부족으로 100% 캐시가 이루어 지지 않는 경우`  
Web UI에 어떻게 나타나는지 살펴보자.   

<img width="1300" alt="스크린샷 2023-01-28 오후 9 34 41" src="https://user-images.githubusercontent.com/26623547/215266704-e8001b9a-6d8f-4f63-82c9-a625a6bb0fe7.png">  

위처럼 55개 파티션 중 1개의 파티션이 캐싱이 안된 것을 확인할 수 있다.   

jobs 탭에서 job의 DAG를 확인해보자.  

<img width="1100" alt="스크린샷 2023-01-28 오후 9 41 25" src="https://user-images.githubusercontent.com/26623547/215267007-810b10c6-9f9e-4336-b64a-7d78f49f7b8c.png">  

위 그림에서 input 크기를 살펴보면, 전체 캐시했을 때보다 조금 증가한 것을 확인할 수 있다.   
해당 크기는 
캐시된 데이터와 캐시되지 않은 1개 파티션은 hdfs에서 읽어온 데이터의 합이다.    

마지막으로 빨간색 박스에 있는 링크를 클릭하여 task 별로도 살펴보자.   

<img width="1282" alt="스크린샷 2023-01-28 오후 9 55 38" src="https://user-images.githubusercontent.com/26623547/215267522-bce903c3-3f98-4cda-ba08-a8d1480fbe58.png">    

`Locality level이 PROCESS_LOCAL로 표기된 것은 task가 돌고 있는 같은 executor 메모리 캐시를 읽은 것이다.`   

`RACK_LOCAL 은 메모리 읽지 않고, 같은 RACK 장비에 있는 다른 노드의 디스크를 읽었다는 의미이다.`    
즉, 131.3MB는 hdfs에 다시 읽어서 연산했다는 의미이다.   

추가적으로 `NODE_LOCAL은 같은 노드의 디스크에서 데이터를 읽었다는 의미이다.`     


- - - 

## 5. Locality Level   

위에서 언급한 locality level에 대해서 조금 더 자세히 살펴보자.   

Data Locality는 Spark job의 퍼포먼스에 많은 영향을 주는 요소 중 하나이다.   
`Spark는 Data Locality를 고려하여 task를 저장된 데이터와 최대한 가까운 executor에서 
실행되도록 Scheduling한다.`          

> Data Locality는 데이터를 처리하는 노드가 얼마나 가까운 거리에 있는지를 나타낸다.   

데이터의 현재 위치를 기반으로 Locality는 여러 Level로 정의된다.   
가장 가까운 것에서 가장 먼 순으로 Level을 살펴보자.   

- PROCESS_LOCAL   
    - 가장 실행 속도가 빠른 Locality이다.  
    - 데이터가 실행되고 있는 executor의 JVM내에 위치한 경우이다.    
    - 예를 들면, executor 내의 메모리에서 데이터를 가져온 경우이다.   


- NODE_LOCAL   
    - 데이터가 같은 노드에 있는 경우이다.  
    - 예를 들면, 같은 노드에 executor와 hdfs가 존재하며, executor가 데이터를 hdfs에서 읽어온 경우이다.    
    - 데이터가 process 들 간에 이동해야하기 때문에 PROCESS_LOCAL에 비해 조금 느리다.   

- NO_PREF   
    - 데이터는 어느 곳에서나 똑같이 빠르게 액세스 되며 지역 선호도가 없다.   

- RACK_LOCAL   
    - 데이터가 같은 Rack 장비에 존재하지만, executor가 다른 노드에서 데이터를 읽어온 경우이다.   
    - 같은 Rack 장비에 속하지만 다른 노드에서 데이터를 읽었으므로 네트워크 비용이 발생한다.   

- ANY   
    - 데이터가 같은 Rack이 아닌 다른 네트워크 상에 존재하는 경우이며, 가장 속도가 느린 Locality이다.   

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

