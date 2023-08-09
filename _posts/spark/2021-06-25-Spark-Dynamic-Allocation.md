---
layout: post
title: "[Spark] Dynamic Allocation"
subtitle: "Spark에서 Dynamic하게 executor를 scale out 또는 scale in"    
comments: true
categories : Spark
date: 2021-06-25
background: '/img/posts/mac.png'
---

## Dynamic Allocation   

`Spark의 Resource를 dynamic하게 할당하기 위해서는 아래와 같이 
옵션을 추가해야 한다.`      
`즉, static하게 execturo 갯수를 고정하지 않고, 
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

`또한, 아래 옵션과 같이 executor는 default로 60초 동안 작업을 
처리하지 않고, 대기하게 되면 사라진다.`      

```
// duration (default 60s)
spark.dynamicAllocation.executorIdleTimeout=60s
```   

그 외에 옵션은 아래와 같다.   

```
// (default: 0) sets the minimum number of executors for dynamic allocation.
spark.dynamicAllocation.minExecutors

// (default: Integer.MAX_VALUE) sets the maximum number of executors for dynamic allocation.   
spark.dynamicAllocation.maxExecutors

// sets the initial number of executors for dynamic allocation.
spark.dynamicAllocation.initialExecutors


// default infinity   
// If an executor with cached blocks has been idle for longer than this duration, 
// it will be removed.
// this configuration helps manage executors holding cached data and defaults to infinity, meaning that by default, executor with cached blocks won't be removed.   
spark.dynamicAllocation.cachedExecutorIdleTimeout


// If there's backlog in the scheduler(tasks are waiting to be scheduled) for longer than this duration, new executors will be requested.
spark.dynamicAllocation.schedulerBacklogTimeout   
```

그럼 어떤 기준을 통해 executor를 늘리고 줄일까?   

`Spark는 처리할 데이터를 파티션 단위로 나눌 것이고, 
    설정한 executor의 core 갯수를 고려하여 executor 갯수를 
    설정하게 된다.`   

`단 주의해야할 점은 해당 클러스터 내에 충분한 리소스가 있어야 
리소스를 할당 받을 수 있다.`   

`다른 곳에서 먼저 리소스를 선점해 버리면, 리소스가 반환될 때까지 
대기해야 하기 때문에 중요한 작업이라면 반드시 최소 할당할 리소스를 
적절하게 설정하자.`   

- - - 

**Reference**    

<https://aws.amazon.com/ko/blogs/korea/best-practices-for-successfully-managing-memory-for-apache-spark-applications-on-amazon-emr/>   
<https://mallikarjuna_g.gitbooks.io/spark/content/spark-dynamic-allocation.html>   
<https://fastcampus.co.kr/data_online_spkhdp>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

