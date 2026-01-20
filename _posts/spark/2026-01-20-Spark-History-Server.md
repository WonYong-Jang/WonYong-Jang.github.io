---
layout: post
title: "[Spark] Spark History Server 구성하기"
subtitle: "분석 플러그인 DataFlint 추가 및 eventLog 리텐션 기간 변경 / 저장 경로 변경" 
comments: true
categories : Spark
date: 2026-01-20
background: '/img/posts/mac.png'
---

Spark History Server는 Spark 어플리케이션에서 발생한 eventLog를 기반으로 하여 Spark UI에서 
실행 이력을 시각적으로 분석할 수 있는 도구이다.   

`기본적으로 Spark 어플리케이션이 실행 중에는 Spark History Server UI 에서 메트릭 정보를 확인할 수 있지만 어플리케이션이 
종료된 이후에는 확인이 불가능하다.`   

`Spark 어플리케이션이 실행 중일 때는 Driver 메모리에 모든 실행 상태를 실시간으로 알고 있고, 그 상태를 HTTP 서버로 노출하기 때문에 
확인 가능하지만 어플리케이션이 종료되면 메모리가 정리되면서 메트릭 정보들을 확인할 수 없게 된다.`         

spark.eventLog.enabled=true 로 설정을 하고 eventLog를 저장한다면, 어플리케이션 종료 후에도 Spark History Server UI를 통해서 
메트릭 정보를 확인 가능하다.    

`여기서 eventLog를 write 하는 주체는 Spark Driver 가 진행한다.`   

> SparkContext가 생성될 때 EventLoggingListener 생성 및 등록된다.   

UI 에는 작업의 실행 시간, 자원 사용량, 작업의 내부 Flow 등이 포함되어 있기 때문에 어플리케이션에 
문제가 있을 때 이 정보를 바탕으로 큰 도움을 받을 수 있다.   

현재 업무에서 전사 공용으로 Spark History Server를 사용하고 있고, 모든 팀의 Spark 어플리케이션에서 생성된 
eventLog가 HDFS의 동일한 경로에 적재되는 구조였다.   
이를 팀 내의 어플리케이션에서 발생한 eventLog만 따로 관리하여 
운영할 수 있도록 구성하였고 이 과정에서 어떤 장점이 있는지와 어떤 절차를 통해 구성했는지 공유하려고 한다.  

- - - 

## 1. 전사에서 공용으로 사용하는 Spark History Server   

기존에는 모든 팀들의 eventLog를 관리하는 Spark History Server를 사용 했고, 모든 팀들의 Spark eventLog가 쌓이기 때문에 
운영 부담을 줄이기 위해 짧은 retention 기간을 가져가야만 했다.   
그 결과, 과거 어플리케이션에 대한 트래킹이 어려움이 발생했고, [DataFlint](https://github.com/dataflint/spark)와 같은 분석 플러그인을 추가하려면 
플랫폼팀 Dependency도 발생하였다.   

> Spark History Server 를 생성시 필요한 설정에 해당 플러그인 추가 작업을 플랫폼팀에서 진행해 주어야 하기 때문에 
각 팀에서 자율적으로 분석 도구를 추가하거나 실험하기 어려운 구조였다.   

또한 최근 [MCP for Spark History Server](https://wonyong-jang.github.io/spark/2025/10/06/Spark-History-Server-MCP.html) 도입을 고려하고 있고, 
전사에서 사용하는 Spark History Server를 바라보고 분석을 하게 되면 다른 팀의 모든 Spark 어플리케이션 eventLog까지 함께 노출되기 때문에 
분석 대상 어플리케이션을 식별하고 필터링하는데 추가적인 어려움이 발생하였다.   

따라서 팀내에서 발생하는 eventLog를 따로 관리하고 Spark History Server에 필요한 분석 플러그인을 유연하게 추가 할수 있도록 
직접 구성하여 운영하는 방향으로 결정하였다.  

- - - 

## 2. eventLog 저장 경로 분리   

Spark 어플리케이션 실행 시 아래 설정을 통해 팀 전용 eventLog 저장 경로로 로그를 기록하도록 한다.   

```
spark-submit \
  --conf spark.eventLog.enabled=true \
  --conf spark.eventLog.dir=s3a://<team-bucket>/event-logs \
  ...
```



- - -

Reference


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







