---
layout: post
title: "[Spark] Streaming 의 Fault Tolerance 와 Graph"
subtitle: "장애 복구 / Dstream의 Graph / Network Input Tracker, Job Scheduler, Job Manager, Block manager"    
comments: true
categories : Spark
date: 2021-04-14   
background: '/img/posts/mac.png'
---

이번 글에서는 Spark Streaming의 Fault Tolerance 와 Graph에 대해 살펴보자.    

기본적으로 Spark 엔진은 RDD의 Fault Tolerance를 지원하며 
    Spark Streaming 에서 사용하는 상위 레벨의 추상화된 Dstream 또한, RDD의 시퀀스이다.   
따라서 Spark Streaming은 
    RDD의 Fault Tolerance를 그대로 상속받아 처리하게 된다.   

또한 Spark RDD 베이스 코드를 작성하면 DAG의 lineage를 생성 및 실행 계획을 기록하여 실행하는데 
Spark Streaming도 마찬가지로 진행된다.  

해당 내용들을 자세히 살펴보자.   

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

이번에는 Dstream의 그래프에 대해 살펴보자.   

Spark는 기본적으로 RDD 베이스로 실행을 할 경우 lineage를 생성하여 실행 계획을 기록해 두었다.   
`Spark Streaming도 마찬가지로 Dstream Graph로 변경되고, 실행 계획을 세우고 이에 따라 실행된다.`         

<img width="771" alt="스크린샷 2023-07-19 오후 10 29 32" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/b9569e15-acad-4d16-bf1c-c00bf0bb4eca">   

위 코드에서 socketTextStream을 만들면, Input Receiver Dstream을 리턴할 것이며 해당 Dstream을 통해 
변경작업(map 연산)을 한 후 최종적으로 output 작업(foreachRDD)을 하였다.   

> 여기서 output 작업은 action 작업과 유사하다.   

`그 후 아래와 같이 Dstream 의 batch interval 마다 Dstream Graph를 RDD graph로 변경한다.`      

> Dstream 은 RDD의 시퀀스이며, 상위 레벨의 추상화된 모델이기 때문이다.   

<img width="800" alt="스크린샷 2023-07-19 오후 10 43 21" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/33f9fac6-6f92-4e15-a6fd-fca19d33bfbf">    

`위와 같이 각각의 output이 spark action으로 변경되며, action 1개는 보통 job 1개를 생성하기 때문에 총 3개의 spark job이 생성되었다.`      

- - -    

## 3. Spark Streaming Components   

이제 위에서 살펴봤던 job들을 실행하기 위한 Spark Streaming Component를 살펴보자.     

아래 코드를 예시로 살펴보면, 
    StreamingContext는 내부에 Spark Context를 항상 가지고 있으며, 
    해당 코드는 Dstream graph를 통해 실행계획을 세우고 이에 따라 실행된다.   

<img width="1000" alt="스크린샷 2023-07-20 오후 11 45 52" src="https://github.com/WonYong-Jang/algorithm/assets/26623547/cfc399de-50fd-476c-a5de-3acbe09ea84e">    


### 3-1) Network Input Tracker   

`Network Input Tracker는 외부에서 네트워크를 통해 가져온 
데이터를 트래킹하기 위한 용도의 Component이다.`   
`즉, 외부에서 Receiver가 가져온 데이터를 트래킹하기 위한 Component이다.`    
Receiver가 가져온 데이터의 Block마다 어떻게 유지가 되고, 어떤 곳에서 
처리하고 있는지 등을 트래킹한다.   

### 3-2) Job Scheduler   

위에서 Dstream graph가 RDD graph로 바뀌고, 
    RDD graph에서 각 action마다 job으로 변경됨을 확인했다.    

`Job Scheduler는 해당 job을 관리하는 Component이며, 주기는 
batch interval마다 가동될 것이다.`   

> batch interval 마다 들어온 데이터를 RDD의 시퀀스로 만들고 이를 순서대로 Job Manager에게 넘긴다.    

`언제 어떠한 job들이 실행되어야 하는지 스케줄하며, 스케줄된 job들은 
Job Manager에게 넘긴다.`      


### 3-3) Job Manager   

