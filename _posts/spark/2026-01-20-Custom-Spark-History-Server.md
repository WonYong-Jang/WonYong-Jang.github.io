---
layout: post
title: "[Spark] Custom Spark History Server 구성하기"
subtitle: "[Spark History Server 자체 구축 및 MCP 기반 AI 분석 파이프라인 구성 / 분석 플러그인 DataFlint 추가 / multi-tenant history server"
comments: true
categories: Spark
date: 2026-01-20
background: /img/posts/mac.png
---

Spark History Server는 Spark 어플리케이션에서 발생한 eventLog 를 기반으로 하여 Spark Web UI에서 실행 이력을 시각적으로 분석할 수 있는 도구이다.   

`기본적으로 Spark 어플리케이션이 실행 중에는 Spark Web UI 에서 메트릭 정보를 확인할 수 있지만 어플리케이션이 종료된 이후에는 확인이 불가능하다.`   

`Spark 어플리케이션이 실행 중일 때는 Driver 메모리에 모든 실행 상태를 실시간으로 알고 있고, 그 상태를 HTTP 서버로 노출하기 때문에 확인 가능하지만 어플리케이션이 종료되면 메모리가 정리되면서 메트릭 정보들을 확인할 수 없게 된다.`         

spark.eventLog.enabled=true 로 설정을 하고 eventLog를 저장한다면, 어플리케이션 종료 후에도 Spark History Server UI를 통해서 메트릭 정보를 확인 가능하다.    

`여기서 eventLog를 write 하는 주체는 Spark Driver 가 진행한다.`   

> 더 정확히는 SparkContext가 생성될 때 EventLoggingListener 가 생성 및 등록되어 write하게 된다.  

UI 에는 작업의 실행 시간, 자원 사용량, 작업의 내부 Flow 등이 포함되어 있기 때문에 어플리케이션에 
문제가 있을 때 이 정보를 바탕으로 문제를 해결하는데 큰 도움을 받을 수 있다.   

현재 업무에서 전사 공용으로 Spark History Server를 사용하고 있고, 모든 팀의 Spark 어플리케이션에서 생성된 eventLog가 HDFS의 동일한 경로에 적재되는 구조 였다.      
이를 팀 내의 어플리케이션에서 발생한 eventLog만 따로 관리하여 운영할 수 있도록 Spark History Server를 새롭게 구성하였고 이 과정에서 어떤 장점이 있는지와 어떤 절차를 통해 구성했는지 공유하려고 한다.    

- - - 

## 1. 전사에서 공용으로 사용하는 Spark History Server   

