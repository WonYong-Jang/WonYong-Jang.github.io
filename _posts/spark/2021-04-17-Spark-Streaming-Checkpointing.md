---
layout: post
title: "[Spark] Streaming Checkpointing "
subtitle: ""    
comments: true
categories : Spark
date: 2021-04-17
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming을 사용할 때 장애 복구를 위해 사용 되는 
checkpointing 에 대해 자세히 살펴보자.   

- - -    


## 1. What is RDD checkpointing?   

`체크포인트란 rdd에 있는 데이터를 디스크에 기록하는 것이며 
기록이 필요한 이유는 실패했을 경우에 복구를 위해 필요하다.`   

기본적으로 rdd는 아래와 같이 rdd graph(lineage) 정보를 가지고 있으며, 
    연산 중에 실패했을 경우, rdd graph 정보를 가지고 
    처음부터 다시 연산을 해서 복구를 한다.   
`하지만 rdd graph 에서 연산들이 너무 많고 연산 비용이 크다면 
중간에 checkpointing 을 이용하여 디스크에 기록해 둘 수 있다.`   
`따라서, 처음 부터 연산할 필요 없이 기록한 부분부터 연산이 가능하다.`       

<img width="800" alt="스크린샷 2023-07-25 오후 11 33 48" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/79ebf8a6-bf54-402b-9a52-f2a600c178bb">   

`주의해야할 부분은 checkpointing을 로컬 디스크에 기록을 한다면  
    문제가 발생할 수 있다.`       
`노드 전체가 장애가 발생한다면 이를 복구하지 못하기 때문에 
    보통 hdfs 같은 분산 파일 시스템에 저장한다.`     

그러면 checkpointing에 어떤 내용을 기록할까?   

아래와 같이 2가지 타입을 기록한다.   

##### Metadata checkpointing   

`Metadata는 Driver가 실패했을 경우에 복구를 위한 데이터이다.`   

네트워크 또는 디스크 등의 여러 이유로 Driver에 장애가 발생하는 경우 또한,  
이전에 처리했던 부분 부터 다시 처리를 해야할 것이다.    

- Configuration: 스트리밍 어플리케이션을 구동하기 위해 사용되는 configuration 정보들이 필요하다.   

- DStream operations: DStream을 통해 어떤 연산들을 진행했는지에 대한 정보들이 필요하다.   

- Incomplete batches: 가장 중요한 정보이며 장애가 나기 전에 수행을 완료하지 
못한 queue에 쌓여있는 job 정보들이다.   

`따라서 Driver가 장애가 발생하면 위의 정보들을 이용하여 
스트리밍을 재기동을 하며 이전에 완료하지 못했던 job들 부터 
처리하기 시작한다.`   


##### Data(RDD) checkpointing   

`두번째는 실제로 rdd에 들어있는 데이터이다.`   

DStream 




- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-kinesis-integration.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

