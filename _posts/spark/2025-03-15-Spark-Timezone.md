---
layout: post
title: "[Spark] Globalization을 위한 Timezone 설정, TIMESTAMP_NTZ"
subtitle: "G11N / 파일 포맷(Parquet, Avro, ORC)에 따른 timezone 처리" 
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

그러나, Spark 2.4 부터는 아래와 같이 JVM 전체 대상으로 적용해주기 때문에 
옵션을 같이 적용해주는 것이 좋다.   

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

하지만 위의 경우 time.tzset() 는 window machine 에서는 사용이 불가능하기 때문에 
아래와 같이 공통 함수로 사용할 수 있도록 제공하는 것을 권장한다.   


```python
import pytz
from datetime import datetime

DEFAULT_TZ = pytz.timezone("Asia/Taipei")

def now():
    return datetime.now(DEFAULT_TZ)
```

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

## TIMESTAMP_NTZ 타입 

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







