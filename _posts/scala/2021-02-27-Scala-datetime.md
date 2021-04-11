---
layout: post
title: "[Scala] 여러가지 date 표현  "
subtitle: "ISO 8601, UTC, GMT, Timezone"    
comments: true
categories : Scala
date: 2021-02-27
background: '/img/posts/mac.png'
---

# UTC?   

`국제 표준시(UTC)는 각 나라별 시차를 조정하기 위한 기준 시간이다.`      

UTC라는 국제표준시로 시간을 정했다면, 국가 마다 사용하는 시간이 
다르기 때문에 공통된 시간대로 묶는 특정 지역을 `Timezone` 이라고 한다.   

우리나라의 경우 UTC+9 로 표기된다.   
UTC 기준으로 +9시간을 추가한 시간이 된다.   
예를 들어, 우리나라 시간이 22시라면 9시를 뺀 13시가 UTC이다.   

<img width="700" alt="스크린샷 2021-02-27 오후 1 23 05" src="https://user-images.githubusercontent.com/26623547/109375308-1c328a80-78ff-11eb-89f3-5caecc3b0c17.png">    

`UTC 기준이 되기 때문에, 해외 API와 연동이 필요한 경우 
서로간의 기준 시간을 맞추기 위해 UTC를 활용 할 수 있다.`    

# GMT(Greenwich Mean Time)   

그리니치 평균시라고 불리며 런던을 기점으로 하고 웰링텅에서 종점으로 
설정되는 협정 세계시이다.   

#### UTC 와 GMT ?   

UTC와 GMT는 동일하다고 생각하면 된다. (정확하게 
        들어가면 UTC가 더 정확한 시간을 표현한다.) 1972년 1월 1일 부터 UTC로 
세계 협정시가 변경되었으며 이는 먼저 사용되던 GMT와 같은 기준시가 같기에 
요즘은 혼용해서 사용하게 되었다.    
기술적인 표현에서는 UTC를 주로 쓴다.   

# ISO 8601    

`UTC 그리고 TImezone과 함께 문자열의 형태로 시간을 표현하는 방법을 
기술해놓은 표준이다.`    

`날짜와 시간의 숫자 표현에 대한 오해를 줄이고자 함에 있는데, 숫자로 된 
날짜와 시간 작성에 있어 다른 관례를 가진 나라들 간의 데이터가 오갈 때 
특히 그렇다.`    

#### 원칙   

- 년/월/일T시:분:초 처럼 왼쪽에서 오른쪽으로 갈수록 작은 단위어야 한다.     

- 날짜와 시간은 포맷을 맞추기 위해 0을 붙인다. ex) 4월 -> 04월   

#### 형태    

```
2017-03-16T17:40:00+09:00   
```   

- 날짜 => 년-월-일의 형태로 나와있다.   
- T =>  날짜 뒤에 시간이 오는 것을 표시해 주는 문자이다.   
- 시간 => 시:분:초의 형태로 나와있으며 프로그래밍 언어에 따라서 초 뒤에 소수점 형태로 
milliseconds가 표시되기도 한다.   
- Timezone Offset: 시간뒤에 ±시간:분 형태로 나와있으며 UTC시간시로부터 얼마만큼 차이가 
있는지를 나타낸다. 현재 위의 예시는 한국시간을 나타내며 UTC기준시로부터 9시간 +된 시간임을 나타낸다.   
- (Z or +00:00): UTC기준시를 나타내는 표시이며 '+00:00'으로 나타내기도 한다.     






#### 왜 UTC와 ISO 8601을 따라야 할까?   

ISO 8601에 따르면 파싱을 할 수 있는 라이브러리가 많으며 전체적으로 
호환이 되는 부분이 많다.     

- - - 

## Date와 TimeStamp 차이   

자바에서 날짜 표현으로 많이 쓰이는 date와 timestamp 차이를 알아보자.   

- java.util.Date   

일반적으로 날짜와 시간을 저장할 때 사용한다.(2018-12-09 16:39:20)   

- java.sql.Timestamp   
date보다 정밀한 시간을 요구할 때 사용한다.   
시스템간의 프로세스 시간, 우선순위를 정하거나 밀리세컨드 이하까지 사용하기 
위해 사용한다.   

- - - 


## Scala date example   

스칼라에서 여러가지 날짜 관련 처리 방법을 알아보자.  

#### 현재 분, 시간 가져오기    

```scala 
val now = Calendar.getInstance()
println(now.get(Calendar.MINUTE))
```

현재 분을 int 타입으로 리턴한다. 

```scala   
val now = Calendar.getInstance()
println(now.get(Calendar.HOUR_OF_DAY))  //ex) 출력 : 22
```

0부터 23시 까지 현재 시간을 리턴한다.    

#### SimpleDateFormat을 이용하여 시간 가져오기     

