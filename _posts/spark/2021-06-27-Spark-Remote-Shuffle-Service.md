---
layout: post
title: "[Spark] Remote Shuffle Serivce"
subtitle: "" 
comments: true
categories : Spark
date: 2025-10-06
background: '/img/posts/mac.png'
---



## 1. External Shuffle Service(ESS)      

Spark는 YARN에서 built-in External Shuffle Service(ESS)를 제공하고 있다.   
`Spark executor가 shuffle 데이터를 생성하면, 그 데이터는 노드 로컬의 
디스크(NodeManager의 local-dir)에 저장되고, executor가 종료되더라도 ESS 덕분에 
shuffle 결과를 재사용할 수 있게 된다.`     
그렇기 때문에 Dynamic Allocation 사용시에도 shuffle 데이터 손실을 막을 수 있다.  

> spark.shuffle.service.enabled 옵션을 활성화하게 되면, spark executor는 ESS에 등록한다.   

대표적으로 YARN ESS의 mechanisim 은 아래와 같다.   

- Register with ESS   
    - Executor가 실행하면서 `같은 node`의 nodemanager의 ESS에 shuffle 서비스 사용을 등록   
        - 즉, 같은 노드의 executor 외부(external)의 shuffle service   
    - Executor는 ESS의 locality를 이용, Executor와 ESS는 N:1의 관계   

- Generate shuffle file   
    - Map task의 결과를 partition hash 값을 키로 메모리에 보관하다가 필요시 disk에 저장   
    - Executor는 Map stage의 마지막에 모든 데이터를 병합, 정렬하여 local dir에 `shuffle data file(partition 키로 구분되는 shuffle block의 모음)과 index file 한쌍을 생성, 저장`   

- Fetch shuffle blocks   
    - Reduce task가 실행될 때 spark driver에 input shuffle block 위치를 조회   
    - `Reduce task는 ESS와 connection을 맺고 shuffle data를 요청, ESS는 index file을 참고하여 shuffle data를 reduce task로 전송`      

하지만, Spark ESS의 문제점은 아래와 같다.  

ESS 기반이라면 shuffle data를 저장한 노드는 장시간 살아 있어야 하기 때문에, 

- Shuffle 중 비효율적인 disk I/O  
- 불균일한 disk 배분   
- 


## Remote Shuffle Service   

### Apache Uniffle

### 

- - -

Reference

<https://yangwwei.github.io/2021/11/12/Spark-remote-shuffling-service-k8s.html?utm_source=chatgpt.com>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







