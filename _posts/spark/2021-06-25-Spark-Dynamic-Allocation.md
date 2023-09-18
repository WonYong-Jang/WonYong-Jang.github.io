---
layout: post
title: "[Spark] Dynamic Allocation in AWS EMR Cluster"
subtitle: "Spark에서 Dynamic하게 executor를 scale out 또는 scale in / ec2기반 aws emr 5.x 트러블 슈팅"    
comments: true
categories : Spark
date: 2021-06-25
background: '/img/posts/mac.png'
---

## 1. Dynamic Allocation   

`Spark의 Resource를 dynamic하게 할당하기 위해서는 아래와 같이 
옵션을 추가해야 한다.`      
`즉, static하게 execturor 갯수를 고정하지 않고, 
    필요에 따라 줄이고 추가할 수 있다.`    

```
spark.dynamicAllocation.enabled=true
```

또한, 아래 옵션을 추가해야 한다.   
`shuffle은 기본적으로 stage가 나뉠 때 발생하며, 앞의 stage 데이터를 
shuffle write하여 쓰고, 뒤에 stage가 해당 데이터를 shuffle read하여 
작업을 진행한다.`   
이 때 executor가 사라졌다가 생겼다가 dynamic하게 할당될 것이며, 
필요하다면 과거의 shuffle 데이터를 읽어야 하는데 
그렇지 못한 경우도 발생할 것이다.   

> ex) executor가 Idle 시간이 초과 되어 제거 된 경우 

`따라서, dynamicAllocation의 경우 
shuffle 데이터를 tracking하여 필요하다면 읽을 수 있는 옵션이다.`   

```
// spark 3.0 이상 
spark.dynamicAllocation.shuffleTracking.enabled=true

// spark 2.x
spark.shuffle.service.enabled=true
```

- - - 

## 2. Dynamic Allocation 여러 옵션  

Dynamic Allocation 에서 제공하는 여러 옵션들에 대해 살펴보자.   

`아래 옵션은 executor에서 60초 동안 task를  
처리하지 않고, 놀고 있는 executor를 제거한다.`     


```
// duration (default 60s)
spark.dynamicAllocation.executorIdleTimeout=60s
```   

`Dynamic allocation 사용시 최소 및 최대 executor 갯수와 
어플리케이션 실행시 셋팅할 executor 갯수는 아래와 같이 설정 가능하다.`      

```
// (default: 0) sets the minimum number of executors for dynamic allocation.
spark.dynamicAllocation.minExecutors

// (default: Integer.MAX_VALUE) sets the maximum number of executors for dynamic allocation.   
spark.dynamicAllocation.maxExecutors

// sets the initial number of executors for dynamic allocation.
spark.dynamicAllocation.initialExecutors
```

그 외에 옵션은 아래와 같다.  

```
// default infinity   
// If an executor with cached blocks has been idle for longer than this duration, 
// it will be removed.
// this configuration helps manage executors holding cached data and defaults to infinity, meaning that by default, executor with cached blocks won't be removed.   
spark.dynamicAllocation.cachedExecutorIdleTimeout


// If there's backlog in the scheduler(tasks are waiting to be scheduled) for longer than this duration, new executors will be requested.
spark.dynamicAllocation.schedulerBacklogTimeout   
``` 

- - -    

## 3. Dynamic Allocation 의 기준    

그럼 어떤 기준을 통해 executor를 늘리고 줄일까?   

Spark는 기본적으로 처리해야할 데이터를 확인하고 실행 계획을 DAG 형태로 
표현하여 기록해둔다.   

`따라서, 현재 할당 되어 있는 리소스(executor 갯수 및 cpu 등) 를 고려하여 
파티션 단위로 작업을 나눈다.`       

> 각 파티션은 1개의 task로 할당되어 처리된다.   
 
이 때 Spark는 scheduler queue에 대기하고 있는 task들의 갯수를 트래킹하고 있으며, 
    만약 스케줄 되어 있는 task 갯수가 일정시간 동안 계속 남아 있다면 
    Spark는 executor를 더 추가하게 된다.   

아래 옵션을 통해 scheduler queue에 쌓여 있는 task들을 얼마나 기다릴지 
결정할 수 있다.   

> 10초 마이크로 배치의 스트리밍의 경우, 위 옵션을 절반인 5초로 지정했을 때 
> 5초 동안 task들이 backlog에 쌓여 있다면 executor를 추가할 것이다.   

```
spark.dynamicAllocation.schedulerBacklogTimeout
```

`단 주의해야할 점은 해당 클러스터 내에 충분한 리소스가 있어야 
리소스를 할당 받을 수 있다.`   

