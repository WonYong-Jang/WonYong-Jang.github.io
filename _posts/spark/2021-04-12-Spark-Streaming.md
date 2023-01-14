---
layout: post
title: "[Spark] 아파치 스파크(spark) 스트리밍 "
subtitle: "DStream(Discretized Streams) / stateful(window, state)"    
comments: true
categories : Spark
date: 2021-04-12
background: '/img/posts/mac.png'
---

이번에 살펴볼 내용은 단순히 주어진 데이터를 읽고 처리하는 것뿐만 아니라 
시간의 흐름에 따라 꾸준히 변화하는 데이터를 다루기 위한 것이다. 

`즉, 스파크 스트리밍에서 다루는 데이터는 하루 전 혹은 한달 전과 같이 과거에 
생성된 고정된 데이터가 아니라 현재의 미래에 꾸준히 변화되는 데이터를 대상으로 한다.`   

## 1. 실시간 스파크 스트리밍    

스트리밍이란 실시간으로 끊임없이 들어오는 데이터를 의미한다.    
`Spark Streaming이란 이렇게 실시간으로 들어오는 데이터를 처리하기 위한 
모듈이다. 이러한 스트리밍 데이터는 개발자가 지정한 단위의 시간동안 
들어온 데이터를, 마이크로 배치로 짧게 수행하여 처리를 한다.`   

> 실시간이란 상대적인 개념으로 요건에 따라 실시간의 범위가 정의 될 수 있다.   
> ex) 지난 2초 동안 평균 온도 산출 (슬라이딩 윈도우 기반)   

흔히 스트리밍 데이터라고 하면 끊임 없이 연속된 데이터를 의미하는 경우가 많다.   
예를들면, 시시각각 변하는 날씨 데이터라든가 웹 서버의 접속 로그와 같은 것들이 
스트리밍 데이터로 취급될 수 있다.   

<img width="809" alt="스크린샷 2021-04-12 오후 9 30 47" src="https://user-images.githubusercontent.com/26623547/114394652-67b2a680-9bd6-11eb-83fd-609d8756769e.png">     

스파크 스트리밍은 Kafka, Kinesis, HDFS/S3 등 다양한 소스로 부터 수집 할 수 있도록 제공한다.   
또한, 처리된 데이터를 파일 시스템, 데이터베이스로 수집하거나 대시보드로 
시각화 할 수 있다.   

<img width="599" alt="스크린샷 2021-04-12 오후 9 12 10" src="https://user-images.githubusercontent.com/26623547/114394973-caa43d80-9bd6-11eb-9338-d26e10669ec2.png">   

### 1-1) DStream(Discretized Streams)    

`스파크 스트리밍에서는 새로운 데이터 모델인 DStream을 사용하는데, 이름에 
포함된 Stream이라는 단어를 통해 알 수 있듯이 고정되지 않고 끊임없이 
생성되는 연속된 데이터를 나타내기 위한 일종의 추상 모델이다.`    

이렇게 연속된 데이터를 다루는 방법에는 다양한 해법들이 있을 수 있지만 
그 중에서 가장 직관적이고 자주 사용되는 방법은 일정한 시간 간격 사이에 
새로 생성된 데이터를 모아서 한번에 처리하는 방식이다.   

> 이 때 데이터를 처리하는 주기가 짧아질수록 소위 리얼타임이라 불리는 
실시간 처리에 가까운 상황이 되는데, 어느 정도의 주기(batch interval)로 데이터를 처리할지는 
각 시스템의 요구사항에 따라 달라질수 있다.      

`DStream의 경우에도 같은 방식으로 데이터 스트림을 처리한다. 일정 시간마다 
데이터를 모아서 RDD를 만드는데 이러한 RDD로 구성된 시퀀스가 바로 DStream이라고 
할 수 있다.`    

<img width="600" alt="스크린샷 2023-01-12 오후 5 57 34" src="https://user-images.githubusercontent.com/26623547/212022602-8d361b9c-723c-4c38-933f-bbad22c77bb5.png">   


