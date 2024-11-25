---
layout: post
title: "[Iceberg] Apache Iceberg - Hidden Partitioning"
subtitle: "시간에 따른 메타데이터 심층 탐구" 
comments: true
categories : BigData
date: 2024-10-03
background: '/img/posts/mac.png'
---

## 1. Partitioning in apache hive   

iceberg 에서 제공하는 hidden partitioning을 살펴보기 위해 
아래 예제를 통해 기존 hive 에서 파티셔닝을 먼저 확인해보자.   

```
+----------------+----------------------+--------+---------+
| transaction_id |    transaction_dt    | amount | cust_id |
+----------------+----------------------+--------+---------+
| 1              | 2023-04-25 11:12:11  | 100.00 | c1      |
| 2              | 2023-04-25 12:12:12  | 200.00 | c1      |
| 3              | 2023-04-26 11:11:11  | 300.50 | c2      |
| 4              | 2023-04-26 10:12:10  | 500.00 | c3      |
+----------------+----------------------+------------------+
```

위 데이터를 저장할 테이블을 생성해보자.   

```sql
CREATE TABLE sales_data (
transaction_id int,
transaction_dt timestamp,
amount         double,
cust_id        string
)
PARTITIONED by (day_part string)
```

또한, 테이블에 데이터를 저장하기 위해 특정 포맷에 맞게 변환해주어야 한다.  

```sql
INSERT OVERWRITE TABLE sales_data
PARTITION (day_part)
SELECT
transaction_id,
transaction_dt,
amount,
cust_id string,
substring(transaction_dt,1,10) as part_day -- yyyy-MM-dd
FROM temp_view;
```

이제 파티션된 테이블에서 데이터를 쿼리하기 위해서 
아래와 같이 명시적으로 파티션을 적용해주어야 한다.   
`즉, 우리는 partition pruning 을 이용하여 효율적인 
쿼리를 위해 매번 partiton에 대한 포맷정보를 기억하고 있어야 한다.`    

```sql
select * from sales_data where part_day = '2023-04-25' and <other-filters>   
```

`즉, 실제 파티션에 대한 포맷 및 타입이 다를 경우 기대와 다른 전체 테이블을 
스캔하여 성능 저하가 발생할 수 있다.`   

- - - 

## 2. Iceberg's hidden partitioning   

`Hive 와 같이 Iceberg에서는 명시적으로 partition value에 대해서 
제공할 필요가 없다.`   

아래 예제를 살펴보자.   

```python
ddl = """
CREATE TABLE dev.sales_data
(trnsaction_id  int,
transaction_dt  timestamp, 
amount          double, 
cust_id         string)
USING iceberg
PARTITIONED BY (day(transaction_dt))
"""

spark.sql(ddl)

spark.sql("DESCRIBE EXTENDED dev.sales_data").show(20,False) 
```   

위에서는 iceberg에서 제공하는 다양한 [transform](https://iceberg.apache.org/spec/#partition-transforms) type 을 
이용하여 파티션을 생성하였다.  

이제 데이터를 테이블에 저장해보자.   

```python
from datetime import datetime
from pyspark.sql.types import *

data = [
        (1, datetime.strptime("2023-04-25 11:12:11", '%Y-%m-%d %H:%M:%S'), 100.00, "C1"),
        (2, datetime.strptime("2023-04-25 12:12:12", '%Y-%m-%d %H:%M:%S'), 200.00, "C1"),
        (3, datetime.strptime("2023-04-26 11:11:11", '%Y-%m-%d %H:%M:%S'), 200.00, "C2"),
        (4, datetime.strptime("2023-04-26 10:12:10", '%Y-%m-%d %H:%M:%S'), 300.50, "C2"),
        (5, datetime.strptime("2023-04-27 11:12:10", '%Y-%m-%d %H:%M:%S'), 300.00, "C3"),
    ]

schema = StructType([
        StructField("trnsaction_id", IntegerType(), True), \
        StructField("transaction_dt", TimestampType(), True), \
        StructField("amount", DoubleType(), True), \
        StructField("cust_id", StringType(), True), \
    ])

df = spark.createDataFrame(data=data,schema=schema)
df.writeTo("dev.sales_data").append()
```

저장된 데이터를 확인해보면 3개의 파티션이 생성되었다.   

<img width="1200" alt="스크린샷 2024-11-25 오후 3 53 43" src="https://github.com/user-attachments/assets/811121a0-318f-4560-ae67-f4a05b919424">   

```python
from pyspark.sql.functions import col
spark.table('dev.sales_data').filter((col('transaction_dt')>='2023-04-25 00:00:00') & (col('transaction_dt')<'2023-04-26 00:00:00')).show()
```

`위와 같이 명시적으로 파티션의 포맷에 맞게 쿼리를 하지 않고도 
2023-04-25 파티션의 데이터를 가져올 수 있다.`  

`Spark Job UI 에서 실제로 3개의 파티션 중에 2개의 파티션을 skip 한 부분을 
확인해볼 수 있다.`        

<img width="700" alt="스크린샷 2024-11-25 오후 3 57 52" src="https://github.com/user-attachments/assets/d74be889-1c4e-426f-818b-edda06f7ee5d">   

<img width="816" alt="스크린샷 2024-11-25 오후 3 58 05" src="https://github.com/user-attachments/assets/e78b5a5e-6f41-4f71-8304-9a215a96eb9a">     







- - -

<https://tech.kakao.com/posts/656>   
<https://iceberg.apache.org/docs/latest/partitioning/#icebergs-hidden-partitioning>   
<https://bigdataenthusiast.medium.com/apache-iceberg-hidden-partitioning-e42762caacae>   


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







