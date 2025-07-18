---
layout: post
title: "[Kafka] Apache Kafka 이해하기  "
subtitle: "pub-sub 모델, Broker, Topic, Partition, Zookeeper "    
comments: true
categories : Kafka
date: 2021-02-09
background: '/img/posts/mac.png'
---

# Kafka 란?  

카프카는 2011년 미국 링크드인에서 출발했다. 카프카는 링크드인 웹사이트에서 
생성되는 로그를 처리하여 웹사이트 활동을 추적하는 것을 목적으로 개발되었다.   
당시 링크드인이 실현하려는 목표는 아래와 같다.   

- 높은 처리량으로 실시간 처리한다.   
- 임의의 타이밍에서 데이터를 읽는다.   
- 다양한 제품과 시스템에 쉽게 연동한다.   
- 메시지를 잃지 않는다.    

링크드인은 위의 목표를 실현하기 위해 기존에 제공하고있는 메시지 큐를 고려했지만, 
    요구사항을 포괄적으로 해결할 수 있는 제품이 없기 때문에 카프카를 개발했다.   

메시지 큐의 목적은 단순하게 메시지를 한곳에 던지고 그걸 필요한 주체가 가져가서 처리한다.   
우선 메시지 큐를 가장 많이쓰는 서비스는 로그 관리이며, `메시지 큐를 사용했을 때 
장점으로는 Queue에 넣기 때문에 비동기로 처리할 수 있으며 어플리케이션과 
분리할 수 있다는 점이 있다. 또한, 실패시 재처리가 가능하며, 다수의 프로세스들이 
큐에 메시지를 보낼 수 있다 라는 장점이 있다.`        

대표적인 메시징 시스템으로 Kafka, RabbitMQ, Active MQ가 있으며, 
    기본적인 메시지 큐의 구조는 아래와 같은 순서로 이루어진다.   

> Producer(Sender) -> Queue(Message) -> Consumer(Receiver)    

어떻게 보면 메시지를 바로 던지는게 더 빠르지 않은가? 라고 생각을 하게 된다.   

일단 기존 동기화 방식을 쓴다면 많은 데이터가 전송될 경우 병목이 생기고 
뒤에 들어오는 모든 요청들이 딜레이가 되게 된다. 그렇기 때문에 중간에 미들웨어에게 
전송만은 위임해서 순차적으로 처리하는 것이다. 하지만 이럴 경우 서버 성능 저하에 
대해서 이점을 가질수 있겠지만 보편적으로 즉각적인 서비스는 힘들 수 있다. 
어느 한쪽이라도 제대로 받쳐주지 못하면 결국은 다시 병목이다.    
그렇기 때문에 용도에 맞는 메시지큐를 써야하고 환경에 맞는 설정이 필요하다.   

#### RabbitMQ vs Kafka  

메시지큐는 다양하지만, 주변에서 많이 사용되는 RabbitMQ와 Kafka를 간단하게 비교해보자.   

분산, 고성능, 대용량, 노드장애 대응을 추구한다면 카프카를 선택하고, 굳이 분산까지 해가며 트래픽을 감당할 
규모가 아니라면 오히려 RabbitMQ가 좋은 선택일 수도 있다.      

RabbitMQ는 Kafka에 비교하면 역사와 전통을 자랑할 정도로 성숙도가 높다. 큐의 다양한 기능이 
필요하다면 RabbitMQ 이고, 속도와 안정성이 우선시 되는 시스템이라면 Kafka를 권장한다.   

카프카는 다른 메시징 시스템과는 다른 특징이 있다.  

`기존의 메시징 시스템에서는 broker가 consumer에게 메시지를 push해 주는 방식인데 반해, 
    Kafka는 consumer가 broker로부터 직접 메시지를 가지고 가는 pull 방식이다. 따라서, 이 방식 덕분에 consumer의 처리 능력에 따라 
    메시지를 조절할 수 있어 과부하를 줄이고 안정적인 처리를 할 수 있다.`      

`또한, 기존의 메시징 큐 시스템은 데이터를 consume 했을 때 데이터가 사라지지만, 
    카프카는 데이터가 그대로 유지되어 재사용이 가능하다.`    

#### Kafka 사용 이유?   

<img width="900" alt="스크린샷 2021-06-11 오후 1 45 51" src="https://user-images.githubusercontent.com/26623547/121632640-4b3ec780-cabc-11eb-9a0a-5abf1e1a1e6a.png">    


