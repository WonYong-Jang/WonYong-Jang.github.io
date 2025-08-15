---
layout: post
title: "[Python] Kafka & Spark 활용한 Realtime Datalake 구성하기 (2)"  
subtitle: "아파치 카프카와 Confluent Kafka 의 Consumer 메커니즘 비교(Commit, Partition Assignment, 옵션)"   
comments: true
categories : Data-Engineering   
date: 2025-07-05
background: '/img/posts/mac.png'
---


## 1. Confluent Kafka를 이용하여 Consumer 구현   

Confluent Kafka를 이용하여 Consumer 구현은 [링크](https://docs.confluent.io/kafka-clients/python/current/overview.html)를 참고하여 진행할 예정이다.   

먼저 Consumer를 구현하기 위해 필요한 개념에 대해서 살펴보자.   

### 1-1) Consumer Commit

Producer와 달리 Consumer는 commit 이라는 단계가 존재한다.    

`commit()을 수행하게 되면 카프카 내부 토픽인 __consumer_offsets 토픽에 commit 내용이 바이너리 형식으로 저장된다.`   

> commit 내용은 파티션당 offset 정보가 저장된다.   
> 실제 처리 완료한 offset은 commit한 offset의 -1 이며, offset 2번까지 처리 완료했다면 offset 3번으로 저장된다.   

여기서 commit 방식은 sync 방식과 async 방식이 존재하며 자세히 살며보자.   

<img src="/img/posts/data-engineering/08-15/스크린샷 2025-08-15 오후 3.28.25.png">  

Consumer는 브로커로부터 메시지를 꺼내온 후 로직을 처리하며, 처리가 완료된 후 commit을 진행한다.    
`그 후 commit에 대한 ack 응답을 받은 후 그 다음 메시지를 꺼내와서 진행하는 것이 동기 커밋이다.`    

`반대로, 비동기 커밋은 로직 처리 후 commit을 하게 되는데, 그에 대한 ack 응답을 받지 않고 바로 그 다음 메시지를 꺼내와 처리를 하는 것이다.`   

```python
# sync
consumer.commit()

# async
consumer.commit(asynchronous=True)
```

async 방식이 성능상 유리하며, sync 방식이 정합성 관점에서 약간 유리하지만 sync 방식도 중복 처리를 할 가능성이 있다.    

sync와 async 방식 각각 로직 처리 완료 후 commit 직전에 장애가 발생하여 
rebalance가 발생했다고 가정해보자.    
이때는 다른 Consumer가 이전까지 처리된 커밋을 확인하고 로직을 다시 수행하게 되어 중복처리를 한다.   


`따라서 Consumer를 개발할 때 가장 중요한 것은 멱등성 보장을 위해 중복처리 가능성이 있다는 것을 염두하여 개발 해야 한다.`   

> Producer는 멱등성을 보장해주는 옵션이 존재하지만 Consumer는 존재하지 않으며, 직접 로직을  개발해주어야 한다.  

### 1-2) enable.auto.commit

Consumer의 파라미터 중 enable.auto.commit 파라미터가 존재하며 자동으로 commit을 수행할지를 결정한다.   

`Default는 true 이며, 5초에 한번씩 commit 수행하나 Rebalance 상황에서 메시지 중복 또는 유실 발생 가능성이 있으니 주의해야 한다.`    

> enable.auto.commit 이 true 일 경우 auto.commit.interval.ms 가 default로 5s 이다.    

<img src="/img/posts/data-engineering/08-15/스크린샷 2025-08-15 오후 4.00.24.png">

`위 그림에서 왼쪽 그림은 메시지 유실이 발생할 수 있는 케이스이다.`.     

offset 정보를 301 부터 310 까지 처리를 하는데 로직 처리가 5초 이상이 수행되어 
자동으로 커밋이 되었다고 가정해보자.  
그 후 처리 도중에 에러가 발생하여 rebalance가 발생했고, 그 다음 Consumer가 
커밋 정보를 확인했을 때 301 ~ 310 에 대한 오프셋은 모두 완료 처리된 것으로 확인하게 된다.   
따라서 그 이전 메시지를 모두 처리하지 못하고 311 부터 처리를하게 되어 메시지 유실이 발생하게 된다.   

`오른쪽 그림은 메시지 중복이 발생할 수 있는 케이스이다.`   

이번에는 로직처리가 굉장히 빠르게 처리되고 있고 offset 301 ~ 310 까지 로직처리가 완료 되고 offset 311 ~ 319 처리 도중 장애가 발생하여 rebalance가 발생했다고 해보자.  
그러면 자동 커밋에 의해 마지막으로 커밋된 곳은 301 전 이기 때문에, 이미 처리한 301 ~ 310 에 대한 offset을 중복으로 처리하게 된다.   




- - -

Reference

<https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/VPC_NAT_Instance.html>   
<https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/work-with-nat-instances.html>   
<https://www.inflearn.com/course/kafka-spark-realtime-datalake/dashboard>  
<https://docs.confluent.io/kafka-clients/python/current/overview.html>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







