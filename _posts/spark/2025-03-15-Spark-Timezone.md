---
layout: post
title: "[Spark] Globalization을 위한 Timezone 설정, TIMESTAMP_NTZ"
subtitle: "G11N / 파일 포맷(Parquet, Avro, ORC)에 따른 timestamp 처리시 이슈 / iceberg 에서 timestamp 이슈" 
comments: true
categories : Spark
date: 2025-03-15
background: '/img/posts/mac.png'
---

여러 나라에서 서비스를 제공하기 위해서는 
반드시 Timezone을 고려해야 하며, Spark 에서 timezone을 설정하여 
운영할 때 발생할 수 있는 이슈와 해결방법에 대해서 살펴보자.   

- - - 

## 1. Spark Timezone   

Spark 2.4 이전에는 아래와 같은 코드를 통해서 
Spark sql 엔진에서 사용되는 날짜 연산들에 대해서만 적용해 줄 수 있었다.   

```python
.config("spark.sql.session.timeZone", "UTC")
```

그러나, Spark 2.4 부터는 아래와 같이 JVM 전체 대상으로 
적용할수 있는 옵션을 제공하기 때문에 해당 옵션을 
같이 적용해주는 것이 좋다.   

```python
.config("spark.driver.extraJavaOptions", "-Duser.timezone=UTC")
.config("spark.executor.extraJavaOptions", "-Duser.timezone=UTC")
```   

`또한 Pyspark를 사용할 때는 Python 내장 함수는 JVM 또는 SparkSession timezone 설정에 영향을 받지 않기 
때문에 주의해야 한다.`     
예를 들면 아래와 같이 Python 내장 함수를 사용하는 경우는 위에서 설정한 옵션들에 대해 적용을 
받지 않는다.   

```python
from datetime import datetime

datetime.now()
```

따라서 추가로 os 의 타임존을 환경변수로 추가해주거나 
직접 timezone 파라미터로 적용하여 함수를 사용해야 한다.  

```python
import datetime
import os
import time

# Python 인터프리터의 타임존 설정
os.environ['TZ'] = 'Asia/Taipei'
time.tzset()  

print(time.tzname)
print(datetime.now()) # 지정된 타임존에 따라 시간 출력 
```

하지만 위의 경우 time.tzset() 는 window machine 에서는 사용이 불가능하며, 
    각 프로젝트마다 타임존을 설정해주는 코드가 적용되어야 하기 때문에 
아래와 같이 공통 함수 또는 yaml 파일 등을 통해 관리해주는 것이 권장된다.   


```python
import pytz
from datetime import datetime

DEFAULT_TZ = pytz.timezone("Asia/Taipei")

def now():
    return datetime.now(DEFAULT_TZ)
```

> pytz 에서 timezone 결과를 보면 +08:28로 이슈가 있기 때문에 파이썬 3.9 부터는 zoneinfo 를 
사용하는 것이 권장된다.  
> 현재 python 3.8을 사용해야하며  
    타임존 결과는 이슈가 있지만, datetime.now() 를 계산하는 과정은 이슈가 없기 때문에 위처럼 사용하였다.   

- - - 

## 2. Spark 에서 날짜 관련 함수    

Spark 에서 사용할 수 있는 날짜 관련 함수는 아래와 같다.   

```python
# current_timestamp()는 현재 설정된 timezone에 따라 현재 시간 출력    
# 즉 timezone 영향을 받기 때문에 주의해야 한다.  
spark.sql("""select date_format(current_timestamp(), "yyyy-MM-dd'T'HH:mm:ss")""")    

# from_utc_timestamp() 는 UTC 를 local timezone으로 변환   
spark.sql("""select date_format(from_utc_timestamp(current_timestamp(), 'Asia/Seoul'), "yyyy-MM-dd'T'HH:mm:ss")""") 

# to_utc_timestamp 는 local timezone을 utc 로 변환     
spark.sql("""select to_utc_timestamp(current_timestamp(), 'Asia/Seoul')""") 

# local timezone 과 관계없이 주어진 시간 기준으로 date 반환  
spark.sql("""SELECT to_date("2025-03-15T20:00:00.000+0900")""")
# output: 2025-03-15   
```

- - - 

## 3. Spark Timezone Issue   