카프카를 사용하기 전에는 데이터를 전달할 때 end-to-end 연결방식의 아키텍처를 주로 사용했다.   
이는 데이터를 전달해주는 Source가 있고 데이터를 받는 Target이 있다고 했을 때 
시스템이 복잡해질수록 의존관계가 강해지기 때문에 유지보수가 어렵다는 
단점이 있다.   

<img width="650" alt="스크린샷 2021-04-17 오후 6 39 29" src="https://user-images.githubusercontent.com/26623547/115108640-8a650680-9fac-11eb-8770-3f666315678f.png">   

카프카 사용 후에는 아래와 같이 Source와 Target을 분리하여 의존성을 
낮추고 유연한 아키텍처를 구성할 수 있다.   

<img width="650" alt="스크린샷 2021-04-17 오후 6 40 17" src="https://user-images.githubusercontent.com/26623547/115108642-8d5ff700-9fac-11eb-9101-f5ec714a591f.png">   


- - - 

## 카프카의 특징

링크드인에서 카프카를 개발 할 당시에도 다양한 메시징 시스템이 존재했었다. 하지만
링크드인에서 처음 개발 될 때 기존 메시징 시스템과 비교하여 장점으로
내세울 수 있는 몇 가지 특징을 가지도록 설계되었다.

##### 1. High throughput message capacity

`짧은 시간 내에 엄청난 양의 데이터를 컨슈커까지 전달할 수 있다.`
파티션을 통한 분산처리가 가능하기 때문에 데이터 양이 많아 질수록
컨슈머 개수를 늘려서 병렬처리가 가능하고 이를 통해
데이터 처리를 더욱 빠르게 할 수 있다.

##### 2. Scalability와 Fault tolerant

`카프카는 확장성이 뛰어 나다.`
이미 사용되고 있는 카프카 브로커가 있다고 하더라도 신규 브로커 서버를
추가해서 수평 확장이 가능하다.
또한, 이렇게 늘어난 브로커 중 몇대가 죽더라도 이미
replica로 복제된 데이터는 안전하게 보관되어 있으므로
복구하여 처리할 수 있다.

##### 3. Undeleted log

`다른 플랫폼과 달리 카프카 토픽에 들어간 데이터는 컨슈머가
데이터를 가지고 가더라도 데이터가 사라지지 않는다.`

하지만 카프카에서는 컨슈머의 그룹 아이디만 다르다면 동일한
데이터도 각각 다른 형태로 처리할 수 있다.


- - -     


## Publish-Subscribe(발행 / 구독) 모델   

`카프카는 기본적으로 Publish-Subscribe 모델을 구현한 분산 메시징 시스템이다. 
pub-sub 모델은 데이터를 만들어내는 Producer, 소비하는 Consumer 그리고 이 둘 사이에서 
중재자 역할을 하는 브로커(Broker)로 구성된 느슨한 결합(Loosely Coupled)의 시스템이다.`   

Producer는 Broker를 통해 메시지를 발행(Publish)한다. 이 때 메시지를 전달할 대상을 
명시하지는 않으며 관련 메시지를 구독(Subscribe)할 Consumer가 Broker에게 요청하여 가져
가는 식이다. 마치 블로그 글을 작성하여 발행하면 블로그 글을 구독한 독자들이 
따로 읽어가는 형태를 생각하면 된다.   

즉, pub-sub은 메세지를 특정 수신자에게 직접적으로 보내주는 방식이 아니다.    
publisher는 메세지를 topic을 통해서 카테고리화 한다. 분류된 메시지를 받기를 
원하는 receiver는 그 해당 topic을 구독(subscribe)함으로써 메세지를 읽어 올 수 있다.   
`publisher는 topic에 대한 정보만 알고 있고, 마찬가지로 subscriber도 topic만 바라본다. publisher와 
subscriber는 서로 모르는 상태다.`   

> 간단한 예는, 신문사에서 신문의 종류(topic)에 메세지를 쓴다. 우리는 그 해당 신문을 구독한다.   

> 반대되는 개념으로는 글을 작성한 Producer가 구독하려는 Consumer에게 직접 메일을 보내는 것을 생각하면 된다.   


<img width="509" alt="스크린샷 2021-02-09 오후 10 55 22" src="https://user-images.githubusercontent.com/26623547/107373890-5abbfd00-6b2a-11eb-9eee-5446e04b23b3.png">     

