---
layout: post
title: "[AWS] Kinesis"
subtitle: "Amazon Kinesis Data Streams"    
comments: true
categories : Java
date: 2021-02-08
background: '/img/posts/mac.png'
---

# Big Data   

인터넷의 발전으로 인해서 하루에도 계산하기 힘든 데이터가 쏟아 진다. 과거와는 달라진 이러한 
환경을 우리는 간단히 Big Data 시대라고 한다. 그러다 보니 쏟아지는 데이터를 분석해서 
유의미한 데이터를 뽑아내는 기술이 필요하게 되었는데 이게 바로 Big Data의 진정한 의미 중에 
하나 이다. 

- - - 

# Batch VS Streaming   

과거 이야기를 좀 더 해보면, 과거에도 데이터를 분석해내는 방법이 있었다. 첫번째로는 데이터를 
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

# AWS Kinesis   

`AWS Kinesis 는 데이터 수집구간과 데이터 처리구간 중간에 위치한다. 이렇게 중간에 위치하는 소프트웨어를 
만든 이유는 다양한 데이터들을 수집하고 이것을 다양한 포맷으로 만들어 준다.    

Kinesis는 '스트리밍 데이터 처리'를 해주는데 여기서 스트리밍 데이터 처리라는 말은 
스트리밍으로 데이터를 분석해준다는 이야기가 아니다.   
다양한 현태로 들어오는 데이터를 가공해서 다양한 분석 소프트웨어가 사용가능하도록 다양한 
출력물을 만들어내주거나 데이터 저장소에 저장하도록 해준다.`       

아래 그림은 Kinesis Data Streams 의 아키텍처를 보여준다. Producer가 계속해서 
Kinesis Data Streams에 데이터를 푸시하고 Consumer가 실시간으로 데이터를 처리한다.    

<img width="710" alt="스크린샷 2021-02-08 오후 9 51 44" src="https://user-images.githubusercontent.com/26623547/107222990-faa95600-6a58-11eb-8d7d-974b3050baf9.png">   


Consumer는 Amazon DynamoDB, Amazon Redshift 또는 Amazon S3와 같은 AWS 서비스를 
사용하여 결과를 저장할 수 있다.


## Kinesis Data Streams 용어   

Kinesis Data Steams 용어들을 정리 해보자.   

#### 1. Producer ( 생산자 ) 

생상자는 Amazon Kinesis Data Streams에 레코드를 넣는다. 예를 들면 스트림에 로그 데이터를 
보내는 웹 서버가 생산자이다.   

#### 2. Consumer ( 소비자 )   

소비자는 Amazon Kinesis Data Streams 에서 레코드를 가져와서 처리한다. 이 소비자를 
Amazon Kinesis Data Streams Application이라고 한다.   



- - - 

**Reference**    

<https://linux.systemv.pe.kr/aws-kinesis/>    
<https://docs.aws.amazon.com/ko_kr/streams/latest/dev/key-concepts.html>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

