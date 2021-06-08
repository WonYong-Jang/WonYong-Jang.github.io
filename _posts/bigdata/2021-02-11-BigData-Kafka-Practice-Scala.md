---
layout: post
title: "[Kafka] Apache Kafka Client"
subtitle: "Scala를 이용하여 Producer, Consumer API 구현하기"    
comments: true
categories : BigData
date: 2021-02-11
background: '/img/posts/mac.png'
---

# 스칼라로 Consumer 구현하기   

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

  consumer.subscribe(Collections.singletonList(TOPIC))  // topic을 list로 설정가능   

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

# 스칼라로 Producer 구현하기   

Producer는 카프카에서 메시지를 생산해서 카프카 토픽으로 보내는 역할을 한다.   
아래와 같이 레코드를 생성해서 Producer를 통해 전송하게 된다.   

`레코드는 타임스탬프, 메시지 키, 메시지 값, 오프셋으로 구성되어 있다. 
Producer가 생성한 레코드가 브로커로 전송되면 오프셋과 타임스탬프가 지정되어 
저장된다. 브로커에 한번 적재된 레코드는 수정할 수 없고 
리텐션 기간 또는 용량에 따라서만 삭제된다.`    

컨슈머는 레코드의 타임스탬프를 토대로 레코드가 언제 브로커에 적재되었는지 
알수 있다.   

메시지 키는 메시지 값을 순서대로 처리하거나 메시지 값의 종류를 나타내기 위해 사용된다.   
메시지 키를 사용하면 Producer가 토픽에 레코드를 전송할 때 메시지 키의 해시값을 
토대로 파티션을 지정하게 된다. 즉, 동일한 메시지 키라면 동일 파티션에 들어가는 것이다.   

다만, 어느 파티션에 지정될지 알 수 없고 파티션 개수가 변경되면 메시지 키와 파티션 매칭이 
달라지게 되므로 주의해야 한다. 만약 메시지 키를 사용하지 않는다면 Producer에서 
레코드를 전송할 때 메시지 키를 선언하지 않으면 된다. 메시지 키를 선언하지 
않으면 null로 설정된다.    
메시지 키가 null로 설정된 레코드는 Producer 기본 설정 파티셔너에 따라서 
파티션에 분배되어 적재된다.   

메시지 값에는 실질적으로 처리할 데이터가 들어 있다. 메시지 키와 메시지 값은 
직렬화되어 브로커로 전송되기 때문에 컨슈머가 이용할 때는 직렬화한 형태와 
동일한 형태로 역직렬화를 수행해야 한다.   
`즉, 직렬화, 역직렬화 할 때는 반드시 동일한 형태로 처리해야 한다.`   

> 만약 Producer가 StringSerializer로 직렬화한 메시지 값을 컨슈머가 
IntegerDeserializer로 역직렬화하면 정상적인 데이터를 얻을 수 없다.   




```scala   
import java.util.Properties

import org.apache.kafka.clients.producer.{Callback, RecordMetadata}
import org.apache.kafka.clients.producer.{KafkaProducer, ProducerRecord}
import org.apache.kafka.common.serialization.StringSerializer

object KafkaProducerTest {

  def main(args: Array[String]): Unit = {

    val TOPIC = "quickstart-events"
    val kafkaProducerProps: Properties = {
      val props = new Properties()
      props.put("bootstrap.servers", "localhost:9092")
      props.put("key.serializer", classOf[StringSerializer].getName)
      props.put("value.serializer", classOf[StringSerializer].getName)
      props
    }

    val producer = new KafkaProducer[String, String](kafkaProducerProps)

    val record = new ProducerRecord[String, String](TOPIC, null, "send message")
    producer.send(record, new ProducerCallback)

    producer.close()
  }

  // 비동기 전송 방식   
  class ProducerCallback extends Callback {
    override def onCompletion(metadata: RecordMetadata, exception: Exception): Unit = {
      if(exception == null) println("success publish")
      else exception.printStackTrace()
    }
  }
}
```   

KafkaProducer는 생성한 ProducerRecord를 전송하기 위해 record를 파라미터로 가지는 send() 메서드를 
호출했다.   

