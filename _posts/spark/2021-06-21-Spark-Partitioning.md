---
layout: post
title: "[Spark] 아파치 스파크 Partitioning"
subtitle: "RDD on a Cluster / Partiton 개수와 크기 정하기 / coalesce 와 repartition "    
comments: true
categories : Spark
date: 2021-06-21
background: '/img/posts/mac.png'
---


## 1. Partitoning 이란?   

`RDD의 데이터는 클러스터를 구성하는 여러 서버(노드)에 나누어 저장된다. 
이때, 나누어진 데이터를 파티션이라는 단위로 관리한다.`   

RDD의 파티션은 RDD 데이터의 일부(조각 또는 슬라이스)를 의미한다. 예를 들어 
로컬 파일 시스템에 저장된 텍스트 파일을 스파크에 로드하면, 스파크는 파일 내용을 
여러 파티션으로 분할해 클러스터 노드에 고르게 분산 저장한다.  

> 보통 파티션 하나당 하나의 스레드가 할당되어 처리된다.    

15줄짜리 텍스트 파일을 노드 다섯 개로 구성된 클러스터에 분산 저장해 
RDD를 구성한 예다. 15줄 짜리 파일이 노드 다섯 개에 분산되었으므로 
각 파티션에는 세 줄씩 저장된다. 스파크는 RDD별로 RDD의 파티션 목록을 
보관하며, 각 파티션의 데이터를 처리할 최적 위치를 추가로 저장할 수 있다.   

<img width="503" alt="스크린샷 2021-06-21 오후 5 00 47" src="https://user-images.githubusercontent.com/26623547/122727873-7b534b00-d2b2-11eb-869c-24218ec2fa60.png">    


HDFS를 사용하는 경우에는 기본적으로 HDFS 블록과 파티션이 1:1으로 
구성되지만 스파크 API를 사용하면 파티션의 크기와 수를 쉽게 
조정할 수 있다.   

이렇게 파티션의 크기와 수를 조정하고 파티션을 배치하는 방법을 
설정하여 RDD의 구조를 제어하는 것을 파티셔닝 이라고 한다.   

파티션의 크기나 수를 변경하느냐에 따라 어플리케이션의 성능이 
크게 변할 수 있으므로 스파크의 동작을 잘 이해하고 적절하게 
설정해야 한다.   

> 스파크에서 올바른 파티셔닝 방법을 선택하는 것은 일반적으로 프로그래밍에서 올바른 
자료구조를 선택하는 것과 같다.   

#### 파티셔닝에 고려해야할 사항   

파티셔닝이 모든 상황에 대해서 성능을 개선시켜주는 것은 아니다. RDD가 
단 한번만 스캐닝된다면 오히려 비효율적이므로 굳이 파티셔닝 할 필요가 없다.   

`파티셔닝은 조인 같은 키 중심의 Pair RDD연산에서 데이터 세트가 여러번 
재활용 될 때에만 의미가 있다.`   

파티셔닝은 앞서 언급한바와 같이 Spark의 성능에 
중요한 요소이다.    

파티션의 개수는 클러스터의 CPU 코어의 개수에 따라 결정이 되고, 
    파티션을 효율적으로 하게되면 parallelism 을 증가시키고, 
    Worker 노드의 bottleneck의 위험을 줄일 수 있다.    
또한, Worker노드 사이에 데이터 이동이 줄어들기 때문에 shuffling의 
cost도 절약할 수 있다.    
shuffling은 OOM(Out Of Memory)의 위험이 있기 때문에 최소한으로 동작하게끔 
하는게 중요하다.   

<img width="438" alt="스크린샷 2021-06-21 오후 5 22 03" src="https://user-images.githubusercontent.com/26623547/122730495-3da3f180-d2b5-11eb-9db9-f24c83d7797f.png">    

위의 그림에서 첫번째 그림의 클러스터 환경은 코어 개수가 3개이고, 4개의 
파티션을 만들었다.    
4000개의 record를 처리해야 한다고 할 때, 파티션이 4개이므로 1000개씩 분산되어 
저장했다고 가정하자.   
1000개를 처리하는게 하나의 task라고 하고 1시간이 소요된다고 가정했을 때, 
    이런 환경에서는 모든 task를 처리하기 위해 2시간이 소요될 것이다.   

동시에 처리할 수 있는 코어 개수가 3개이기 때문에 3개의 파티션을 먼저 처리 한 후 
하나의 task를 완료한 코어에 의해 나머지 파티션을 처리하기 때문이다.   
이렇게 처리하게 되면 나머지 2개의 코어는 1시간동안 1개의 코어가 하나의 
task를 처리하는 시간 동안 아무런 처리를 하지 않게 된다.   

그렇다면 파티션의 개수를 3개로 한다면 어떻게 될까?   

각 파티션이 처리해야 하는 task는 3개이고, 각 task는 1300여개의 records를 
처리해야 한다.    
기존에 1000개를 처리하는 것보다 처리해야 하는 양이 많아지지만, 한번에 
각 코어가 각 파티션을 처리가 가능하기 때문에 약 80분이면 모든 작업이 
완료 된다.   

`즉, 파티션의 개수는 spark에서 성능을 향상시키는데 중요한 요소이다. 2시간 
작업을 할 것인가. 파티셔닝을 잘해서 80분에 작업을 마칠것인가는 
개발자의 역량이다.`    

- - - 

## 2. spark.sql.files.maxPartitonBytes   

