---
layout: post
title: "[Kafka] Apache Kafka 이해하기  "
subtitle: "pub-sub 모델, Broker, Topic, Partition "    
comments: true
categories : BigData
date: 2021-02-05
background: '/img/posts/mac.png'
---

# Kafka 란?   

데이터 파이프라인(Data Pipeline)을 구축할 때 가장 많이 고려되는 시스템 중 하나가 
카프카(Kafka)일 것이다. 아파치 카프카는 링크드인에서 처음 개발된 분산 메시징 시스템이다.   



## Publish-Subscribe 모델   

`카프카는 기본적으로 Publish-Subscribe 모델을 구현한 분산 메시징 시스템이다. 
pub-sub 모델은 데이터를 만들어내는 Producer, 소비하는 Consumer 그리고 이 둘 사이에서 
중재자 역할을 하는 브로커(Broker)로 구성된 느슨한 결합(Loosely Coupled)의 시스템이다.`   

Producer는 Broker를 통해 메시지를 발행(Publish)한다. 이 때 메시지를 전달할 대상을 
명시하지는 않으며 관련 메시지를 구독(Subscribe)할 Consumer가 Broker에게 요청하여 가져
가는 식이다. 마치 블로그 글을 작성하여 발행하면 블로그 글을 구독한 독자들이 
따로 읽어가는 형태를 생각하면 된다.   

> 반대되는 개념으로는 글을 작성한 Producer가 구독하려는 Consumer에게 직접 메일을 보내는 것을 생각하면 된다.   


<img width="509" alt="스크린샷 2021-02-09 오후 10 55 22" src="https://user-images.githubusercontent.com/26623547/107373890-5abbfd00-6b2a-11eb-9eee-5446e04b23b3.png">     

카프카 역시 카프카 클러스터로 메시지를 전송할 수 있는 Producer와 메시지를 읽어 갈수 있는 
Consumer 클라이언트 API를 제공한다. 그 밖에 데이터 통합을 위한 커넥터(Connector)와 스트림 처리를 위한 
스트림즈(Streams) API도 있지만 이 역시 크게 보면 Producer와 Consumer의 확장이라고 볼 수 있다.   

`카프카에서 Producer는 특정 토픽(Topic)으로 메시지를 발행할 수 있다. Consumer 역시 토픽의 메시지를 
읽어 갈 수 있다. 카프카에서 토픽은 Producer와 Consumer가 만나는 지점이라고 생각할 수 있다.`      

<img width="374" alt="스크린샷 2021-02-09 오후 11 28 03" src="https://user-images.githubusercontent.com/26623547/107377833-bbe5cf80-6b2e-11eb-9c24-b24a815ab0cf.png">   

카프카는 슈평적 확장(scale horizontally, scale out)을 위해 클러스터를 구성한다. 
카프카를 통해 유통되는 메시지가 늘어나면 카프카 브로커의 부담(Load)이 증가하게 되어 
클러스터의 규모를 확장할 필요가 있다. 카프카는 여러 브로커들의 클러스터링을 위해 
아파치 주키퍼(Apache ZooKeeper)를 사용한다. 주기퍼를 사용하면 브로커의 
추가 및 장애 상황을 간단하게 대응할 수 있다.   

카프카 클러스터 위에서 Producer가 전송한 메시지는 중복저장을 보장하게 된다. 
Producer가 메시지를 카프카 클러스터로 전송하면 브로커는 또 다른 브로커에게 
프로듀서의 메시지를 중복해서 저장한다. 만약 한 브로커에 장애가 생기더라도 
중복 저장된 복사본을 Consumer에게 전달 할 수 있으므로 장애 상황에 대비 할 수 있다.   

- - - 

## 카프카 구조   

카프카의 구조에 대해 알아보자.   

#### 1. 토픽과 파티션 그리고 세그먼트 파일   

`카프카에 전달되는 메시지 스트림의 추상화된 개념을 토픽(Topic)이라고 한다.
프로듀서는 메시지를 특정 토픽에 발행한다. 컨슈머는 특정 토픽에서 발행되는 
메시지를 구독할 수 있다. 즉, 토픽은 프로듀서와 컨슈머가 만나는 접점이라고 
생각하면 된다.`   


프로듀서가 메시지를 특정 토픽에 전송하면 카프카 클러스터는 토픽을 좀 더 세분화된 
단위인 파티션(Partition)으로 나누어 관리한다.    
기본적으로 프로듀서는 발행한 메시지가 어떤 파티션에 저장되는지 관여하지 않는다. (물론 
        메시지 키와 파티셔너를 이용하여 특정 파티션으로 메시지를 전송할 수 있도록 할 수도 있다.) 
각 파티션은 카프카 클러스터를 구성하는 브로커들이 고루 나눠 갖는다.    

> 카프카 클러스터의 브로커 중 한 녀석이 Controller가 되어 이 분배 과정을 담당한다. 컨트롤러는 
카프카 클러스터의 반장 역할이라고 보면 된다.   

특정 파티션으로 전달된 메시지에는 오프셋(Offset)이라고하는 숫자가 할당된다. 
오프셋은 해당 파티션에서 몇 번째 메시지인지 알 수 있는 ID 같은 개념이라고 
생각하면 된다. (배열의 인덱스 같은 역할)   
오프셋을 이용해서 컨슈머가 메시지를 가져간다. 몇 번째 오프셋까지 읽었다, 몇 번째 오프셋
부터 읽겠다는 요청을 할 수 있다. 오프셋은 파티션 내에 Unique한 값을 갖는다.   

<img width="469" alt="스크린샷 2021-02-09 오후 11 37 08" src="https://user-images.githubusercontent.com/26623547/107379774-9954b600-6b30-11eb-9a5a-d94dd014a78d.png">   

카프카 브로커는 파티션에 저장된 메시지를 파일 시스템에 저장한다. 
이 대 만들어지는 파일이 세그먼트 파일(Segment File)이다. 
기본적으로 1GB까지 세그먼트 파일이 커지거나 일정 시간이 지나면 
파일을 다시 만든다. 보존기간이 지난 메시지가 지워질 때 
세그먼트 파일 단위로 지워진다.

#### 2. 파티션의 복제(Replication)   

카프카는 고가용성(Hig Availability)을 제공하기 위해 파티션 데이터 복사본을 
유지할 수 있다. 몇개의 복사본을 저장할 것인지는 Replication Factor로 
저장할 수 있으며 토픽 별로 다르게 설정 할 수 있다.   



- - -


## 카프카의 특징   

링크드인에서 카프카를 개발 할 당시에도 다양한 메시징 시스템이 존재했었다. 하지만 
링크드인에서 처음 개발 될 때 기존 메시징 시스템과 비교하여 장점으로 
내세울 수 있는 몇 가지 특징을 가지도록 설계되었다.   

#### 1. 다중 프로듀서, 다중 컨슈머   





- - - 

**Reference**    

<https://soft.plusblog.co.kr/3>   
<https://medium.com/@umanking/%EC%B9%B4%ED%94%84%EC%B9%B4%EC%97%90-%EB%8C%80%ED%95%B4%EC%84%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0-%ED%95%98%EA%B8%B0%EC%A0%84%EC%97%90-%EB%A8%BC%EC%A0%80-data%EC%97%90-%EB%8C%80%ED%95%B4%EC%84%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0%ED%95%B4%EB%B3%B4%EC%9E%90-d2e3ca2f3c2>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

