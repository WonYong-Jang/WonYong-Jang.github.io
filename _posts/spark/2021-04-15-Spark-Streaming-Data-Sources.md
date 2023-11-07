---
layout: post
title: "[Spark] Streaming Data Sources "
subtitle: "Kafka, Kinesis / Direct, Receiver Based Data Sources, Fault Tolerance / Backpressure"    
comments: true
categories : Spark
date: 2021-04-15
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming의 데이터 소스에 대해 살펴보자.   
아래와 같이 Spark Streaming에서는 기본적으로 제공하는 데이터 소스 부터, 
    라이브러리를 추가하여 사용할 수 있는 데이터 소스까지 존재한다.   

- Basic data sources   
    - Network socket  
    - Text file
- Advanced data sources   
    - Kafka   
    - Flume   
    - Kinesis   
    - Twitter, Akka, MQTT, ZeroMQ   
    - and more coming in the future   

- - -   

## 1. Receiver Based Data Sources    

대부분의 데이터 소스는 [receiver](https://wonyong-jang.github.io/spark/2021/04/14/Spark-Streaming-Fault-Tolerance.html) 기반으로 동작하고 있다.   

<img width="1000" alt="스크린샷 2023-07-23 오후 12 31 57" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/fd05b401-e1c6-48e7-b522-c2fedc0f57ea">    

외부에 있는 데이터 소스로 부터 receiver가 지속적으로 데이터를 
받아와서 rdd로 생성한다.   

> micro batch interval 마다 들어온 데이터를 모아서 rdd로 생성 하며 
rdd를 순서대로 처리하게 된다.  

receiver는 별도의 task로 실행되며, executor 안에서 core 1개(thread)를 잡고 
지속적으로 데이터를 받아온다.    

`중요한 것은 receiver는 읽어온 데이터를 rdd의 분산된 파티션(block 과 동일한 개념)으로 데이터를 
밀어 넣는다.`     

> rdd는 데이터 구분 단위는 파티션 단위이다.   

<img width="1000" alt="스크린샷 2023-07-23 오후 12 41 14" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/decc4440-75fc-4cea-a1a7-6d234fdeb71c">   

또한, `receiver는 데이터를 읽어오면 default로 다른 executor에 데이터를 replication을 진행한다.`   

> 장애가 발생했을 때 recomputation을 진행하기 위해서 복제를 진행한다.      

- - - 

## 2. Receiver Based Fault Tolerance   

만약 receiver 또는 receiver가 실행 중인 노드에 장애가 발생한다면 
어떻게 장애를 복구 할까?   

<img width="1000" alt="스크린샷 2023-07-23 오후 12 46 31" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/36a810ec-b409-430a-988e-7e137982ab2f">    

`Spark driver는 다른 executor에 receiver를 재시작하여 장애를 복구한다.`      
다시 생성된 receiver는 다시 데이터 소스로 부터 데이터를 읽어오게 된다.   

`여기서 중요한 것은 receiver가 죽고나서 다른 executor에 새로운 receiver가 생성될 때까지 들어온 데이터는 
잠재적으로 손실 가능성이 있다.`    


하지만, 데이터 소스에 따라(kafka, kinesis) 이러한 경우 장애를 복구할 수 있도록 제공하며, 
    해당 내용은 아래에서 더 자세히 살펴보자.   

> 또한, Spark Streaming에서 제공하는 Write Ahead Logs(WAL) 메카니즘을 통해 모든 데이터들을 HDFS 같은 파일 시스템에 
저장하여 데이터 손실을 막을 수도 있다.    

- - - 

## 3. Managing Incoming Data   

아래 Spark UI와 같이 batch interval을 10초로 설정했다고 가정해보자.   

데이터 소스로 부터 데이터를 읽어온 후 job을 생성하여 queue에 push 하게 된다.   
이때 데이터가 많거나 연산이 오래 걸려서 10초 이내에 작업을 
끝내지 못하면 다음 작업들이 queue에 계속 쌓이게 되어 지연이 발생한다.    

<img width="1000" alt="스크린샷 2023-07-23 오후 1 36 33" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/d0b87e06-dba3-4846-83f0-8f3501786be9">   

따라서, queue에 job들이 계속 쌓이지 않게 해야 하며 기본적인 방법은 리소스를 추가해야 한다.   
즉, executor 갯수를 늘리거나 cpu 또는 메모리를 증가 해야 한다.  

하지만, 무한히 리소스를 늘릴 수 없기 때문에 폭발적인 데이터가 발생했을 때 
데이터를 안정적으로 처리할 수 있어야 한다.   

### 3-1) Backpressure   

`만약 리소스를 더 늘리기 어렵다면 spark.streaming.backpressure.enabled=true 옵션을 추가하면 
batch interval 당 처리할 수 있는 데이터만 읽어와서 처리한다.`    

`따라서, queue에 계속해서 job들이 쌓이는 것을 방지할 수 있다.`      

> queue에 계속 job이 쌓인 다는 것은 spark 메모리에 계속해서 데이터를 저장하며, 
    다른 executor 메모리에 replication 까지 진행하게 되어 OOM이 발생할 수도 있다.    

처리 시간이 배치 간격보다 커지면 다음 배치 잡에서는 지연이 생기고 불안정해 진다.   
`따라서 불안정 상태가 지속되면 backpressure에 의해 입력율(input rate)를 줄여 
처리량과 처리 시간을 줄인다.`      

`즉, 스케줄링이 지연되기 시작하면 어플리케이션이 받을 수 있는 최대 메시지 개수를 
자동으로 조절한다. 하지만 사용자가 수동으로 설정한 maxRate 매개변수 값을 초과하지 않는다.`      

```
spark.streaming.backpressure.enabled=true
spark.streaming.backpressure.initialRate=100000

// 각 리시버 기반 입력 스트림에 유입되는 레코드 개수를 제한   
spark.streaming.receiver.maxRate=100000 (리시버 기반 커넥터에 사용)   
// 각 카프카 파티션에서 가져올 레코드 개수를 제한   
spark.streaming.kafka.maxRatePerPartition=20000 (카프카 다이렉트 커넥터에 사용)   
```   

하나의 예를 들어보면, 서버 부하 또는 하둡 클러스터 네트워크 문제로 클러스터에서 
레코드 처리가 굉장히 느려져서 배치 간격 보다 처리 시간이 길어져 레코드가 무한정 쌓이는 경우가 
발생할 수 있다.   
이때, backpressure 옵션을 true로 설정하면 클러스터의 배치간격과 처리시간에 따라 받아오는 
레코드의 수를 동적으로 조절하여 받아들인다.  

> 아래 사진을 보면 하둡 클러스터의 네트워크 문제로 인하여 스트리밍 어플리케이션이 영향을 받아 지연이 발생한 상태이다.   
> 지연이 발생되자 input size가 줄었다가 지연이 해소되자 다시 늘어나는 것을 볼 수 있다.   

<img width="1200" alt="스크린샷 2023-10-29 오후 10 50 06" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7d548a32-d062-4ff9-a7e3-3bafd66686db">      


- - - 

## 4. Spark Streaming with Kafka   

`Spark Streaming에서 kafka를 데이터 소스로 사용할 때 
아래와 같이 2가지 방식을 통해 데이터를 읽어 올 수 있다.`   

- Receiver based 
- Direct(receiverless)

### 4-1) Receiver based   

`위에서 설명한 것처럼 동일하게 receiver라는 별도의 task(thread)를 이용하여 
kafka topic에서 데이터를 읽어 온다.`   

<img width="1000" alt="스크린샷 2023-07-24 오후 11 46 20" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/83a695fc-0f9a-49cf-81c0-45ed2650b142">    

카프카는 토픽에 여러 파티션을 지원하며, receiver based 스트리밍은 여러 receiver를 
그림과 같이 설정할 수 있다.   

> 카프카는 여러 파티션을 통해 병렬로 전달해주는데, 스트리밍에서 receiver 1대로 
받아 오게 되면 병목이 발생할 수 있다.   
> receiver는 core 1개인 task로 실행되기 때문이다.   

`단, 중요한 것은 receiver 1대에서 하나의 rdd가 생성되며 receiver 2대를 사용하게 되면 
batch interval 마다 2개의 rdd가 생성된다.`   
`카프카의 토픽 파티션마다 receiver를 실행했기 때문에 batch interval에 여러 rdd가 
생성되며, 이를 한번에 처리하기 위해서는 DStream의 rdd들을 union 작업을 따로 해주어야 한다.`  

[Structured Streaming](https://wonyong-jang.github.io/spark/2022/01/03/Spark-Structured-Streaming.html)을 
사용하게 되면, 이러한 작업은 따로 고려하지 않아도 된다.   

### 4-2) Direct(also called receiverless)   

receiver를 사용하지 않는 방법은 아래와 같다.   

<img width="1000" alt="스크린샷 2023-07-25 오전 12 01 07" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7432c628-e278-4268-bc83-415f2c9c461e">    

`executor 별로 task를 띄우는데, 이때 카프카 토픽의 파티션 갯수와 동일하게 
설정하여 각 task가 카프카 토픽의 파티션을 처리하도록 하는 방식이다.`          
즉, 카프카 토픽의 파티션마다 task가 맡아서 처리를 한다.   

예를 들면 위처럼 rdd 0번째 파티션은 카프카 토픽의 0번 파티션과 맵핑되어 처리되며, 
    1번 파티션 또한 동일하게 맵핑되어 처리된다.   

> rdd 내에 파티션 1개는 1개의 task로 처리된다.    
> hdfs에서 데이터를 rdd로 읽어올 때, hdfs에서 10개의 block이 있다면 10개의 파티션으로 
이루어진 rdd가 생성되는 것과 동일하다.     

`이렇게 처리하다보니 자연스럽게 병렬로 처리가 되며 receiver가 필요없게 된다.`   

receiver 방식은 데이터를 읽어 와서 다른 executor 에 데이터를 replication 해놓는다.  
하지만, `해당 방식은 replication 하지 않고도 데이터 손실을 막을 수 있다.`   

> 카프카는 기본적으로 default 7일 정도 데이터를 저장하고 있기 때문에 장애가 발생했을 때 
spark에서 카프카에 저장된 이전 데이터를 다시 읽어 올 수 있다.   

`장애 발생시 task가 직접 다시 카프카 토픽의 파티션에서 이전 데이터를 가져온다.`   




- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-kinesis-integration.html>   
<https://velog.io/@och5351/%EB%8D%B0%EC%9D%B4%ED%84%B0-%ED%94%8C%EB%9E%AB%ED%8F%BC-%EC%9A%B4%EC%98%81-%EA%B0%9C%EB%B0%9C-Spark4-Pull-based-backpressure>   
<https://lucaskim.tistory.com/15>   


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