DStream을 transformation 연산을 적용하면, RDD와 마찬가지로 새로운 DStream이 
생성되며, 동일하게 Immutable하다.    

`여기서 주의할 점은 각 batch interval간에 쌓인 데이터를 RDD로 만들어서 처리하는데, 
    이때 transformation과 action 작업이 모두 완료되고 난 이후 다음 배치 작업을 
    진행한다는 것이다.`   

보통 각 batch interval 작업이 완료되면 해당 RDD를 버리고 다음 batch interval에서 
생성된 RDD를 작업한다.    

> 물론, 이전 batch interval에서 사용한 RDD를 유지하기 위한 stateful한 함수도 제공한다.   

- - - 

## 2. 실습하기     

간단한 예제를 통해서 스파크 스트리밍 코드를 살펴보자.    
먼저, 스파크 스트리밍을 위한 의존성을 추가해줘야 한다.   
`그후 RDD와 데이터셋을 사용하기 위해 SparkContext와 SparkSession을 가장 먼저 생성해야 했듯이 스파크 
스트리밍 모듈을 사용하기 위해서는 StreamingContext 인스턴스를 먼저 생성해야 한다.`    

이때, 어떤 주기로 배치 처리를 수행할지에 대한 정보(batchDuration)를 함께 제공해야 한다.   

또한, `StreamingContext는 명시적인 시작(start)와 종료(stop), 대기(awaitTermination) 메서드를 가지고 있다.`       
즉, StreamingContext는 SparkSession이나 SparkContext와 달리 명시적으로 시작, 종료, 대기 등의 메서드를 
호출해서 시작 혹은 종료시켜야 한다.      


```groovy
implementation group: 'org.apache.spark', name: 'spark-streaming_2.11', version: '2.3.0'
```

#### 2-1) 예제 1    

아래 예제는 스파크 컨텍스트를 먼저 생성한 뒤 이를 스트리밍 컨텍스트의 인자로 전달해서 스트리밍 컨텍스트 인스턴스를 
생성하고 있지만 `new StreamingContext(conf, Seconds(3))과 같이 직접 SparkConf를 이용해서 생성하는 
것도 가능하다.`    

> StreamingContext는 내부적으로 SparkContext를 가진다.    

아래에서 사용한 RDD 큐는 RDD들을 구성하여 직접 DStream을 만들 수 있다.  
이 방식은 테스트 데이터를 만들고 DStream의 다양한 연산을 테스트하고 학습하는 
용도로 많이 사용한다.   

```scala 
val conf = new SparkConf()
conf.setMaster("local[*]")
conf.setAppName("RDDTest")
conf.set("spark.driver.host", "127.0.0.1")

val sc = new SparkContext(conf)
val ssc = new StreamingContext(sc, Seconds(3))  // 3초 간격 배치 처리   
val rdd1 = sc.parallelize(List("Spark Streaming Sample ssc"))
val rdd2 = sc.parallelize(List("Spark Queue Spark API"))
val inputQueue = mutable.Queue(rdd1, rdd2)
val lines = ssc.queueStream(inputQueue, true)
val words = lines.flatMap(_.split(" "))
words.countByValue().print()

ssc.start()  // 명시적으로 시작해야 스트리밍 시작   
ssc.awaitTermination() 
```

위 예제를 보면, `awaitTermination() 메서드를 호출해서 어플리케이션이 종료되지 않게 Block 하는 역할을 한다.`          
즉, 한번 시작하면 명시적인 종료 또는 에러가 없다면 어플리케이션이 임의로 종료되지 않아야 하기 때문이다.   