카프카 역시 카프카 클러스터로 메시지를 전송할 수 있는 Producer와 메시지를 읽어 갈수 있는 
Consumer 클라이언트 API를 제공한다. 그 밖에 데이터 통합을 위한 커넥터(Connector)와 스트림 처리를 위한 
스트림즈(Streams) API도 있지만 이 역시 크게 보면 Producer와 Consumer의 확장이라고 볼 수 있다.   

`정리해보면, 카프카에서 Producer는 특정 토픽(Topic)으로 메시지를 발행할 수 있다. Consumer 역시 토픽의 메시지를 
읽어 갈 수 있다. 카프카에서 토픽은 Producer와 Consumer가 만나는 지점이라고 생각할 수 있다.`      



- - - 

## 카프카 구조   

카프카의 구조에 대해 알아보자.   

<img width="700" alt="스크린샷 2021-04-17 오후 5 00 07" src="https://user-images.githubusercontent.com/26623547/115106214-72868600-9f9e-11eb-83c9-8163cc486654.png">   

#### 1. 토픽과 파티션 그리고 세그먼트 파일   

`카프카에 전달되는 메시지 스트림의 추상화된 개념을 토픽(Topic)이라고 한다.
프로듀서는 메시지를 특정 토픽에 발행한다. 컨슈머는 특정 토픽에서 발행되는 
메시지를 구독할 수 있다. 즉, 토픽은 프로듀서와 컨슈머가 만나는 접점이라고 
생각하면 된다.`   

> 토픽은 이해하기 쉽게 큐 라고 생각하면 되며 Producer가 큐에 데이터를 적재 해놓으면 
Consumer가 큐에서 데이터를 읽어 간다.    

`프로듀서가 메시지를 특정 토픽에 전송하면 카프카 클러스터는 토픽을 좀 더 세분화된 
단위인 파티션(Partition)으로 나누어 관리한다.`        
기본적으로 프로듀서는 발행한 메시지가 어떤 파티션에 저장되는지 관여하지 않는다. (물론 
        메시지 키와 파티셔너를 이용하여 특정 파티션으로 메시지를 전송할 수 있도록 할 수도 있다.) 
각 파티션은 카프카 클러스터를 구성하는 브로커들이 고루 나눠 갖는다.    

> 카프카 클러스터의 브로커 중 한 녀석이 Controller가 되어 이 분배 과정을 담당한다. 컨트롤러는 
카프카 클러스터의 반장 역할이라고 보면 된다.   

위의 내용을 정리를 해보면, 메세지는 topic에 저장되고, topic은 여러개의 
파티션으로 나눠 질 수 있다. 파티션내의 한 칸은 로그라고 불린다. 데이터는 
한 칸의 로그에 순차적으로 append 된다.    

> Log는 Key, value, timestamp로 구성된다.   

##### 그러면, 왜 하나의 토픽에 여러개의 파티션을 나눠서 메세지를 쓸까?    

하나의 topic에 하나의 파티션만 가진 상황과 하나의 topic에 
여러개의 파티션을 가진 경우를 비교해 보면 이해가 쉽다.    

메세지는 카프카의 해당 토픽에 쓰여진다. 쓰는 과정도 시간이 소비된다. 
몇 천건의 메세지가 동시에 카프카에 쓰여진다고 생각해보자. 그러면 하나의 
파티션에 순차적으로 append 될 텐데, 처리하는게 조금 버겁지 않을까?    
`그렇기 때문에 여러개의 파티션을 두어서 분산저장을 하는 것이다.`   

병렬로 처리하기 때문에 시간이 절약되지만 항상 trade-off가 존재한다.   

`한번 늘린 파티션은 절대로 줄일 수 없기 때문에, 파티션을 늘려야 하는건 
충분히 고려해 봐야 한다.`   

또한, 파티션을 늘렸을 때 메세지가 Round-robin방식으로 쓰여진다. 즉, 순차적으로 
메세지가 쓰여지지 않는다는 말이다. 

`즉, 순차적으로 메세지가 쓰여지지 않는다는 말이다. 이 말은, 나중에 해당 토픽을 
소비하는 소비자가 만약에 메세지의 순서가 엄청나게 중요한 모델이라면 
순차적으로 소비됨을 보장해 주지 않기 때문에 상당히 위험한 것이다.`   