Spark 3.x 부터 날짜 관련된 이슈가 대부분 해결되었지만 
[링크](https://issues.apache.org/jira/browse/SPARK-34675) 를 확인해보면 
여러 포맷에서 timezone을 다루는 방식 차이에서 문제가 발생할 수 있다.   

`Spark 에서 JVM 과 Spark Session Timezone 설정이 다를 경우 발생할 수 있는 문제가 있으며, 
    Spark는 여러 데이터 소스로부터 데이터를 처리하고 데이터 소스에서 사용하는 설정 및 파일 포맷의 
    처리 방식이 모두 다르기 때문에 발생할 수 있는 문제이다.`      

아래 예제를 보자.   
    
```python
--conf spark.sql.session.timeZone='UTC'
--conf spark.driver.extraJavaOptions='-Duser.timezone=UTC'
--conf spark.executor.extraJavaOptions='-Duser.timezone=UTC'
```

timezone 을 UTC로 설정해두고 각 포맷별로 테이블을 생성하여 timestamp 타입에 
데이터를 넣어보자.  

```python
spark.sql("create table spark_parquet(type string, t timestamp) stored as parquet")
spark.sql("create table spark_orc(type string, t timestamp) stored as orc")
spark.sql("create table spark_avro(type string, t timestamp) stored as avro")
spark.sql("create table spark_text(type string, t timestamp) stored as textfile")

spark.sql("insert into spark_parquet values ('FROM SPARK-EXT PARQUET', '1989-01-05 01:02:03')")
spark.sql("insert into spark_orc values ('FROM SPARK-EXT ORC', '1989-01-05 01:02:03')")
spark.sql("insert into spark_avro values ('FROM SPARK-EXT AVRO', '1989-01-05 01:02:03')")
spakr.sql("insert into spark_text values ('FROM SPARK-EXT TEXT', '1989-01-05 01:02:03')")
```

이후 UTC 설정이 아닌 spark session에서 데이터 조회시 결과를 살펴보자.   

```python
--conf spark.sql.session.timeZone='Asia/Seoul'
--conf spark.driver.extraJavaOptions='-Duser.timezone=Asia/Seoul'
--conf spark.executor.extraJavaOptions='-Duser.timezone=Asia/Seoul'
```

결과를 살펴보면 parquet 포맷은 시간대를 반영하여 타임스탬프를 표시하지만, 
    다른 포맷(orc, avro, csv, text) 은 원래의 UTC 타임스탬프를 그대로 표시한다.   

`이렇게 불일치가 발생하는 이유는 각 파일 포맷마다 시간대를 처리하는 방식의 차이에서 비롯된다.`  

위 케이스 외에도 외부의 여러 데이터 포맷과 환경에 따라서 데이터 이동 과정에서 
날짜 데이터에 의도하지 않는 변환이 발생할 수 있다.  

따라서 현재 팀 내에서는 아래와 같이 spark에서 날짜 타입을 다루도록 convention 으로 지정하였다.   

- spark 에서 사용하는 hive, iceberg 테이블의 날짜 데이터는 문자열로 다루며, 
    이 때 반드시 ISO8601 포맷과 timezone가 포함된 offset 을 같이 다루도록 한다.  
    - spark 에서 날짜 관련 연산이 필요하면, 해당 offset을 이용하여 parse 하여 사용하면 된다.  
- timestamp 타입으로 다뤄야 할 경우는 timestamp_ntz 를 사용하여 의도하지 않는 변환을 막는다.   


- - - 

## 4. TIMESTAMP_NTZ 타입 

`spark 3.4 부터 제공되며, 기존 timestamp 타입은 타임존을 고려하는 방식이며, 
      JVM 및 session timezone의 영향을 받지만 해당 타입은 timezone 
      영향 없이 있는 그대로 저장된다.`   

`즉, timestamp_ntz 는 타임존 관련 오류를 방지할 수 있으며, 
    hive, redshift 등 외부 시스템과의 호환성을 유지할 수 있다.`   
 
```python
# TIMESTAMP_NTZ 타입 
create table example (
    event_time timestamp_ntz
) using parquet

# 타입 캐스팅 
select cast('2025-03-15 00:00:00' as timestamp_ntz)
select timestamp_ntz '2025-03-15 00:00:00'
```

추가적으로 spark 3.4 에서 아래와 같이 timezone을 변경할수 있는 함수도 소개 되었다.   

```python
select convert_timezone('Asia/Seoul', 'UTC', TIMESTAMP_NTZ '2025-03-15 19:00:00')
# output: 2025-03-15 10:00:00    

# Current session local timezone: UTC
spark.sql("""SELECT convert_timezone('Asia/Seoul', timestamp_ntz'2025-03-15 10:00:00')""").show(truncate=False)
# 2025-03-15 19:00:00   
```

- - -

## 5. iceberg 에서 timestamp 사용시 주의사항   

iceberg 테이블 생성은 spark에서도 가능하지만 hive 에서도 가능하다.  
`hive 에서 테이블 생성을 아래와 같이 생성시 timestamp_ntz 타입으로 생성되기 때문에 
이를 정확하게 이해해야 한다.`     

```sql
create table iceberg_table (
    `type` string,
    `t` timestamp
)
```

`위 테이블의 컬럼 타입을 확인해보면 timestamp_ntz 로 생성이 되며, timezone 을 
고려한 timestamp 타입을 사용하려면 아래와 같이 테이블을 생성해주어야 한다.`   

```sql
create table iceberg_table (
    `type` string,
    `t` timestamp with local time zone
)
```

- - -

Reference

<https://www.databricks.com/blog/2020/07/22/a-comprehensive-look-at-dates-and-timestamps-in-apache-spark-3-0.html>   
<https://issues.apache.org/jira/browse/SPARK-34675?utm_source=chatgpt.com>   
<https://stackoverflow.com/questions/48767008/spark-strutured-streaming-automatically-converts-timestamp-to-local-time/48767250#48767250>  
<https://community.databricks.com/t5/technical-blog/introducing-timestamp-ntz-in-apache-spark-the-timestamp-without/ba-p/50586>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