또한, 종료는 sparkStreamContext.stop() 메서드를 이용하면 된다.    
참고로 데이터 손실 없는 종료는 [링크](https://wonyong-jang.github.io/spark/2021/06/29/Spark-graceful-shutdown.html)를 
참고하자.   


#### 2-2) 예제 2     

아래와 같이 TCP 소켓을 이용해 데이터를 수신하는 경우 서버의 IP와 포트 번호를 
지정해 스파크 스트리밍의 데이터 소스로 사용할 수 있다.   

```scala 
val conf = new SparkConf()
conf.setMaster("local[*]")
conf.setAppName("RDDTest")
conf.set("spark.driver.host", "127.0.0.1")

val ssc = new StreamingContext(conf, Seconds(3))

val ds = ssc.socketTextStream("localhost", 9000) // IP, port 입력    
ds.print()

ssc.start()
ssc.awaitTermination()    
```

```
// 서버를 실행 후 netcat 서버에 문자열을 입력하면, 스파크 스트리밍 어플리케이션에 의해 
// 해당 문자열이 출력되는 것을 확인할 수 있다.   
$ nc -lk 9000
Hello, World!
```

- - - 


## 3. 데이터 다루기(기본 연산)

데이터를 읽고 DStream을 생성했다면 이제 DStream이 제공하는 API를 사용해 
원하는 형태로 데이터를 가공하고 결과를 도출해보자.   

#### 3-1) print()   

아래 예제를 통해 여러 api를 사용해보자.   

```scala
import org.apache.spark.streaming.{Seconds, StreamingContext}
import org.apache.spark.{SparkConf, SparkContext}

import scala.collection.mutable

object main {

  def main(args: Array[String]): Unit = {

    val conf = new SparkConf()
    conf.setMaster("local[*]")
    conf.setAppName("RDDTest")
    conf.set("spark.driver.host", "127.0.0.1")

    val sc = new SparkContext(conf)
    val ssc = new StreamingContext(sc, Seconds(3))
    val rdd1 = sc.parallelize(List("a", "b", "c", "c", "c"))
    val rdd2 = sc.parallelize(List("1,2,3,4,5"))
    val rdd3 = sc.parallelize(List(("k1", "r1"), ("k2", "r2"), ("k3", "r3")))
    val rdd4 = sc.parallelize(List(("k1", "s1"), ("k2", "s2")))
    val rdd5 = sc.range(1, 6)

    val q1 = mutable.Queue(rdd1)
    val q2 = mutable.Queue(rdd2)
    val q3 = mutable.Queue(rdd3)
    val q4 = mutable.Queue(rdd4)
    val q5 = mutable.Queue(rdd5)

    val ds1 = ssc.queueStream(q1, false)
    val ds2 = ssc.queueStream(q2, false)
    val ds3 = ssc.queueStream(q3, false)
    val ds4 = ssc.queueStream(q4, false)
    val ds5 = ssc.queueStream(q5, false)

    ds1.print()

    ssc.start()  // 명시적으로 시작해야 스트리밍 시작
    ssc.awaitTermination()
  }
}
```

`위 예제에서 print() 는 DStream에 포함된 각 RDD의 내용을 콘솔에 출력한다.`   
기본적으로 각 RDD의 맨 앞쪽 10개의 요소를 출력하는데, print(20)과 같이 
출력할 요소의 개수를 직접 지정해서 변경할 수 있다.   

#### 3-2) map(), flatMap()    

DStream의 RDD에 포함된 각 원소에 func 함수를 적용한 결과값으로 구성된 
새로운 DStream을 반환한다.    

```scala
val result: DStream[(String, Int)] = ds1.map((_, 1))
result.print()
```

```scala
val result = ds2.flatMap(_.split(","))
result.print()
```

#### 3-3) count(), countByValue()    


```scala
ds1.count().print()

ds1.countByValue()
```

- - - 

## 4. 데이터 다루기(고급 연산)   

기본적인 DStream은 RDD의 연속된 작업이다. RDD는 각 마이크로 배치를 위해서 
데이터가 담겨있다.   
기본적으로 각 RDD는 정해진 batch interval 간의 개별적으로 작업이 이루어진다.     
`하지만, 여러 RDD간의 stateful한 작업을 할 수 있는 연산도 제공한다.`   

아래 stateful한 연산들을 살펴보자.   

#### 4-1) window

아래 예제는 트위터의 데이터를 2초 간격(batch interval)으로 스트림 데이터를 
처리하고 있다.
2초간 쌓인 데이터를 RDD로 만들고, transformation연산을 통해 
해시태그만 추출 하여 다시 만든 RDD를 가지고 countByValue action연산을 진행한다.   

```
val tweets = TwitterUtils.createStream(ssc, None, filters)
val hashTags = tweets.flatMap(status => getTags(status)) // 트위터 상태에서 해시태그만 추출   
val tagCounts = hashTags.window(Seconds(8), Seconds(2)).countByValue() 
```

`위에서 window 연산이 8초로 되어 있는데, 2초 간격의 batch interval로 
진행되기 때문에 전체 RDD 4개를 window에 넣어두고 연산을 진행한다.`   

> window( window length, sliding interval )

<img width="700" alt="스크린샷 2023-01-13 오후 8 26 25" src="https://user-images.githubusercontent.com/26623547/212309836-0f51509e-b8d4-4fa6-ae14-4db59fc4bee1.png">    

즉, window의 연산의 첫번째 파라미터는 window 의 전체 크기이며, 두번째 파라미터는 
얼마나 미끄러져 갈건지에 대한 크기이다.  

<img width="700" alt="스크린샷 2023-01-13 오후 8 31 00" src="https://user-images.githubusercontent.com/26623547/212310640-07b01a1e-7580-477c-ba2f-0c0fff7c876e.png">    

<img width="700" alt="스크린샷 2023-01-13 오후 8 40 24" src="https://user-images.githubusercontent.com/26623547/212312203-a6eeb26e-9b60-4559-8149-272697b481a4.png">

`정리해보면, 2초 간격으로 RDD를 생성하여 해시태그를 추출하는 transformation 연산을 
하여 새로운 RDD를 생성하고 window 연산으로 과거 8초간 쌓인 RDD를 이용하여 countByValue 연산 
진행한다.`   

비슷한 연산으로 reduceByKeyAndWindow, countByWindow 등이 있고, window를 이용하는 것은 동일하며 
reduceByKey, countBy 등의 연산을 적용하는 것이다.  
`이때, 파라미터로 window length(duration)은 필수 값으로 추가해야 하며, 두번째 파라미터를 
넣지 않으면 default 값으로 DStream batch interval(SSC duration)로 적용된다.`   

만약, SSC duration은 2초이고, window(Seconds(12), Seconds(4))로 연산을 적용한다면 
아래와 같이 될 것이다.   
결과가 2초가 아닌 4초마다 한번씩 출력된다.   

<img width="800" alt="스크린샷 2023-01-13 오후 8 55 10" src="https://user-images.githubusercontent.com/26623547/212314805-3a1467b8-0c24-4b05-b9fc-f4c8af32c0d1.png">   

#### 4-2) state

Spark Streaming이 제공하는 state를 관리하는 api 중에서 
updateStateByKey를 살펴보자.    

`updateStateByKey는 key 별로 상태를 관리하는 api` 이며, User를 예로 들면 
UserId 별로 state를 계속해서 관리할 수 있다.   


```
moods = tweets.updateStateByKey(updateMood)
updateMood(newTweets, lastMood) => newMood
```

<img width="800" alt="스크린샷 2023-01-14 오후 4 57 59" src="https://user-images.githubusercontent.com/26623547/212462374-d6f4951e-2777-447b-9fcf-9ebeccfb4052.png">     

즉 위 예시에서 트위터에서 userId 별로 mood(state)를 계속해서 업데이트하면서, 
    지금 들어온 상태를 계속 유지한다.   

아래 또 다른 예제를 살펴보자.   
user 별로 요청 수를 확인한다고 할 때, updateStateByKey를 이용하여, 
     상태는 계속해서 update할 수 있다.   

t2 시점에 그 이전 시점에 유지하고 있던 RDD 데이터와 누적하여 상태값을 유지해 나간다.  

<img width="900" alt="스크린샷 2023-01-14 오후 5 06 19" src="https://user-images.githubusercontent.com/26623547/212462654-721e1abd-5887-40d7-9b39-240ddd111847.png">   
 




- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-programming-guide.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

