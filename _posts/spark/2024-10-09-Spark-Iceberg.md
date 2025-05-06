---
layout: post
title: "[Spark] Spark에서 Iceberg 테이블 다루기"
subtitle: "테이블 생성(create) / partitionOverwriteMode, storeAssignmentPolicy(ANSI, legacy, strict) / insert overwrite 와 merge into" 
comments: true
categories : Spark
date: 2024-10-09
background: '/img/posts/mac.png'
---

이번글에서는 spark에서 iceberg 테이블 사용 방법을 다룰 예정이며, 
    spark(버전 3.4.1)과 iceberg(1.4.3) 기준으로 실습을 진행한다.      

- - - 

## 1. Spark 에서 Iceberg 사용   

Spark에서 Iceberg 테이블을 사용하기 위한 코드를 살펴보자.  

```python
from pyspark.sql import SparkSession

# Spark 세션 생성
spark = SparkSession.builder \
    .appName("Iceberg Snapshot Example") \
    .config("spark.sql.catalog.spark_catalog", "org.apache.iceberg.spark.SparkSessionCatalog") \
    .config("spark.sql.catalog.spark_catalog.type", "hive") \
    .config("spark.sql.extensions", "org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions") \
    .getOrCreate()
```

> Spark는 기본적으로 spark_catalog 라는 내장 카탈로그를 사용한다.   
> 카탈로그의 역할은 테이블, 뷰, 메타데이터 조회 및 관리하며, 다양한 메타스토어(Glue, Hive, JDBC 등)를 
지원할 수 있도록 연결 역할을 수행한다.   

위의 코드에서 `catalog.type을 hive`로 지정하였고, 이는 hive 메타스토어를 사용하여 
테이블의 메타데이터를 관리한다.   
hive를 사용하는 경우는 기존에 hive 생태계를 사용하고 있어서 
여러 어플리케이션이 메타데이터를 공유해야 하는 경우에 주로 사용한다.   

`메타스토어는 테이블, 스키마, 파티션 등 메타데이터를 저장하는 저장소이며, 카탈로그는 메타데이터를 
관리하는 인터페이스이며 API 개념이라고 이해하면 된다.`   


반면 `hadoop으로 설정하면 hive 메타스토어를 사용하지 않고, Iceberg가 
자체적으로 hdfs나 s3와 같은 파일 시스템을 통해 메타데이터 파일을 관리`한다.      

> hadoop 카탈로그는 production 환경에서는 적절하지 않으며, 테스트시에만 사용하는 것이 권장된다.  



