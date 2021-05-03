---
layout: post
title: "[Kafka] Apache Kafka 설치 및 예제, 파티션 수에 따른 메시지 순서"
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

#### 4. 파티션 수에 따른 메시지 순서에 대한 이해    

이번 내용은 카프카를 이해하는데 한참 걸렸던 메시지 순서에 대한 내용을 살펴보자.    
메시지 순서에 대한 이해를 위해 파티션 수를 8로 메시지 순서를 확인해보자.   

```
bin/kafka-topics.sh --create --zookeeper localhost:2181 --replication-factor 1 --partitions 8 --topic quickstart-events      
```

이해하기 쉽게 문자가 아닌 1부터 8까지 숫자로 메시지를 보내보고 순서를 확인해보자.     

`1,2,3,4,5,6,7,8 순서대로 Producer로 메시지를 전송하게 되면 예상과는 다르게 
순서대로 숫자를 가져오지 못한다.`    

이를 이해하기 위해 파티션 갯수 1인 경우를 살펴보자.   

<img width="450" alt="스크린샷 2021-05-03 오후 11 11 52" src="https://user-images.githubusercontent.com/26623547/116887341-2c4f4900-ac65-11eb-9dd4-b8fa207806d0.png">    

위 그림은 파티션에 데이터 1, 2가 순서대로 들어갔고, 컨슈머를 이용해서 해당 
파티션의 첫번째 데이터인 1을 가져왔다.    

<img width="450" alt="스크린샷 2021-05-03 오후 11 11 59" src="https://user-images.githubusercontent.com/26623547/116887366-3113fd00-ac65-11eb-99e7-8fefff815a2a.png">   

다음으로, 파티션에는 데이터 3, 4가 순서대로 들어갔고, 컨슈머는 파티션의 이후 데이터인 2, 3을 가져왔다. 
이후 컨슈머가 가져오는 데이터는 4라는 것을 예상할 수 있다.   

`위의 예제에서 알 수 있듯이 하나의 파티션에 대해서 데이터의 순서를 보장한다. 만약 토픽에 
대해 모든 데이터의 순서를 보장 받고 싶다면, 토픽을 생성할 때 파티션의 수는 1로 생성하면 된다.`   

그럼 이제 파티션의 수가 1이 아닌 4인 경우를 살펴보자.   

<img width="450" alt="스크린샷 2021-05-03 오후 11 12 16" src="https://user-images.githubusercontent.com/26623547/116887377-3709de00-ac65-11eb-9e4c-2fe524942436.png">   

위의 예제는 토픽의 파티션이 4개이고, 각각의 파티션 마다 첫번째 데이터가 1,2,3 하나씩 데이터가 들어갔다.   
컨슈머는 각각의 파티션으로부터 데이터를 하나씩을 가져오게 되고, 순서는 1,3,2 순으로 가져왔다.    
컨슈머는 각각의 파티션에서 첫번째 데이터를 가져올 뿐이지 순서를 맞춰서 가져오지는 않는다.   

아래 그림을 통해 더 진행해보자.   

<img width="450" alt="스크린샷 2021-05-03 오후 11 12 28" src="https://user-images.githubusercontent.com/26623547/116887392-38d3a180-ac65-11eb-843b-390442174ab9.png">      

이후 해당 토픽에 데이터 4,5,6이 들어오고, 그 데이터는 파티션 4의 첫번째, 
    파티션 2와 3의 두번째에 들어왔다.    
컨슈머는 이후 데이터 즉 4,5,6 에 대해서도 가져오게 된다. 하지만 역시 
순서대로 가져오지 않는다.    

메시지를 가져오는 순서에 대해 파티션 2번으로 
추가 설명해보면, 2번 파티션의 첫번째 데이터가 2, 두번째 데이터가 5이다.   
이런 경우에 파티션 2는 앞서 설명한것 처럼 파티션 1인 경우와 동일하게 
두번째 데이터 5가 첫번째 데이터 2 앞으로 올 수 없다.    
마찬가지로 6도 3보다 앞에 올 수 없다.   
즉, 파티션이 4개를 사용하는 경우에는 전체 순서는 보장을 못하지만 
각각의 파티션에 담긴 메시지 순서는 보장한다.  

> 파티션 2번의 5는 2보다 뒤에 온다.      
> 파티션 3번의 6은 3보다 뒤에 온다.   

<img width="450" alt="스크린샷 2021-05-03 오후 11 12 40" src="https://user-images.githubusercontent.com/26623547/116887399-3a9d6500-ac65-11eb-8933-70c9f68bedb6.png">    
 
앞의 내용을 정리해보자.   
`카프카는 각각의 파티션에 대해서만 순서를 보장한다. 그래서, 
    위의 천번째 예제에서 살펴본 것처럼 1개의 파티션인 경우에는 프로듀서가 
    보낸 순서대로 가져올 수 있지만, 파티션이 8개인 경우에는 프로듀서가 
    보낸 순서대로 메시지를 가져올수 없었다.`     




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

