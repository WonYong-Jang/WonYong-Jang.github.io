---
layout: post
title: "[Spark] (Structured) Streaming Checkpointing "
subtitle: "Spark Streaming과 Structured Streaming Checkpoint, S3 를 checkpoint 로 사용하여 구현"    
comments: true
categories : Spark
date: 2021-04-17
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming과 Structured Streaming 사용할 때 장애 복구를 위해 사용 되는 
checkpointing 에 대해 자세히 살펴보자.      

- - -    

## 1. What is RDD checkpointing?   

`체크포인트란 rdd에 있는 데이터를 디스크에 기록하는 것이며 
기록이 필요한 이유는 실패했을 경우에 복구를 위해 필요하다.`   

기본적으로 rdd는 아래와 같이 rdd graph(lineage) 정보를 가지고 있으며, 
    연산 중 실패했을 경우 rdd graph 정보를 가지고 
    처음부터 다시 연산 및 복구를 한다.   
`하지만 rdd graph 에서 연산들이 너무 많고 연산 비용이 크다면 
중간에 checkpointing 을 이용하여 디스크에 기록해 둘 수 있다.`   
`따라서, 처음 부터 연산할 필요 없이 기록한 부분부터 연산이 가능하다.`       

<img width="800" alt="스크린샷 2023-07-25 오후 11 33 48" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/79ebf8a6-bf54-402b-9a52-f2a600c178bb">   

`주의해야할 부분은 checkpointing을 로컬 디스크에 기록을 한다면  
    문제가 발생할 수 있다.`       
`노드 전체가 장애가 발생한다면 이를 복구하지 못하기 때문에 
    보통 hdfs 같은 분산 파일 시스템에 저장한다.`     

그러면 checkpointing에 어떤 내용을 기록할까?    

- - -    

## 2. Spark Streaming(DStream) Checkpoint    

아래와 같이 2가지 타입을 기록한다.   

#### 2-1) Metadata checkpointing   

`Metadata는 Driver가 실패했을 경우에 복구를 위한 데이터이다.`   

> 즉, Spark streaming을 구동하기 위한 metadata 정보들이다.   

네트워크 또는 디스크 등의 여러 이유로 Driver에 장애가 발생하는 경우 또한,  
이전에 처리했던 부분 부터 다시 처리를 해야할 것이다.    

- Configuration: 스트리밍 어플리케이션을 구동하기 위해 사용되는 configuration 정보들이 필요하다.      

- DStream operations: DStream을 통해 어떤 연산들을 진행했는지에 대한 정보들이 필요하다.

    > lineage 정보들을 가지고 있다.   

- Incomplete batches: 가장 중요한 정보이며 장애가 나기 전에 수행을 완료하지 
못한 queue에 쌓여있는 job 정보들이다.   

`따라서 Driver가 장애가 발생하면 위의 정보들을 이용하여 
스트리밍을 재기동을 하며 이전에 완료하지 못했던 job들 부터 
처리하기 시작한다.`   

#### 2-2) Data(RDD)     

`두번째는 실제 RDD에 들어있는 데이터들이다.`        

DStream은 각각 batch interval 별로 가지고 있는 RDD를 
transformations 작업들을 진행 후 output 작업까지 진행하게 되면 
RDD의 데이터들은 더 이상 필요가 없다.   

즉, 메모리에서 더 이상 필요가 없기 때문에 제거하게 된다.   

`하지만 Stateful 연산들은 여러 batch interval에 걸쳐서 연산을 해야 하기 때문에 
위의 경우와 다르다.`      

> ex) updateStateByKey, reduceByKeyAndWindow(inverse function 일 경우만 기록이 된다)   

`stateful 연산들에 대해서는 checkpointing 에 기록이 되어야 장애가 발생했을 때 
최근 state 값을 이용하여 이어서 작업이 가능하다.`   


stateful한 연산들에 대해서는 checkpointing에 기록을 안한다면 어떻게 될까?   

만약 아래 그림과 같이 stateful한 연산을 이용하여 
작년 1월 부터 state를 관리하고 있다고 가정해보자.   

<img width="1000" alt="스크린샷 2023-08-25 오전 12 27 05" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3a3df6d1-96bc-4a45-b768-8cbb808120d5">   