<img width="469" alt="스크린샷 2021-02-09 오후 11 37 08" src="https://user-images.githubusercontent.com/26623547/107379774-9954b600-6b30-11eb-9a5a-d94dd014a78d.png">   


`특정 파티션으로 전달된 메시지에는 오프셋(Offset)이라고하는 숫자가 할당된다. 
오프셋은 해당 파티션에서 몇 번째 메시지인지 알 수 있는 ID 같은 개념이라고 
생각하면 된다. (배열의 인덱스로 이해하자)`     
오프셋을 이용해서 컨슈머가 메시지를 가져간다. 몇 번째 오프셋까지 읽었다, 몇 번째 오프셋
부터 읽겠다는 요청을 할 수 있다. 오프셋은 파티션 내에 Unique한 값을 갖는다.   


`카프카 브로커는 파티션에 저장된 메시지를 파일 시스템에 저장한다. 
이 때 만들어지는 파일이 세그먼트 파일(Segment File)이다.`     
기본적으로 일정 용량 세그먼트 파일이 커지거나 일정 시간이 지나면 삭제 또는 
압축된다.(옵션 지정 가능)      
이때, 보존기간이 지난 메시지가 지워질 때 
세그먼트 파일 단위로 지워진다.   


- - - 

#### 2. Producer, Consumer   

Producer는 메세지를 생산하는 주체이다. 메세지를 만들고 Topic에 메세지를 쓴다. 
Producer는 Consumer의 존재를 알지 못한다.   

Consumer는 소비자로써 메세지를 소비하는 주체이다. 역시 Producer의 존재를 모른다.   
해당 topic을 구독함으로써, 자기가 스스로 조절해가면서 소비할 수 있는 것이다. 
소비를 했다는 표시는 해당 topic내의 각 파티션에 존재하는 offset의 위치를 
통해서 이전에 소비했던 offset위치를 기억하고 관리하고 이를 통해서, 
    혹시나 `Consumer가 죽었다가 다시 살아나도, 전에 마지막으로 읽었던 
    위치에서 부터 다시 읽어들일 수 있다. 그렇기 때문에 fail-over에 대한 
    신뢰가 존재한다.`        

<img width="578" alt="스크린샷 2021-04-17 오후 4 42 51" src="https://user-images.githubusercontent.com/26623547/115105783-00ad3d00-9f9c-11eb-8e58-cf572c18dd97.png">    

카프카에서는 Consumer 그룹이라는 개념이 나온다. 말 그대로 consumer들의 묶음이고, 
    기본적인 룰이 하나가 존재한다.   




- - - 

#### 3. 파티션의 복제(Replication)   

카프카는 고가용성(High Availability)을 제공하기 위해 파티션 데이터 복사본을 
유지할 수 있다. 몇개의 복사본을 저장할 것인지는 Replication Factor로 
저장할 수 있으며 토픽 별로 다르게 설정 할 수 있다.   

> Replication 갯수를 많이 할수록 고가용성을 유지하므로 안전할 수 있지만, 그만큼 
브로커 리소스 사용량도 많아지기 때문에 적절히 사용해야 한다.    

local에 broker 3대를 띄우고(replica-factor=3)로 복제되는 경우를 살펴보자.  

`3대 이상의 브로커를 사용할 때 Replication 갯수를 3개로 하는 것을 추천한다.`      

복제는 수평적 스케일 아웃이다. broker 3대에서 하나의 서버만 leader가 되고 
나머지 둘은 follower 가 된다. producer가 메세지를 쓰고, consumer가 
메세지를 읽는건 오로지 leader가 전적으로 역할을 담당한다.   

**나머지 follower들의 역할은?**   

나머지 follower들은 leader와 싱크를 항상 맞춘다. 해당 option이 있다. 혹시나 
leader가 죽었을 경우, 나머지 follower 중에 하나가 leader로 선출되어서 
메세지의 쓰고/읽는 것을 처리한다.   


- - - 

#### 4. Broker, Zookeeper    

`broker는 카프카의 서버를 칭한다.`    
broker.id = 1..n으로 함으로써 동일한 노드내에서 
여러개의 broker서버를 띄울 수도 있다.   

> 보통 3개 이상의 broker로 구성하는 것을 권장 한다.   

<img width="500" alt="스크린샷 2021-04-17 오후 6 44 36" src="https://user-images.githubusercontent.com/26623547/115108762-28f16780-9fad-11eb-83f3-1d555c0d5c50.png">   

