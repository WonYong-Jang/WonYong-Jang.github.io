---
layout: post
title: "[Spark] Custom Spark History Server 구성하기"
subtitle: "분석 플러그인 DataFlint 추가 및 eventLog 리텐션 기간 변경 / multi-tenant history server 지원 여부 / spark.history.fs.logDirectory, spark.eventLog.dir" 
comments: true
categories : Spark
date: 2026-01-20
background: '/img/posts/mac.png'
---

Spark History Server는 Spark 어플리케이션에서 발생한 eventLog를 기반으로 하여 Spark Web UI에서 
실행 이력을 시각적으로 분석할 수 있는 도구이다.   

`기본적으로 Spark 어플리케이션이 실행 중에는 Spark Web UI 에서 메트릭 정보를 확인할 수 있지만 어플리케이션이 
종료된 이후에는 확인이 불가능하다.`   

`Spark 어플리케이션이 실행 중일 때는 Driver 메모리에 모든 실행 상태를 실시간으로 알고 있고, 그 상태를 HTTP 서버로 노출하기 때문에 
확인 가능하지만 어플리케이션이 종료되면 메모리가 정리되면서 메트릭 정보들을 확인할 수 없게 된다.`         

spark.eventLog.enabled=true 로 설정을 하고 eventLog를 저장한다면, 어플리케이션 종료 후에도 Spark History Server UI를 통해서 
메트릭 정보를 확인 가능하다.    

`여기서 eventLog를 write 하는 주체는 Spark Driver 가 진행한다.`   

> 더 정확히는 SparkContext가 생성될 때 EventLoggingListener 가 생성 및 등록되어 write하게 된다.  

UI 에는 작업의 실행 시간, 자원 사용량, 작업의 내부 Flow 등이 포함되어 있기 때문에 어플리케이션에 
문제가 있을 때 이 정보를 바탕으로 큰 도움을 받을 수 있다.   

현재 업무에서 전사 공용으로 Spark History Server를 사용하고 있고, 모든 팀의 Spark 어플리케이션에서 생성된 
eventLog가 HDFS의 동일한 경로에 적재되는 구조 였다.      
이를 팀 내의 어플리케이션에서 발생한 eventLog만 따로 관리하여 
운영할 수 있도록 Spark History Server를 새롭게 구성하였고 이 과정에서 어떤 장점이 있는지와 어떤 절차를 통해 구성했는지 공유하려고 한다.    

- - - 

## 1. 전사에서 공용으로 사용하는 Spark History Server   

