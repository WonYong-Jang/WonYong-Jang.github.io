---
layout: post
title: "[Spark] Memory 관리 및 튜닝"   
subtitle: "Spark 실행시 적절한 Driver와 Executor 개수 / on-heap, off-heap, overHead memory /PySpark에서의 Memory"    
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

`executor의 memory(JVM)는 on-heap memory, off-heap memory, overhead memory로 
크게 3가지 독립 영역으로 나뉘게 된다.`       

<img width="700" alt="Image" src="https://github.com/user-attachments/assets/2014bfa0-8401-4a1c-a03f-149ae01e4577" />      

### 1-1) On-Heap Memory Management(In-Memory)   

`Object는 JVM heap에 할당되고 GC에 의해 관리된다.`        

> 따라서 GC가 자주 발생하는 경우는 on-heap 메모리를 늘려야 한다.   

어플리케이션 대부분에 데이터가 on-heap 메모리에 저장된다.  
`spark.executor.memory는 스파크의 설정 옵션 중 하나로, executor에 할당되는 
메모리를 설정하는데에 사용되는 config 값이다.`    

우선 Spark Executor의 JVM Heap 메모리를 크게 다음과 같이 나눌 수 있다.   

<img width="499" alt="Image" src="https://github.com/user-attachments/assets/44d23256-e14b-451d-9c8c-38572ed3d265" />    

#### 1-1-1) Spark Memory(spark.memory.fraction=0.6, default)   

`Spark의 메모리가 부족할 경우 Executor가 사용하는 전체 JVM 메모리 사이즈를 늘리거나, 
    spark.memory.fraction 값을 올릴 수 있다.`  

`주의해야 할 점은 Out of Memory 메모리 오류가 발생하게 되면 무조건 spark.memory.fraction 을 
증가시키면 안되며, 오히려 줄여야 하는 경우도 있으니 각 역할을 정확히 이해하는 것이 중요하다.`   

##### Execution Memory

- 함수로는 join, sort, aggregtaion(transformations, actions의 함수들)과 같은 함수 호출을 
통해 사용되는 영역이다.   

##### Storage Memory(spark.memory.storageFraction=0.5, default)   