기존에는 모든 팀들의 eventLog를 관리하는 Spark History Server를 사용 했고, 모든 팀들의 Spark eventLog가 쌓이기 때문에 플랫폼팀에서는 운영 부담을 줄이기 위해 짧은 retention 기간을 가져가야만 했다.   
그 결과, 과거 어플리케이션 트래킹에 대한 어려움이 발생했고, [DataFlint](https://github.com/dataflint/spark)와 같은 분석 플러그인을 추가 하려면 플랫폼팀 Dependency 도 발생하였다.   

> Spark History Server 를 실행시 해당 플러그인 추가 작업을 플랫폼팀에서 진행해 주어야 하기 때문에 각 팀에서 자율적으로 분석 도구를 추가하거나 실험하기 어려운 구조였다.   

또한 최근 [MCP for Spark History Server](https://wonyong-jang.github.io/spark/2025/10/06/Spark-History-Server-MCP.html) 도입을 고려하고 있고, 전사에서 사용하는 Spark History Server를 바라보고 분석을 하게 되면 다른 팀의 Spark 어플리케이션 eventLog까지 함께 노출되기 때문에 분석 대상 어플리케이션을 식별하고 필터링하는데 병목이 발생했다.   

`Spark History Server는 기본적으로 아래와 같이 1개의 디렉토리만 스캔하며, 각 팀별로 폴더를 나눠서 ACL을 관리하는 등의 multi-tenant 는 지원하지 않는다.`     

> 현재 spark 3.4.1 기준으로 지원하지 않는다.   

```
spark.history.fs.logDirectory=hdfs:///spark-history
```

multi-tenant에 대한 지원은 [SPARK-45126](https://issues.apache.org/jira/browse/SPARK-45126)에 등록이 되어 있지만 현재 기준으로 진행되고 있지 않고 있다.    

> multi-tenant history server란 여러 팀이 하나의 history server를 공유하되, 각 팀은 자기 팀의 eventLog와 application만 볼 수 있어야 하고, 다른 팀 로그는 존재 자체도 보지이 않아야 하는 구조가 되어야 한다.   

아래와 같이 폴더를 나눠도 기본적으로 Spark History Server는 각 폴더 안의 이벤트 로그를 재귀적으로 탐색하지 못한다. 

```
/spark-history/
    teamA/
    teamB/
```

또한, Spark 의 코드를 살펴보면, [ACL 로 접근 제어하는 코드](https://github.com/apache-spark/spark/blob/master/core/src/main/scala/org/apache/spark/deploy/history/FsHistoryProvider.scala#L164)를 살펴볼 수 있는데 이는 단순하게 UI 접근제어이다.    
이는 특정 사용자만 Spark Web UI 페이지에 접근 가능하도록 제한할 수 있는 기능이다.   

`즉, 우리가 원하는 것은 각 팀별로 발생하는 eventLog는 자신의 팀의 eventLog만 확인 가능하며, 다른 팀의 eventLog는 볼 수 없는 것을 기대했지만 위 옵션을 사용하더라도 기본적으로 Spark History Server는 단일 디렉토리 내에 모든 eventLog를 표기해주게 된다.`   

> spark.history.ui.acls.enable=true로 설정하면 각 어플리케이션의 상세 UI에 접근할 때 조회 권한을 검사한다. 다만 어플리케이션 목록을 사용자별로 필터링하지 않으므로, 조회 권한이 없는 다른 팀의 애플리케이션도 목록에는 표시된다.   

`따라서 팀내에서 발생하는 eventLog를 따로 관리하고 Spark History Server를 직접 구성하여 운영하는 방향으로 결정하였다.`   

이렇게 진행함으로서 팀내에서 발생하는 eventLog 만 분석 가능해지기 때문에, retention 기간 또한 적절하게 조절이 가능해지며, DataFlint와 같은 분석 플러그인을 추가하여 테스트해 볼 수 있는 구조가 된다.     

- - -

## 2. DataFlint 분석 플러그인    

[DataFlint](https://github.com/dataflint/spark) 는 Spark Web UI와 History Server를 통해 다양한 메트릭을 시각적으로 보여주어 문제를 직관적으로 파악할 수 있게 도와주는 도구이다.      

`DataFlint 은 human readable UI 를 제공하며 disk spill, data skew 등과 같은 performance issue에 대해서 직관적으로 확인할 수 있는 점이 가장 큰 장점이다.`      

> 기존의 Spark Web UI 에서 disk spill이 발생하는 구간을 확인하기 위해서는 각각 stage를 클릭해보며 확인해야 되지만, DataFlint 는 전체 Flow를 보여주며 어떤 작업을 진행하면서 spill이 발생하는지 확인이 가능하다.      

> 또한, 데이터를 읽고 쓰는 과정에서 small file 로 진행중이라면, 이를 사전에 alert로 제공하여 인지할수 있도록 한다.    

`어플리케이션의 Memory Usage, Idle Cores, Task Error Rate 등과 같이 중요한 메트릭 정보를 요약하여 전달해주는 장점도 존재한다.`       

`다만, DataFlint에서 아쉬운 부분은 분석 결과에 대한 Rest API를 제공하지 않는다는 점이다.`    

> Rest API가 제공된다면, 팀내에 전체 어플리케이션들을 모니터링하면서 문제가 발생한 
어플리케이션에 대해서 알람을 주어 자동화 할 수 있을 것 같았지만 현재는 Spark Web UI에서 DataFlint 탭을 통해서만 모니터링해야 했다.    
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
```

### 3-2) eventLog 압축   

`Spark 4.0 부터 spark.eventLog.compress 의 기본값이 true로 변경되었지만 그 이전 버전이라면 아래와 같이 명시적으로 추가해주어야 한다.`   

```scala
spark.eventLog.compress=true 
spark.eventLog.compression.codec=zstd
```

### 3-3) DataFlint 플러그인 추가   

Spark 가 실행중일 때도 DataFlint 탭을 확인하기 위해서는 spark-submit 할 때도 추가해주어야 한다.   

```java
spark.plugins=io.dataflint.spark.SparkDataflintPlugin
spark.jars.packages=io.dataflint:spark_2.12:0.8.2
```

### 3-4) YARN 환경의 경우 history server url 지정    

YARN 환경에서 사용 중이라면 해당 옵션을 이용하여 신규로 생성된 spark history server url을 전달해 주는 것이 권장된다.     
`이 옵션은 Spark 어플리케이션의 history server 위치를 spark 에게 알려주는 설정 옵션이다.`     


```
spark.yarn.historyServer.address=spark-history.mycompany.com:18080
```

`YARN ResourceManager가 제공하는 Tracking URL 은 어플리케이션이 실행 중일 때는 Spark UI 로 제공해주지만 어플리케이션이 종료 후에는 eventLog를 이용한 Spark History Server 를 통해 UI를 봐야 하기 때문이다.`      

여기서 Tracking URL은 어플리케이션이 실행중일 때는 http://rm-host/proxy/application 과 같은 url 로 제공하며, 어플리케이션이 종료되고 나면 spark.yarn.historyServer.address 로 연결해주게 된다.      

- - - 

## 4. Spark History Server 설정

### 4-1) 저장된 eventLog 경로 지정 및 retention 기간 설정    

위에서 변경한 eventLog 경로를 Spark History Server가 로드할 수 있도록 아래 설정을 추가해준다.   

```scala
spark.history.fs.logDirectory=s3a://<team-bucket>/event-logs
```

`또한, eventLog는 적절한 retention 기간을 설정하여 주기적으로 정리해주어야 한다.`       
`s3를 사용하기 때문에 lifecycle 기능을 이용하여 정리하는 방법과 아래와 같이 spark 옵션을 사용하여 정리해주는 방법이 있다.`      

```scala
spark.history.fs.cleaner.enabled=true 
spark.history.fs.cleaner.maxAge=7d 
spark.history.fs.cleaner.interval=1d
```

`하지만, s3와 같은 object storage를 저장소로 사용할 때는 s3 lifecycle을 이용하여 정리해주는 것이 권장된다.`     
왜냐하면 cleaner는 history server가 주기적으로 eventLog directory를 주기적으로 스캔하고 정리하기 때문에 history server 프로세스에 의존하게 된다.   
따라서 history server에 문제가 발생하게 되면 cleaner 프로세스에도 문제가 발생할 수 있지만, s3 lifecycle 기능은 s3 내부 백엔드에서 처리하기 때문에 이러한 영향이 없다.
`이벤트 로그 정리를 SHS 프로세스와 독립적으로 운영 가능하다는 장점이 있다.`     

hdfs를 저장소로 사용할 때는 cleaner 옵션을 통해 삭제하면, NameNode metadata에서 먼저 제거되며, 실제 블록 제거는 이후 DataNode에 의해 비동기적으로 진행된다.   

### 4-2) Spark History Server 의 Replica   

`Spark History Server 는 구조적으로 scale out 을 전제로 설계된 컴포넌트가 아니기 때문에 replica를 증가시키는 경우는 여러 이슈에 대해서 검토가 필요하다.`

> 여러 SHS가 동일한 이벤트 로그 저장소를 읽도록 구성할 수 있지만, 각 인스턴스가 로그 스캔과 UI 데이터 재구성을 독립적으로 수행한다.   
> 따라서, replica를 늘릴 때는 중복 작업과 자원 사용량을 고려해야 한다.   

`우리 팀은 운영복잡도와 자원 사용량을 고려하여 replica 1개로 시작하였다.`  

[링크](https://docs.stackable.tech/home/stable/spark-k8s/usage-guide/history-server/)를 참고해보면, 여러 SHS를 띄워도 각 인스턴스는 동일한 일을 반복하며 중복으로 비용이 증가하게 된다고 한다.   
또한, cleaner의 경우도 각 SHS 별로 중복으로 발생하면서 문제가 발생할 수 있음을 나타내고 있다.   

### 4-3) Event Log file을 Rolling 하여 저장   

어플리케이션에서 발생한 eventLog file의 크기가 굉장히 큰 경우에 대해서는 SHS가 처음 파싱할 때 timeout 등의 문제가 발생할 수 있다.   

따라서 spark-submit 옵션에서 eventLog file을 저장할 때 적절한 크기로 Rolling 하여 저장할 수 있다.   

```
spark.eventLog.rolling.enabled=true
spark.eventLog.rolling.maxFileSize=128m
```

### 4-4) DataFlint 추가   

SHS에서 DataFlint를 사용하려면 DataFlint Jar를 SHS의 클래스패스에 별도로 추가해야 한다.
`$SPARK_HOME/jars에 배치하거나 SPARK_DAEMON_CLASSPATH에 추가한 뒤 SHS를 재시작한다.`   

- - - 

## 5. 운영 TroubleShooting  

위와 같은 설정으로 k8s에 spark history server를 직접 운영 과정에서 메모리가 부족하여 파드가 Evicted 되는 현상을 확인했다.   

> Pod was rejected: The node had condition: [MemoryPressure].

기존에 pod에 대해서 리소스 제한이 없기 때문에 메모리 사용이 증가함에 따라서 kubelet이 Pod 를 Eviction 시킨 것을 확인했다.    
때문에 아래와 같이 설정을 추가해주었다.   

```
resources:
    limits:
        memory: "12Gi"
        cpu: "2"
    requests:
        memory: "4Gi"
        cpu: "100m"
```

또한 근본적인 문제는 spark history server의 전체 메모리가 부족했기 때문에 메모리를 증설해주었다.  

처음에는 메모리를 주기적으로 정리해주지 못하는 문제라고 생각되어 spark.history.fs.cleaner 를 추가하게 되면 메모리 정리까지 진행할 줄 알았는데, 해당 옵션은 s3 lifecycle과 동일하게 파일만을 정리해주는 옵션이다.      

따라서, 아래와 같은 옵션을 이용하여 SHS의 JVM 메모리와, 어플리케이션 UI 캐시를 함께 조정할 수 있다.   

```shell
# 캐시에 유지할 어플리케이션 UI 수의 상한
spark.history.retainedApplications   

# 요약 페이지에 표시할 어플리케이션 수의 상한
# 목록에 없어도 직접 URL로 접근할수 있다.   
spark.history.ui.maxApplications   
```

즉, spark history server 은 주기적으로 저장된 event log 디렉토리를 스캔하며, 이때 모든 로그를 파싱해서 메모리에 올리지는 않는다.   
SHS는 로그를 스캔하면서 어플리케이션 목록 구성에 필요한 이벤트를 선별적으로 파싱한다.   
개별 어플리케이션의 상세 UI나 관련 API가 요청되면, 캐시 상태에 따라 이벤트 로그를 재생하여 상세 상태를 구성한다.   
이 때, 메모리에 캐싱을 하게 되며 spark.history.retainedApplications 만큼 유지한다.  

- - -

## 6. 정리 

팀 전용 Spark History Server를 구성하여 이벤트 로그의 보존 기간과 분석 플러그인을 팀 요구사항에 맞게 관리할 수 있도록 했다.   
안정적인 운영을 위해서는 로그 정리 정책과 함께 Pod 리소스, SHS 메모리 및 UI 캐시 설정도 고려해야 한다.   
이후에는 [Spark-History-Server-MCP](https://wonyong-jang.github.io/spark/2026/04/30/Spark-History-Server-MCP-AI-Agnet.html) 를 연동하여 AI가 팀 어플리케이션의 실행 정보와 메트릭을 조회하고 분석할 수 있도록 했다.   
이를 통해 복잡한 작업의 병목 구간을 파악하고, 실제 Spark 설정과 실행 계획을 바탕으로 개선 방향을 검토할 수 있는 환경을 마련하였다.    

- - -

Reference

<https://dataflint.gitbook.io/dataflint-for-spark>    
<https://github.com/dataflint/spark>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