자바의 SimpleDateFormat 클래스를 사용하여 날짜를 표현할 수 있다.   
[공식문서](https://docs.oracle.com/javase/7/docs/api/java/text/SimpleDateFormat.html)를 확인하면 
SimpleDateFormat에서 사용되는 패턴을 확인 할 수 있다.    

```scala    
val now = Calendar.getInstance().getTime
val simpleDateFormat = new SimpleDateFormat("yyyy-MM-dd HH:mm:ss")
val result = simpleDateFormat.format(now)
println(result) // 출력 : 2021-03-10 23:18:13
```

#### Joda Time 사용하기   

`위에서 처럼 java에서 제공하는 SimpleDateFormat은 멀티스레딩 환경이 보장이 안되기 때문에 
날짜가 꼬이는 현상이 발생한다.`   

멀티스레딩 환경에서 사용할 수 있는 자바 라이브러리인 Joda를 사용하는 방법을 살펴보자.   

Joda Time라이브러리는 불변 객체이며, 자바의 Date, Calendar 클래스의 
tread-safe 하지 않는 점과 무분별한 상수 사용의 단점을 보완 하였다.   

`Joda time을 원하는 포맷으로 사용하기 위해서는 DateTimeFormat을 사용하면 된다. 
forPattern()으로 원하는 포맷을 지정하고, 이후 메서드(parseDateTime(), print() 등등..)로 
원하는 행위를 지정하면 된다.`   

아래 예제는 오늘 날짜를 원하는 포맷으로 구해서 String 타입으로 
리턴하는 함수이다.    

```scala 
// dateFormat: output 원하는 데이터 포맷 (ex. yyyy-MM-dd)
def getToday(stringFormat: String): String = {
    val dt = new DateTime()
    dt.toString(stringFormat)
  }
// 출력 : 2021-04-11 15:28:57
```

아래는 원하는 날짜에 원하는 일 수 더한 날짜를 리턴 하는 함수이다.   

```scala
// dateFormat: output 원하는 데이터 포맷 (ex. yyyy-MM-dd)
// targetDate: 더하려는 날짜 (dataFormat 과 같아야 함)
// num : 더하려는 일수
def addDate(stringFormat: String, targetDate: String, num: Int) : String = {
    val formatter: format.DateTimeFormatter = DateTimeFormat.forPattern(stringFormat)
    val time = formatter.parseDateTime(targetDate).plusDays(num)
    
    formatter.print(time)
  }
```

또한 여러 상황에서 사용할 수 있는 날짜 차이를 구하는 함수는 아래와 같다.   
start 와 end 날짜의 일 수 차이를 구한다. 결과는 2가 나오며 start 와 
end 의 순서를 바꾸게 되면 -2가 출력된다.   

```scala 
// dateFormat: output 원하는 데이터 포맷 (ex. yyyy-MM-dd)  
def diffDate(stringFormat: String, startDate: String, endDate: String) : Int = {
    val formatter: format.DateTimeFormatter = DateTimeFormat.forPattern(stringFormat)
    val start = formatter.parseDateTime(startDate)
    val end = formatter.parseDateTime(endDate)

    val days = Days.daysBetween(start, end)
    days.getDays
  }

val start = "2021-01-01"
val end = "2021-01-03"
println(diffDate(stringFormat, end, start)) // 출력 : 2
```

또한, Json으로 받아온 데이터는 모두 String형태이며, 이 데이터를 시간 타입으로 
변경하여 사용이 필요한 경우가 종종 있다. ISO로 표현되는 문자열의 경우 
Joda time 라이브러리를 통해 쉽게 변경이 가능하다.  

```scala   
val parsedDateTime = DateTime.parse("2018-05-05T10:11:12.123Z")
val parsedDateTime = DateTime.parse("2018-05-05T10:11:12.123+09:00")
```

마지막으로 기존에 사용하던 API와 호환도 가능하다.   

```scala   
// java.util.Date -> joda time으로 변경    
val date: Date = new Date()
val time:DateTime = new DateTime(date)
```

```scala
// joda time -> java.sql.timestamp 로 변경 
val jodaTime: DateTime = new DateTime()
val timestamp: Timestamp = new Timestamp(jodaTime.getMillis)
```



#### 시,분,초, 밀리세컨 모두 최대치로 초기화     

상황에 따라서 날짜를 23시 59분 59초 999 밀리세컨과 같이 변경이 필요할 때가 있다.   
예를 들어 하루에 한번 배치가 실행되고 시간 간격을 0시 0분 0초 ~ 23시 59분 59초로 
변경해서 쿼리를 실행해야 할 때 유용하다.   

```scala   
def maximize(date: Date): Date = {
    val cal = Calendar.getInstance()
    cal.setTime(date)

    cal.set(Calendar.HOUR_OF_DAY,23)
    cal.set(Calendar.MINUTE, 59)
    cal.set(Calendar.SECOND, 59)
    cal.set(Calendar.MILLISECOND,999)

    cal.getTime
  }
```

joda time으로 아래와 같이 변경해서 사용할 수 있다. 
jodaTime은 불변 객체이기 때문에 객체를 생성 후 변경 할 수 없다. 
하지만 아래와 같이 새로운 변수를 생성해서 값을 변경할 수 있다.   

```scala   
def maximize(date: Date): Timestamp = {

    val jodaTime = new DateTime(date)

    val time = jodaTime.withTime(23, 59, 59, 999)
    new Timestamp(time.getMillis)
  }
```


- - - 

**Reference**    

<https://www.baeldung.com/joda-time>   
<https://howtodoinjava.com/java/date-time/parse-string-to-date-time-utc-gmt/>   
<https://alvinalexander.com/scala/scala-get-current-date-time-hour-calendar-example/>   
<https://vmpo.tistory.com/77>    
<https://twpower.github.io/29-iso8601-utc-and-python-example>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

