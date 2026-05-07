---
layout: post
title: "[Spark] On Kubernetes"   
subtitle: "EMR Cluster 에서의 Spark와 비교 / Spark on Yarn 과 Spark on K8s 비교"       
comments: true   
categories : Spark   
date: 2024-03-03   
background: '/img/posts/mac.png'   
---

현재 업무에서 Spark on YARN(Cloudera Data Platform) 환경에서 Spark Job을 제출하여 Spark 
어플리케이션을 실행하고 있다.       

이를 운영하면서 발생한 문제점은 아래와 같다.      

기본적으로 클러스터의 자원이 고정되어 있어서 활용률이 저하된다.   
`CDP on-premise 환경을 사용하고 있기 때문에 물리 노드가 고정되어 있어서 
Auto Scaling이 불가능하다.`       

또한, YARN 의 dedicated Queue 를 이용하여 특정 조직/팀 단위로 자원을 할당받아서 사용하고 있다.  
즉, maximum-capacity를 고정하는 운영 정책이기 때문에 자원 낭비는 구조적으로 발생할 수 밖에 없다.  

> 비용을 maximum-capacity 를 기준으로 지불해야 하기 때문에 피크타임이 아닌 시간에는 남는 리소스가 많이 발생하게 된다.   

그 이전 회사에서는 CDP on-premise가 아닌 EMR 클러스터에서 Spark를 운영한 경험이 있었고, 
    EMR 클러스터에서는 Auto Scaling을 지원하지만 아래 문제가 있었기 때문에 K8S로 전환을 고려했었다.   

목적에 따라 여러 EMR 클러스터를 구성하거나 DR 을 대비하여 여러 EMR Cluster 를 구성해야 할 때가 있다.
즉, Multi AZ로 구성하여 운영해야 하는데 EMR Cluster 비용이 기본적으로 비싸기 때문에 많은 비용이 발생한다.   

`EMR Cluster는 하나의 AZ 에만 프로비저닝 할 수 있기 때문에, DR 을 대비하기 위해 
다른 AZ에 동일한 EMR 클러스터를 구성하여 active-active cluster 를 구성하여 해결 할 수는 있지만 
비용이 2배로 발생하게 된다.`           

> 하나의 AZ 에 문제가 발생하였을 때 다른 AZ 를 통해 job 을 실행하여 가용성을 확보할 수 있다.      

`그리고 또하나의 문제점은 Spark 버전과 사용 라이브러리의 버전 유연성이 떨어진다.`   

EMR Cluster 자체가 특정 버전에 묶여 있기 때문에 클러스터 자체를 업데이트 하지 않는 이상 
고정된 Spark 버전과 특정 라이브러리 버전을 사용해야 한다.  

> spark, iceberg, java, aws 등의 라이브러리를 고정된 버전을 사용해야 한다.   

CDP on-premise 또한 버전이 고정되어 의존성 문제가 발생할 수 있다.   

마지막으로 모니터링 관점에서 한계가 존재한다.   

CDP on-premise 와 EMR은 플랫폼이 모니터링을 기본적으로 제공하지만 커스터마이징이 제한적이고, 
    Spark 레벨의 메트릭을 모니터링하는데 어려움이 존재한다.   

> 예를 들면 Spark Executor별 메모리 사용 패턴이나 Task 별 처리 시간 등   

위의 문제점을 기반으로 하여 Spark on K8s 로 전환했을 때 이를 해결할 수 있는지 
확인해보려고 한다.   

<img width="1000" alt="스크린샷 2024-03-03 오후 4 59 36" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/f3900cad-ca4d-4db5-95ad-ac07f7163b91">


- - - 

## 1. PoC 검증 항목    

PoC에서 아래와 같은 항목들에 대해서 확인해보려고 한다.   

### 1-1) 멀티 버전 Spark 이미지 동시 실행 확인   

