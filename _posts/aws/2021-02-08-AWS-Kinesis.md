---
layout: post
title: "[Kinesis] AWS Kinesis"
subtitle: "Amazon Kinesis Data Streams, Firehose / Kafka와의 차이점 / Kinesis 모니터링 지표"    
comments: true
categories : AWS
date: 2021-02-08
background: '/img/posts/mac.png'
---

## 1. AWS Kinesis Data Stream

`AWS Kinesis Data Stream는 데이터 수집구간과 데이터 처리구간 중간에 위치한다. 이렇게 중간에 위치하는 소프트웨어를 
만든 이유는 다양한 데이터들을 수집하고 이것을 다양한 포맷으로 만들어 주기 때문이다.`        

Kinesis는 `스트리밍 데이터 처리`를 해주는데 여기서 스트리밍 데이터 처리라는 말은 
스트리밍으로 데이터를 분석해준다는 이야기가 아니다.   
다양한 형태로 들어오는 데이터를 가공해서 다양한 분석 소프트웨어가 사용 가능하도록 다양한 
출력물을 만들어내주거나 데이터 저장소에 저장하도록 해준다.      


아래 그림은 Kinesis Data Streams 의 아키텍처를 보여준다. Producer가 계속해서 
Kinesis Data Streams에 데이터를 푸시하고 Consumer가 실시간으로 데이터를 처리한다.    

<img width="710" alt="스크린샷 2021-02-08 오후 9 51 44" src="https://user-images.githubusercontent.com/26623547/107222990-faa95600-6a58-11eb-8d7d-974b3050baf9.png">   


Consumer는 Amazon DynamoDB, Amazon Redshift 또는 Amazon S3와 같은 AWS 서비스를 
사용하여 결과를 저장할 수 있다.


### 1-1) Kinesis Data Streams 용어   

Kinesis Data Steams 용어들을 정리 해보자.   

#### 1-1-1) Producer ( 생산자 ) 

생산자는 Amazon Kinesis Data Streams에 레코드를 넣는다. 예를 들면 스트림에 로그 데이터를 
보내는 웹 서버가 생산자이다.   

#### 1-1-2) Consumer ( 소비자 )   

소비자는 Amazon Kinesis Data Streams 에서 레코드를 가져와서 처리한다. 이 소비자를 
Amazon Kinesis Data Streams Application이라고 한다.   

- - - 

## 2. Kafka와의 차이점   

<img width="750" alt="스크린샷 2021-07-26 오후 11 40 03" src="https://user-images.githubusercontent.com/26623547/127007955-637cd05e-6c2f-4ade-9b4e-570d7257b8a4.png">   

<img width="750" alt="스크린샷 2021-07-26 오후 11 40 11" src="https://user-images.githubusercontent.com/26623547/127007968-3080314b-f4e6-444d-a0d4-be205272e389.png">   


위 표에서 인상 깊은 차이점만 알아보자.   

#### 2-1) Partiton vs Shard   

Kafka에서의 Partiton은 분산의 기준으로서 중요하다. 각 Partiton의 
리더들을 통해 데이터가 처리되고, 팔로워들이 리더에 접근해 
데이터를 복제한다.   
KDS(Kinesis Data Streams) 차이점은 Shard가 데이터 처리 속도의 기준이 되고 자유롭게 
증가/감소를 할 수 있다는 부분이다.    
각 샤드는 읽기에 대해 초당 최대 5개의 트랜잭션, 초당 최대 2MB의 데이터 읽기 속도, 
    초당 최대 1,000개의 레코드까지, 초당 최대 1MB의 총 데이터 쓰기 속도를 지원할 수 있다.   

`참고로 Kafka의 Partition은 한번 늘어나면 줄이지 못한다. 각 
Partition으로 분산된 데이터들을 줄어든 숫자로 다시 
재배치가 어렵기 때문이다. Partion을 늘릴 때는 입수되는 데이터를 
추가 분산하면 되지만 줄일 때는 방법이 없다.`   

`KDS에서는 Shard를 늘릴수도 줄일수도 있다. Cloud는 사용한만큼 
금액을 부여하기 때문에 데이터가 많아져서 Shard를 늘였는데 줄일 수 
없다면 계속 많은 금액을 내야 하기에 꼭 Shard 숫자를 줄일 수 있어야 한다고 
생각한 듯 하다.`   

#### 2-2) Data Size   

Kafka에서는 설정에 의해 들어오는 데이터의 크기를 조절할 수 있다.   
Default 값이 1MB이기는 하나 들어오는 데이터 크기에 따라 조절할 수 
있다. 그런데 KDS에서는 안된다.   
만약 실시간 처리하려는 데이터의 크기가 1MB를 넘는 경우라면 KDS를 
사용할 수 없다.   

#### 2-3) Partiton/Shard Limitation   

