---
layout: post
title: "[Kafka] Apache Kafka Producer, Consumer 구현하기"
subtitle: "Scala를 이용하여 Producer, Consumer 구현"    
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

  class ProducerCallback extends Callback {
    override def onCompletion(metadata: RecordMetadata, exception: Exception): Unit = {
      if(exception == null) println("success publish")
      else exception.printStackTrace()
    }
  }
}
```

## Custom Serializer 사용하기    

```scala 
import java.util

import com.fasterxml.jackson.databind.ObjectMapper
import com.fasterxml.jackson.module.scala.DefaultScalaModule
import org.apache.kafka.common.serialization.Serializer

class JsonSerializer[T] extends Serializer[T] {
  val mapper = new ObjectMapper()
  mapper.registerModule(DefaultScalaModule)

  private var encoding = "UTF8"

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


### 여러가지 Producer 옵션   

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