동일한 K8s 클러스터 내에서 서로 다른 Spark 버전 및 라이브러리 버전의 Job이 동시에 실행 가능한지 확인한다.   
서로 다른 Spark 버전 Job이 동일 클러스터에서 충돌 없이 독립적으로 실행이 가능한지 확인한다.   

### 1-2) Prometheus + Grafana 모니터링 확인   

CDP 에서 불가능했던 Spark 어플리케이션 레벨의 실시간 메트릭 수집 및 시각화가 가능한지 확인 한다.     
Grafana를 통해 현재 실행중인 Spark 어플리케이션의 리소스 사용량의 패턴을 모니터링 가능한지 확인한다.   

### 1-3) Remote Shuffle Service 안정성 확인   

YARN은 NodeManager가 External Shuffle Service를 기본적으로 제공하지만, K8s는 기본적으로 제공하지 않는다.   
Spark의 Shuffle 데이터는 기본적으로 Executor 로컬 디스크에 저장되기 때문에, Executor가 종료(Preemption, Scale-in, Incident) 되면 
Shuffle 데이터가 함께 사라져 Job 이 실패한다.   
이를 해결하기 위해 Apache Celeborn을 RSS로 도입하여 Shuffle 데이터를 외부 서비스에 보존할 수 있게 된다.   

Executor 종료 시 Shuffle 데이터 유실 없이 Job이 정상 완료되었는지 확인한다.   
또한, YARN External Shuffle Service 대비 성능 및 안정성을 비교한다.   
Celeborn 장애 상황에서의 확인을 위해서 Celeborn을 미적용 상태에서 동작을 확인해본다.   

### 1-4) 메모리 관리 및 OOM Kill 튜닝 확인   

기존 Spark on YARN 에서 기본값으로 사용 중인 리소스에 대한 옵션 값이 적절한지 확인한다.   
spark.executor.memoryOverhead 가 필요하다면 20% ~ 40% 범위를 기본값으로 설정한다.   

`CDP 및 EMR 의 경우 YARN은 NodeManager가 일정 주기로 메모리를 체크하기 때문에 
순간적인 메모리 스파이크를 감지하지 못하고 넘어가는 경우가 있어서 K8s에 비해 
상대적으로 느슨하게 동작한다. 반면, K8s 의 경우 할당된 메모리 한도를 cgroup이 실시간으로 감지하고 
넘어서면 그 즉시 OOM Kill을 발생시킨다.`     

`따라서 k8s 에서는 executor memory의 약 20% ~ 40% 정도를 spark.executor.memoryOverhead 로
증가시키는 것을 권장한다.`

k8s 에서는 아래와 같이 [메모리를 구성](https://luminousmen.com/post/dive-into-spark-memory/)하는 것이 좋다.

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

### 1-5) YARN dedicated queue 대비 자원 활용율   

Spark on K8s 에서는 Apache YuniKorn 을 사용할 예정이며, YuniKorn 스케줄러의 계층형 Queue와 
우선순위 정책을 활용하여 자원 격리와 효율적인 공유를 동시에 달성하는지 확인한다.   

YuniKorn Queue의 guaranteed/max 설정과 preemption 정책으로 YARN Dedicated Queue 대비 
전체 자원 활용률이 향상되는지 확인한다.   


### 1-6) Karpenter Auto Scaling 및 Dynamic Resource Allocation 확인     

워크로드에 따라 노드가 동적으로 확장/축소 되는지 확인한다.  
또한, Spark on k8s에서 Dynamic Resource Allocation 동작을 Spark on YARN 과 비교한다.   


### 1-7) Spark on YARN 대비 성능 비교   

Spark on K8s의 Job 실행 성능이 기존 Spark on YARN 대비 허용 가능한 수준인지 확인한다.  
동일한 Spark Job을 CDP 와 K8s 환경에서 실행하여 실행시간, 자원 사용량, Shuffle 성능을 비교한다.   




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

