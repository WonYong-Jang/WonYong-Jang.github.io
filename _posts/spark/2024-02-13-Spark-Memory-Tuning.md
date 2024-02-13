---
layout: post
title: "[Spark] Memory 관리 및 튜닝"   
subtitle: "Spark 실행시 적절한 Driver와 Executor 개수"    
comments: true
categories : Spark
date: 2024-02-13
background: '/img/posts/mac.png'
---

## 1. Spark의 Memory 관리   

Spark의 기존 메모리 관리는 정적인 메모리 분할(Memory fraction)을 통해 
구조화 되어 있다.   

<img width="800" alt="스크린샷 2024-02-13 오후 11 35 24" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/15148d1f-2921-401e-9984-d40d06c367ca">  




메모리 공간은 3개의 영역으로 분리되어 있으며, 각 영역의 크기는 JVM Heap 크기를 
Spark Configuration에 설정된 고정 비율로 나누어 정해진다.   

<img width="900" alt="스크린샷 2024-02-13 오후 10 01 04" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/ca761a71-6892-4b29-8c1e-173c1dcea7b0">      

- spark.executor.memory: executor가 사용할 수 있는 총 메모리 크기를 정의한다.   

- Execution(Shuffle): 이 영역은 Shuffle, Join, Sort, Aggregation 등을 수행할 때의 중간 데이터를 
버퍼링하는데에 사용된다. 
    - 이 영역의 크기는 spark.shuffle.memoryFraction(기본값: 0.2)를 통해 설정   

- Storage: 이 영역은 주로 추후에 다시 사용하기 위한 데이터 블록들을 Caching하기 위한 용도로 사용된다.  
    - Cache, Broadcast, Accumulator를 위한 데이터 저장 비율   
    - spark.storage.memoryFraction(기본값: 0.6)을 통해 설정   

- Other: 나머지 메모리 공간은 주로 사용자 코드에서 할당되는 데이터나 Spark에서 내부적으로 사용하는 
메타데이터를 저장하기 위해 사용된다.   

`각 영역 메모리에 상주된 데이터들은 자신이 위치한 메모리 영역이 가득 찬다면 
Disk로 Spill 된다.`   
'Storage 영역의 경우 Cache 된 데이터는 전부 Drop되게 된다. 모든 경우에서 데이터 Drop이 발생하면 I/O 증가 혹은 
Recomputation으로 인한 성능 저하가 나타나게 된다.'    

- - - 

## 2. 적절한 Driver와 Executor 사이즈   

먼저, Executor에 관한 몇 가지 기본 전제를 확인해보자.   

- executor는 캐싱과 실행을 위한 JVM을 가지고 있다.    

- executor와 driver 사이즈는 하나의 노드나 컨테이너에 할당된 자원보다 많은 메모리나 코어를 가질 수 없다.     

- executor의 일부 공간은 스파크의 내부 메타 데이터와 사용자 자료구조를 위해 예약되어야 한다. (평균 약 25%)   
    - 이 공간은 spark.memory.fraction 설정으로 변경 가능하며, 기본값은 0.6으로 60%의 공간이 저장과 실행에 쓰이고 40%는 캐싱에 쓰인다.   

- 하나의 partition이 여러개 executor에서 처리될 수 없다. 즉, 하나의 partition은 하나의 executor에서 처리한다.   

그럼 다수의 작은 사이즈의 executor로 구성하는게 좋을까, 소수의 큰 사이즈의 executor로 
구성하는게 좋을까?   

### 2-1) 다수의 작은 executor VS 소수의 큰 executor 

#### 2-1-1) 다수의 작은 executor 의 경우 발생할 수 있는 문제   

하나의 파티션을 처리할 자원이 충분하지 않을 수 있으며, OOM 또는 disk spill 이 
생길 수 있다.     

`따라서 자원이 허용된다면, executor는 최소 4GB 이상으로 설정하는 것을 권장한다.`   

#### 2-1-2) 소수의 큰 executor 의 경우 발생할 수 있는 문제   

너무 큰 executor는 힙 사이즈가 클수록 GC가 시작되는 시점을 
지연시켜 Full GC로 인한 지연이 더욱 길어질 수 있다.    
executor 당 많은 수의 코어를 쓰면 동시에 스레드가 많아지면서 
스레드를 다루는 HDFS의 제한으로 인해 성능이 더 떨어질 수도 있다.   

`따라서 executor당 코어를 최대 5개로 하는 것을 권장하며, 이를 넘게 되면 
성능 향상에 도움되지 않으며 CPU 자원을 불필요하게 소모하게 된다.`   


- - - 

**Reference**   

<https://jaemunbro.medium.com/spark-executor-%EA%B0%9C%EC%88%98-%EC%A0%95%ED%95%98%EA%B8%B0-b9f0e0cc1fd8>   
<https://jaemunbro.medium.com/apache-spark-partition-%EA%B0%9C%EC%88%98%EC%99%80-%ED%81%AC%EA%B8%B0-%EC%A0%95%ED%95%98%EA%B8%B0-3a790bd4675d>  
<https://spidyweb.tistory.com/328>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

