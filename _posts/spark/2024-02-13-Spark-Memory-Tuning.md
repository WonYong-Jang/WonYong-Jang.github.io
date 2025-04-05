---
layout: post
title: "[Spark] Memory 관리 및 튜닝"   
subtitle: "Spark 실행시 적절한 Driver와 Executor 개수 / on-heap, off-heap, overHead memory /PySpark에서의 Memory"    
comments: true
categories : Spark
date: 2024-02-13
background: '/img/posts/mac.png'
---

Spark 는 in-memory 에서 작동하기 때문에 빠르지만 잘못된 설정에 의해서 
불안정해 질 수 있다.   
메모리 관리, cpu core 수의 관리를 통해 out of memory 가 발생하지 않는 선에서 
job이 성공적으로 수행될 수 있도록 해야 하며, 
    적절한 캐싱 전략, 직렬화, executor 파티션 갯수 선정을 통해 
    많은 컴퓨팅 자원을 점유하지 않도록 해야 한다.   

- - - 

## 1. Spark Executor Memory

Spark는 JVM 위에서 실행되며, PySpark를 사용하는 경우에는 외부에 Python 프로세스가 존재할 수 있으나 
Driver 또는 Executor 를 위한 JVM이 실행되는건 동일하다.   

Executor는 Worker 노드에서 실행되는 JVM 프로세스 역할을 한다. 따라서 JVM 메모리 관리를 
이해하는 것이 중요하다.    

`executor의 memory(JVM)는 on-heap memory, off-heap memory, overhead memory로 
크게 3가지 독립 영역으로 나뉘게 된다.`       

<img width="700" alt="Image" src="https://github.com/user-attachments/assets/2014bfa0-8401-4a1c-a03f-149ae01e4577" />      

### 1-1) On-Heap Memory Management(In-Memory)   

`on-heap 메모리는 JVM 의 GC 관리 하에 있는 메모리 영역이다.`            

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

- `함수로는 join, sort, aggregtaion(transformations, actions의 함수들)과 같은 함수 호출을 
통해 사용되는 영역이다.`       

##### Storage Memory(spark.memory.storageFraction=0.5, default)   

