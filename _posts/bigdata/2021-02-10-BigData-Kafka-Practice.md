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

## Kafkacat     

카프카를 사용하는 개발자라면 로컬 혹은 서버에서 브로커와 직접 통신하여 
테스트 해야 하는 경우가 있다. 이 때 별도 설치 없이 명령어 한 줄로 편리하게 
쓸 수 있는 도구인 [Kafkacat](https://github.com/edenhill/kafkacat)을 
사용 할 수 있다.   

#### 설치   

설치하는 방법은 여러 방식이 있지만 여기서는 mac 기준으로 설치하면 
아래와 같이 가능하다.   

```
brew install kafkacat
```

#### 사용 방법   

사용방법은 아래와 같다.   

```
kafkacat -b localhost:9092 -t new_topic -G [group_name] -p [partition_num] [-P|-C]   
```

- -b : 카프카 브로커 주소 목록   
- -t : 토픽   
- -p : 파티션   
- -P : 프로듀서 모드로 실행. 기본 파티션은 0이다.   
- -C : 컨슈머 모드로 실행. -P, -C가 생략될 경우 기본 컨슈머 모드로 실행한다.   
- -G : 컨슈머 그룹   

먼저 kafka의 정보를 확인해 보자. -L 을 이용하면 메타데이터 정보를 확인 할 수 있다.   

```
kafkacat -L -b localhost:9092      
```

Output

```
$ kafkacat -L -b localhost:9092
Metadata for all topics (from broker 0: localhost:9092/0):
 1 brokers:
  broker 0 at localhost:9092 (controller)
 1 topics:
  topic "quickstart-events" with 1 partitions:
    partition 0, leader 0, replicas: 0, isrs: 0
```

위와 같이 1개의 broker 서버와 1개의 토픽이 있는 걸 확인 할 수 있다.   


또한, 토픽에 대해서 컨슈머와 프로듀서를 테스트 및 모니터링 할 수 있다. 
`파티션을 명시하지 않으면 모든 파티션으로 부터 메시지를 읽는다.`   

```
kafkacat -b localhost:9092 -t quickstart-events -C       
```

Output   

`아래와 같이 몇번 파티션으로 부터 메시지를 읽었는지와 
각 파티션에서의 offset을 확인 할 수 있다.`      

```
# kafkacat -b localhost:9092 -t quickstart-events -C
hi
% Reached end of topic new_topic [0] at offset 4
success
```

토픽에 대한 메타정보도 아래와 같이 확인 해보자.   

```
kafkacat -b localhost:9092 -L -t quickstart-events   

```

sasl 인증을 해야 하는 경우 아래와 같이 인증방식과 id, pw를 추가로 입력하면 된다.   

```
kafkacat -b $BROKERS -C -X security.protocol=SASL_SSL -X sasl.mechanisms=SCRAM-SHA-256 -X sasl.username=$USERNAME -X sasl.password=$PASSWORD -t $TOPIC
```

- - - 

## 스칼라로 구현해보기 ( Consumer )

`Consumer의 경우는 구독(subscribe)을 시작한 후 poll을 통해 레코드를 처리한다.`    
topic의 경우 list로 설정 가능하다. 즉 여러 topic 처리가 가능하다.    
poll 메서드의 파라미터는 레코드를 기다릴 최대 블럭 시간이다.   

아래와 같이 소스를 작성하여 실행하고 위에서 실습한 것처럼 Producer Console을 
이용하여 메시지를 보내면 정상적으로 전송된 것을 확인 할 수 있다.   

```scala 
import java.time.Duration
import java.util.{Collections, Properties}
import org.apache.kafka.clients.consumer.{ConsumerRecords, KafkaConsumer}
import scala.collection.JavaConversions._
object KafkaTest extends App {

  val TOPIC = "quickstart-events"
  val props = new Properties()
  props.put("bootstrap.servers", "localhost:9092")
  props.put("key.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
  props.put("value.deserializer", "org.apache.kafka.common.serialization.StringDeserializer")
  props.put("group.id", TOPIC)

  val consumer = new KafkaConsumer[String, String](props)

  consumer.subscribe(Collections.singletonList(TOPIC))

  while(true){
    val records: ConsumerRecords[String, String] = consumer.poll(Duration.ofMillis(100000))

    for (record <- records) {
      println(record.topic + " : " + record.value)
    }
  }
}
```

Output   

```
quickstart-events : success!
```


- - - 

**Reference**    

<https://ooeunz.tistory.com/117>     
<https://github.com/edenhill/kafkacat>      
<https://kafka.apache.org/documentation/#quickstart>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

