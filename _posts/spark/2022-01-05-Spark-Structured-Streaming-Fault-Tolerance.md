---
layout: post
title: "[Spark] Structured Streaming Fault Tolerance"   
subtitle: ""    
comments: true
categories : Spark
date: 2022-01-05
background: '/img/posts/mac.png'
---

이번 글에서는 Structured Streaming이 장애가 
발생했을 때 어떻게 복구하는지 자세히 살펴보자.      

- - -   

## 1. Fault Tolerance   

Structured Streaming의 Fault Tolerance는 아래와 같이 각각 
나뉠 수 있는데 자세히 살펴보자.   

<img width="800" alt="스크린샷 2023-07-31 오후 10 58 04" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/5d854bb1-81c3-4b5c-819d-d2acd4c11492">    


### 1-1) Planner    

`planner는 항상 실행 전에 데이터 소스로부터 데이터를 어디에서 부터 어디까지 읽었는지에 대한 오프셋 정보를 write ahead log(WAL)을 통해 hdfs에 
저장해둔다.`      
`따라서, 각 Incremental Execution 정보들을 트래킹하고 있다.`   

<img width="900" alt="스크린샷 2023-07-31 오후 11 05 11" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7a72aa99-64f3-442b-87f4-22a47ce93101">    

그렇다면 planner가 장애가 발생했을 때는 어떻게 복구할까?   

<img width="500" alt="스크린샷 2023-07-31 오후 11 07 51" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/65fa0627-baa9-45f1-aeea-263ce1765475">    

`planner가 장애가 발생하게 되면, execution도 실패를 하게 된다.`       
`하지만 planner가 restart되면서 기존에 기록해두었던 오프셋 정보가 있기 때문에, 
    실패한 exectuion 부터 복구한다.`       

<img width="500" alt="스크린샷 2023-07-31 오후 11 11 56" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3711d682-6cf7-414d-a0d8-8e637a7ce637">    


<img width="500" alt="스크린샷 2023-07-31 오후 11 15 05" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/c278dc73-1eeb-41d8-a472-941718d713a8">


### 1-2) Sources     

`Sources는 대표적으로 Kafka, Kinesis, file 등이 있으며 중요한 것은 replayable해야 한다.`   

<img width="800" alt="스크린샷 2023-07-31 오후 11 20 23" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3cc91ad0-1a2d-4d88-ad08-dc3a1e945701">    

> kafka, kinesis, file은 replayable 하다.   

즉, 장애가 발생했을 때 저장해두었던 오프셋 정보를 이용하여 데이터 소스로 부터 다시 가져올 수 있어야 한다.    

### 1-3) State      

`State는 Incremental Execution 1에 결과값을 Incremental Execution2에 전달하는 역할을 하며, 
기본적으로 메모리에 가지고 있다.`    

> 메모리에 기본적으로 가지고 있기 때문에 동일하게 WAL 방식으로 디스크에 기록해 둔다.    

`또한 Exectuion 1에서 2로 전달한 state와 2에서 3으로 전달한 state가 각각 다르기 때문에 
버전으로 나누어서 관리되고 있다.`      

`Planner는 정확하게 특정 Exectuion에서 어떠한 state를 사용해야 하는지 정보를 알고 있다.`   

<img width="850" alt="스크린샷 2023-07-31 오후 11 22 13" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/fef9ef17-49cc-4217-b267-d456bc930c62">    

따라서, State 역시 WAL에 의해 정보가 기록되기 때문에 장애 발생시 복구가 가능하다.   

### 1-4) Sink      

`기본적으로 장애가 발생하면 recomputation을 진행하기 때문에 중복으로 sink에 커밋될 수 있다.`   
`하지만 아무리 반복하더라도 결과는 동일하게 처리하도록 디자인 되어 있다.`  

<img width="800" alt="스크린샷 2023-07-31 오후 11 28 44" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/8c991506-76d2-49c4-8c9b-95d39620a869">   


- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

