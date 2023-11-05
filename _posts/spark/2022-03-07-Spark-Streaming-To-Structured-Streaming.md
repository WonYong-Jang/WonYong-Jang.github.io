---
layout: post
title: "[Spark] Structured Streaming 전환 하기"   
subtitle: "Migration Spark Streaming to Structured Streaming / Structured Streaming 과 Kinesis 연동 / checkpoint와 initialPosition"   
comments: true
categories : Spark
date: 2022-03-07
background: '/img/posts/mac.png'
---

이번 글에서는 현재 업무에서 사용하던 Spark Streaming을 
Structured Streaming 으로 전환 하는 과정에서 
trouble shooting을 정리해 보려고 한다.   

[Incident Review](https://wonyong-jang.github.io/spark/2023/07/09/Spark-Streaming-Processing-Delay.html)에서 
공유한 것처럼 잘못된 구조로 설계되어 있는 부분을 개선하면서 
성능 향상 및 DStream의 단점을 보완할 수 있는
[Structured Streaming](https://wonyong-jang.github.io/spark/2022/01/03/Spark-Structured-Streaming.html) 으로 전환하는 작업을 같이 진행하였다.   


> 현재 Spark Streaming은 AWS EMR Cluster(5.33.1 version) 에서 
실행하고 있으며 Spark version은 2.4.7, Scala version 2.11을 
사용 중이다.   

또한 Spark Streaming의 데이터 소스로는 AWS Kinesis를 통해 
데이터를 수집하고 있으며, [공식문서](https://spark.apache.org/docs/latest/streaming-kinesis-integration.html)를 
참고하여 구성하였다.   


- - -   

## 1. Spark Streaming과 Kinesis   

기존 Spark Streaming과 Kinesis 연동은 아래와 같이 진행하였다.   

```gradle
// https://mvnrepository.com/artifact/org.apache.spark/spark-streaming-kinesis-asl
implementation group: 'org.apache.spark', name: 'spark-streaming-kinesis-asl_2.11', version: '2.4.7'
```

```scala
import org.apache.spark.streaming.{Seconds, StreamingContext}

val ssc: StreamingConext = new StreamingContext(sparkContext, Seconds(10L))

val kinesisStream = KinesisInputDStream.builder
        .streamingContext(ssc)
        .streamName("stream_name")
        .endpointUrl(kinesisUrl)
        .regionName(region)
        .initialPosition([initial position])
        .checkpointAppName([Kinesis app name])
        .checkpointInterval([checkpoint interval])
        .storageLevel(StorageLevel.MEMORY_AND_DISK_2)
        .build()  
```

`checkpointAppName에서 파라미터(appName)는 checkpoint 저장을 위해 dynamoDB table을 
생성할 때 사용 된다.`     

또한 `initial position은 kinesis에서 데이터를 어디서 부터 읽어 올지 결정하는 옵션이다.`   
`여기서 중요한 점은 해당 옵션은 checkpoint가 기록되어 있지 않을 경우에만 적용되며, 
    checkpoint가 저장되어 있다면 해당 checkpoint 이후 데이터 부터 읽기 시작한다.`   

- LATEST: checkpoint가 저장되어 있지 않다면 가장 최근 데이터 부터 읽기 시작한다.   
    > 체크포인트가 없다면, 이전 데이터는 읽지 않기 때문에 data loss 발생할 수 있다.   

- TRIM_HORIZON: 체크 포인트가 저장되어 있지 않다면, 가장 이전(kafka 옵션의 earliest 과 동일) 데이터 부터 로드 한다.     
    > kinesis의 경우 default로 하루 전 데이터까지 저장하고 있으므로, 하루 전 데이터 부터 읽기 시작한다.   

- AT_TIMESTAMP: 지정된 시간 이후 데이터부터 로드한다.      

`여러 shard로 부터 데이터를 로드 할지라도 KinesisInputDStream은, 
    각 batch interval마다 하나의 RDD로 생성된다.`    


> Spark Streaming이 Kafka 등에서 여러 파티션을 통해 
데이터를 로드하게 되면, 각 batch interval 마다 파티션 개수만큼 RDD가 
생성되어 추가로 merge 를 통해 하나의 RDD로 만드는 작업이 필요하다. (Receiver 기반 
        스트리밍일 경우만 해당 되며, Direct 기반인 경우는 하나의 RDD로 생성된다.)      

KinesisRecordProcessor of Kinesis Client Library(KCL) 가 shard로 부터 
데이터를 가져오는 역할을 하게 되는데, 하나의 RDD로 합쳐 주는 역할을 한다.     

아래 [공식문서](https://spark.apache.org/docs/latest/streaming-kinesis-integration.html) 일부를 참고하자.    

- A single Kinesis input DStream can read from multiple shards of a Kinesis stream by creating multiple KinesisRecordProcessor threads.   

- - - 

## 2. Structured Streaming 과 kinesis    

<img width="800" alt="스크린샷 2023-11-05 오전 11 22 14" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/833e8554-0c15-4c49-8622-6cd23394c59f">   


현재 spark 버전으로 kinesis를 input source로써 사용할 수 있는 
라이브러리는 아래와 같다.   

```gradle
// https://mvnrepository.com/artifact/com.qubole.spark/spark-sql-kinesis
implementation group: 'com.qubole.spark', name: 'spark-sql-kinesis_2.11', version: '1.2.0_spark-2.4'   
```

단, 현재 기준으로 [qubole](https://github.com/qubole/kinesis-sql)는 
지원이 종료되었으며 spark 3.2 이상을 사용한다면 [roncemer](https://github.com/roncemer/spark-sql-kinesis)를 
사용하자.   

> 현재 spark 버전을 3.2로 upgrade 하기 위해서는 여러 dependency와 aws emr cluster 버전을 upgrade 해야 하기 때문에 
추후 진행 예정이다.   

### 2.1) Version Conflict   

기존 프로젝트에 위 라이브러리를 추가하고 kinesis와 연동 후 런타임 시 
jackson 버전 충돌 에러가 발생했다.   

```
Caused by: java.lang.RuntimeException: Jackson jackson-core/jackson-dataformat-cbor incompatible library version detected. 
You have two possible resolutions: 
1) Ensure the com.fasterxml.jackson.core:jackson-core & com.fasterxml.jackson.dataformat:jackson-dataformat-cbor libraries on your classpath have the same version number 
2) Disable CBOR wire-protocol by passing the -Dcom.amazonaws.sdk.disableCbor property or setting the AWS_CBOR_DISABLE environment variable
```

AWS SDK는 kinesis와 연동할 때 사용되는 json을 직렬화 하기 위해 CBOR 을 사용한다고 한다.    
이때, `qubole.spark 라이브러리 코드를 살펴보니, jackson version을 2.6.7을 사용하고 있으며 현재 프로젝트는 2.9.4 version을 사용하기 때문에 
충돌이 발생했다.`   

[qubole 코드](https://github.com/qubole/kinesis-sql/blob/2.4/pom.xml) 를 참고하자.   

<img width="576" alt="스크린샷 2023-10-15 오후 8 08 10" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/bea5a470-47a1-42b8-b5be-69ce2120c4b2">   

[링크](https://docs.gradle.org/current/userguide/resolution_rules.html)를 
참고하여 아래와 같이 jackson 의존성을 2.6.7을 사용하도록 고정했다.   

> build.gradle   

```groovy
configurations.all {
    resolutionStrategy.eachDependency { DependencyResolveDetails details ->
        if(details.requested.group == 'com.fasterxml.jackson.core') {
            details.useVersion '2.6.7'
        }
        if(details.requested.group == 'com.fasterxml.jackson.dataformat') {
            details.useVersion '2.6.7'
        }
    }
}
```

따라서, 현재 프로젝트 버전을 2.6.7로 downgrade 하여 해결했다. 
추후 spark version 3.2로 upgrade 진행할 때 [roncemer](https://github.com/roncemer/spark-sql-kinesis) 로 
전환하게 되면, jackson version 2.10 이상 버전을 같이 사용할 수 있음을 확인했다.   

strucutred streaming과 kinesis 연동은 정상적으로 되었지만, 테스트 과정에서 jackson version downgrade에서 
side effect 가 발생했다.   

jackson deserialize 하는 과정에서 date 컬럼 중에 nano second를 사용하는 컬럼이 
실제 날짜와 다른 결과값을 리턴했다.  

> 해당 버전에서 java8을 지원하는 jackson-datatype-jsr310이 포함되어 있지 않는 것 같다.      

따라서, 해당 컬럼은 custom deserialize를 이용하여 해결하였다.   

```scala
case class Meta
{
    @JsonDeserialize(using = classOf[ISODateDeserializer]   
    occurredAt: Timestamp
}
```

```scala
class ISODateDeserializer extends JsonDeserializer[Timestamp] {
    override def deserialize(parser: JsonParser, ctxt: DeserializationContext): Timestamp = {
        val stringDate = parser.getText.trim
        val time = DateTime.parse(stringDate)
        new Timestamp(time.getMillis)
    }
}
```


### 2-2) Checkpoint    

위의 코드와 같이 Spark Streaming 에서 
사용하던 KCL(Kinesis Client Library)은 DynamoDB에 checkpoint를 저장하도록 지원했다.   

`Spark Structured Streaming은 streaming query에서 checkpoint를 지정하기 위해 checkpointLocation 옵션을 사용 함으로써 저장할 수 있다.`     

```
resultDF
  .writeStream
  .outputMode("complete") 
  .option("checkpointLocation", "/usr/checkpoint")
  .format("console")
  .start()
  .awaitTermination()
```   

이때 주로 HDFS 또는 S3에 checkpoint를 저장한다.  


### 2-3) EMR Cluster 배포 시 에러(HiveExternalCatalog)   

로컬 테스트를 진행할 때 이상이 없었기 때문에 최종적으로 emr cluster에 structured streaming을 배포 하였지만, 
    아래와 같은 에러가 발생 했다.   

```
java.lang.ClassCastException: org.apache.spark.sql.catalyst.catalog.InMemoryCatalog cannot be cast to org.apache.spark.sql.hive.HiveExternalCatalog
```

Spark Streaming(DStream)에서는 hive가 사용되지 않았지만, Strucutred Streaming(DataFrame)은 
Spark SQL 기반이기 때문에 아래의 경우 hive를 사용한다.   

[링크](https://jaceklaskowski.medium.com/why-is-spark-sql-so-obsessed-with-hive-after-just-a-single-day-with-hive-289e75fa6f2b)를 
참고하자.   


이는 spark-submit command에 아래 명령어를 추가하여 해결하였다.  

spark.sql.catalogImplementation 옵션은 hive와 in-memory 옵션이 존재한다.   


```
--conf "spark.sql.catalogImplementation=hive"
```

### 2-4) ShuffleBlockFetcherIterator 에러 발생   

Strucutred Streaming 실행은 성공했지만, 특정 포트에 대해서만 아래와 같은 에러가 발생했다.      

```
ERROR shuffle.RetryingBlockFetcher: Failed to fetch block shuffle and will not retry ( 0 retries)
ERROR ShuffleBlockFetcherIterator: Failed to get block(s) from ip-192-168-14-250.us-east-2.compute.internal:7337

org.apache.spark.network .client.ChunkFetchFailureException: Failure while fetching StreamChunkId[streamId=842490577174,chunkIndex=0]: java.lang.RuntimeException: Failed to open file
```

[ERROR ShuffleBlockFetcherIterator: Failed to get block](https://repost.aws/ko/knowledge-center/emr-troubleshoot-failed-spark-jobs) 링크를 참고해보니, 워커 노드가 비정상 상태일 때 
발생할 수 있음을 확인했다.   

또한, [Amazon EMR 클러스터 탄력성에 따른 Spark 노드 손실 문제 해결 방법](https://aws.amazon.com/ko/blogs/korea/spark-enhancements-for-elasticity-and-resiliency-on-amazon-emr/) 도  
참고해보자.   

여러 [문서](https://www.waitingforcode.com/apache-spark/external-shuffle-service-apache-spark/read)를 리서치 해보니, 7337 port는 external shuffle 을 사용할 때 default port이며, 
    dynamic resource allocation을 적용하기 위해 아래 옵션을 추가했을 때 문제가 발생함을 확인했다.      

> spark.shuffle.service.port     

```
spark.dynamicAllocation.enabled=true
spark.shuffle.service.enabled=true
```

현재 spark version 2.x 버전에서 spark batch job이 아닌, streaming에서 dynamic resource allocation을 사용했을 때, 
    side effect가 발생할 수 있음을 확인했다.  

> 해당 옵션은 spark batch job에서 사용하기 최적화 되어 있는 것 같다.     

따라서 해당 옵션을 false로 변경한 후 해당 에러가 발생하지 않음을 확인했다.      

- - - 

## 3. Configuration  

#### 3-1) kinesis.client.describeShardInterval   

`kinesis의 shard 정보를 확인할 interval을 지정하는 옵션이며, default 1초 이다.`   

이때, [DescribeStream API](https://docs.aws.amazon.com/kinesis/latest/APIReference/API_DescribeStream.html)를 사용한다.    

`kinesis의 shard는 throughput 단위이며, 
    shard의 갯수가 증가 하거나 감소할 때 resharding이 발생한다.`       
`따라서, describeShardInterval 마다 어플리케이션은 kinesis stream의 변경을 체크하여, 
    각 shard들로 부터 읽어올 position을 결정한다.`      

> micro batch interval 10초로 지정했을 때, describeShardInterval은 
일반적으로 10초 ~ 60초 사이가 적당하다.    
> 하지만, 어플리케이션이 얼마나 자주 resharding이 발생하는지, 
    AWS API rate limit이 어느정도 되는지 또는 어플리케이션의 데이터 특성에 따라 달라질 수 있다.  

describeShardInterval 주기를 너무 짧게 설정하면 너무 자주 api를 호출하게 되고, 주기를 너무 길게 설정하면 
shard 변경에 대해서 대응이 늦어지게 되므로 데이터 처리 delay가 발생할 수 있다.   

> describeShardInterval 주기를 길게 설정하여도, kinesis 데이터 보관주기(default 1 day) 안에서는 
data loss는 없고, 처리 delay가 발생할 수 있다.   

따라서, 테스트 및 모니터링을 통해 적절한 주기를 설정해야 한다.   

```scala
val kinesisDataFrame = spark.readStream
  .format("kinesis")
  .option("streamName", "my-kinesis-stream")
  .option("endpointUrl", "https://kinesis.us-west-2.amazonaws.com")
  .option("region", "us-west-2")
  .option("awsUseInstanceProfile", "false")
  .option("kinesis.client.describeShardInterval", "10000") // Check for shard updates every 10 seconds
  .load()
```

#### 3-2) awsUseInstanceProfile   

`awsUseInstanceProfile의 default 옵션은 true이며, 이는 AWS EC2 인스턴스 프로파일을 이용하여 인증하는 방식이다.`   

```scala
.option("awsUseInstanceProfile", "false")
```

`현재 업무에서는 AWS Credentials file(~/.aws/credentials)을 사용하여 인증하는 방식이기 때문에 fals로 지정하였다.`  

#### 3-3) backpressure 관련 옵션   

```
.option("kinesis.executor.maxFetchTimeInMs", 1000)
.option("kinesis.executor.maxRecordPerRead", 10000)
.option("kinesis.executor.maxFetchRecordsPerShard", 100000)
```

- - - 

**Reference**    

<https://github.com/qubole/kinesis-sql>   
<https://github.com/roncemer/spark-sql-kinesis>    
<https://www.qubole.com/blog/kinesis-connector-for-structured-streaming>   
<https://www.qubole.com/blog/dstreams-vs-dataframes-two-flavors-of-spark-streaming>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

