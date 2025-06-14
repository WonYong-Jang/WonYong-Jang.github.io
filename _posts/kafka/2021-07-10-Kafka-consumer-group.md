---
layout: post
title: "[Kafka] Apache Kafka Consumer Group"
subtitle: "컨슈머 그룹을 사용하는 이유와 파티션 수의 관계 / 컨슈머 그룹 리밸런싱(Rebalancing)"       
comments: true
categories : Kafka
date: 2021-07-10
background: '/img/posts/mac.png'
---

이번 글은 처음 카프카를 접했을 때 가장 이해가 안되고 어려웠던 Consumer Group에 대해서 
다룰 예정이며 [링크](https://www.popit.kr/kafka-consumer-group/)를 참고하였다.   
카프카 전반적인 개념은 [이전글](https://wonyong-jang.github.io/kafka/2021/02/09/Kafka-basic-concept.html)을 
참고하자.   

- - - 

## 1. 컨슈머 그룹   
 
Kafka에서 Consumer Group은 동일한 토픽을 구독하는 Consumer들의 집합이다.   
기존의 메시지 큐 솔루션에서는 Consumer가 메시지를 가져가면, 해당 메시지는 
큐에서 삭제된다.   
즉, 하나의 큐에 대하여 여러 Consumer가 붙어서 같은 메시지를 가져갈 수 없다.   
하지만, Kafka는 Consumer Group 마다 해당 topic의 partition에 대한 별도의 
offset을 관리할 수 있도록 제공한다.   

컨슈머 그룹에 대해 보다 쉽게 이해하기 위해 반드시 필요한 용어 몇가지만 살펴보자.   

`먼저 컨슈머 그룹이란 컨슈머 인스턴스들을 대표하는 그룹이며, 컨슈머 인스턴스(Consumer Instance)란 
하나의 프로세스 또는 하나의 서버라고 할 수 있다.`       

> 여기서는 이해를 돕기 위해서 하나의 서버로 표현할 예정이다.   

`또한, Offset이란 파티션안에 데이터 위치를 유니크한 숫자로 표시한 것을 offset이라 부르고, 
    컨슈머는 자신이 어디까지 데이터를 가져갔는지 offset을 이용해서 관리를 한다.`       

위에서 설명한 간단한 이론을 바탕으로, 아래 그림을 살펴보자.   

<img width="446" alt="스크린샷 2021-07-10 오후 3 47 03" src="https://user-images.githubusercontent.com/26623547/125154690-2c545380-e196-11eb-8f88-841e3f63278b.png">   

위 그림은 2개의 컨슈머 그룹을 나타내고 있다. 2개의 컨슈머 그룹은 서로를 구분하기 위한 이름으로 
consumer-01, consumer-02라고 되어 있고, consumer-01 그룹의 구성원은 4개의 서버로 구성되어 있으며, 
    consumer-02 그룹의 구성은 6개의 서버로 구성되어 있다.   
    각각의 그룹내의 서버들끼리는 서로의 정보를 공유하고 있어, 만약 하나의 서버가 Down되더라도 
    다른 서버가 그 서버의 역할을 할 수 있게 된다. 아래에서 좀 더 자세히 살펴보자.   

- - - 

## 2. 컨슈머 그룹의 목적   

위에서 컨슈머 그룹이 어떻게 구성되어 있는지에 대해 설명했다. 컨슈머 그룹을 이해하려면 
컨슈머 그룹이 왜 필요한지에 대해 먼저 알야아 한다. 컨슈머 그룹을 사용하는 이유는 
사용 방법에 따라 여러가지가 있을 수 있지만 여기서는 2가지 이유를 살펴보자.   

`첫번째 이유는 가용성에 대한 부분이다.` 아래 그림을 보자.   

<img width="441" alt="스크린샷 2021-07-10 오후 3 55 27" src="https://user-images.githubusercontent.com/26623547/125154883-4b071a00-e197-11eb-8a48-301a516fb7d4.png">   

위 그림은 peter-topic이라는 토픽을 consumer-01 그룹이 데이터를 가져가고 있는 예제이다. consumer-01 그룹은 
하나의 컨슈머 인스턴스가 있다. 안정적으로 운영하던 중 컨슈머 인스턴스 server1이 장애가 발생했다. 장애가 
발생하였기 때문에 server1은 더 이상 자신의 역할을 못하게 되었고, 데이터를 가져오는 작업도 중단되었다.   
하지만 위의 에제와 달리 컨슈머 그룹에서 1대의 컨슈머 인스턴스가 아닌 4대의 컨슈머 인스턴스로 
운영중이였다면 어떨까? 그리고 4대의 서버 중 하나의 서버에서 장애가 발생하였다면 어떻게 되었을까?   
아래 그림으로 살펴보자.   

<img width="442" alt="스크린샷 2021-07-10 오후 3 55 37" src="https://user-images.githubusercontent.com/26623547/125154885-4d697400-e197-11eb-9139-8baa2a7297b2.png">   

위 그림은 server1이 장애가 발생한 예제이다. consumer-01 그룹은 4대의 서버로 구성되어 있어 server1만 
제외되고, 나머지 서버 3대로 멈추지 않고 계속해서 작업을 이어갈 수 있다.   
이러한 이유 때문에 컨슈머 그룹을 사용하고, 한대가 아닌 여러대의 컨슈머 인스턴스를 
구성하여 안정성을 확보하는 것이 필요하다.    

`두번째 이유는 컨슈머 그룹들을 구분하고, 컨슈머 그룹들은 자신의 그룹에 대한 offset 관리를 하기 
때문이다.`    

개념적인 설명을 위해서 몇가지 조건을 가정해보자.   
A 사용자와 B사용자가 있고, 둘다 동일한 토픽에 대해서 데이터를 가져가길 원하는 상황이며, 
  컨슈머 그룹이라는 것이 없다고 가정해보자.   

컨슈머 그룹이 없기 때문에, 카프카에서는 컨슈머들을 구분할 수 없고, 또한 컨슈머들은 
자신들만의 offset을 유지할 수 없다.   

그렇기 때문에 카프카에서는 컨슈머 그룹마다 컨슈머 그룹 네임을 지정하여 각각의 그룹들을 구분하고, 
    각각의 컨슈머 그룹별로 자신만의 offset을 관리 하게 된다.   

즉, 컨슈머 그룹을 사용하게 되면 동일한 토픽을 여러 컨슈머 그룹이 컨슘하더라도 서로 각기 다른 
offset을 가지고 데이터의 손실 없이 가져가기를 할 수 있게 된다.   

여기서 중요한 점은 컨슈머 그룹을 만들때, 미리 동일한 이름의 컨슈머 그룹이 있는지를 체크 해보고 
만드는게 중요하다.   

- - - 

## 3. 컨슈머 그룹과 파티션 수의 관계     

먼저 이 주제를 이해하기 위해서는 컨슈머 인스턴스의 제약사항에 대해 
알고 있어야 한다.   

- `카프카에서는 하나의 파티션에 대해 컨슈머 그룹내 하나의 컨슈머 인스턴스만 
접근할 수 있다. 파티션에 대해 한명의 reader만 허용하여 데이터를 순서대로 
읽어갈 수 있게 하기 위함이다.`       

- 파티션 수보다 컨슈머 그룹의 인스턴스 수가 많다면, 비효율적으로 자원을 사용하게 된다.     

위의 내용을 이해하기 쉽게 그림으로 살펴보자.   

<img width="440" alt="스크린샷 2021-07-11 오전 12 57 37" src="https://user-images.githubusercontent.com/26623547/125168967-16b94b00-e1e3-11eb-9c53-ccb607ec3fb4.png">      
  
위 그림은 한개의 partition으로 구성된 peter-topic이라는 토픽이 있고, 컨슈머 
인스턴스는 server1과 server2로 구성된 consumer-01 이라는 컨슈머 그룹이 있다.   
`카프카에서는 하나의 파티션에 컨슈머 그룹내 하나의 인스턴스만 접근이 가능하기 
때문에, 비록 컨슈머 인스턴스가 2개로 구성되어 있지만, server1만 접근하여 데이터를 
가져오고 server2는 일을 하지 못하고 대기하고 있는 상태이다.`   
컨슈머 인스턴스 하나는 대기 상태이므로, 예제의 상황이 효율적인 상황은 
아니다.    

`효율적으로 구성을 위해서 토픽의 파티션 수와 컨슈머 인스턴스 수는 동일하게 
맞추어 주거나 절반정도 수준으로 구성해 주는 것이 좋다.`       

응용편으로 몇가지 예제를 들어보면서, 파티션과 
인스턴스 수의 관계에 대해서 조금 더 자세히 알아보자.    

#### 4개의 파티션 + 2개의 컨슈머 인스턴스   

peter-topic이라는 하나의 토픽은 4개의 파티션으로 구성되어 있다. 그리고 
컨슈머 그룹은 consumer-01이라는 이름을 사용하며, 컨슈머 인스턴스 수는 2개이다.    
그림으로 표시하면 아래와 같다.   

<img width="442" alt="스크린샷 2021-07-11 오전 1 10 54" src="https://user-images.githubusercontent.com/26623547/125169392-e672ac00-e1e4-11eb-9a1f-bad828000d14.png">   

위 그림을 잘 보면, 앞에서 설명한 내용과 같이 `하나의 파티션에 하나의 컨슈머 
인스턴스만 연결되어 있다.`   
파티션수에 비해 컨슈머 인스턴스수가 적기 때문에 하나의 컨슈머 인스턴스는 
2개의 파티션에 대해서 가져오기를 하고 있다. 만약 컨슈머 인스턴스가 2개가 
아니라, 4개인 경우는 어떻게 될까?   

#### 4개의 파티션 + 4개의 컨슈머 인스턴스   

위 그림에서 컨슈머 인스턴스를 2개에서 4개로 늘리고, 위의 예제와 구분을 위해 
컨슈머 그룹을 consumer-02라고 변경해보자. 그림으로 나타내면 아래와 같다.    

<img width="438" alt="스크린샷 2021-07-11 오전 1 11 11" src="https://user-images.githubusercontent.com/26623547/125169396-e96d9c80-e1e4-11eb-829e-df1594420ff1.png">     

위 그림은 파티션 수 4개와 컨슈머 인스턴스 수 4개로 두 수가 같은 경우에 대한 
예제이다. 두 수가 동일하기 때문에 각각의 파티션과 컨슈머 인스턴스는 
1:1로 연결되어 있다. 가장 이상적인 상태라고 할 수 있다.     
그러면 앞에서 살펴본 컨슈머 인스턴스 2개인 경우와 
지금 보고 있는 컨슈머 인스턴스 4개의 차이는 무엇이 있을까?    
`정답은 바로 데이터를 가져오는 속도의 차이이다.`   
예를 들어, 각각의 파티션에 순서대로 1, 2, 3 ,4라는 데이터가 들어있고, 
    컨슈머가 파티션에 있는 데이터를 가져올 때, 1초가 걸린다고 
    가정해보자. 가정한 내용을 바탕으로, 그림을 추가하여 살펴보자.    


컨슈머 인스턴스 2개 - 1초    
<img width="438" alt="스크린샷 2021-07-11 오전 1 16 04" src="https://user-images.githubusercontent.com/26623547/125169690-5170b280-e1e6-11eb-9e01-de84c209aa8f.png">

컨슈머 인스턴스 2개 - 2초   
<img width="442" alt="스크린샷 2021-07-11 오전 1 16 10" src="https://user-images.githubusercontent.com/26623547/125169692-546ba300-e1e6-11eb-9796-d42268eb2d17.png">

위 그림에서 보는 것처럼 consumer-01그룹은 파티션 1, 3의 첫번째 데이터 1, 3을 
가져오는데 1초 소비하고, 파티션 2, 4의 첫번째 데이터 2, 4를 가져오는데 
또 1초를 소비하여 1, 2 ,3 4, 데이터를 전부 가져오는데 모두 2초를 소비하였다.   

아래 그림은 컨슈머 인스턴스가 4개인 consumer-02도 그림으로 살펴보자.   

컨슈머 인스턴스 4개 - 1초   
<img width="439" alt="스크린샷 2021-07-11 오전 1 16 17" src="https://user-images.githubusercontent.com/26623547/125169696-56cdfd00-e1e6-11eb-9ec7-17b04c47adf0.png">

위 그림에서 보는 것처럼 1, 2, 3, 4의 파티션에 각각 하나의 컨슈머 
인스턴스가 데이터를 하나씩 가져오므로, consumer-02 그룹은 1, 2 ,3, 4 데이터를 
모두 가져오는데 1초가 소비되었다.    
이렇게 토픽의 파티션 수가 많을 경우에는 그 수 만큼 컨슈머 인스턴스를 
늘려서 데이터를 빠르게 가져올 수 있는 장점이 있다.   
`하지만, 이러한 장점만 보고 파티션수를 무작정 늘리는 것은 좋지 않다.`       
`토픽의 파티션 수는 토픽이 생성된 이후에 언제든지 늘릴 수 있지만, 절대로 
줄일 수는 없다.`    
그래서 일방적으로 파티션 수를 많이 늘리기 보다는 사전 테스트를 통해서 
어느정도 컨슈머의 인스턴스 수를 유지했을 때, 데이터를 가져오는데 
밀리는 증상이 없는지를 찾아서 해당 수만큼 파티션 수를 
만들어주는 것이 효율적이다.   

#### 하나의 토픽에 2개의 컨슈머 그룹    

컨슈머 그룹 응용편 마지막 에제로서, 하나의 토픽에 2개의 컨슈머 그룹이 
연결되었을 때이다. 아래 그림을 살펴보자.   

<img width="442" alt="스크린샷 2021-07-11 오전 1 16 24" src="https://user-images.githubusercontent.com/26623547/125169673-3e5de280-e1e6-11eb-84a5-7a643ac3862e.png">   

먼저 consumer-01 그룹에 대한 설명이다. 4개의 파티션으로 구성된 peter-topic의 
데이터를 가져오는데, 컨슈머 인스턴스 수는 3개이다. 이런 경우에는 
파티션 하나당 하나의 컨슈머 인스턴스가 연결되고, 토픽의 파티션 수보다 컨슈머 
인스턴스 수가 부족하기 때문에 컨슈머 인스턴스 3개중의 어느 하나는 2개의 
파티션에 대해서 데이터를 가져오게 된다.    
설명을 하기 위한 예시이므로 실제 서비스에 이렇게 구성하게 되면 
바람직한 구조는 아니다.   

다음은 consumer-02 그룹에 대한 설명이다.   
앞에서 설명한 파티션 수보다 컨슈머 인스턴수 수가 많은 경우이다.   
이런 경우에는 파티션 하나당 하나의 컨슈머 인스턴스가 연결되기 때문에, 마지막 
컨슈머 인스턴스는 일을 하지 못하고 대기 상태로 남아 있게 된다. 이 역시 
단지 설명을 위한 예제중의 하나일 뿐이다.   

- - - 

## 4. Consumer Group Rebalancing      

각각의 카프카 컨슈머는 토픽의 각 파티션에 대해 메시지를 처리한다.    
그런데 만약, `특정 컨슈머에 문제가 생겨 더 이상 메시지를 처리할 수 없다면, 파티션의 
소유권을 다른 컨슈머에게 이관해야 한다.`     
이러한 조정 작업을 리밸런싱이라고 한다.   

그럼 카프카 컨슈머 그룹 리밸런싱은 언제 일어날까?   

##### 컨슈머의 생성/삭제  

`컨슈머가 생성/삭제 되는 가장 일반적인 상황은 배포할 때이다.`     
배포 과정에서 기존 어플리케이션이 종료되고, 새 어플리케이션이 다시 동작하게 된다.  
결국 이때 리밸런싱이 최소 두 번 일어나게 된다.  
기존 컨슈머가 삭제되고, 새로운 컨슈머가 생성되기 때문이다.   

##### 시간안에 Poll 요청 실패   

`컨슈머는 max.poll.records 설정의 개수만큼 poll 요청을 통해 데이터를 가져와서 처리한다.`         
`하지만 메시지들의 처리 시간이 늦어져서 max.poll.interval.ms 설정 시간을 넘기게 된다면 
컨슈머에 문제가 있다고 판단하여 리밸런싱이 일어난다.`      

##### 컨슈머 문제 발생   

컨슈머가 일정 시간동안 heartheat 를 보내지 못하면, 세션이 종료되고 컨슈머 그룹에서 제외된다.   
이때 리밸런싱이 진행된다.   

##### 토픽에 새로운 파티션이 생길 때   

새로운 파티션이 추가되면, 컨슈머 그룹에서 새 파티션을 누가 처리할지 정해야 한다.  
따라서 전체 파티션 할당 정보를 새로 구성해야 하므로 리밸런싱이 발생한다.     

### 4-1) 리밸런싱 리스크는?   

##### 컨슈머 처리 중단(파티션 읽기 작업 중단)   

`리밸런싱이 진행되는 동안 컨슈머는 메시지를 처리하지 않는다. 이로 인해 어플리케이션 처리에 
지연이 발생할 수 있다.`   

##### 메시지 중복 컨슈밍  

`리밸런싱 과정에서 컨슈머가 파티션의 어느 위치부터 메시지를 읽어야 할지 결정해야 하는데, 
    이 과정에서 메시지가 중복되거나 누락될 수 있다.`         

만약 컨슈머에 별다른 설정을 하지 않았다면 아래와 같이 동작할 것이다.   

```
- auto commit 사용 (enable.auto.commit=true)
- 5초 주기로 커밋 가능 (auto.commit.interval.ms=5000)
- max.poll.records 개수의 메시지만큼 poll 요청을 통해 가져와서 처리한 뒤 커밋이 가능하다면 메시지 offset 변경 사항을 커밋    

1) 메시지 lag 가 10개 쌓임  
2) 메시지 10개 처리 (max.poll.records=500)
3) offset 커밋   
```

위와 같이 일반적인 상황에서는 문제가 없다.  
하지만 리밸런싱이 발생한다면 문제가 발생할 수 있다.   

```
1) 메시지 lag가 500개 쌓임
2) 메시지 500개 처리(max.poll.records=500)
3) 메시지 500개 중 400개만 처리 완료  
4) max.poll.interval.ms 시간이 지남(5분)   
5) 리밸런싱 발생  
6) offset 커밋이 되지 않는다 ! 
7) 다른 컨슈머에서 마지막으로 커밋된 메시지 부터 처리(중복 메시지 발생)   
```


### 4-2) 리밸런싱 리스크를 해결하기 위해서는?  

##### max.poll.records     

일정시간(max.poll.interval.ms)안에 poll 요청을 보내지 않으면 리밸런싱이 일어난다.   
하지만 max.poll.records 값이 작을 수록 poll 요청을 빠르게 보내게 되어 리밸런싱 발생할 
가능성이 줄어든다.   

`기본값은 500 이며 이 값을 줄이게 되면 처리해야할 데이터가 적어지기 때문에 poll 요청을 
빠르게 보낼 수 있다.`   

이 값을 무조건 낮게 설정하게 되면 비지니스에 따라 불필요한 I/O 및 CPU가 증가하기 때문에 
서비스에 맞게 트레이드 오프를 고려해야 한다.   

각 레코드 별로 처리시간이 길다면 max.poll.records 를 줄이고 max.poll.interval.ms 를 
늘리는 것이 권장되고, 레코드당 처리 시간이 짧은 경우는 
max.poll.records를 늘려서 throughput을 극대화 하는 것도 방법이다.   

##### max.poll.interval.ms   

default는 5분이며, poll() 호출 간의 최대 허용시간이다.   
`이 시간 안에 컨슈머가 poll()을 호출하지 않으면 컨슈머가 죽은것으로 간주되어 리밸런싱이 발생한다.`   

각 레코드 별로 처리시간이 길다면 이 설정을 늘려주게 되면 리밸런싱 가능성이 적어진다.    

`하지만, 리밸런싱이 자주 발생했을 때 무조건 max.poll.records 설정을 줄이거나, max.poll.interval.ms 설정을 늘려주기 보다는 
어플리케이션에서 각 레코드 처리 별로 slow query가 발생하는 등의 문제가 없는지 먼저 확인하고 근본적인 문제를 해결하는 것이 
더 중요하다.`   


##### session.timeout.ms   

`기본값은 10초 이며, 이 시간 내에 heartheat가 오지 않으면, 컨슈머를 죽은 것으로 간주하고 리밸런싱이 발생한다.`      

> 이 값은 heartbeat.interval.ms 보다 커야 한다.   

##### enable.auto.commit   

`이 설정을 true로 하게되면 실제로 메시지를 처리했는지 여부와 무관하게 주기적으로 오프셋을 커밋한다.`       

따라서 아래와 같은 상황에서 메시지 누락이 발생할 수 있다.  

```
1) 컨슈머가 A, B, C를 poll 하여 처리를 시작  
2) auto.commit.interval.ms 주기로 오프셋 3까지 커밋 진행(A, B, C를 처리했다고 kafka는 기록)  
3) A 까지 처리 후 어플리케이션 장애 발생   
4) 실제로는 B, C는 아직 처리하지 못함 
5) 재시작된 컨슈머는 오프셋 3부터 읽기 시작(B, C 는 데이터 누락)
```  

`따라서 enable.auto.commit 을 false로 설정하고, 메시지를 다 처리한 후 수동으로 커밋을 진행하게 되면 
데이터 누락은 발생하지 않는다.`  

> 다만, 데이터가 중복으로 발생할 수 있다 (at least once)   




- - - 


**Reference**    

<https://www.popit.kr/kafka-consumer-group/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

