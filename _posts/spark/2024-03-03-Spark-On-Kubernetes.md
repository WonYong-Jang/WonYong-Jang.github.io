---
layout: post
title: "[Spark] On Kubernetes"   
subtitle: "EMR Cluster 에서의 Spark와 비교"       
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