`zookeeper는 이러한 분산 메세지 큐의 
정보를 관리해 주는 역할을 하며, 리더 채택, 클러스터의 설정정보 관리하여 서버들이 
공유하는 데이터를 관리한다.`        

> 보통 토픽의 offset 정보등을 저장하고 있고 zookeeper는 과반수 투표방식으로 결정 하기 때문에 
홀수로 구성해야 하고, 과반수 이상 살아 있으면 정상으로 동작한다.   

> zookeeper 3대일 경우 2대 이상, zookeeper 5대일 경우 3대 이상     


kafka를 띄우기 위해서는 클러스터를 관리하는 zookeeper가 반드시 실행되어야 한다.

<img width="374" alt="스크린샷 2021-02-09 오후 11 28 03" src="https://user-images.githubusercontent.com/26623547/107377833-bbe5cf80-6b2e-11eb-9c24-b24a815ab0cf.png">

하지만, 최근에는 아파치 카프카의 새로운 메커니즘인 KRaft를 사용하면서 
주피커의 의존성을 제거하고, 카프카 클러스터 내 컨트롤러가 선출된 후 
메타데이터를 직접 관리하도록 제공하고 있다.   

기존에 주키퍼를 사용하면서 성능 문제와 여러 관리적인 문제점들을 개선하였고, 
    이로 인해 유지보수가 단순화되고 병목현상을 줄일 수 있기 있게 되었다.     



- - - 

#### 5. 설정 방식   

`Producer config 정보에서 ack(acknowlegement) 옵션이 있다. 메세지를 보내고 
잘 받았다고 확인받는 메세지라고 보면된다.`         
`보통 ack = 0, 1, all 옵션 중 한개를 선택하게 된다.`        

완전하게 ack=all로 하게 되면, producer가 메세지를 리더한테 보내고 쓰여지고, 
    나머지 follower들이 똑같이 메세지를 다 복사할 때까지 기다린다. 복사까지 
    완벽하게 되면, 그제서야 응답값을 producer에게 보낸다. (메세지 잘 쓰여졌고, 
            복사까지 잘 됬어!)라고 이렇게 구성하면 장점은 leader가 어느 순간 
    뻗어도, 복제 된 데이터가 follower들에게 있으니, 메세지의 유실이 전혀 없다는 
    장점이 있지만 복제할 때까지 기달려야 해서 네트워크를 타고 흐르는 시간을 
    기달려야 하는 비용이 든다.        

ack=0으로 설정하게 되면 리더에게 데이터를 전송하고 응답값은 받지 않는다. 그렇기 때문에 
데이터가 정상적으로 전송되었는지, follower들에게도 잘 전송이 되었는지 확인이 불가능하다. 
즉, 속도는 빠르지만 데이터 유실 가능성이 있다.   

그래서 보통 default(ack=1)로 한다. 즉, 리더한테만 쓰여지만 바로 응답값을 받을 수 있도록 설정한다.     

- - -


**Reference**    

<https://www.popit.kr/kafka-%EC%9A%B4%EC%98%81%EC%9E%90%EA%B0%80-%EB%A7%90%ED%95%98%EB%8A%94-%EC%B2%98%EC%9D%8C-%EC%A0%91%ED%95%98%EB%8A%94-kafka/>   
<https://towardsdatascience.com/10-configs-to-make-your-kafka-producer-more-resilient-ec6903c63e3f>   
<https://needjarvis.tistory.com/604>   
<https://kafka.apache.org/documentation/#quickstart>   
<https://victorydntmd.tistory.com/344>   
<https://soft.plusblog.co.kr/3>   
<https://medium.com/@umanking/%EC%B9%B4%ED%94%84%EC%B9%B4%EC%97%90-%EB%8C%80%ED%95%B4%EC%84%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0-%ED%95%98%EA%B8%B0%EC%A0%84%EC%97%90-%EB%A8%BC%EC%A0%80-data%EC%97%90-%EB%8C%80%ED%95%B4%EC%84%9C-%EC%9D%B4%EC%95%BC%EA%B8%B0%ED%95%B4%EB%B3%B4%EC%9E%90-d2e3ca2f3c2>   
<https://www.youtube.com/watch?v=VJKZvOASvUA>   
<https://ellune.tistory.com/29>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

