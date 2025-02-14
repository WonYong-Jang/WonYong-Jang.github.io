---
layout: post
title: "[Spark] Memory 관리 및 튜닝"   
subtitle: "Spark 실행시 적절한 Driver와 Executor 개수 / PySpark에서의 Memory"    
comments: true
categories : Spark
date: 2024-02-13
background: '/img/posts/mac.png'
---

## 1. Spark Executor Memory

Spark는 JVM 위에서 실행되며, PySpark를 사용하는 경우에는 외부에 Python 프로세스가 존재할 수 있으나 
Driver 또는 Executor 를 위한 JVM이 실행되는건 동일하다.   


Executor는 Worker 노드에서 실행되는 JVM 프로세스 역할을 한다. 따라서 JVM 메모리 관리를 
이해하는 것이 중요하다.    

JVM 메모리 관리는 두가지로 나눌 수 있다.  

<img width="500" alt="Image" src="https://github.com/user-attachments/assets/b4da2cb3-7db4-4cbb-8551-cef7062e84e3" />   

### 1-1) On-Heap Memory Management(In-Memory)   

`Object는 JVM heap에 할당되고 GC에 바인딩된다.`     

> 따라서 GC가 자주 발생하는 경우는 on-heap 메모리를 늘려야 한다.   

어플리케이션 대부분에 데이터가 on-heap 메모리에 저장된다.  
`spark.executor.memory는 스파크의 설정 옵션 중 하나로, executor에 할당되는 
메모리를 설정하는데에 사용되는 config 값이다.`    

우선 Spark Executor의 JVM Heap 메모리를 크게 다음과 같이 나눌 수 있다.   

<img width="499" alt="Image" src="https://github.com/user-attachments/assets/44d23256-e14b-451d-9c8c-38572ed3d265" />    

#### 1-1-1) Spark Memory(spark.memory.fraction=0.6, default)   

`Spark의 메모리가 부족할 경우 Executor가 사용하는 전체 JVM 메모리 사이즈를 늘리거나, 
    spark.memory.fraction 값을 올릴 수 있다.`   

##### Execution Memory

- spark.memory.storageFraction 를 제외한 spark.memory.fraction 의 나머지    
- 데이터 집계 과정에서 Shuffle, Aggregation, Sort 등을 위해 사용한다.   

##### Storage Memory(spark.memory.storageFraction=0.5, default)   

- 캐싱 또는 Broadcast, Driver로 보내는 결과들이 이 영역의 메모리를 사용한다.  
- 캐싱을 많이 사용한다면 Storage Memory가 부족하여서 spark.memory.storageFraction 값을 
늘릴수도 있겠지만, spark 1.6부터는 [Unified Memory Management](https://issues.apache.org/jira/browse/SPARK-10000)가 
도입되면서 위 사진과 같이 통합되었기 때문에 큰 효과가 없을 수 있다.   

위에서 언급한 것과 같이 spark 1.6 부터 spark memory 영역이 통합되면서 
캐싱(Storage)을 사용하지 않을 경우에는 Execution(집계)를 위해 Storage Memory 영역을 사용할 수 있게 되었고, 
    캐싱(Storage)을 많이 사용한다면 Execution Memory 영역을 필요시 더 사용할 수 있게 되었다.   

`즉, spark.memory.storageFraction 값은 이제 절대적인 Storage Memory 양이 아니라, Evition 되지 않는 최대 
메모리 양을 지정하는 옵션이 되었다.`   

#### 1-1-2) User Memory

- 전체 JVM Heap 에서 spark.memory.fraction 와 Reserved Memory를 제외한 영역   
- Spark 가 사용하는 내부 메타데이터, 사용자 생성 데이터 구조 저장이나 UDF 및 OOM을 
방지하기 위한 대비영역으로 사용된다.   

#### 1-1-3) Reserved Memory (300 MiB)     


### 1-2) Off-Heap Memory Management(External-Memory)   

`Object는 직렬화에 의해 JVM 외부의 메모리에 할당되고 Application에 의해 
관리되며 GC에 바인딩되지 않는다.`      

Spark 내부의 [Tungsten](https://wonyong-jang.github.io/spark/2021/05/04/Spark-DataFrame-Tungsten.html)이라 불리는 
실행엔진은 off-heap 메모리 관리 기능을 제공한다.   
  
기본적으로 executor memory를 설정하면 memoryOverhead 크기는 아래와 같이 설정된다.   

```python
MAX(spark.executor.memory*0.1, 384MB)   

# On-Heap과 Off-Heap
# 만약 executor-memory=5g로 설정했다면 
# on-heap: 5G
# off-heap: max(5g*0.1, 384MB) = 500MB
```

`spark.executor.memoryOverhead 값 지정을 통해 직접 설정해줄 수도 있다.`   

`PySpark를 사용할 경우 Python Process의 메모리(spark.executor.pyspark.memory) 등 
Non-JVM 메모리 영역을 지정한다.`      


일반적으로 Object의 읽기 및 쓰기 속도는 On-Heap > Off-Heap > DISK 순서로 빠르다.   

- - -   

## 2. Spark의 Memory 관리   

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

## 3. PySpark Memory and Arrow   

<img width="438" alt="Image" src="https://github.com/user-attachments/assets/02fb02c2-0d9a-481d-897d-213685ac2b93" />   

PySpark를 사용한다면 다음 두 가지의 메모리 옵션을 설정할 수 있다.   

- spark.python.worker.memory (512m, default) 는 JVM 내에서 Python Worker 의 집계를 
위해 사용되는 영역이다.    

- spark.executor.pyspark.memory (설정되지 않음, default) 는 실제 Python Process의 메모리이다.   

`spark.executor.pyspark.memory는 기본값이 설정되어 있지 않으므로 PySpark 사용시 
DataFrame 대신 일반 Python 객체와 함수를 이용해 가공하는 등 메모리를 많이 
사용할 경우 메모리 이슈가 발생할 수 있다.`   


- - - 

**Reference**   

<https://1ambda.blog/2021/12/27/practical-spark-10/>    
<https://jaemunbro.medium.com/spark-executor-%EA%B0%9C%EC%88%98-%EC%A0%95%ED%95%98%EA%B8%B0-b9f0e0cc1fd8>   
<https://jaemunbro.medium.com/apache-spark-partition-%EA%B0%9C%EC%88%98%EC%99%80-%ED%81%AC%EA%B8%B0-%EC%A0%95%ED%95%98%EA%B8%B0-3a790bd4675d>  
<https://spidyweb.tistory.com/328>   
<https://medium.com/walmartglobaltech/decoding-memory-in-spark-parameters-that-are-often-confused-c11be7488a24>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