이때 장애가 발생한다면 작년 1월부터 연산을 recomputation을 진행해야 할 것이며, 
    장애 복구하는데 너무 많은 비용이 들 것이다.    

<img width="500" alt="스크린샷 2023-08-25 오전 12 32 04" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/5fa1f511-483d-4a58-b6da-71efd43bbc27">   

`따라서, stateful한 연산들은 위 그림과 같이 주기적으로 checkpointing을 기록해 
두는 이유이다.`       

여기서 그럼 checkpointing을 사용할 때 고민해야 할 사항들이 있다.   

checkpointing 기본적으로 hdfs와 같은 디스크에 기록하기 때문에 비용 든다.  

> 장애가 발생했을 때 로컬 디스크 또는 메모리 모두 사용할수 없기 때문에 이를 이용하는 것은 의미가 없다.   

`따라서 checkpointing 주기를 너무 짧게 설정한다면, 성능에 영향이 있을 수 있다.`   

`반대로 checkpointing 주기를 너무 길게 설정한다면, 장애가 발생했을 때 많은 비용이 들어가게 된다.`   

그렇기 때문에 tradeoff를 고려하여 스트리밍에 가장 적합한 checkpointing 주기를 찾아서 설정해야 한다.   

> 권장사항은 보통 10초 주기이지만 스트리밍의 성격 및 비지니스 등을 고려했을 때 달라질 수 있다.     

#### 2-3) commit   

Kafka와 같은 source를 사용할 때, 해당 디렉토리에 commit된 offset 정보들이 저장된다.    

- - - 

## 3. Strucutred Streaming Checkpoint     

Structured Streaming을 checkpoint를 설정하면 checkpoint 폴더 내에 아래와 같은 파일들이 생성된다.   


#### 3-1) commit     

완료된 batchId가 저장되며 Spark Streaming과 동일하게 kafka, kinesis 와 같은 source를 사용할 때 commit된 
offset들이 저장된다.   

> commits/0, commits/1 이러한 형태로 파일이 저장된다.      

#### 3-2) metadata   

schema of the output, batch timestamp, version of the query 등의 정보가 저장된다.   

#### 3-3) offsets   

offsets안에 batchId가 존재하며, 실제 offsets 정보들이 저장된다.      

> micro batch 마다 batchId가 생성되며, start offset과 end offset 정보를 포함한다.   

#### 3-4) sources      

데이터 소스에 대한 정보들이 들어있다. 예를 들면, kafka 의 topic 파티션 정보 등이 있다.   

#### 3-5) state   

stateful 처리 로직에 의해 생성된 state에 대한 정보들이 저장 된다.        

> aggregations, mapGroupWithState 등의 연산을 예로 들 수 있다.    

- - - 

## 4. S3를 Checkpoint로 사용하여 구현하기   

```scala
val credentialProvide = if("local".equals(profile)) {
    "com.amazonaws.auth.profile.ProfileCredentialsProvider"
} else {
    "com.amazonaws.auth.InstanceProfileCredentialsProvider"
}

builder
    .config("fs.s3a.aws.credentials.provider", credentialProvide)
    .config("fs.s3a.impl", "org.apache.hadoop.fs.s3a.S3AFileSystem")
```

- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-kinesis-integration.html>   
<https://www.waitingforcode.com/apache-spark-structured-streaming/checkpoint-storage-structured-streaming/read>   
<https://charsyam.wordpress.com/2021/03/08/%EC%9E%85-%EA%B0%9C%EB%B0%9C-kafka-%EC%99%80-spark-structured-streaming-%EC%97%90%EC%84%9C-checkpoint-%EC%97%90%EC%84%9C-%EC%95%84%EC%A3%BC-%EA%B3%BC%EA%B1%B0%EC%9D%98-offset%EC%9D%B4-%EC%9E%88/>   
<https://charsyam.wordpress.com/2021/03/09/%EC%9E%85-%EA%B0%9C%EB%B0%9C-spark-structured-streaming-%EC%97%90%EC%84%9C-offset-%EC%9D%80-%EC%96%B4%EB%96%BB%EA%B2%8C-%EA%B4%80%EB%A6%AC%EB%90%98%EB%8A%94%EA%B0%80%EC%95%84%EC%A3%BC-%EA%B0%84/>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

