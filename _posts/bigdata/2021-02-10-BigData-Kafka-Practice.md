---
layout: post
title: "[Kafka] Apache Kafka 설치 및 예제  "
subtitle: "토픽 생성하고 메세지 발행 및 구독, kafkacat "    
comments: true
categories : BigData
date: 2021-02-10
background: '/img/posts/mac.png'
---



## 카프카 설치 및 실습   

mac을 기준으로 작성하였으며, 1 broker, 1 topic 이라는 아주 기본적인 로컬 
환경으로 구성해서 테스트 하였다.   

#### 1. 설치 및 실행    

아래 사이트에서 Binary downloads에 있는 파일을 다운 받고, 
    다운로드 받은 파일은 적절한 위치에 압축을 풀어준다.   

<https://kafka.apache.org/downloads>

```
tar -xzf kafka_2.11-2.3.0.tgz
```

`Kafka는 zookeeper 위에서 돌아가므로 zookeeper를 먼저 실행한다.`   

```
bin/zookeeper-server-start.sh config/zookeeper.properties
```

다음은 kafka를 실행한다.   

```
bin/kafka-server-start.sh config/server.properties
```   

아래와 같이 카프카와 주키퍼가 정상적으로 실행되었는지 
port 확인을 통해서 확인한다. (LISTEN 인지 확인)

```
lsof -i :9092

lsof -i :2181
```

#### 2. Topic 생성하기    

localhost:9092 카프카 서버에 quickstart-events란 토픽을 생성한다.   

```
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 1 --topic quickstart-events   
```
- create : 새로운 토픽을 만들 때 사용하는 옵션   
- replication-factor : partition 복제본 개수   
    - 옵션을 사용하지 않으면 기본값을 사용한다. 
    - 기본값은 server.properties 파일에서 default.replication.factor 항목으로 설정 가능하다.   

- partitions : Topic이 생성되거나 변경될 때의 Partition 수  
    - 이 옵션을 사용하지 않으면, 기본값을 사용한다.   
    - 기본 값은 server.properties 파일에서 num.partitons 항목으로 설정 가능하다.    
     
- topic : create, alter, describe, delete 옵션에 사용할 토픽 이름   

현재 만들어져 있는 토픽은 아래와 같이 확인 가능하다.   

```
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```

특정 토픽의 설정은 아래와 같이 확인 할 수 있다.   

```
bin/kafka-topics.sh --describe --topic quickstart-events --bootstrap-server localhost:9092
```

<img width="800" alt="스크린샷 2021-04-15 오후 11 31 15" src="https://user-images.githubusercontent.com/26623547/114886725-be241d00-9e42-11eb-81d3-b837e5121986.png">  


#### 3. Consumer, Producer 실행하기       

`콘솔에서 Producer와 Consumer를 실행하여 실시간으로 토픽에 event를 추가하고 
받을 수 있다.`    

터미널을 분할로 띄워서 진행해본다.   

Consumer를 실행한다.  

```
bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic quickstart-events   
```

Producer를 실행한다.   

```
bin/kafka-console-producer.sh --broker-list localhost:9092 --topic quickstart-events
```

<img width="1085" alt="스크린샷 2021-04-15 오후 11 51 45" src="https://user-images.githubusercontent.com/26623547/114889970-92566680-9e45-11eb-84eb-5ee71ef6d15f.png">   

- - - 

**Reference**    

<https://kafka.apache.org/documentation/#quickstart>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

