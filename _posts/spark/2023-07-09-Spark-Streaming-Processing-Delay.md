---
layout: post
title: "[Spark] Spark streaming processing delay (Incident Review)"   
subtitle: "Monitor Spark streaming applications on Amazon EMR / StreamingListener"    
comments: true
categories : Spark
date: 2023-07-09
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming을 이용하여 서비스 하면서 
최근 처리 지연 장애가 발생했고, 해당 장애에 대해 리뷰해 보면서 root cause와 
action item에 대해 살펴보려고 한다.    

- - - 

## 1. 서비스 구조 및 배경    

Incident review를 진행하기 전에 현재 서비스되고 있는 구조에 대해 
살펴보면 아래와 같다.   

실제 아키텍처는 더 복잡하지만 간략히 살펴보면, `AWS Event Bridge Event Bus를 통해 이벤트를 실시간으로
AWS Kinesis Data Stream에 보내주고 Spark Streaming이 이를 consume 하여  가공 후 documentDB에 저장한다.`     
그 후 여러 도메인들이 사용할 수 있도록 kafka를 통해 데이터를 publishing 한다.    

> Spark Streaming 처리 중 실패 데이터는 redis에 저장 후 배치를 통해 재처리를 진행하고 있다.    

<img width="900" alt="스크린샷 2024-04-03 오전 12 13 20" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/4a776d93-5c9e-4c16-90c6-3ee8d2d1cc56">


위의 그림에서는 EMR Cluster에 
Spark Streaming 인스턴스를 1대만 표시했지만 실제로 6 대의 인스턴스가 
도메인 별로 각각 수집되고 있다.   

이때, `6대의 Spark 인스턴스들이 하나의 DB를 사용하고 있었고, 논리적으로 database만 다르게 구분`하여 사용하고 있었다.  

그 당시 물리적으로 데이터 베이스를 모두 나누지 않은 이유는 비용과 데이터 건수에 있었다.     
6대 인스턴스 중 1대의 인스턴스만 요청 데이터가 많고, 나머지 인스턴스들은 
데이터 요청 건수가 현저하게 적었기 때문이다.   
따라서, 인스턴스 별로 emr 클러스터를 생성하고, 데이터베이스를 물리적으로 나누기에는 
비용 부담이 컸다.   

하지만 `문제는 데이터 요청 수가 증가함에 따라 데이터 베이스 부하가 심해졌고 
이로 인해 Spark Streaming 처리 지연이 발생하였다.`         

> 최근 개인정보 제거 작업으로 인해 DB 클렌징 배치가 실행 중이여서 DB 평균 CPU 보다 
높은 상태였고, 요청량 또한 2배 이상 증가하였다.   

Spark Streaming은 micro batch라는 개념을 통해, 정해진 시간 동안 쌓인 데이터를 
지속적으로 처리해 나간다.   
즉, micro batch를 10초로 정해놓으면 10초 동안 쌓인 데이터를 처리 후 그 다음 작업을 
계속 진행한다.   
하지만 DB 부하 등의 이유로 정해놓은 micro batch 시간내에 처리를 하지 못한다면 
그 다음 작업이 계속해서 지연되는 현상이 발생한다.   

아래는 Spark Streaming 모니터링 UI이며, Total Delay 메트릭에 지연시간을 확인할 수 있다.    

> 아래 그림은 실제 서비스 되고 있는 UI 그림은 아니며, delay가 발생한다면 해당 그래프가 
위로 치솟는 그래프가 만들어 질 것이다.      

<img width="859" alt="스크린샷 2023-07-09 오전 11 25 21" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/f78a3d63-9c81-4fe1-a22e-4f5b73ab0e2a">  

아래는 각 micro batch마다 실행시간 및 지연시간을 확인할 수 있으며, 
    장애 발생했을 때 10초로 정해놓은 배치시간이 3분이 넘게 처리가 지연됨을 확인했다.      

> 각 micro batch 처리 시간이 지속적으로 delay된다면 누적되어 데이터 처리가 더욱 지연될 것이고, 
    빠르게 데이터를 받아서 처리해야 하는 다운 스트림이 있다면 큰 장애로 이어 질 수 있다.   

<img width="1408" alt="스크린샷 2023-07-09 오전 11 25 52" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/7dcc00ba-a04f-4c59-9e78-dec5a3c70362">   


