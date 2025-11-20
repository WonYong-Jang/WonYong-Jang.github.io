---
layout: post
title: "[Spark] On Kubernetes"   
subtitle: "EMR Cluster 에서의 Spark와 비교 / Spark on Yarn 과 Spark on K8s 비교"       
comments: true   
categories : Spark   
date: 2024-03-03   
background: '/img/posts/mac.png'   
---

현재 업무에서 AWS EMR Cluster를 구성하고 Spark Job을 제출하여 Spark 
어플리케이션을 실행하고 있다.     

> Cluster Manager는 YARN을 사용하고 있다.   

이를 운영하면서 발생한 문제점은 아래와 같다.      

EMR에서 기본적으로 만들어진 AMI를 사용하고, 보안을 위해 이를 6개월에 한번씩 
업데이트를 해주어야 하기 때문에 주기적으로 클러스터를 다시 생성해줘야 하는 
유지보수 비용이 발생하였다.  

또한, 목적에 따라 여러 클러스터를 구성하거나 
DR 을 대비하여 여러 EMR Cluster로 구성된 Multi AZ를 
구축하였을 때 많은 EMR 클러스터 비용이 발생하는 등의 문제가 있기 때문에 
쿠버네티스로 전환을 고려해 보기로 하였다.  

> EMR Cluster는 하나의 AZ 에만 프로비저닝 할 수 있기 때문에, DR 을 대비하기 위해 
다른 AZ에 동일한 EMR 클러스터를 구성하여 active active cluster 를 구성하여 해결 할 수는 있다.    
> 하나의 AZ 에 문제가 발생하였을 때 다른 AZ 를 통해 job 을 실행 할 수 있도록 하였다.    

`또한 EMR Cluster 는 클러스터 하나당 단일 spark 버전만 지원하기 때문에 
여러 spark 버전을 사용해야 한다면 spark 관리가 어렵다.`     


<img width="1000" alt="스크린샷 2024-03-03 오후 4 59 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f3900cad-ca4d-4db5-95ad-ac07f7163b91">


- - -    


## 1. Why Spark On Kubernetes?   

먼저 Spark Job을 Kubernetes 환경에서 돌리는 것이 이점이 있을까?   

기존의 Hadoop Ecosystem에서 사용하는 YARN과 비교해보자.   

1. 클라이언트는 Resource Manager에게 Application Master 실행을 요청한다.   
2. Resource Manager는 컨테이너에서 Application Master를 실행할 수 있는 Node Manager를 찾는다.   
3. Node Manager에서 컨테이너 생성 후 Application Master를 실행 한다.   
4. 분산 처리를 위해, Resource Manager에게 더 많은 컨테이너를 요청한다.   
5. 분산 처리를 수행할 수 있는 다른 Node Manager에게 컨테이너 생성을 요청 한 후, 분산 처리를 수행한다.   

이렇게 보면 딱히 문제가 없는거 같지만, YARN 자체에는 내재 되어 있는 
문제가 있다.   

`첫 번째는 운영적인 측면이며 단일 Spark 버전만 사용할 수 있기 때문에 
성능을 위해 Spark를 업그레이드 하려고 할 때 YARN 클러스터 전체를 
업그레이드 해야 하는 등 의존성 문제가 발생한다.`   

`두 번째는 Resource 문제이며, YARN은 모든 Job에 대해서 
동일한 Resource를 할당하는 Container를 제공하기 한다.`         
따라서, 어떤 연산은 CPU가 더 필요할 수 있고 어떤 연산은 메모리가 
더 필요할 수 있지만 동일한 Resource를 할당해주기 때문에 
노는 CPU, Memory가 발생할 수 있다.     

`세 번째는 Performance 이며, YARN 보다 Kubernetes에서 Spark Job을 
실행하는게 약 5%의 성능 향상을 이뤘다고 한다.`    
[링크](https://aws.amazon.com/ko/blogs/containers/optimizing-spark-performance-on-kubernetes/)를 통해 더 자세한 
내용을 확인해 보자.  

- - - 

## 2. EMR과 EKS 의 Memory 관리      

Spark는 일반적으로 YARN(EMR) 과 Kubernetes(EKS) 환경에서 실행되며, 
    두 환경의 리소스 관리 방식이 다르다.   

`EMR의 경우 YARN은 Executor의 메모리 사용량이 약간 초과하더라도 Container의 
여유 메모리를 사용하여 조정을 하지만, EKS의 경우 할당된 메모리 한도를 
넘어서면 그 즉시 OOM Kill을 발생시킨다.`        

`따라서 EKS 에서는 executor memory의 약 20% 정도를 spark.executor.memoryOverhead 로 
증가시키는 것을 권장한다.`   

따라서 EKS에서는 아래와 같이 메모리를 구성하는 것이 좋다.   

- spark.executor.memoryOverhead = 20% of executor-memory   
- spark.default.parallelism = (num-executors) * (executor-cores)  

`spark.default.parallelism은 RDD 사용시 적용이 되고, spark.sql.shuffle.partitions 는 
DataFrame, Dataset 에서 shuffle이 발생하는 연산에서 파티션 개수를 정한다는 차이가 있다.`      

```python
('executor-memory', '14G',)
('num-executors', '300',)
('executor-cores', '4'),


('conf', 'spark.executor.memoryOverhead=3G'), # (executor-memory) * 20% => 14G * 20% => 3G   
('conf', 'spark.default.parallelism=1200')    # (num-executors) * (executor-cores) => 300 * 4 
```

- - -   

## 3. Remote Shuffle Service(RSS)

Spark의 shuffle 데이터는 기본적으로 executor 로컬 디스크에 저장되기 때문에 executor가 
사라지면(Preemption, Scale in, Incident) 데이터가 함께 사라진다.   

따라서, 이를 해결하기 위해서 Spark는 External / Remote Shuffle Service 를 도입하였다.  



- - - 

**Reference**   

<https://blog.banksalad.com/tech/spark-on-kubernetes/>    
<https://justkode.kr/data-engineering/spark-on-k8s-1/>   
<https://techblog.woowahan.com/10291/>   
<https://spot.io/blog/setting-up-managing-monitoring-spark-on-kubernetes/>   
<https://aws.amazon.com/ko/blogs/containers/optimizing-spark-performance-on-kubernetes/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

