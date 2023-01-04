---
layout: post
title: "[Spark] 아파치 스파크(spark) 스트리밍 "
subtitle: "DStream(Discretized Streams) / DynamicAllocation"    
comments: true
categories : Spark
date: 2021-04-12
background: '/img/posts/mac.png'
---


[이전글](https://wonyong-jang.github.io/bigdata/2021/02/22/BigData-Spark.html)에서 살펴본 내용은 
데이터가 있을 때 이 데이터를 어떻게 처리할 것인가에 대한 
내용이였으며, 이때 처리해야 할 데이터는 이미 어딘가에 준비돼 있던 것들이었다.   
즉, 우리가 작성한 프로그램은 '사전에 준비된' 데이터를 읽어들이는 것으로부터 
시작됐다고 할 수 있다.   

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
실시간 처리에 가까운 상황이 되는데, 어느 정도의 주기로 데이터를 처리할지는 
각 시스템의 요구사항에 따라 달라질수 있다.   

`DStream의 경우에도 같은 방식으로 데이터스트림을 처리해서 일정 시간마다 
데이터를 모아서 RDD를 만드는데 이러한 RDD로 구성된 시퀀스가 바로 DStream이라고 
할 수 있다.`    

<img width="839" alt="스크린샷 2023-01-04 오후 11 56 55" src="https://user-images.githubusercontent.com/26623547/210583050-61537d76-a3d5-42c6-b060-6c95aedbb918.png">    




- - - 

## 2. 실습하기     

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

위 예제를 보면, `awaitTermination() 메서드를 호출해서 어플리케이션이 종료되지 않게 했다.`       
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

## 3. Spark 설정   

#### 3-1) 동적 자원 할당 방식   

[동적 자원 할당 방식](https://spark.apache.org/docs/latest/job-scheduling.html#dynamic-resources-allocation)으로 상황에 따라 자원을 할당 및 회수할 수 있다.   
즉, executor 사용량이 적을땐 줄이고, 지연이 발생하거나 에러가 발생할 때 
늘리는 방식이다.   
dynamicAllocation 옵션을 사용할 때 항상 같이 사용하는 옵션이 spark.shuffle.service.enabled=true 옵션이다.   


```
spark.dynamicAllocation.enabled true
spark.shuffle.service.enabled true
spark.dynamicAllocation.minExecutors 50
spark.dynamicAllocation.maxExecutors 100
spark.dynamicAllocation.cachedExecutorIdleTimeout 600
```


- - - 

**Reference**    

<https://spark.apache.org/docs/latest/streaming-programming-guide.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

