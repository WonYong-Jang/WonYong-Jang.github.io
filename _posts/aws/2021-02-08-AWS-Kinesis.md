---
layout: post
title: "[Kinesis] AWS Kinesis"
subtitle: "Amazon Kinesis Data Streams, Kafka와의 차이점"    
comments: true
categories : AWS
date: 2021-02-08
background: '/img/posts/mac.png'
---


## Batch VS Streaming   

과거 이야기를 먼저 해보면, 과거에도 데이터를 분석해내는 방법이 있었다. 첫번째로는 데이터를 
모으는 것이다. 그리고 그것을 특정한 저장소에 저장을 한다. 대부분 데이터베이스 시스템에 
저장을 했다. 그리고 그것을 이용해서 쿼리문을 이용해서 데이터를 뽑아 냈다.   

그런데 데이터를 모으고 데이터베이스에 저장하고 하는 부분은 특정 시간에 서버에 작업을 
걸어놓아야 하는 경우가 많았다. 간단하게는 리눅스 시스템에서 크론(Cron)을 이용해서 
특정 배치 프로그램을 돌려서 데이터를 모으고 데이터베이스에 집어 넣는 방법을 이용했다. 

하지만 Big Data 시대에 이 방법이 과연 유용한가 하는 문제가 있다. 몇분, 몇시간, 몇일간격으로 배치 
작업을 돌리는건 쏟아지는 데이터 속도보다 빠르지 못하다보니 데이터 분석을 할 수 없는 경우가 
많다.   

그래서 등장한 것이 스트리밍(Streaming)이다. 스트리밍, 물 흐르듯 그때 그때 데이터를 분석해내면 
유용한 정보를 얻기 위해서 기다릴 필요가 없다. 그때 그때 분석한 데이터를 데이터 베이스에 저장하거나 
파일로 저장하는것도 가능하다.   

그래서 현대의 Big Data 분석 소프트웨어들은 전부다 Streaming을 지원하도록 발전되어 왔다.   

<img width="875" alt="스크린샷 2021-02-08 오후 9 33 58" src="https://user-images.githubusercontent.com/26623547/107220474-b9637700-6a55-11eb-8d10-0079d6fcb7b2.png">   


많은 소프트웨어들이 이렇게 데이터 수집, 분석처리, 저장, 분석 및 리포트 영역으로 나뉘어 발전되고 있다.   


`위 그림에서 문제가 하나 있다. 데이터 수집 부분과 데이터 처리부분이다. 이 부분이 문제가 되는 이유는 
데이터 수집하는 소프트웨어와 처리하는 소프트웨어간의 데이터 교환을 맞춰줘야 하고 둘이 동기화 되어 처리되어야 한다. 
어느 한쪽이 병목이 생기면 문제가 생길 수도 있다.`     

- - - 

## AWS Kinesis   

`AWS Kinesis 는 데이터 수집구간과 데이터 처리구간 중간에 위치한다. 이렇게 중간에 위치하는 소프트웨어를 
만든 이유는 다양한 데이터들을 수집하고 이것을 다양한 포맷으로 만들어 주기 때문이다.`        