`Producer에서 send()는 즉각적인 전송을 뜻하는 것이 아니라, 파라미터로 들어간 record를 
Producer 내부에 가지고 있다가 배치 형태로 묶어서 브로커에 전송한다. 이러한 전송 방식을 
배치 전송이라고 부른다. 배치 전송을 통해 카프카는 타 메시지 플랫폼과 
차별화된 전송 속도를 가지게 되었다.`   

또한, send()메서드는 Future객체를 반환한다. 이 객체는 RecordMetadata의 비동기 
결과를 표현한 것으로 ProducerRecord가 카프카 브로커에 정상적으로 적재되었는지에 
대한 데이터가 포함되어 있다.    
`아래와 같이 get() 메서드를 사용하면 Producer로 보낸 데이터의 결과를 
동기적으로 가져올 수 있다.`   

```
val metadata: RecordMetadata = producer.send(record).get();   
```

send()의 결과값은 카프카 브로커로부터 응답을 기다렸다가 브로커로부터 응답이 
오면 RecordMetadata 인스턴스를 반환한다.   

`Producer가 전송하고 난 뒤 브로커로부터 전송에 대한 응답값을 받기 전까지 대기하기 때문에 
동기 방식은 빠른 전송에 허들이 될 수 있다. 메시지의 전송 순서가 중요한 경우는 
이 방식을 이용하면 되지만 아닌 경우는 비동기로 전송하는 것을 권장한다.`    

비동기 방식은 Callback 인터페이스를 이용하여 사용자 정의 클래스를 생성해서 사용 가능하다.   


## Custom Serializer 사용하기   

위의 예제에서는 브로커로 보낼 메시지를 StringSerializer를 사용하였는데, 
    이를 커스텀하게 사용하기 위해서는 Serializer 인터페이스를 사용하여 
    사용자 정의 클래스를 생성하면 된다.   

> deserializer도 마찬가지로 이용가능하다.   

```scala 
import java.util

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.kafka.common.serialization.Serializer

class JsonSerializer[T] extends Serializer[T] {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)

  override def configure(configs: util.Map[String, _], isKey: Boolean): Unit = {
  }

  override def serialize(topic: String, data: T): Array[Byte] = {

    if (data == null) return null
    try {
      mapper.writeValueAsBytes(data)
    }
    catch {
      case e: Exception =>
        throw new Exception("Error serializing JSON message", e)
    }
  }
}
```

```scala 
val TOPIC = "quickstart-events"
val kafkaProducerProps: Properties = {
      val props = new Properties()
      props.put("bootstrap.servers", "localhost:9092")
      props.put("key.serializer", classOf[StringSerializer].getName)
      props.put("value.serializer", classOf[JsonSerializer[_]].getName)
      props
}

val producer = new KafkaProducer[String, Object](kafkaProducerProps)

val person: Person = createDto()

val record = new ProducerRecord[String, Object](TOPIC, null, person)
producer.send(record, new ProducerCallback)

producer.close()
```

- - - 

## Producer 주요 옵션   

Producer 동작과 관련된 옵션 중에 필수 옵션과 선택 옵션이 있다. 필수 옵션은 
사용자가 반드시 설정해야 하는 옵션이다. 선택 옵션은 사용자가 설정을 필수로 
받지 않는다. 여기서 중요한 점은 선택 옵션을 지정하지 않으면 default 값으로 
지정되기 때문에 반드시 각 옵션에 대해서 파악하고 있어야 한다.   

#### 필수 옵션    

##### bootstrap.servers   

카프카 클러스터는 여러 브로커 서버를 가질수 있고, 메시지를 전송할 때 
모든 브로커 서버를 지정하지 않아도 정상적으로 전송이 가능하다.   
하지만, `카프카 클러스터는 살아있지만, 입력한 브로커 서버가 다운될 경우 
다른 브로커 서버를 찾지 못해서 메시지를 전송하지 못하는 경우가 생긴다.`   
`모든 브로커 서버 호스트를 입력해 두었을 경우에는 주어진 리스트의 서버 중 
하나가 장애가 발생하더라도 Producer가 자동으로 다른 서버에 재접속을 시도하기 
때문에 장애를 예방할 수 있다.`   