<img width="700" alt="스크린샷 2024-03-26 오후 11 44 28" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1aaff5d2-cab3-4ef5-b997-099b4ad67516">   

Spark는 기본적으로 spark.sql.files.maxPartitonBytes 값 (Default: 128 MB)을 
설정하면 이를 토대로 데이터를 끊어서 읽는다.   

하지만 실제 테스트를 진행해보면 그 결과가 다를 수 있다.   

실제 Spark 코드를 보면 아래와 같다.   

```scala
# sql/core/src/main/scala/org/apache/spark/sql/execution/datasources/FilePartition.scala

def maxSplitBytes(
    sparkSession: SparkSession,
    selectedPartitions: Seq[PartitionDirectory]): Long = {
  val defaultMaxSplitBytes = sparkSession.sessionState.conf.filesMaxPartitionBytes
  val openCostInBytes = sparkSession.sessionState.conf.filesOpenCostInBytes
  val minPartitionNum = sparkSession.sessionState.conf.filesMinPartitionNum
    .getOrElse(sparkSession.leafNodeDefaultParallelism)
  val totalBytes = selectedPartitions.flatMap(_.files.map(_.getLen + openCostInBytes)).sum
  val bytesPerCore = totalBytes / minPartitionNum

  Math.min(defaultMaxSplitBytes, Math.max(openCostInBytes, bytesPerCore))
}
```

- - - 

## 3. 파티션과 관련된 연산

### 3-1) foreachPartition, mapPartitons

RDD에서 제공하는 대부분의 연산들(map, filter..)등은 RDD 의 element 단위로 동작한다.   

> 여기서 element란, 한건 한건을 의미하는 단위로써 text file을 rdd로 만들었을 경우 default로 
한줄을 element로 지정한다.   

하지만, 파티션 단위로 작업을 하고 싶을 경우 해당 연산들을 사용하면 된다.   

- foreachPartiton, mapPartitions, mapPartitionsWithIndex   



### 3-2) coalesce와 repartition

`RDD를 생성한 뒤 filter() 연산을 비롯한 다양한 트랜스포메이션 연산을
수행하다 보면 최초에 설정한 파티션 개수가 적합하지 않은 경우가
발생할 수 있다. 이 경우 coalesce()나 repartition() 연산을
사용해 현재의 RDD 파티션 개수를 조정할 수 있다.`

`두 메서드는 모두 파티션의 크기를 나타내는 정수를 인자로 받아서 파티션의 
수를 조정한다는 점에서 공통점이 있지만 repartition()이 파티션 수를 
늘리거나 줄이는 것을 모두 할 수 있는 반면 coalesce()는 줄이는 것만 가능하다.`   

이렇게 모든 것이 가능한 repartiton() 메서드가 있음에도 coalesce() 메서드를 
따로 두는 이유는 바로 처리 방식에 따른 성능 차이 때문이다.   
즉, repartition()은 셔플을 기반으로 동작을 수행하는데 반면 coalesce()는 
강제로 셔플을 수행하라는 옵션을 지정하지 않는 한 셔플을 사용하지 않기 
때문이다.    
`따라서 데이터 필터링 등의 작업으로 데이터 수가 줄어들어 파티션의 수를 줄이고자 
할 때는 상대적으로 성능이 좋은 coalesce()를 사용하고, 파티션 수를 늘려야 
하는 경우에만 repartition() 메서드를 사용하는 것이 좋다.`    

즉, coalesce는 셔플링을 수행하지 않는 대신 데이터 이동을 최소화하려고 부모 RDD의 
기존 파티션을 최대한 보존한다.    

참고로 파티션이 몇개로 분할되어 있는지 파티션 수를 확인하려면 아래와 같이 가능하다.   

```scala
df.rdd.getNumPartitions   
df.rdd.partitions.length   
df.rdd.partitions.size   
```



Spark의 Task는 하나의 partition을 가진다.   
SparkContext의 parallelize를 실행해서 hadoop HDFS에 데이터를 저장할 때, 
    병렬(spark core) 개수만큼 파티션이 생긴다. 전문 용어로 level of parallelism이라 한다.    

> hadoop에서도 reduce 개수만큼 파티션 개수가 생긴다.   

HDFS에 저장할 용량이 크지 않다면 spark core 개수와 상관없이 하나의 
파티션 파일로 모아두는 것이 좋을 수 있다.   

이를 위해 repartiton 또는 coalesce를 사용할 수 있다.    

```scala
df.repartition(1).write.format('csv')
.option("path", "s3a://my.bucket.name/location")
.save(header = 'true')
```


- - - 

**Reference**    

<https://blog.devgenius.io/a-neglected-fact-about-apache-spark-performance-comparison-of-coalesce-1-and-repartition-1-80bb4e30aae4>   
<https://jaemunbro.medium.com/apache-spark-partition-%EA%B0%9C%EC%88%98%EC%99%80-%ED%81%AC%EA%B8%B0-%EC%A0%95%ED%95%98%EA%B8%B0-3a790bd4675d>   
<https://m.blog.naver.com/syung1104/221103154997>    
<https://thebook.io/006908/part01/ch04/02-01/>   
<https://ourcstory.tistory.com/147>    
<https://knight76.tistory.com/entry/scala-spark%EC%97%90%EC%84%9C-partition-%EC%A4%84%EC%9D%B4%EA%B8%B0-repartition-coalesce>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