Kinesis는 '스트리밍 데이터 처리'를 해주는데 여기서 스트리밍 데이터 처리라는 말은 
스트리밍으로 데이터를 분석해준다는 이야기가 아니다.   
다양한 형태로 들어오는 데이터를 가공해서 다양한 분석 소프트웨어가 사용 가능하도록 다양한 
출력물을 만들어내주거나 데이터 저장소에 저장하도록 해준다.`       



아래 그림은 Kinesis Data Streams 의 아키텍처를 보여준다. Producer가 계속해서 
Kinesis Data Streams에 데이터를 푸시하고 Consumer가 실시간으로 데이터를 처리한다.    

<img width="710" alt="스크린샷 2021-02-08 오후 9 51 44" src="https://user-images.githubusercontent.com/26623547/107222990-faa95600-6a58-11eb-8d7d-974b3050baf9.png">   


Consumer는 Amazon DynamoDB, Amazon Redshift 또는 Amazon S3와 같은 AWS 서비스를 
사용하여 결과를 저장할 수 있다.


### Kinesis Data Streams 용어   

Kinesis Data Steams 용어들을 정리 해보자.   

#### 1. Producer ( 생산자 ) 

생상자는 Amazon Kinesis Data Streams에 레코드를 넣는다. 예를 들면 스트림에 로그 데이터를 
보내는 웹 서버가 생산자이다.   

#### 2. Consumer ( 소비자 )   

소비자는 Amazon Kinesis Data Streams 에서 레코드를 가져와서 처리한다. 이 소비자를 
Amazon Kinesis Data Streams Application이라고 한다.   

- - - 

## Kafka와의 차이점   

<img width="750" alt="스크린샷 2021-07-26 오후 11 40 03" src="https://user-images.githubusercontent.com/26623547/127007955-637cd05e-6c2f-4ade-9b4e-570d7257b8a4.png">   

<img width="750" alt="스크린샷 2021-07-26 오후 11 40 11" src="https://user-images.githubusercontent.com/26623547/127007968-3080314b-f4e6-444d-a0d4-be205272e389.png">   


위 표에서 인상 깊은 차이점만 알아보자.   

#### 1) Partiton vs Shard   

Kafka에서의 Partiton은 분산의 기준으로서 중요하다. 각 Partiton의 
리더들을 통해 데이터가 처리되고, 팔로워들이 리더에 접근해 
데이터를 복제한다.   
KDS(Kinesis Data Streams) 차이점은 Shard가 데이터 처리 속도의 기준이 되고 자유롭게 
증가/감소를 할 수 있다는 부분이다.    

`참고로 Kafka의 Partition은 한번 늘어나면 줄이지 못한다. 각 
Partition으로 분산된 데이터들을 줄어든 숫자로 다시 
재배치가 어렵기 때문이다. Partion을 늘릴 때는 입수되는 데이터를 
추가 분산하면 되지만 줄일 때는 방법이 없다.`   

`KDS에서는 Shard를 늘릴수도 줄일수도 있다. Cloud는 사용한만큼 
금액을 부여하기 때문에 데이터가 많아져서 Shard를 늘였는데 줄일 수 
없다면 계속 많은 금액을 내야 하기에 꼭 Shard 숫자를 줄일 수 있어야 한다고 
생각한 듯 하다.`   

#### 2) Data Size   

Kafka에서는 설정에 의해 들어오는 데이터의 크기를 조절할 수 있다.   
Default 값이 1MB이기는 하나 들어오는 데이터 크기에 따라 조절할 수 
있다. 그런데 KDS에서는 안된다.   
만약 실시간 처리하려는 데이터의 크기가 1MB를 넘는 경우라면 KDS를 
사용할 수 없다.   

#### 3) Partiton/Shard Limitation   

Shard의 숫자는 region에 따라 다르지만 최대 500개까지 사용이 가능하다.   
경험상 Kafka Partion과 비교할 수 있는 Shard 숫자를 500개까지 늘려야 
하는 가능성은 없지만 제한이 있다는건 차이점이다.   
Shard의 숫자에 따라 속도도 제한하니 Kinesis는 일단 최대 
성능을 유추할 수 있을 듯하다.   
반면에 Kafka는 Partion 숫자의 제한은 없다.   

#### 4) Data Retention   

카프카의 데이터 보관 주기는 maximum이 없고 설정에 의해 
변경 가능하지만 KDS는 1일에서 7일까지만 보관 가능하며 
default는 24시간이다.    

## 정리    

`Kinesis와 Kafka의 성능 비교한 글을 찾아보면 대부분 Kafka의 성능이 
Kinesis에 비해 우수하다.`             
따라서, 회사내에 Kafka를 셋업할 줄 아는 사람이 있으면 
Kafka를 사용하는게 유리하다.   

> AWS의 Kinesis는 완전 관리형 서비스로써 Kafka에 비해 셋업이 쉽다.    

또한, 초당 1000개 이상 데이터를 처리해야 하거나 
1주일 이상 보관해야 한다면 카프카를 사용하는 것을 권장한다.   

참고로 Kafka가 Kinesis에 비해 성능면에서 우수하므로, AWS가 
Kafka를 클러스터링을 구성해서 제공하는 MSK[https://aws.amazon.com/ko/msk/getting-started/)가 있다. 

완전 관리형 서비스로서 Streaming 서비스를 위해 Kinesis는 선택 가능한
옵션 중 하나다. 다만 운영/성능/가격 측면에서
장단점은 무엇인지 비교하고 적용해야 한다.

- - - 

**Reference**    

<https://linux.systemv.pe.kr/aws-kinesis/>    
<https://docs.aws.amazon.com/ko_kr/streams/latest/dev/key-concepts.html>   
<https://devidea.tistory.com/68>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