##### key.serializer   

레코드의 메시지 키를 직렬화하는 클래스를 지정한다.   

##### value.serializer   

레코드의 메시지 값을 직렬화하는 클래스를 지정한다.   

#### 선택 옵션   

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

카프카 리더 파티션에 한해서 데이터를 정상적으로 받았다는 응답을 받는다. 하지만 
모든 팔로워 파티션에까지 메시지가 정상적으로 도착했는지에 관해서는 응답받지 않는다.   

- ack=all / ack=-1   

all 또는 -1로 설정하는 경우 모든 팔로워 파티션으로부터 데이터에 대한 ack를 기다리기 때문에 
하나 이상의 팔로워 파티션이 존재하는 한 데이터는 손실되지 않는다.    
때문에 데이터 무손실에 대해 가장 강력하게 보장하지만, 동시에 모든 팔로워 파티션으로부터 
ack 응답을 기다려야 하므로 성능이 떨어진다.   

##### buffer.memory   

브로커로 전송할 데이터를 배치로 모으기 위해 설정할 버퍼 메모리양을 지정한다.   
기본값은 32MB이다.    

##### compression.type     

Producer가 데이터를 압축해서 보낼 수 있는데, 어떤 타입으로 압축할지를 
정할 수 있다. 옵션으로 none, gzip, snappy, lz4, zstd와 같은 다양한 
포맷을 선택할 수 있다.  

압축 옵션을 정하지 않으면 압축이 되지 않은 상태로 전송된다.    

`압축을 하면 데이터 전송 시 네트워크 처리량에 이득을 볼 수 있지만 
압축을 하는 데에 CPU 또는 메모리 리소스를 사용하므로 사용환경에 따라 
적절한 압축 옵션을 사용하는 것이 중요하다. 또한, Producer에서 압축한 
메시지는 컨슈머 어플리케이션이 압축을 풀데 되는데 이때도 컨슈머 어플리케이션 
리소스가 사용되는 점을 주의하자.`     


##### batch.size    

배치로 전송할 레코드 최대 용량을 지정한다. 너무 작게 설정하면 Producer가 
브로커로 더 자주 보내기 때문에 네트워크 부담이 있고 
너무 크게 설정하면 메모리를 더 많이 사용하게 되는점을 주의해야 한다.   
default 값은 16384 이다.

##### linger.ms   

`아직 배치 사이즈가 덜 채워졌을 때 추가적인 메시지들을 기다리는 시간을 
조정하게 된다.` Producer는 지정된 배치 사이즈에 도달하면 linger.ms 옵션과 
관계없이 즉시 메시지를 전송하지만, 만약 배치 사이즈에 아직 도달하지 못한 
상황이라면 해당 설정의 제한 시간에 도달했을 때 메시지들을 전송하게 된다.    
default값은 0이며(지연 없음), 0보다 큰 값을 설정하면 지연 시간은 조금 
발생하지만 처리량이 올라간다.    

##### max.request.size    

Producer가 보낼 수 있는 최대 메시지 바이트 사이즈이다. default 값은 1MB이다.   

##### retries   

Producer가 브로커로부터 에러를 받고 난 뒤 재전송을 시도하는 횟수를 지정한다.    
default 값은 2147483647 이다.   

##### partitioner.class    

레코드를 파티션에 전송할 때 적용하는 파티셔너 클래스를 지정한다.   
기본값은 org.apache.kafka.clients.producer.internals.DefaultPartitioner이다.   



- - - 

**Reference**   

<https://medium.com/@om.m.mestry/how-to-develop-kafka-consumer-with-customer-deserializer-from-scratch-using-scala-c659a9337ccd>     
<https://www.learningjournal.guru/article/kafka/how-to-create-a-json-serializer-for-kafka-producer/>    
<https://ooeunz.tistory.com/117>    
<https://soft.plusblog.co.kr/30>    
<https://github.com/edenhill/kafkacat>      
<https://kafka.apache.org/documentation/#quickstart>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