더 자세한 내용은 [링크](https://wonyong-jang.github.io/bigdata/2024/10/01/Apache-Iceberg.html)에서 확인하자.   

또한, procedures 와 같이 iceberg에서 제공하는 새로운 sql command를 사용하기 위해 
spark.sql.extensions을 추가해주었다.   

- - - 

## 2. 테이블 생성  

spark를 통해 iceberg 테이블 생성은 아래와 같이 가능하다.   


```python
## Iceberg 테이블 생성
spark.sql("""
  CREATE TABLE my_catalog.db.my_table (
    id BIGINT,
    name STRING,
    ts TIMESTAMP
  ) USING iceberg
  PARTITIONED BY (days(ts))
""")
```

- - - 

## 3. Merge

iceberg 테이블에 행을 조건부로 업데이트, 삭제 또는 삽입할 수 있다.  
source 테이블의 정보로 target 테이블을 업데이트를 진행한다.  

`iceberg 공식문서에서는 insert overwrite 보다는 merge into를 권장하고 있으며, 
    이는 영향을 받은 데이터 파일만 교체할 수 있고 테이블의 파티션이 변경될 경우 동적으로 데이터를 
    overwrite 할 수 있기 때문이라고 한다.`      



```python
## Iceberg 테이블에 조건부 업데이트/삽입 (MERGE INTO)
spark.sql("""
  MERGE INTO my_catalog.db.my_table target  # target table
  USING updates source                      # source
  ON target.id = source.id                  # condition to find updates for target rows   
  WHEN MATCHED THEN UPDATE SET *
  WHEN NOT MATCHED THEN INSERT *
""")
```

위와 같이 매칭되는 rows들을 모두 업데이트 또는 삽입을 할 수도 있으며, 
    특정 조건을 추가하여 특정 컬럼만 업데이트할 수도 있다.   

```python
WHEN MATCHED AND s.op = 'delete' THEN DELETE
WHEN MATCHED AND t.count IS NULL AND s.op = 'increment' THEN UPDATE SET t.count = 0
WHEN MATCHED AND s.op = 'increment' THEN UPDATE SET t.count = t.count + 1
```

- - - 

## 4. Write   

spark에서 iceberg를 사용할 때
여러가지 방식으로 [데이터 쓰기](https://iceberg.apache.org/docs/nightly/spark-writes/)가 가능하다.   

`주의해야 할 점은 spark 3.0 이상 부터 spark.sql.storeAssignmentPolicy 
옵션을 ansi 로 설정하는 것이 요구된다.`   

`해당 옵션은 ANSI SQL 표준을 따르며, 데이터 타입 불일치 등이 발생하면 예외를 던진다.` 
`ANSI 방식은 string을 int로 변환하거나 double 을 boolean 변환 등을 허용하지 않는다.`   
따라서 데이터 무결성을 위해 해당 옵션이 권장되며 Spark 3.0 버전부터는 default로 ANSI 정책을 
사용하도록 변경되었다.  


`데이터 insert를 할 때 사용되는 옵션이며, legacy로 설정할 경우 타입 캐스팅을 허용한다.`      
예를 들면 string to int or double to boolean 를 허용하기 때문에
데이터 무결성에 문제가 발생할 수 있다.  

`또한, strict 옵션도 존재하며 이는 어떠한 변경도 허용하지 않는다.`     
예를 들면 double to int or decimal to double 또한 허용하지 않는다.  


```python
.config("spark.sql.storeAssignmentPolicy", "ansi") # sparkSession에 추가  
```

### 4-1) Insert Overwrite   

spark에서 아래 옵션을 이용해서 파티션을 동적 또는 정적으로 overwrite 할 수 있다.   

```python
.config("spark.sql.sources.partitionOverwriteMode", "dynamic") # dynamic or static
```

`default overwrite는 static 모드이며, insert overwrite 보다는 merge into를 권장하고 있지만 
insert overwrite를 사용해야 한다면 dynamic overwrite mode를 권장한다.`     

static mode를 정확하게 이해하지 못하고 사용할 경우는 전체 파티션이 삭제될 수 있기 때문이며, 
    이는 아래 예시를 통해서 살펴보자.   

```python
ddl = """create table iceberg.customer (country string, customerid bigint, customername string) 
USING iceberg 
PARTITIONED BY (country)"""

spark.sql(ddl)

spark.sql("INSERT INTO iceberg.customer VALUES ('US',1001,'A'), ('INDIA',1002,'B'), ('INDIA',1003,'C') ")

spark.sql("select * from iceberg.customer").show()

spark.conf.get("spark.sql.sources.partitionOverwriteMode")
```   

위 결과는 2개의 파티션과 3개의 record가 생성된다.   
아래 데이터를 이용해서 static과 dynamic 모드를 각각 테스트 해보자.   

```
+-------+----------+------------+
|country|customerid|customername|
+-------+----------+------------+
|     US|      1001|           A|
|  INDIA|      1002|           B|
|  INDIA|      1003|           C|
+-------+----------+------------+
```

`주의해야 할점은 파티션 절 없이 아래와 같이 insert overwrite 할 경우는 
모든 파티션이 교체된다.`   

```python
spark.sql(""" with data as
                   (select 'INDIA' country, 1004 customerid, 'D' customername
                       union all
                    select 'INDIA' country, 1005 customerid, 'E' customername
                    )

           INSERT OVERWRITE iceberg.customer SELECT * from data """)

spark.sql("select * from iceberg.customer").show()

-- output --

+-------+----------+------------+
|country|customerid|customername|
+-------+----------+------------+
|  INDIA|      1004|           D|
|  INDIA|      1005|           E|
+-------+----------+------------+
```

위 결과를 보면 파티션 절 없이 사용했기 때문에 기존에 존재하던 
모든 rows 들이 제거된다.  

`이를 해결하기 위해서 partitionOverwriteMode가 static 모드 일때 
아래와 같이 파티션 절을 같이 사용해준다.`      

```python
spark.sql(""" with data as 
                   (select 'INDIA' country, 1004 customerid, 'D' customername
                       union all 
                    select 'INDIA' country, 1005 customerid, 'E' customername
                       union all
                    select 'INDIA' country, 1006 customerid, 'F' customername
                    ) 
           
           INSERT OVERWRITE iceberg.customer
           PARTITION (country = 'INDIA') 
           SELECT customerid, customername  from data """)

-- output --
+-------+----------+------------+
|country|customerid|customername|
+-------+----------+------------+
|     US|      1001|           A|
|  INDIA|      1004|           D|
|  INDIA|      1005|           E|
|  INDIA|      1006|           F|
+-------+----------+------------+
```

그럼 이제 overwrite mode를 dynamic으로 사용해보자.   
partitionOverwriteMode 를 dynamic으로 설정후 아래 코드와 같이 
동적 파티셔닝을 할 수 있다.   

```python
spark.conf.set("spark.sql.sources.partitionOverwriteMode","dynamic")

spark.sql(""" with data as 
                   (select 'INDIA' country, 1004 customerid, 'D' customername
                       union all 
                    select 'INDIA' country, 1005 customerid, 'E' customername
                       union all
                    select 'INDIA' country, 1006 customerid, 'F' customername
                    ) 
           
           INSERT OVERWRITE iceberg.customer
           SELECT country, customerid, customername  from data """)

spark.sql("select * from iceberg.customer").show()

-- output --

+-------+----------+------------+
|country|customerid|customername|
+-------+----------+------------+
|     US|      1001|           A|
|  INDIA|      1004|           D|
|  INDIA|      1005|           E|
|  INDIA|      1006|           F|
+-------+----------+------------+
```



- - -

Reference

<https://wikidocs.net/228567>   
<https://iomete.com/resources/reference/iceberg-tables/maintenance>   
<https://magpienote.tistory.com/255>    
<https://iceberg.apache.org/docs/latest/spark-queries/>  
<https://iceberg.apache.org/docs/1.5.0/spark-writes/#merge-into-syntax>   
<https://developers-haven.tistory.com/50>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