기존에는 모든 팀들의 eventLog를 관리하는 Spark History Server를 사용 했고, 모든 팀들의 Spark eventLog가 쌓이기 때문에 
운영 부담을 줄이기 위해 짧은 retention 기간을 가져가야만 했다.   
그 결과, 과거 어플리케이션 트래킹에 대한 어려움이 발생했고, [DataFlint](https://github.com/dataflint/spark)와 같은 분석 플러그인을 추가하려면 
플랫폼팀 Dependency도 발생하였다.   

> Spark History Server 를 실행시 해당 플러그인 추가 작업을 플랫폼팀에서 진행해 주어야 하기 때문에 
각 팀에서 자율적으로 분석 도구를 추가하거나 실험하기 어려운 구조였다.   

또한 최근 [MCP for Spark History Server](https://wonyong-jang.github.io/spark/2025/10/06/Spark-History-Server-MCP.html) 도입을 고려하고 있고, 
전사에서 사용하는 Spark History Server를 바라보고 분석을 하게 되면 다른 팀의 Spark 어플리케이션 eventLog까지 함께 노출되기 때문에 
분석 대상 어플리케이션을 식별하고 필터링하는데 어려움이 발생하였다.   

`Spark History Server는 기본적으로 아래와 같이 1개의 디렉토리만 스캔하며, 
      각 팀별로 폴더를 나눠서 ACL을 관리하는 등의 multi-tenant 는 지원하지 않는다.`     

```
spark.history.fs.logDirectory=hdfs:///spark-history
```

multi-tenant에 대한 지원은 [SPARK-45126](https://issues.apache.org/jira/browse/SPARK-45126)에 등록이 되어 있지만 현재 기준으로 진행되고 있지 않고 있다.    

> multi-tenant history server란 여러 팀이 하나의 history server를 공유하되, 각 팀은 자기 팀의 eventLog와 application만 볼 수 있어야 하고, 다른 팀 로그는 존재 자체도 보지이 않아야 하는 구조가 되어야 한다.   

아래와 같이 폴더를 나눠도 기본적으로 Spark History Server는 root-directory 부터 재귀적으로 모두 읽어서 표기한다.   

```
/spark-history/
    teamA/
    teamB/
```

Spark 의 코드를 살펴보면, [ACL 로 접근 제어하는 코드](https://github.com/apache-spark/spark/blob/master/core/src/main/scala/org/apache/spark/deploy/history/FsHistoryProvider.scala#L164)를 살펴볼 수 있는데 이는 단순하게 UI 접근제어이다.    
이는 Spark History Server UI 에서 특정 사용자만 Spark Web UI 페이지에 접근 가능하도록 제한할 수 있는 기능이다.   

`즉, 우리가 원하는 것은 각 팀별로 발생하는 eventLog는 자신의 팀의 eventLog만 확인 가능하며, 다른 팀의 eventLog는 볼 수 없는 것을 기대했지만 
위 옵션을 사용하더라도 기본적으로 Spark History Server는 단일 디렉토리내에 모든 eventLog를 표기해주게 된다.`   

> 위 옵션으로 ACL 제한을 하면 모든 eventLog는 표기되며 Spark Web UI를 보기 위해 클릭할 때만 접근 제한을 한다.   

`따라서 팀내에서 발생하는 eventLog를 따로 관리하고 Spark History Server에 필요한 분석 플러그인을 유연하게 추가 할수 있도록 
서버를 직접 구성하여 운영하는 방향으로 결정하였다.`      

- - -

## 2. DataFlint 분석 플러그인    

[DataFlint](https://github.com/dataflint/spark) 는 Spark Web UI와 History Server를 통해 
다양한 메트릭을 시각적으로 보여주어 문제를 직관적으로 파악할 수 있게 도와주는 도구이다.   

`DataFlint 은 human readable UI 를 제공하며 disk spill, data skew 등과 같은 performance issue에 대해서 
직관적으로 확인할 수 있는 점이 가장 큰 장점이다.`      

> 기존의 Spark Web UI 에서 disk spill이 발생하는 구간을 확인하기 위해서는 각각 stage를 클릭해보며 확인해야 되지만, DataFlint 는 
전체 Flow를 보여주며 어떤 작업을 진행하면서 spill이 발생하는지 확인이 가능하다.   

> 또한, 데이터를 읽고 쓰는 과정에서 small file 로 진행중이라면, 이를 사전에 alert로 제공하여 인지할수 있도록 한다.    

`어플리케이션의 Memory Usage, Idle Cores, Task Error Rate 등과 같이 
중요한 메트릭 정보를 요약하여 전달해주는 장점도 존재한다.`       

`다만, DataFlint에서 아쉬운 부분은 Rest API를 제공하지 않는다는 점이다.`    

> Rest API가 제공된다면, 팀내에 전체 어플리케이션들을 모니터링하면서 문제가 발생한 
어플리케이션에 대해서 알람을 주어 자동화 할 수 있을 것 같았지만 현재는 Spark Web UI에서 DataFlint 탭을 
통해서만 모니터링해야 했다.  
> 아쉬운 부분에 대해서는 MCP와 AI Agent 등을 같이 적용하면 해결할 수 있다.   

따라서, Spark History Server 에서 DataFlint 분석 플러그인을 추가하고, MCP 서버가 
Spar History Server를 바라보고 분석할 수 있는 구조를 고려하여 개발을 진행하였다.   

- - -   

## 3. spark-submit 옵션 추가    

### 3-1) eventLog 저장 경로 분리   

spark-submit 할 때, 아래 설정을 통해 팀 전용 eventLog 저장 경로로 로그를 기록하도록 한다.   

```scala
spark.eventLog.enabled=true 
spark.eventLog.dir=s3a://<team-bucket>/event-logs 
// s3 인증을 위한 설정 추가
```

### 3-2) eventLog 압축   

`Spark 4.0 부터 spark.eventLog.compress 의 기본값이 true로 변경되었지만 그 이전 버전이라면 아래와 같이 
명시적으로 추가해주어야 한다.`   

```scala
spark.eventLog.compress=true 
spark.eventLog.compression.codec=zstd
```

### 3-3) DataFlint 플러그인 추가   

Spark 가 실행중일 때도 DataFlint 탭을 확인하기 위해서는 spark-submit 할 때도 추가해주어야 한다.   

```java
spark.plugins=io.dataflint.spark.SparkDataflintPlugin
spark.jars.pacages=io.dataflint:spark_2.12:0.8.2
```

### 3-4) spark.yarn.historyServer.address   

`YARN 환경에서 사용 중이라면 해당 옵션을 이용하여 신규로 생성된 spark history server url을 전달해 주어야 한다.`      
이 옵션은 Spark 어플리케이션의 history server 위치를 spark 에게 알려주는 설정 옵션이다.   

```
spark.yarn.historyServer.address=http://spark-history.mycompany.com:18080
```


- - - 

## 4. Spark History Server 설정    

위에서 변경한 eventLog 경로를 Spark History Server가 로드할 수 있도록 아래 설정을 추가해준다.   

```scala
spark.history.fs.logDirectory=s3a://<team-bucket>/event-logs
// s3 인증을 위한 설정 추가
```

`또한, eventLog는 적절한 retention 기간을 설정하여 주기적으로 정리해주어야 한다.`       
`s3를 사용하기 때문에 lifecycle 기능을 이용하여 정리하는 방법과 아래와 같이 spark 옵션을 사용하여 
정리해주는 방법이 있다.`      

```scala
spark.history.fs.cleaner.enabled=true 
spark.history.fs.cleaner.maxAge=7d 
spark.history.fs.cleaner.interval=1d
```

`하지만, s3와 같은 object storage를 저장소로 사용할 때는 s3 lifecycle을 이용하여 정리해주는 것이 권장된다.`     
왜냐하면 cleaner는 history server가 주기적으로 eventLog directory를 주기적으로 스캔하고 정리하기 때문에 
history server 프로세스에 의존하게 된다.   
따라서 history server에 문제가 발생하게 되면 cleaner 프로세스에도 문제가 발생할 수 있지만, s3 lifecycle 기능은 
s3 내부 백엔드에서 처리하기 때문에 이러한 영향이 없다.   

hdfs를 저장소로 사용할 때는 cleaner 옵션을 통해 삭제하면, NameNode metadata에서 먼저 제거되며, 실제 블록 제거는 
이후 DataNode에 의해 비동기적으로 진행된다.   
하지만, s3 의 경우 실제 delete api 호출이 지속적으로 발생하기 때문에 hdfs 의 cleaner 보다 
비용과 latency 측면에서 비효율적일 수 있다.   

추가적으로 아래와 같이 Hybrid Store 설정을 추가하는 것이 권장된다.   

```
# Enable hybrid store to prevent OOM by using disk + memory storage (default: false)   
spark.history.store.hybridStore.enabled true  

# default: 2g
# HybridStore가 사용할 수 있는 최대 메모리 공간
spark.history.store.hybridStore.maxMemoryUsage


# Disk backend for overflow storage (ROCKSDB recommended for compatibility)
spark.history.store.hybridStore.diskBackend ROCKSDB 


# History Server가 메모리에서 디스크 기반 KV-store에 UI 객체를 직렬화할 때 사용할 포맷
# PROTOBUF는 3.4 이상에서 사용가능하며, 4.0 부터는 default로 변경되었다. 
# 기존 JSON 보다 더 빠르며, compact 하다.   
# https://github.com/apache/spark/pull/43609    
spark.history.store.serializer PROTOBUF


# SHS가 eventLog를 파싱해 만든 UI용 내부 객체를 모두 메모리에만 유지하지 않고, 
# 지정한 로컬 경로의 디스크 기반 KV-store(LocalStore)에 직렬화해서 저장, 관리한다.   
# 지정한 디렉터리에 RocksDB/LevelDB 등 백엔드 파일들이 생성된다.
spark.history.store.path /path/to/local/history-store


# Maximum disk usage to prevent runaway storage growth( default: 10g )
spark.history.store.maxDiskUsage 50g
```

기본적으로 Spark History Server는 eventLog를 UI에 필요한 상태로 메모리에 쌓는다.   
로그가 많거나, 로그가 큰 경우 SHS JVM heap이 커지고, GC가 늘어나면서 UI 로딩이 느려지거나 OOM이 나기 쉽다.  

> 이 옵션은 History Server의 event log 파싱/보관 방식에만 영향이 있고, 실행 중인 Spark 어플리케이션 동작 자체를 바꾸는 옵션은 아니다.   

`HybridStore는 event log를 파싱할 때 먼저 in-memory store에 쓰고 백그라운드 스레드가 disk 기반 KV store로 덤프하는 구조이다.`  
`즉, 파싱은 메모리에서 빠르게 하고, UI 조회 빈도가 낮은 오래된 상태는 디스크로 밀어내는 방식이다.`         

주의해야할 점은 hybrid.maxMemoryUsage를 크게 줬을 때 UI 로딩이 느려지는 사례가 있기 때문에 크게 잡지 않는게 좋다.   
또한, hybridStore의 메모리 영역은 SHS JVM 힙을 같이 쓰기 때문에 아래와 같이 힙 메모리 영역을 증가시켜야 할 수 있다.   

> hybrid.maxMemoryUsage 의 default 가 2g 이기 때문에 해당 값 보다는 높게 잡아 주는 것이 권장 된다.    

```
export SPARK_DAEMON_MEMORY=4g
# 또는, -Xmx 설정
```


- - -

Reference

<https://dataflint.gitbook.io/dataflint-for-spark>    
<https://github.com/dataflint/spark>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