- `캐싱 또는 Broadcast 의 데이터를 저장하는 영역이다.`         
- 캐싱을 많이 사용한다면 Storage Memory가 부족하여서 spark.memory.storageFraction 값을 
늘릴수도 있겠지만, spark 1.6부터는 [Unified Memory Management](https://issues.apache.org/jira/browse/SPARK-10000)가 
도입되면서 위 사진과 같이 통합되었기 때문에 큰 효과가 없을 수 있다.  

> 만약 메모리가 부족하다고 판단이 되면 비용이 허락하는 한도 내에서 전체 메모리를 늘려보는 것도 방법이다.   

위에서 언급한 것과 같이 spark 1.6 부터 spark memory 영역이 통합되면서 
캐싱(Storage)을 사용하지 않을 경우에는 Execution(집계)를 위해 Storage Memory 영역을 사용할 수 있게 되었고, 
    캐싱(Storage)을 많이 사용한다면 Execution Memory 영역을 필요시 더 사용할 수 있게 되었다.   

즉, spark.memory.storageFraction 값은 이제 절대적인 Storage Memory 양이 아니라, Evition 되지 않는 최대 
메모리 양을 지정하는 옵션이 되었다.    

#### 1-1-2) User Memory

- `전체 JVM Heap 에서 spark.memory.fraction 와 Reserved Memory를 제외한 영역`      
- `Spark 가 사용하는 내부 메타데이터, 사용자 생성 데이터 구조 저장이나 UDF 및 OOM을 
방지하기 위한 대비영역으로 사용된다.`      

#### 1-1-3) Reserved Memory (300 MiB)    

- spark 엔진 내부동작을 위해 남겨놓는 reserved 용량, 해당 영역은 300MB가 고정으로 할당된다.   

위에서 설명한 spark.memory.fraction은 각 메모리 영역의 비율을 설정하게 된다.   
`만약 spark.memory.fraction=0.6 인 경우, storage memory + execution memory 영역이 60%, User Memory 영역이 
40% 를 차지한다.`      


### 1-2) Off-Heap Memory Management(External-Memory)   

`off-heap memory는 JVM(on heap memory) 영역과는 별도로 존재하며, Spark container(Executor) 내에 위치한다.`      

<img width="500" alt="Image" src="https://github.com/user-attachments/assets/b4da2cb3-7db4-4cbb-8551-cef7062e84e3" />   

off-heap memory는 특정([Tungsten](https://wonyong-jang.github.io/spark/2021/05/04/Spark-DataFrame-Tungsten.html) 데이터를 저장하거나, 혹은 
        on-heap memory(JVM 영역)에서의 빈번한 GC로 인한 Overhead를 감소시킬 목적으로 사용된다.   

spark.memory.offHeap.enabled=true(default = false)로 설정되어 있어야 사용 가능하다.    
단, 해당 설정이 true라고 하더라도, default는 0 (bytes) 이다.   
즉, spark.memory.offHeap.size를 통해 추가 설정 해줘야 한다.   

### 1-3) Overhead Memory   

오버헤드 메모리는 executor에서 container의 overhead를 감안해서 여유분으로 
남겨놓은 메모리 공간이다.   
`보통, 전체 spark.executor.memory 의 10% 정도로 설정하고, default 값도 10% 이다.`      
`spark.executor.memoryOverhead 혹은 spark.executor.memoryOverheadFactor 설정을 통해 세팅을 한다.`   

일반적으로 Object의 읽기 및 쓰기 속도는 On-Heap > Off-Heap > DISK 순서로 빠르다.   

만약 spark.memory.fraction 비율을 너무 줄일 경우, spill이 자주 발생할 수 있다. 
즉 데이터를 저장할 공간이 부족해져 성능을 저해할 수 있다.   

> 따라서, 최초에는 default로 설정으로 진행 후, 이후에 모니터링을 통해 튜닝을 진행하는게 
일반적인 튜닝 방법이다.   

<img width="646" alt="Image" src="https://github.com/user-attachments/assets/369d0995-7e3b-4c35-8480-80aeb37888d5" />   

Spill 이란, 데이터를 저장할 메모리 공간(Storage memory 혹은 execution memory)이 부족할 경우 데이터를 
담을 공간이 없을 때 발생한다.   
Spill 은 부족한 메모리 영역에 저장 못한 데이터를 Disk 영역(HDFS)에 저장하기 때문에 Spill이 많이 
발생할 경우 성능에 매우 치명적이다.(Disk I/O 발생)   

해결 방법은 여러 측면을 봐야하지만 `가장 대표적으로는 파티션의 사이즈를 줄이는 것으로 튜닝을 하는 것이다.`      
파티션의 사이즈를 줄이는 이유는 한번에 처리할 데이터의 양을 줄일 수 있어 메모리 영역에 저장되는 
데이터 사이즈를 감소시킬 수 있다.  
하지만 파티션의 사이즈를 줄여서 파티션의 수가 늘어나게 되면 오히려 더 많은 task가 생성 및 수행 되기 때문에 
여러 테스트를 통해 가장 적합한 파티션의 사이즈 및 수를 조절해 나가야 한다.    

또 다른 예제를 살펴보자.   

다음과 같은 오류 메세지를 발견했을 때 어떤 옵션을 조절하면 좋을까?   

```python
spark.executor.instances = 10
spark.executor.cores = 10
spark.executor.memory = 30g (GiB)
```

아래와 같은 오류 메시지가 Parquet Write 를 하는 과정에서 발생했으며 join, aggregation 등 로직에는 
문제가 없었다.  

```
ExecutorLostFailure (executor 7 exited caused by one of the running tasks) Reason: Container killed by YARN for exceeding memory limits. 33.2 GB of 33 GB physical memory used. Consider boosting spark.yarn.executor.memoryOverhead or disabling yarn.nodemanager.vmem-check-enabled because of YARN-4714.
```

메모리 관련 설정은 아래와 같이 설정되어 있었다.   

```python
spark.memory.memoryOverhead = 0.1
spark.memory.fraction = 0.8
spark.memory.storageFraction = 0.5
spark.memory.offHeap.enabled = false
```

join, aggregation 등에서 memory 가 터졌다면 heap OOM 메시지가 발생했을 것이다.  
일반적인 경우엔 memory가 넘친다면 disk spill 을 이용해 속도는 느리겠지만 집계할 수 있다.   

off-heap 에서 오류가 났으므로 전체 메모리 사이즈는 동일하게 유지하고 on-heap 을 줄여 off-heap을 
늘려보자.   

```python
spark.executor.memory=25g 
spark.memory.memoryOverhead=8g  
# 전체 = 33 GiB 로 기존과 동일   
```  

수정 후에는 이제 off-heap 이 아니라 heap OOM 이 발생한다.  

```
21/11/26 23:19:51 ERROR util.SparkUncaughtExceptionHandler: Uncaught exception in thread Thread[read-ahead,5,main]
java.lang.OutOfMemoryError: Java heap space
```

`spark.executor.memory 를 줄이면 메모리 영역 중 Execution 메모리(group by, window, aggregation 등)가 줄어든다.`    

만약 메모리는 넉넉한데 group by, window function 등에서 skew 가 발생한다면 어떤 옵션을 수정해야 할까?   

`첫번째로 spark.sql.shuffle.partitons 숫자를 늘려 skew 확률을 낮춰야 한다.`     
`또한, group by, window function 전 해당 집계에서 사용하는 key를 기준으로 repartition(X, "key")를 시도해 볼 수도 있다.`      


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