또한, 과거의 비효율적으로 작성된 코드로 인해 DB 부하가 더 심해졌고 
해당 장애가 redis까지 전파되었다.   

이제 해당 장애에 대해 root cause 를 자세히 살펴보자.   

- - - 

## 2. Root Cause    

### 2-1) 비 효율적으로 작성된 코드   

위에서 언급한 것처럼 최근 데이터 요청 수가 2배 이상 증가했고, 
    DB 클렌징 배치 작업으로 인해 DB 평균 CPU가 증가 함에 따라 DB 부하가 
    심해졌다.   

> 가장 요청 수가 많은 시간대에 documentDB cpu가 85%이상 증가하였다.   

하지만, 단순히 요청 건수가 증가한 것이 root cause가 아니라 
`요청 건수가 증가함에 따라 과거에 잘못 작성 했었던 코드들에 의해 
DB 부하가 심해진 것이 원인이였다.`       

그 중 하나는 아래와 같이 건 바이 건으로 데이터 조회 및 저장을 
하는 코드였다.   

아래와 같이 데이터 건수가 적었을 때 foreach를 돌면서 처리시 
문제가 없었지만 대량의 데이터를 처리할 때 처리가 지연됨을 확인했다.     

```java
@Transactional
public void save(Long key) {

    Dto dto = service.findByKey(key);

    //... Data processing operations

    service.save(dto)
}
```
따라서 위 코드를 조회와 저장을 각각 한번씩만 진행하도록 변경하였다.   

### 2-2) DB 조회시 timeout 설정   

다른 코드에서는 모두 DB 조회시 timeout을 최대 10초로 지정했었지만, 
    delay가 발생한 곳에서는 해당 설정이 누락되어 있었다.    

> 아래와 같이 Infinite duration으로 설정되어 있었다.   

```scala
Await.result(query, Duration.Inf)
```

DB 부하가 발생함에 따라 해당 코드에서 계속 커넥션을 잡고 있었던 
것이 또 하나의 root cause 였다.   
따라서, 다른 코드와 동일하게 timeout을 설정해 주었다.  

```scala
Await.result(query, Duration.create(10, TimeUnit.SECONDS)
```

### 2-3) 불필요한 Shuffle 발생   

Spark 에서 Shuffle은 일반적으로 데이터 집계같은 작업을 진행하였을 때 클러스터 노드의 
전체 데이터를 재분배하는데 사용된다.  

<img width="550" alt="스크린샷 2024-03-09 오후 3 48 10" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1bc87035-50b5-4a53-a460-b285fc27a1d6">   

`따라서 Shuffle은 클러스터 노드마다 데이터 재분배를 위해 중간 파일을 기록하고 읽으면서 
오버헤드가 발생하며 네트워크 비용이 발생하기 때문에 
Spark에서 비용이 많이 드는 작업 중 하나이며 성능에 상당한 영향을 미칠 수 있다.`   

`따라서 불필요한 Shuffle은 제거해야 하며 반드시 필요하다면 최소한으로 사용해야 한다.`     

현재 로직은 여러 노드를 이용하여 분산처리하는 과정에서 같은 id 데이터가 각각 다른 노드에서 동시에 
처리된다면 동시성 이슈가 발생할 수 있기 때문에 반드시 Shuffle이 필요했다.  
즉, 같은 노드에서 같은 id 값의 데이터들이 처리될 수 있도록 데이터 재분배하는 과정이 필요했지만 
마이크로배치 당 최대 3번까지 불필요한 Shuffle이 발생하고 있음을 확인했다.   

> reduceByKey를 사용하고 있었고, 이를 각 타입에 따라서 순차적으로 사용하고 있었다.  
> 즉, reduceByKey를 사용하여 Shuffle 진행 후 데이터 처리를 하고, 다른 타입의 데이터도 
동일하게 진행하여 최대 3번까지 Shuffle이 발생했다.   

따라서, 이를 리펙토링을 진행하여 마이크로배치에서 1번만 Shuffle이 진행되도록 수정하였다.   

- - - 

## 3. Action Item     

### 3-1) 처리 지연에 대한 알람 추가    

