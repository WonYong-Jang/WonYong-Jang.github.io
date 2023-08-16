---
layout: post
title: "[Spark] Structured Streaming 으로 Word Count 구현하기"   
subtitle: "append 모드와 update 모드의 watermarking / late data에 대한 handling "   
comments: true
categories : Spark
date: 2022-01-07
background: '/img/posts/mac.png'
---

이번 글에서는 Structured Streaming을 이용하여 Word Count를 구현해볼 
예정이며, 늦게 들어온 데이터에 대한 핸들링을 어떻게 
할 수 있는지 자세히 살펴보자.   

- - -   

## 1. Word Count   

아래와 같이 triggering 되는 시점은 1초라고 가정해보자.   
Input은 unbounded table으로 쿼리를 실행하여 결과를 console에 출력한다.   

<img width="650" alt="스크린샷 2023-08-09 오후 3 19 16" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/7f9f9485-7e19-4d5b-8132-e5a22f63226b">    

위를 코드로 작성하면 아래와 같다.   

```scala
val spark = SparkSession.builder()
    .master("local[*]")
    .appName("SparkByExamples.com")
    .config("spark.driver.bindAddress", "127.0.0.1")
    .getOrCreate()

import org.apache.spark.sql.functions._
import spark.implicits._

val lines = spark
    .readStream
    .format("socket")
    .option("host", "localhost")
    .option("port", 9999)
    .load

// 컬럼명은 따로 지정해주지 않으면 기본적으로 value
val words = lines.select(explode(split('value, " ")).as("word"))
val wordCount = words.groupBy("word").count

val query = wordCount.writeStream
    .outputMode(OutputMode.Complete)
    .format("console")
    .start()

// DStream 과 마찬가지로 스트리밍이 중지 되지 않고 지속적으로 처리 되도록   
query.awaitTermination()
```   

- - -    

## 2. Window Operations on Event Time   

이번에는 5분마다 triggering 되며, window 연산을 이용하여 groupBy를 진행한다.    
window 간격은 10분이며, sliding 간격은 5분이다.    

5 분씩 겹치기 때문에(sliding) 하나의 데이터가 다른 window에도 계산되는 것을 확인할 수 있다.     


> 12:02 cat dog 에서 시간은 실제 event 가 발생한 시간이다.   


`DStream은 event가 발생한 시간으로 연산할 수 있는 함수는 제공해 주지 않지만 
Structured Streaming은 가능함을 확인할 수 있다.`   

> DStream은 데이터를 받아와서 처리를 하는 
processing time 기반으로 window가 만들어진다.    
> DStream은 따로 제공하는 함수는 없고 직접 구현해주어야 한다.   

<img width="900" alt="스크린샷 2023-08-09 오후 3 30 30" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/187a7b1c-093b-4cc1-a1f6-0da5e19c5578">   

코드는 아래와 같다.   

아래 코드에서 사용한 window 메소드의 timestamp는 이벤트가 발생한 시간이며, 
    window 크기는 10분 sliding 간격은 5분으로 지정한 것을 확인할 수 있다.   
또한, window 메소드와 각 단어에 대해 groupBy 하였고, 위의 그림과 
같은 결과가 나올 것이다.  

```scala
import spark.implicits._

val words = ... // streaming DataFrame of schema { timestamp: Timestamp, word: String }    

// Group the data by window and word and compute the count of each group 
val windowedCounts=words.groupBy(
        window($"timestamp", "10 minutes", "5 minutes"),
        $"word"
).count()   
```   

그럼 `Late Data Processing`에 대해 살펴보자.      
아래와 같이 12:04에 발생한 이벤트가 12:15분에 늦게 들어 온 경우이다.     

Structured Streaming의 경우 기다려 줄 수 있는 기능을 제공한다.   

<img width="900" alt="스크린샷 2023-08-09 오후 4 00 37" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/409c86e7-5a76-446a-afc2-2fdd1c88f613">    

`하지만 계속해서 기다릴 순 없고, watermarking이라는 기능을 이용하여 
threshold 만큼 기다리고 그 외에는 무시하는 기능이다.`      

그럼, watermarking에 대해 자세히 살펴보자.   

- - - 

## 3. Handling Watermarking      

### 3-1) Update Mode   

`watermarking은 지정한 threshold 만큼 늦은 데이터에 대해 기다리게 된다.`   
아래는 triggering 시간은 5분이며 watermarking의 
threshold는 10분으로 지정한 예이다.   

<img width="1000" alt="스크린샷 2023-08-09 오후 4 31 18" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d2a093b2-5c56-4e2b-ba96-91d87c3e0aa8">    

> X 축은 processing time이며, Y 축은 event time이다.    

위 그림에서 event time 12:14의 dog가 들어왔고 그 이 후 12:09 cat이 들어왔다.   
12:09 cat은 순서상 late date라는 것을 알 수 있다.   
threshold를 10분으로 지정했기 때문에 12:09 cat 데이터는 정상적으로 
포함 시킨다.   

watermark threshold를 이용하여 늦은 데이터를 포함시킬지 말지에 대한 기준은 아래와 같다.   

```
Watermark = max event time - threshold   
```

`즉, processing time 12:20 기준으로 현재까지 쌓인 데이터에서 가장 큰 event time은 
12:21 owl이다.`     
`12:21에서 threshold 10분을 빼면, 12:11이 watermark 기준이 된다.`   
`그럼, processing time 12:20 ~ 12:25에 들어온 데이터들 중에서 
event time이 12:11보다 작다면 제외시킨다.`   

따라서 12:04 donkey 데이터는 버리게 된다.    

`또한, watermark가 12:11이라는 것은 그 이전 데이터들은 메모리에 가지고 
있을 필요가 없다는 뜻이다.`   

`즉, watermark를 사용함으로써, 더 이상 변경이 발생하지 않으며 
    불필요한 데이터를 정리하여 
    메모리 효율을 높힐 수 있다는 뜻이다.`   

### 3-2) Append Mode   

동일하게 append mode일 때를 자세히 살펴보자.   

<img width="1200" alt="스크린샷 2023-08-16 오전 11 07 22" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/eb1fee2c-2c86-4168-b1ec-a8c40d5e9b22">

`update mode 일 때와 비교해보면 12:10분과 12:15분에 결과값이 없는 것을 확인할 수 있다.`      
`append mode 일 때는 데이터가 들어와도 결과가 늦게 나올 수 있다.`   

append mode는 앞으로 절 때 바뀌지 않는 데이터만 결과값으로 나타낸다.   

`12:25에 처음으로 결과값이 나타난 이유는, watermamrk가 12:11 분이였을 때 
그 이전 데이터는 더 이상 바뀌지 않기 때문에 메모리에 들고 있을 필요가 없다.`   
`즉, 12:11분 이전 데이터들은 절 때 바뀌지 않음이 확인 되었기 때문에 
결과값으로 노출 되었다.`   

`주의해야할 점은 집계 연산을 사용할 때 
append mode로 하기 위해서는 반드시 watermark를 설정해야 한다.`     
`그렇지 않으면 무한히 결과를 리턴하지 않고 가지고 있게 된다.`      


- - - 

**Reference**    

<https://fastcampus.co.kr/data_online_spkhdp>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

