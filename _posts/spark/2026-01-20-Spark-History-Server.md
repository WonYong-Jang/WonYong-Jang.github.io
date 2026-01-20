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

현재 업무에서 전사 공용으로 Spark History Server를 사용하고 있고, 이를 팀 내에서 발생하는 eventLog만 따로 
관리하여 운영할 수 있도록 구성하였고 이 과정에서 어떤 장점이 있는지와 어떤 절차를 통해 구성했는지 공유하려고 한다.  

- - - 

## 1. 전사에서 공용으로 사용하는 Spark History Server   




- - -

Reference


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