Shard의 숫자는 region에 따라 다르지만 최대 500개까지 사용이 가능하다.   
경험상 Kafka Partion과 비교할 수 있는 Shard 숫자를 500개까지 늘려야 
하는 가능성은 없지만 제한이 있다는건 차이점이다.   
Shard의 숫자에 따라 속도도 제한하니 Kinesis는 일단 최대 
성능을 유추할 수 있을 듯하다.   
반면에 Kafka는 Partion 숫자의 제한은 없다.   

#### 2-4) Data Retention   

카프카의 데이터 보관 주기는 maximum이 없고 설정에 의해 
변경 가능하지만 KDS는 1일에서 7일까지만 보관 가능하며 
default는 24시간이다.    

- - - 

## 3. Kinesis Monitoring Metrics   

다음은 Kinesis를 사용할 때 주의 깊게 모니터링 해야할 지표는 아래와 같다.   

### 3-1) GetRecords

Kinesis로 부터 데이터를 가져오고 있음을 확인할 수 있다.   

#### 3-1-1) GetRecords.Success   

GetRecords가 성공하고 있음을 확인할 수 있는 지표이다.   


#### 3-1-2) GetRecords.IteratorAgeMilliseconds 

현재 시간과 마지막 GetRecords 호출 레코드가 스트림에 작성된 시간의 차이를 말한다.   
`즉, 이 값이 증가하면 Consumer가 스트림의 처리 속도를 따라가지 못하고 있다는 것을 의미하며 Consumer가 문제를 겪고 있다는 것을 
의미할 수 있다.`   

이러한 지표가 증가하는 [이유](https://repost.aws/ko/knowledge-center/kinesis-data-streams-iteratorage-metric)는 다음과 같다.     

- 느린 레코드 처리   
    - Amazon Kinesis Client Library(KCL)을 사용하는 경우 물리적 리소스가 부족한지 등을 확인해야 한다.   

- 읽기 스로틀(Getrecords.ReadProvisionedThroughputExceeded)   
    - 해당 메트릭이 증가하는지 같이 확인해봐야 한다.    

- AWS Lambda 함수 오류   

- 연결 제한 시간 초과(Intermittent connection timeout)     
    - Consumer 어플리케이션은 Kinesis 데이터 스트림에서 레코드를 폴링하는 동안 연결 제한 시간 초과 문제가 발생할 수 있다.   
    - 간헐적인 연결 제한 시간 오류로 인해 IteratorAgeMilliseconds 수가 크게 증가할 수 있다.   
    - 증가가 연결 제한 시간과 관련되어 있는지 확인하려면 GetRecords.Latency 및 GetRecords.Success 지표를 확인해보면 된다.   

- 샤드 간의 고르지 않은 데이터 분포   
    - Kinesis 데이터 스트림의 일부 샤드는 다른 샤드보다 더 많은 레코드를 수신할 수 있다. 이는 put 작업에 사용되는 파티션 키가 
    샤드 전체에 데이터를 균등하게 분배하지 않기 때문이다. 이렇게 고르지 않은 데이터 분포로 인해 Kinesis 데이터 스트림 샤드에 
    대한 병렬 GetRecords 호출이 줄어들어 IteratorAgeMilliseconds 수가 증가 한다.   

#### 3-1-3) ReadProvisionedThroughputExceeded   

`읽기 처리량 초과함을 확인할 수 있는 지표이며, 해당 지표가 발생하고 있다면 
kinesis 데이터를 consume하고 있는 대상이 consume을 따라가고 있지 못함을 
의미한다.`       


### 3-2) PutRecords   

Kinesis에 데이터를 추가하고 있음을 확인할 수 있는 메트릭이다.   

### 3-4) WriteProvisionedThroughputExceeded     

`쓰기 처리량 초과함을 확인할 수 있는 지표이며, 해당 지표가 발생하고 있다면 
kinesis에 데이터를 추가하는 속도가 현재 kinesis의 throughput 에  
따라가지 못하고 있음을 의미한다.`       
`따라서 kinesis의 샤드의 갯수를 증가시켜야 하며 읽기처리량과 쓰기처리량의 지표가 
지속적으로 증가한다면 데이터 loss가 발생할 수 있으므로 
알람 등을 추가하여 빠르게 조치하여야 한다.`       


- - - 

## 4. Kinesis Firehose   

`kiensis firehose는 실시간 스트리밍 데이터를 전송하는 완전 관리형 서비스이다.`   

예를 들면 아래와 같이 kinesis data stream에 연결하여 실시간으로 s3에 데이터를 수집할 수 있다.   

<img width="564" alt="스크린샷 2024-04-01 오후 8 11 03" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/c12febc9-526b-43cc-8c5a-f7b70abcd446">   

현재 업무에서 kinesis data stream을 사용하고 있고, 데이터 트래킹 및 백필을 위한 데이터를 s3에 수집하고 있다.

이때 aws kinesis firehose를 사용하여 간단하게 s3와 연결할 수 있다.   
자세한 내용은 [링크](https://medium.com/@neslihannavsar/streaming-data-from-amazon-kinesis-data-streams-to-s3-using-firehose-35c0b50449b7)를 참고해보자.   


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

