---
layout: post
title: "[Spark] Streaming 의 Fault Tolerance 와 Graph"
subtitle: "장애 복구"    
comments: true
categories : Spark
date: 2021-04-14   
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming의 Fault Tolerance 에 대해서 살펴보자.   

기본적으로 Spark 엔진은 RDD의 Fault Tolerance를 지원하며, 
    Spark Streaming 또한, RDD의 시퀀스이다.   
`따라서, Spark Streaming은 
    RDD의 Fault Tolerance를 그대로 상속받아 처리하게 된다.`   

- - -    

## 1. Spark Streaming Fault Tolerance   

[이전글](https://wonyong-jang.github.io/spark/2021/04/11/Spark.html)에서 
RDD는 리니지(lineage)에 생성 작업들을 기록해두기 때문에, 
    장애가 발생하여도 리니지를 참고하여 재연산(recomputation)을 통해 데이터 손실을 
    복구한다고 하였다.   
이때, 스트리밍 데이터가 아닌 경우 보통 원본 데이터가 HDFS, S3 등에 
잘 저장이 되어 있기 때문에 이를 바탕으로 recomputation을 진행하면 된다.   

하지만 실시간성으로 생기는 데이터의 원본 데이터가 없다면, Spark Streaming은 
어떻게 장애 복구를 할까?   

> 트위터의 데이터를 실시간성으로 처리를 하다가 장애가 발생했을 때, 
    5초전에 발생했던 데이터를 다시 전달해 달라고 할 수 있을까? 대부분 그렇지 못하다.    

`따라서 Spark Streaming은 장애 복구를 위해서 원본이 되는 데이터를 최소 2벌을 가지고 있도록 
복제를 해놓는다.`   

`즉, 분산환경이라면 원본 데이터를 복제하여 각 다른 서버 메모리에 복제해 놓는다.`  

<img width="500" alt="스크린샷 2023-01-14 오후 6 01 26" src="https://user-images.githubusercontent.com/26623547/212464508-4a0bb8a5-3e32-4543-8652-3892a0dbab08.png">     

그럼 위의 그림에서 특정 서버(워커노드)가 장애가 발생했을 때 어떻게 Fault Tolerance를 
유지하는지 살펴보자.   

아래 그림은 특정 파티션을 처리하던 워커노드가 장애가 발생한 예이다.   
여기서 워커노드는 executor를 가르킨다.   
즉, 해당 executor가 처리하던 파티션 2개가 데이터 손실이 발생했다.   

<img width="500" alt="스크린샷 2023-01-14 오후 6 09 54" src="https://user-images.githubusercontent.com/26623547/212464779-3660ce0a-8429-416e-8708-78b3d3f6990a.png">   

하지만, 스케줄링을 담당하는 Driver는 장애가 발생한 사실을 알고 있다.    
`따라서 해당 executor(장애가 난)가 처리하려고 했던 파티션 정보를 다른 executor가 
처리할 수 있도록 스케줄링하여 할당한다.`    

<img width="500" alt="스크린샷 2023-01-14 오후 6 21 40" src="https://user-images.githubusercontent.com/26623547/212465178-6254f3ef-75c4-44cd-8827-e65f90807745.png">   

- - - 

## 2. DStream Graph   




- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-programming-guide.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