`장애가 발생했고, 가장 큰 문제점은 처리가 지연되고 있다는 알람이 존재하지 않아 인지가 늦었다는게 
가장 큰 문제였다.`     

> Spark Streaming 처리 건수가 지속적으로 0 이라면 알람을 받고 있었지만, 이번 장애는 처리는 진행 중이지만 delay가 발생한 것이 
문제였다.    

따라서, [Monitor Spark streaming applications on Amazon EMR](https://aws.amazon.com/ko/blogs/big-data/monitor-spark-streaming-applications-on-amazon-emr/)에서 
가이드 해준 것처럼 `SparkListeners`를 추가하여 delay가 있는지에 대한 알람도 추가해야 한다.      

`아래와 같이 StreamingListener를 상속받아 오버라이드 할 수 있다.`   

```scala
trait StreamingListener {
    // Called when the streaming has been started
    def onStreamingStarted(streamingStarted: StreamingListenerStreamingStarted) { }   

    // Called when a receiver has been started 
    def onReceiverStarted(receiverStarted: StreamingListenerReceiverStarted) { }

    // Called when a receiver has reported an error
    def onReceiverError(receiverError: StreamingListenerReceiverError) { }

    // Called when a receiver has been stopped 
    def onReceiverStopped(receiverStopped: StreamingListenerReceiverStopped) { }

    // Called when a batch of jobs has been submitted for processing 
    def onBatchSubmitted(batchSubmitted: StreamingListenerBatchSubmitted) { }

    // Called when processing of a batch of jobs has started.
    def onBatchStarted(batchStarted: StreamingListenerBatchStarted) { }

    // Called when processing of a batch of jobs has completed.
    def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted) { }

    // Called when processing of a job of a batch has started.
    def onOutputOperationStarted(
      outputOperationStarted: StreamingListenerOutputOperationStarted) { }

    // Called when processing of a job of a batch has completed. 
    def onOutputOperationCompleted(
      outputOperationCompleted: StreamingListenerOutputOperationCompleted) { }
}
```

`알람을 추가하기 위해 onBatchCompleted와 onReceiverError를 적용한 예제를 살펴보자.`      

##### onBatchCompleted   

- Total delay: 데이터를 전달 받고 처리가 완료될 때까지 걸린 총 시간이다.  
따라서, totalDelay는 배치를 처리하는데 걸린 시간(processingDelay)와 배치가 대기열에서 대기하는데 걸린시간(SchedulingDelay)의 합이다.   
    ```
    totalDelay = schedulingDelay + processingDelay
    ```

- Scheduling delay: 이전 배치 처리가 완료될 때까지 배치가 대기열에서 대기하는 시간이다. 즉 배치 처리가 준비된 시점과 
실제로 처리가 시작될 때까지 경과된 시간이다.    

- Processing delay: 실제로 배치를 처리하는데 걸린 시간이다.    

- Records: The number of records per batch    


`배치가 지연되고 있음을 확인하기 위한 모니터링 및 알람을 추가하기 위해서 schedulingDelay와 totalDelay를 이용하여 확인할 수 있다.`   
`totalDelay에서 schedulingDelay가 많은 비중을 차지하고 있다면, 배치가 지연되고 있음을 알 수 있다.`   

```scala
class StreamingCustomListener extends StreamingListener {
    override def onBatchCompleted(batchCompleted: StreamingListenerBatchCompleted): Unit = {

        val totalDelay: Long = batchCompleted.batchInfo.totalDelay.getOrElse(0L)
        val schedulingDelay: Long = batchInfo.schedulingDelay.getOrElse(0L)

        val delayRatio = (schedulingDelay.toDouble / totalDelay.toDouble) * 100
        if (delayRatio > THRESHOLD) {
            // Trigger your alarm here
            println(s"ALARM: Scheduling Delay Ratio Exceeded: $delayRatio%")
      }

    } 

    override def onReceiverError(receiverError: StreamingListenerReceiverError): Unit = {
    val executorId = receiverError.receiverInfo.executorId
    val lastError = receiverError.receiverInfo.lastError
    val lastErrorMessage = receiverError.receiverInfo.lastErrorMessage

  }
}
```   

```scala
val conf = new SparkConf().setAppName(appName)
val batchInterval = Milliseconds(10000)
val ssc = new StreamingContext(conf, batchInterval)

ssc.addStreamingListener(new StreamingCustomLister)     
```



### 3-2) 데이터 베이스 region 분리  

비용 등의 문제로 6개의 인스턴스가 하나의 데이터 베이스를 바라보며, 논리적으로 데이터 베이스만 다르게 
서비스 되고 있었다.   

`장애가 발생했을 때 가장 요청수가 많은 1대의 인스턴스에만 문제가 있었음에도 
불구하고 같은 DB를 사용하기 때문에 다른 인스턴스에도 일부 처리 지연이 동일하게 발생했다.`      

따라서 action item으로 점차 인스턴스 별로 region을 불리하여 물리적으로 데이터 베이스를 구분하는 작업을 
진행해야 한다.   


### 3-3) 재처리 구조 변경    

위에서 Spark Streaming 처리 중에 실패가 있을 경우 실패 건들을 redis에 저장 후
배치를 통해 재처리를 진행한다고 언급했다.

`기존에 실패 건들을 DB가 아닌 redis에 저장 했었던 이유는 성능 이슈 때문이였다.`
기존에 간헐적으로 Spark Streaming 에서 documentDB 저장 시 timeout이 발생했고,
    대량의 데이터를 백필하는 경우 더 자주 발생했다.

이때, 실패한 대량의 데이터 재처리를 위해 다시 한번 DB에 저장하기에는 성능상 이슈가
있었기 때문에 redis에 잠시 저장 후 배치를 통해 재처리하는 방식을 선택했다.

하지만, `이러한 재처리 방식이 장애가 발생하고 해당 장애가 redis 까지 전파 되는
원인이 되었다.`

`db 부하가 발생하였고, 대량의 데이터가 지속적으로 실패하여 redis에 쌓이게 되었다.
따라서 해당 장애로 인해 redis의 cpu 및 memory가 피크를 쳐서 장애가 전파 되었다.`

`따라서, redis는 캐시 용도로만 사용하고 Spark Streaming 에서 실패한 건들은 kafka로 흘려서
따로 재처리를 처리하도록 변경하였다.`      

### 3-4) DB 저장 방식 변경   

현재 Spark Streaming에서 데이터를 수집 및 가공하여 DB에 직접 저장하고 있다.   
위에서 DB 저장시 비효율적인 코드를 개선하였지만, 데이터 볼륨이 증가할 수록 마이크로 배치마다 
DB에 저장되기 때문에 부하는 점차 증가할 것이다.   

> 현재 마이크로 배치마다 여러 테이블을 조회 및 저장을 나눠서 진행하고 있다.     

`따라서, 근본적으로 해결하기 위해 Spark Streaming에서 직접 DB에 저장하는 것보다 
kafka를 통한 저장 방식으로 변경하여 Spark Streaming 에서 많은 데이터를 처리할 때 
병목현상을 줄일 수 있다.`    

<img width="626" alt="스크린샷 2024-03-10 오후 2 42 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/9c5083f1-5cc5-4b66-bcc8-a31a82a37b7e">   


실제로 이력 데이터는 DB 저장이 필요 없기 때문에 DB 저장을 
제외하고 kafka를 통해 hive에 저장하는 방식으로 
변경하였고, 스트리밍 성능이 많이 향상 됨을 확인하였다.   

- - - 

## 4. 마무리    

이번 장애로 인해 Spark Streaming에서 가공한 데이터를 전달 받아 빠르게 처리 되어야 하는 도메인들이 영향을 받았다.   
또한, 잘못된 설계로 인하여 장애가 redis까지 전파되었고, kr 인스턴스의 장애가 다른 region의 인스턴스까지 
전파되었다.   

> 물론 그 당시에는 최선의 선택 이였을 수 있지만 현재 기준으로는 개선해야 하는 구조이다.   

따라서, 위에서 언급한 root cause와 이에 따른 action item들을 정리했고  
    action item을 하나씩 작업하여 개선해 나가야 될 것 같다.   


- - - 

**Reference**   

<https://aws.amazon.com/ko/blogs/big-data/monitor-spark-streaming-applications-on-amazon-emr/>    
<https://github.com/apache/spark/blob/v2.4.4/streaming/src/main/scala/org/apache/spark/streaming/scheduler/StreamingListener.scala#L70>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

