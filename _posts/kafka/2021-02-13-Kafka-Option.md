---
layout: post
title: "[Kafka] Apache Kafka Producer, Consumer 주요 옵션"
subtitle: "Producer와 Consumer의 필수 옵션 및 선택 옵션  "    
comments: true
categories : Kafka
date: 2021-02-13
background: '/img/posts/mac.png'
---

이번글에서는 Kafka를 구현할 때, 사용하는 여러 옵션들에 대해서 살펴보자.   

더 자세한 내용은 [Producer](https://docs.confluent.io/platform/current/installation/configuration/producer-configs.html#ssl-truststore-password)와 
[Consumer](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html)를 
확인해보자.   

- - - 

## 1. Consumer   


Consumer 어플리케이션을 실행할 때 설정해야 할 필수 옵션과 선택 옵션이 있다.   
필수 옵션은 사용자가 반드시 설정해야 하는 옵션이다. 선택 옵션은 사용자가 설정을 필수로 
받지 않는다. 여기서 중요한 점은 선택 옵션을 지정하지 않으면 default 값으로 
지정되기 때문에 반드시 각 옵션에 대해서 파악하고 있어야 한다.     


#### 필수 옵션    

##### bootstrap.servers   

Consumer가 데이터를 가져 올 카프카 클러스터에 속한 브로커의 호스트 이름:포트를 1개 이상 
작성한다. 2개 이상 브로커 정보를 입력하여 일부 브로커에 이슈가 발생하더라도 
접속하는데에 이슈가 없도록 설정가능하다.    

##### key.deserializer   

레코드의 메시지 키를 역직렬화하는 클래스를 지정한다.   

##### value.deserializer    

레코드의 메시지 값을 역직렬화하는 클래스를 지정한다.    

#### 선택 옵션    

##### group.id    

`Consumer 그룹 아이디를 지정한다. subscribe() 메서드로 토픽을 구독하여 사용할 때는 
이 옵션을 필수로 넣어야 한다. 기본값은 null이다.`    

##### auto.offset.reset     

Consumer 그룹이 특정 파티션을 읽을 때 저장된 Consumer 오프셋이 없는 경우 어느 
오프셋부터 읽을지 선택하는 옵션이다.    
이미 Consumer 오프셋이 있다면 이 옵션값은 무시된다.   
`이 옵션은 latest, earliest, none 중 1개를 설정 할 수 있다.`    

`latest로 설정하면 가장 높은(가장 최근에 넣은) 오프셋부터 읽기 시작한다.`       
`earliest로 설정하면 가장 낮은(가장 오래전에 넣은) 오프셋부터 읽기 시작한다.`    
`none으로 설정하면 Consumer 그룹이 커밋한 기록이 있는지 찾아본다. 만약 커밋 기록이 
없다면 오류를 반환하고, 커밋 기록이 있다면 기존 커밋 기록 이후 오프셋부터 읽기 
시작한다.`    
기본값은 latest이다.   

##### enable.auto.commit    

자동 커밋으로 할지 수동 커밋으로 할지 선택한다. 기본값은 true이다.   

##### auto.commit.interval.ms    

자동 커밋(enable.auto.commit=true)일 경우 오프셋 커밋 간격을 지정한다.   
기본값은 5000(5초)이다.   

##### max.poll.records    

`poll() 메서드를 통해 반환되는 레코드 개수를 지정한다. 기본값은 500이다.`        

##### session.timeout.ms   

컨슈머가 브로커와 연결이 끊기는 최대 시간이다. 이 시간 내에 하트비트(heartbeat)를 
전송하지 않으면 브로커는 컨슈머에 이슈가 발생했다고 가정하고 리밸런싱을 시작한다.    
보통 하트비트 시간 간격의 3배로 설정한다.   
기본값은 10000(10초)이다.   

##### heartbeat.interval.ms       

하트비트를 전송하는 시간 간격이다. 기본값은 3000(3초)이다.   

##### max.poll.interval.ms   

poll()메서드를 호출하는 간격의 최대 시간을 지정한다. poll() 메서드를 
호출한 이후에 데이터를 처리하는 데에 시간이 너무 많이 걸리는 경우 
비정상으로 판단하고 리밸런싱을 시작한다.    
기본값은 300000(5분)이다.   


##### isolation.level    

트랜잭션 프로듀서가 레코드를 트랜잭션 단위로 보낼경우 사용한다. 이 옵션은 
read_commited, read_uncommitted로 설정할 수 있다. read_committed로 설정하면 
커밋이 완료된 레코드만 읽는다. read_uncommitted로 설정하면 커밋 여부와 관계없이 
파티션에 있는 모든 레코드를 읽는다.     
기본값은 read_uncommitted이다.    



- - - 


## 2. Producer

Producer 동작과 관련된 옵션 중에 필수 옵션과 선택 옵션이 있다.     
`Producer의 설정값들은 데이터를 브로커에 발송할 때, 발송하는 
데이터의 양, 주기 및 데이터를 받는 브로커와의 네트웍 연결 등을 
조절하는데 사용한다.`    

`이러한 설정들을 주의깊게 봐야하는 이유는 Producer가 비동기로 
브로커에 데이터를 발송하기 때문이다.`   
`Producer 코드에서 ProducerRecord를 생성해서 send()메서드를 보낼 때, 
         바로 데이터가 브로커로 발송되지 않고 비동기로 데이터를 전송한다.`   
그래서 실제로 브로커에 데이터를 발송하기 전까지 데이터를 모아둘 버퍼가 필요하며, 
    얼마만큼 모아서 보내고, 보낸 데이터의 성공을 어떻게 체크할 지 등의 로직이 
    설정값에 녹여져 있다.   

> 설정값을 이해하게 되면 Producer의 아키텍처도 더 깊 이해할 수 있다.   

<img width="683" alt="스크린샷 2023-03-28 오후 11 14 17" src="https://user-images.githubusercontent.com/26623547/228267202-4b544962-eb63-45c2-8976-3fb37b486b05.png">   

Producer의 아키텍처는 위와 같다.   

- Accumulator   
    - Accumulator는 레코드를 축적하는 역할을 한다.   

- Sender   
    - Sender는 레코드를 브로커에 전달하는 역할이다. Accumulator가 쌓아 놓은 
    레코드를 비동기로 브로커에 계속 발송한다. 그래서 Sender와 연결된 컴포넌트를 
    보면 Accumulator와 Kafka(브로커)가 있다.   


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
메시지는 컨슈머 어플리케이션이 압축을 풀어야 하며 이때도 컨슈머 어플리케이션 
리소스가 사용되는 점을 주의하자.`    

더 자세한 내용은 [링크](https://developer.ibm.com/articles/benefits-compression-kafka-messaging/)를 참고하자.   


##### batch.size    

`배치로 전송할 레코드 최대 용량을 지정한다. 너무 작게 설정하면 Producer가 
브로커로 더 자주 보내기 때문에 네트워크 부담이 있고 
너무 크게 설정하면 메모리를 더 많이 사용하게 되는점을 주의해야 한다.`    

해당 옵션은 같은 파티션으로 보내는 여러 데이터를 
함께 배치로 보내려고 하는 양을 조절하는 옵션이다.   

> producer는 레코드를 한번에 하나씩 발송하지 않고 묶어서 발송한다. 설정한 
용량보다 크게 레코드를 묶지 않으며, 그렇다고 배치가 가득찰 때까지 기다린다는 것은 아니다.   

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

<https://devidea.tistory.com/90>   
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