`다른 곳에서 먼저 리소스를 선점해 버리면, 리소스가 반환될 때까지 
대기해야 하기 때문에 중요한 작업이라면 반드시 최소 할당할 리소스를 
적절하게 설정하자.`   

또한, 반대로 특정기간 동안 executor에 task들이 할당 되지 않고 대기하고 있다면 
Spark는 executor를 제거한다.   

> 스트리밍의 경우 trigger interval 보다 약간 높게 설정하는 것이 권장 된다.   
> executor를 제거하고 추가하는 비용이 크기 때문에 30~60초가 권장된다.   

```
spark.dynamicAllocation.executorIdleTimeout
```

마지막으로 Spark는 cached RDD partiton과 같이 cached block들이 
존재하는지 확인하고 존재한다면 기본적으로 executor를 제거하지 않는다.   
따라서, 아래 옵션을 통해 일정 시간동안 작업이 없는 executor들을 제거하는데 
도움을 준다.   

```
spark.dynamicAllocation.cachedExecutorIdleTimeout
```


## 4. AWS EMR Cluster에서 Dynamic allocation 

AWS EMR Cluster에서 스파크를 사용하고 있다면, EMR Cluster 에 대해서 먼저 이해해야 한다.   

#### 4-1) EMR Cluster 구조   

EMR은 기존 Hadoop에서의 Computing 부분을 그대로 구현해 놓은 플랫폼이라고 
이해하면 된다.   

> EMR 내에는 Hadoop, Hive, Zeppelin, Flink, Spark, Hue 등 다양한 
분산처리 및 노트북 환경을 제공한다.   
> EKS 기반 EMR과 EC2 기반 EMR을 각 사용할 수 있으며 이 글에서는 EC2 기반 EMR에 대해 다룰 예정이다.   

`EMR은 기본적으로 Master, Core, Task 노드로 구성되어 있다.`   

<img width="600" alt="스크린샷 2023-09-18 오후 11 39 13" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/9b3ee459-19ef-43d0-861d-15e6c1481f62">   

- Master Node: 1개 이상 노드가 필요하고, 
    다른 노드들 간의 작업 트래킹 및 리소스 분배를 진행하며 전반적인 클러스터의 상태를 모니터링하고 관리한다.    

> NameNode, ResourceManager, Hive Server 등이 이에 속한다.    

- Core Node: 1개 이상 노드가 필요하며, 클러스터의 HDFS(Hadoop Distributed File System)에 작업을 실행하고 데이터를 
저장할 수 있는 노드이다.    

> DataNode, NodeManager가 실행된다고 이해하면 된다.   

- Task Node: HDFS에 데이터를 저장하지 않고 작업들만 처리하는 노드이다.    

> 선택사항이며, 반드시 필요한 노드는 아니다.   

클러스터를 구성할 때 작업의 성격에 따라 각 Node들에 해당하는 리소스를 
적절히 설정하여야 하며, NameNode, ResourceManager를 포함하고 있는 Master Node 그리고 
DataNode를 포함하고 있는 Core Node는 On demand로 설정해야 한다.   

> on demand 옵션은 ec2 비용 그대로를 할인 없이 지불하는 대신 안전하게 사용할 수 있다.   
> Master Node와 HDFS를 사용하는 Core Node는 보통 on demand를 사용한다.  
> spot 옵션은 on demand 요금보다 70~90% 절감된 비용으로 사용할 수 있는 instance   

#### 4-2) Core / Task Node 분리되어 있는 이유   

기존 하둡의 경우 Master에 Resource Manager, NameNode가 있고, Workerdp Node Manager, DataNode가 
설치되어 있었다.   
하지만 `EMR에서는 Worker를 DataNode가 있는 Node(Core)와 DataNode가 없는 Node(Task)로 
분리하여 제공한다.`     
때문에 Task 노드를 활용하면 HDFS에 저장을 하지 않는 Spark나 기타 Map Reduce를 사용하는 
병렬 프레임워크들을 사용할 때 조금 더 유연하게 사용할 수 있다.   
DataNode에 대한 부담이 없으므로 정말 Job들을 처리하는 Worker로써 쉽고 빠르게 
늘리고 줄일 수 있다.   


- - - 

**Reference**    

<https://yeo0.tistory.com/entry/AWS-EMR-MasterCoreTaskAutoScalingSpotInstance>   
<https://aws.amazon.com/ko/blogs/korea/best-practices-for-successfully-managing-memory-for-apache-spark-applications-on-amazon-emr/>   
<https://mallikarjuna_g.gitbooks.io/spark/content/spark-dynamic-allocation.html>   
<https://fastcampus.co.kr/data_online_spkhdp>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

