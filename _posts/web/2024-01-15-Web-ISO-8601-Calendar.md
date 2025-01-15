---
layout: post
title: "[Web] 달력 주차 ISO 8601 를 이용하여 표준화 하기"
subtitle: "연간 주차 계산(24W52)"
comments: true
categories : Web
date: 2024-01-15
background: '/img/posts/mac.png'
---

업무에서 달력 주차를 여러 도메인에서 계산하여 사용하고 있고, 
    최근 2024년 12월 31일에 계산된 달력 주차가 각 도메인마다 상이했던 
    문제가 발생했다.   

> 예를 들면 A 라는 도메인에서 계산된 월 주차는 25W01 이였지만 B라는 도메인에서 
계산된 주차는 24W52 였다.   

왜 이런 문제가 발생하는지와 표준화 하는 방법에 대해 살펴보자.  

- - -

## 1. 각 도메인마다 표준화되어 있지 않고 다양한 방식으로 계산   

문제는 2024년 12월 30일을 계산하는 주차에서 문제가 발생했다.   
이는 ISO 8601과 같은 표준을 따르지 않고, 다양한 계산 방식을 통해 계산을 진행했기 
때문에 결과값이 다르게 노출되었다.   

ISO 8601 표준은 국제적으로 가장 널리 사용되며, 연도 변경 시 주차 계산에서 발생할 수 있는 
혼란을 줄일수 있다.   

- - - 

## 2. 국제 표준화 기구인 ISO 8601   

국제 표준 ISO 8601 에 따르면 `매주의 시작일은 월요일에서 시작해서 일요일에 끝난다.`   

매월의 첫 주는 4일 이상이 포함된 주를 기준으로 한다.   
즉, 목요일 기준으로 계산이 진행되며, 목요일이 어느쪽에 포함되어 
있는지 보면 된다.   

`2024년 12월 30일 또는 2024년 12월 31일의 달력을 보면 목요일이 2025년에 
포함되어 있기 때문에 25W01, 즉 1주차에 해당한다.`   

<img width="201" alt="스크린샷 2025-01-15 오전 8 55 39" src="https://github.com/user-attachments/assets/4066f6d9-c783-4fe8-afe3-7d4554ee2346" />

- - - 

## 3. 언어와 플랫폼에서 제공하는 표준 라이브러리 사용   

### 3-1) Java

- java.time.LocalDate 와 WeekFields.ISO  

```java
import java.time.LocalDate;
import java.time.temporal.WeekFields;
import java.util.Locale;

LocalDate date = LocalDate.of(2024, 12, 30);

// ISO 8601 기준으로 연도 및 주차 계산
WeekFields weekFields = WeekFields.ISO;
int weekOfYear = date.get(weekFields.weekOfWeekBasedYear());
int year = date.get(weekFields.weekBasedYear());

// 결과 출력
System.out.println("ISO 8601 기준: " + year + "W" + String.format("%02d", weekOfYear));
```

### 3-2) Python   

```python
import datetime

# 날짜 설정
date = datetime.date(2024, 12, 30)

# ISO 8601 기준으로 연도 및 주차 계산
iso_year, iso_week, _ = date.isocalendar()

# 결과 출력
print(f"ISO 8601 기준: {iso_year}W{iso_week:02}")
```

### 3-3) SQL

```sql
SELECT YEARWEEK('2024-12-30', 3) AS iso_yearweek,
YEAR('2024-12-30' + INTERVAL 1-DAYOFWEEK('2024-12-30') DAY) AS iso_year,
WEEK('2024-12-30', 3) AS iso_week;
```

### 3-4) pyspark   

```python
# DataFrame 생성
df = spark.createDataFrame(data, schema)

# ISO 8601 연도 및 주차 계산
result_df = df.withColumn("iso_year", date_format("date", "g")) \
              .withColumn("iso_week", date_format("date", "V"))
```

- - -
Referrence 

<https://medium.com/monday-9-pm/%EC%B4%88%EB%B3%B4-%EA%B0%9C%EB%B0%9C%EC%9E%90-url-shortener-%EC%84%9C%EB%B2%84-%EB%A7%8C%EB%93%A4%EA%B8%B0-1%ED%8E%B8-base62%EC%99%80-%EC%B6%A4%EC%9D%84-9acc226fb7eb>     
<https://it-eldorado.tistory.com/143>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

