---
layout: post
title: "[Python] Kafka & Spark 활용한 Realtime Datalake 구성하기"  
subtitle: "NAT 인스턴스를 이용한 클러스터 구성 / Confluent Kafka 를 이용하여 파이썬으로 구현하기"   
comments: true
categories : Data-Engineering   
date: 2025-07-05
background: '/img/posts/mac.png'
---


## 1. 개발 환경 설정   

먼저 파이썬 인터프리터 버전 [3.10.11](https://www.python.org/downloads/release/python-31011) 를 설치해보자.   

설치 완료 후/usr/local/bin 디렉토리에 python3.10 관련 파일이 생성됨을 확인할 수 있다.   
그 후 파이썬 가상 환경을 생성해보자.  

```shell
$ cd ~/dev
$ mkdir datalake
$ cd datalake

# kafka_venv 이름의 디렉토리가 생성되면서 가상환경 생성
$ /usr/local/bin/python3.10 -m venv kafka_venv

$ cd kafka_venv

# kafka_venv 가상환경으로 진입
$ source bin/activate
$ python -V  

# 파이썬 가상환경을 빠져나올 때는 현재 위치한 경로에 상관없이 deactivate
$ deactivate   
```

- - -   

## 2. 카프카 클러스터 구성하기

카프카 클러스터 구성은 [NAT 인스턴스](https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/VPC_NAT_Instance.html) 기반으로 진행할 예정이며, 
먼저 NAT에 대해서 살펴보자.   

### 2-1) NAT(Network Address Translation) 란? 

- `내부망에 연결된 장비의 IP를 1개 또는 소수의 외부 IP로 변환하는 기술`    
- `부족한 IPv4 공인 1개를 받은 후 사설 IP 수십개와 매핑 가능하며 외부에서 먼저 접근할 수 없으므로 보안적으로도 우수하여 기업내에서도 자주 사용되는 기술` 

> IPv4 가 고갈된다고 한지가 20년이 넘었지만 아직도 잘사용하고 있는 이유가 NAT 기술 때문이다.   

<img src="/img/posts/data-engineering/스크린샷 2025-07-26 오전 11.41.39.png" width ="700" height="700">

집에서 공유기 사용할 때도 NAT 를 사용하게 되며 컴퓨터, 노트북, 핸드폰 등이 연결이 되어 모두 사설 IP로 할당이 되어 있다.     
`사설 IP로 할당이 되고 외부 인터넷 등을 연결할 때 NAT 가 공인 IP 로 변경해주게 된다.`  
`그리고 컨텐츠 등을 들고 다시 돌아올때는 이를 다시 사설 IP로 바꿔주게 된다.`    
`따라서 NAT가 있음으로써 사설 IP가 외부에 접근하여 돌아오게는 가능하지만, 반대로 외부에서 직접 접근이 불가능하게 하여 보안을 향상 시킬 수 있다.`   

### 2-2) AWS NAT 인스턴스 기반 카프카 클러스터  

private subnet 에서 인터넷 연결을 하기 위해 AWS NAT Gateway 서비스가 존재한다.   
하지만 NAT Gateway 는 상대적으로 고비용, 고가용성 서비스이기 때문에 실습을 위해 EC2를 이용한 NAT Instance를 구성해 볼 예정이다.  

> NAT 역할을 하는 EC2를 구성하며, NAT Gateway와 동일한 역할을 한다.   

<img src="/img/posts/data-engineering/스크린샷 2025-07-26 오전 11.36.04.png">

위 구성도를 보면 인터넷 접속이 가능한 public subnet 이 있으며, EC2 기반 NAT 인스턴스로 구성했다.  

각 private subnet은 인터넷을 통해 직접 접근이 불가능하며, 
public subnet을 통해서만 접근이 가능하도록 구성했다.       
또한, private subnet에 있는 kafka 등이 인터넷 접속이 필요할 때도 동일하게 public subnet을 통해서만 접근이 가능하다.   

<img src="/img/posts/data-engineering/스크린샷 2025-07-28 오후 3.16.58.png">

[링크](https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/work-with-nat-instances.html)를 참고하여 구성해보자.  

- - - 

## 3. Confluent Kafka 를 이용하여 파이썬으로 구현하기    

Confluent 사는 실리콘밸리에 있는 빅데이터 회사로, 아파치 카프카의 최초 개발자들(Jay Kreps 등)이 설립한 회사이다.    

아파치 카프카는 자바로 구현되어 있지만, Client(Producer, Consumer)는 파이썬과 같은 다른 언어로 구현이 가능한 여러 라이브러리가 존재한다.     

파이썬으로 Kafka Client 구현이 가능한 라이브러리 예는 아래와 같다.   

- confluent-kafka: `Confluent의 공식 라이브러리, librdkafka 라이브러리 기반`이며 가장 성능이 좋다.   
- kafka-python: pure 파이썬으로 작성되어 있으며 가장 성능이 느리다.   
- pykafka: kafka-python 대비 성능이 좋다.   
- aiokafka: 파이썬의 asyncio 라이브러리 기반 동작하며, kafka-python(동기방식) 대비 성능이 좋다.     

이 글에서는 [Confluent Kafka](https://docs.confluent.io/kafka-clients/python/current/overview.html) 를 사용할 것이며,  
Zookeepr를 포함하고 있는 Apache Kafka 2.8x, Confluent Platform 6.2x 버전을 사용할 예정이다.       

> 그 이후 버전부터는 Zookeeper를 제외한 KRaft 합의 알고리즘을 사용한다.    

파이썬은 내부적으로 librdkafka를 활용하여 구동되며, librdkafka 라이브러리는 순수 자바 Kafka 와 비교했을 때 
옵션에 대해서 차이가 존재 한다.   
[Broker 옵션](https://docs.confluent.io/platform/current/installation/configuration/broker-configs.html) 과 [Topic 옵션](https://docs.confluent.io/platform/current/installation/configuration/topic-configs.html), 
[Producer 옵션](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html), [Consumer 옵션](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html) 등은 
기존 아파치 카프카와 다른 옵션이 존재하기 때문에 공식문서를 참고하자.     

아래 코드는 producer 기본 예시이며, 비동기 방식으로 publish를 진행하고 있다.   


```python
from confluent_kafka import Producer

conf = {'bootstrap.servers': 'host1:9092,host2:9092'}   

producer = Producer(conf)

producer.produce(topic, key="key", value="value")

def acked(err, msg):
    if err is not None:
        print("Failed to deliver message: %s: %s" % (str(msg), str(err)))
    else:
        print("Message produced: %s" % (str(msg)))

producer.produce(topic, key="key", value="value", callback=acked)

# Wait up to 1 second for events. Callbacks will be invoked during
# this method call if the message is acknowledged.
producer.poll(1)
```

`producer는 메시지 전송에 대해서 바로 진행하지 않고 메모리 공간 내에 
buffer 설정 만큼 쌓아 두었다가 한번에 브로커에 전달한다.`  

그 후 브로커는 정상적으로 메시지를 전달 받았다면 ack 응답을 리턴해준다.  



```python

```


- - -

<https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/VPC_NAT_Instance.html>   
<https://docs.aws.amazon.com/ko_kr/vpc/latest/userguide/work-with-nat-instances.html>   
<https://www.inflearn.com/course/kafka-spark-realtime-datalake/dashboard>  
<https://docs.confluent.io/kafka-clients/python/current/overview.html>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