## 스칼라로 Consumer 구현하기   

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

## 스칼라로 Producer 구현하기   

Producer는 카프카에서 메시지를 생산해서 카프카 토픽으로 보내는 역할을 한다.   


#### 여러가지 Producer 옵션   

Producer 동작과 관련된 다양한 옵션들이 있는데 이러한 옵션들에 대해 살펴보자.   

##### bootstrap.servers   

카프카 클러스터는 여러 브로커 서버를 가질수 있고, 메시지를 전송할 때 
모든 브로커 서버를 지정하지 않아도 정상적으로 전송이 가능하다.   
하지만, `카프카 클러스터는 살아있지만, 입력한 브로커 서버가 다운될 경우 
다른 브로커 서버를 찾지 못해서 메시지를 전송하지 못하는 경우가 생긴다.`   
`모든 브로커 서버 호스트를 입력해 두었을 경우에는 주어진 리스트의 서버 중 
하나가 장애가 발생하더라도 Producer가 자동으로 다른 서버에 재접속을 시도하기 
때문에 장애를 예방할 수 있다.`   

##### acks   

Producer가 카프카 토픽의 리더에게 메시지를 보낸 후 요청을 완료하기 전 ack(승인)의 
수에 관한 옵션이다. `해당 옵션의 정수가 낮으면 성능이 좋지만, 메시지 손실 가능성이 있고 
수가 높을수록 성능은 줄지만 메시지 손실률이 줄어든다.`     

- ack=0   

`Producer는 카프카로부터 어떠한 ack도 기다리지 않는다.` 즉, Producer에서 
전송한 메시지가 실패하더라도 결과를 알지 못하기 때문에 재요청 설정도 
적용되지 않는다.    
하지만 카프카로부터 ack에 대한 응답을 기다리지 않기 때문에 매우 빠르게 메시지를 
보낼 수 있어 높은 처리량으로 기능을 수행할 수 있다.   

- ack=1   

카프카 리더에 한해서 데이터를 정상적으로 받았다는 응답을 받는다. 하지만 
모든 팔로워에까지 메시지가 정상적으로 도착했는지에 관해서는 응답받지 않는다.   

- ack=all / ack=-1   

all 또는 -1로 설정하는 경우 모든 팔로워로부터 데이터에 대한 ack를 기다리기 때문에 
하나 이상의 팔로워가 존재하는 한 데이터는 손실되지 않는다.    
때문에 데이터 무손실에 대해 가장 강력하게 보장하지만, 동시에 모든 팔로워로부터 
ack 응답을 기다려야 하므로 성능이 떨어진다.   

##### buffer.memory   

Producer가 카프카 서버로 데이터를 보내기 위해 잠시 대기할 수 있는 전체 메모리 
바이트이다.   
배치 전송과 같은 딜레이가 발생할 때 사용할 수 있다. 

##### compression.type     

Producer가 데이터를 압축해서 보낼 수 있는데, 어떤 타입으로 압축할지를 
정할 수 있다. 옵션으로 none, gzip, snappy, lz4와 같은 다양한 
포맷을 선택할 수 있다.   

##### batch.size    

Producer는 파티션으로 보내는 여러 데이터를 일정 용량만큼 모아서 배치로 
보내게 된다. 이때 해당 설정으로 `배치 크기를 바이트 단위로 조정할 수 있다.`    
정의된 배치 크기보다 큰 데이터는 배치를 시도하지 않게 된다.    
또한, 배치를 보내기 전에 클라이언트에서 장애가 발생하게 되면 
배치 내에 있던 메시지는 전달되지 않게 된다.    
따라서, 만약 고가용성이 필요한 메시지라면 배치기능을 사용하지 않는 것도 하나의 방법이다.    

##### linger.ms   

`아직 배치 사이즈가 덜 채워졌을 때 추가적인 메시지들을 기다리는 시간을 
조정하게 된다.` Producer는 지정된 배치 사이즈에 도달하면 linger.ms 옵션과 
관계없이 즉시 메시지를 전송하지만, 만약 배치 사이즈에 아직 도달하지 못한 
상황이라면 해당 설정의 제한 시간에 도달했을 때 메시지들을 전송하게 된다.    
default값은 0이며(지연 없음), 0보다 큰 값을 설정하면 지연 시간은 조금 
발생하지만 처리량이 올라간다.    

##### max.request.size    

Producer가 보낼 수 있는 최대 메시지 바이트 사이즈이다. default 값은 1MB이다.   


- - - 

**Reference**    

<https://www.popit.kr/kafka-%EC%9A%B4%EC%98%81%EC%9E%90%EA%B0%80-%EB%A7%90%ED%95%98%EB%8A%94-%EC%B2%98%EC%9D%8C-%EC%A0%91%ED%95%98%EB%8A%94-kafka/>    
<https://ooeunz.tistory.com/117>    
<https://soft.plusblog.co.kr/30>    
<https://github.com/edenhill/kafkacat>      
<https://kafka.apache.org/documentation/#quickstart>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