- `Cache, Broadcast, Accumulator 의 데이터를 저장하는 영역이다.`         
- 캐싱을 많이 사용한다면 Storage Memory가 부족하여서 spark.memory.storageFraction 값을 
늘릴수도 있겠지만, spark 1.6부터는 [Unified Memory Management](https://issues.apache.org/jira/browse/SPARK-10000)가 
도입되면서 위 사진과 같이 통합되었기 때문에 큰 효과가 없을 수 있다.  

> 만약 메모리가 부족하다고 판단이 되면 비용이 허락하는 한도 내에서 전체 메모리를 늘려보는 것도 방법이다.   

위에서 언급한 것과 같이 spark 1.6 부터 spark memory 영역이 통합되면서 
Storage memory와 Execution Memory는 필요시 서로의 메모리를 점유할 수 있다.   
여기서 Execution memory는 Storage memory를 빼앗아 사용할 수 있지만 그 반대는 불가능하다.

따라서 Execution memory가 부족할 경우 spark.memory.storageFraction 값을 줄이는 것이 효과적인 방법이 
될 수 있다.   

#### 1-1-2) User Memory

- `전체 JVM Heap 에서 spark.memory.fraction 와 Reserved Memory를 제외한 영역`      
- `Spark 가 사용하는 내부 메타데이터, UDF, 사용자 생성 데이터 구조 저장 및 OOM을 
방지하기 위한 대비영역으로 사용된다.`     


#### 1-1-3) Reserved Memory (300 MiB)    

- spark 엔진 내부동작을 위해 남겨놓는 reserved 용량, 해당 영역은 300MB가 고정으로 할당된다.   

위에서 설명한 spark.memory.fraction은 각 메모리 영역의 비율을 설정하게 된다.   
`만약 spark.memory.fraction=0.6 인 경우, storage memory + execution memory 영역이 60%, User Memory 영역이 
40% 를 차지한다.`      


### 1-2) Off-Heap Memory Management(External-Memory)   

`off-heap memory는 JVM(on heap memory) 영역과는 별도로 존재하며, Spark container(Executor) 내에 위치한다.`      

> off-heap 메모리는 JVM 영역과는 별도로 존재하기 때문에, GC 관리 밖의 메모리를 사용하여 stop-the-world 를 
최소화 할 수 있다는 점에서 성능 향상을 할 수 있다.   
> 다만 on-heap 메모리보다는 성능이 느리다.   

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

`Spark on Kubernetes 환경에서 사용시 spark.executor.memoryOverhead 를 20% 정도까지 증가 시키는 것을 
권장한다.`   
EMR Cluster의 경우 executor 메모리 사용량이 약간 초과하더라도 container의 여유 메모리를 사용하여 
조정을 하지만 Kubernetes에서 사용시 할당된 메모리 한도를 넘어서면 그 즉시 OOM Kill을 시키기 때문이다.   


일반적으로 Object의 읽기 및 쓰기 속도는 On-Heap > Off-Heap > DISK 순서로 빠르다.   

만약 spark.memory.fraction 비율을 너무 줄일 경우, spill이 자주 발생할 수 있다. 
즉 데이터를 저장할 공간이 부족해져 성능을 저해할 수 있다.   

> 따라서, 최초에는 default로 설정으로 진행 후, 이후에 모니터링을 통해 튜닝을 진행하는게 
일반적인 튜닝 방법이다.   

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

## 2. Spark 리소스 이슈 별 해결 방안    

#### GC overhead limit exceeded (OOM)

GC 시간이 너무 길어지면서 성능이 저하되고, 결국 GC overhead limit exceeded 오류가 발생한 경우이다.   
`spark executor가 계속해서 GC를 수행하느라 실제 작업을 거의하지 못하는 상태이다.`   

시도해 볼 수 있는 해결방법은 아래와 같다.   

- spark.executor.memory를 증가
- spark.executor.memoryOverhead 증가

`다만 Pyspark, Pandas UDF, 또는 많은 데이터 변환 과정에서 
Spark가 직접 관리하지 않는 메모리(Heap 영역 외) 에서 OOM이 
발생하는 경우는 오히려 spark.memroy.fraction 값을 낮추는게 효율적일 수도 있다.`    

#### OutOfMemoryError: Java heap space (OOM)   

JVM heap 메모리 부족으로 executor가 죽는 경우이며, 보통 executor memory 부족으로 인해 발생한다.   
할당된 메모리에 비해 executor에 처리하는 데이터가 너무 많은 경우 이기 때문에 아래와 같이 해결할 수 있다.  

- executor 메모리 증가(spark.executor.memory)   
- spark.memory.fraction 증가    
- 데이터 파티션 수를 증가(spark.sql.shuffle.partition)   

##### OutOfMemoryError: unable to create new native thread   

Spark의 Executor가 너무 많은 스레드를 생성하면서 네이티브 OS 리소스를 초과한 경우이다.   
executor가 너무 많은 작업을 동시에 처리하려고 하기 때문에 아래와 같이 해결할 수 있다.   

- spark.executor.cores 값을 줄인다.   


#### ExecutorLostFailure (executor 0 exited due to SIGKILL)   

OOM이 원인일 가능성이 있으며, Executor가 비정상적으로 종료되는 경우이다.   

해결 방법은 아래와 같다   

- spark.executor.memoryOverhead 값 증가 
- spark.memory.fraction 증가  

#### org.apache.spark.shuffle.FetchFailedException   

shuffle 과정에서 데이터 가져올 때 실패한 경우이며, 대량의 데이터를 shuffle 할 때 주로 발생한다.   

shuffle 과정에서 메모리 부족으로 spill 이 발생하며, executor가 죽는 케이스가 있을 수 있다.   
이런 경우 spark.shuffle.service.enabled 옵션이 비활성화 되어 있다면 executor 종료 시 shuffle 데이터가 
유실되어 가져오지 못할 수 있다.  

해결 방법은 아래와 같다.  

- spark.memory.fraction 을 늘려 execution memory를 확보 한다.  
- spark.shuffle.service.enabled=true 로 설정하여 executor 종료 후에도 데이터를 유지한다.   

- - - 

## 3. 적절한 Driver와 Executor 사이즈   

임의의 클러스터와 어플리케이션에 대해 최적의 설정을 바로 찾는 것은 
어려울 수 있다.    
여러 테스트를 진행해야 하며, 아래와 같이 잘못된 설정을 하게 되었을 때 
발생하는 문제점들을 확인하여 어떻게 설정을 수정해야 하는지 살펴보자.   


### 3-1) 다수의 작은 executor VS 소수의 큰 executor 

#### 3-1-1) 다수의 작은 executor 의 경우 발생할 수 있는 문제   

하나의 파티션을 처리할 자원이 충분하지 않을 수 있다.   
셔플을 하거나 균형이 맞지 않는 데이터를 캐시하거나 비싼 비용의 
transformation을 수행할 때 메모리 문제를 만나거나 디스크로 데이터가 
넘칠 우려가 있다.    

또한, 만약 executor가 하나의 core만 가지고 있다면 각 
executor에서 최대 하나씩의 태스크만 수행이 가능하며, 
    각 executor로 보내지는 broadcast 변수의 이점을 얻지 못한다.   

`spark 에서 어떤 데이터를 broadcast 했을 때 동일한 JVM(= 동일한 executor)의 
task들이 해당 데이터를 공유하는데 executor의 core가 1개라면 JVM을 공유하는 
장점이 사라지게되며 하나씩의 task만 순차적으로 처리한다.`         

`따라서 자원이 허용된다면, executor는 최소 4GB 이상으로 설정하는 것을 권장한다.`   

#### 3-1-2) 소수의 큰 executor 의 경우 발생할 수 있는 문제   

너무 큰 executor는 힙 사이즈가 클수록 GC가 시작되는 시점을 
지연시켜 Full GC로 인한 지연이 더욱 길어질 수 있다.    
executor 당 많은 수의 코어를 쓰면 동시에 스레드가 많아지면서 
스레드를 다루는 HDFS의 제한으로 인해 성능이 더 떨어질 수도 있다.   

`따라서 executor당 코어를 최대 5개로 하는 것을 권장하며, 이를 넘게 되면 
성능 향상에 도움되지 않으며 CPU 자원을 불필요하게 소모하게 된다.`  



- - - 

## 4. PySpark Memory and Arrow   

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