`Job Manager는 job들을 queue에 넣어두고 실행하게 된다.`     

> 이때, 비지니스 로직이 복잡하거나 데이터 양이 많을 경우, queue에 쌓이게 되어 지연이 발생할 수 있다.   

`Job Manager는 job들이 어떻게 만들어지고 언제 실행될지는 모르지만, 
    Job Scheduler에 넘겨 받은 순서대로 처리한다.`     

`최종적으로 Job Manager는 Job을 Spark 클러스터 내에 실행하는 역할을 한다.`    

### 3-4) Spark Context

`각각의 job은 spark context를 통해서 실행된다.`   

위의 그림에서 `Block manager는 RDD에 들어있는 데이터 맵핑 정보를 관리한다.`   
따라서 job은 클러스터 내에 있는 executor에서 task라는 단위로 처리될 것이며, 
    보통 파티션은 task 1개로 할당되어 처리된다.   
파티션의 정보는 block manger가 가지고 있다.   

- - - 

## 4. Execution Model   

위의 내용을 도식화하여 이해해보자.    

### 4-1) Receiving Data   

<img width="860" alt="스크린샷 2023-07-21 오후 9 47 19" src="https://github.com/WonYong-Jang/algorithm/assets/26623547/da92759f-773f-4b4a-9ac7-04d58d3063d4">     

`먼저, 외부에서 데이터를 가져오는 부분부터 시작해야 하며 
이때 Driver가 아닌 클러스터내에 executor 중 1개가 데이터를 가져온다.`   

`StreamingContext.start() 하게 되면 스트리밍이 시작 되며, 
    Network Input Tracker가 Receiver를 띄우게 된다.`      

> Receiver는 하나의 task로 실행되며, core 1개를 사용하게 된다.    
> 이때, receiver가 core를 쓰고 다른 task를 수행할 core가 부족할 수 있기 때문에 적절하게 리소스 할당을 해야한다.     

해당 Receiver는 executor 내에서 실행될 것이며 스트리밍이 시작하고 종료될 때까지 끊임 없이 계속 
실행된다.   

`Receiver가 받아들인 데이터를 Block 단위로 Block Manager에게 넘긴다.   
해당 block을 이용하여 rdd로 만들며, 유실되면 안되기 때문에 block을 replication 해 놓는다.`       

복제 후 Receiver는 Network Input Tracker에게 block 의 id 등을 알려주게 된다.    

> ex) t1 batch interval 마다 속하는 block id들을 Network Input Tracker가 관리한다.      

`각각의 executor 마다 block manager가 있고, driver에는 
Block Manager Master가 존재하며 block id가 각각 어느 노드에 위치해 있는지 정보를 가지고 있다.`     

- - -    

### 4-2) Job Scheduling   

이번엔 Job Scheduling에 대해 살펴보자.   

<img width="900" alt="스크린샷 2023-07-22 오후 2 17 05" src="https://github.com/WonYong-Jang/algorithm/assets/26623547/d21b4cb1-e228-449c-aa03-dbdd6bcdf625">


우리가 Spark Streaming 코드를 작성하게 되면 Dstream graph로 해석되고, 
    RDD graph로 변환된다고 언급했다.  
따라서, 각 action 마다 job으로 해석될 것이며 
실제 실행 단위는 task로 실행된다.   

`여기서 실행 대상 데이터들은 Network Input Tracker가 block 단위로 관리하게 
되므로 Dstream Graph와 Network Input Tracker가 공조하여 job을 만들어 낸다.`      

> job에는 어떤 데이터(Network Input Tracker에서 참조)를 수행할지 
어떤 연산(Dstream graph 참조)을 할지에 대한 정보가 담겨있다.     

`Job Scheduler 는 job을 생성하여 Job Manager가 관리하는 queue에 
순서대로 넣는다.`       

`그 후 Job Manager는 직접 스케줄하는게 아니라, 스케줄러에 의해 
넘겨 받은 job들을 순서대로 실행시킨다.`      

최종적으로 각 executor에게 job 들을 전달하여 연산할 수 있도록 한다.    



- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>   
<https://spark.apache.org/docs/latest/streaming-programming-guide.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

