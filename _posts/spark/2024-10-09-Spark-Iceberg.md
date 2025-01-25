---
layout: post
title: "[Spark] Spark에서 Iceberg 테이블 다루기"
subtitle: "테이블 생성 및 업데이트, 병합 쿼리 / partitionOverwriteMode, storeAssignmentPolicy" 
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
메타데이터는 테이블의 메타데이터 디렉토리에 json 파일 형식으로 저장된다.    

또한, procedures 와 같이 iceberg에서 제공하는 새로운 sql command를 사용하기 위해 
spark.sql.extensions을 추가해주었다.   

- - - 

## 2. 테이블 생성   


```python
-- Iceberg 테이블 생성
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

```python
-- Iceberg 테이블에 조건부 업데이트/삽입 (MERGE INTO)
spark.sql("""
  MERGE INTO my_catalog.db.my_table t
  USING updates u
  ON t.id = u.id
  WHEN MATCHED THEN UPDATE SET *
  WHEN NOT MATCHED THEN INSERT *
""")
```


- - - 

## 4. Write   

spark에서 iceberg를 사용할 때
여러가지 방식으로 [데이터 쓰기](https://iceberg.apache.org/docs/nightly/spark-writes/)가 가능하다.   

`주의해야 할 점은 spark 3.0 이상 부터 spark.sql.storeAssignmentPolicy 
옵션을 ansi 로 설정하는 것이 요구된다.`   

`해당 옵션은 ANSI SQL 표준을 따르며, 데이터 타입 불일치 등이 발생하면 예외를 던진다.`  
따라서 데이터 무결성을 위해 해당 옵션이 권장되며 기본값은 legacy로 설정되어 있다.   

데이터 insert를 할 때 사용되는 옵션이며, legacy로 설정할 경우 타입 캐스팅을 허용한다.  
예를 들면 string to int or double to boolean 를 허용하기 때문에
데이터 무결성에 문제가 발생할 수 있다.  

`또한, strict 옵션도 존재하며 이는 어떠한 변경도 허용하지 않는다.`     
예를 들면 double to int or decimal to double 또한 허용하지 않는다.  


```python
.config("spark.sql.storeAssignmentPolicy", "ansi") // sparkSession에 추가  
```

### 4-1) Insert Overwrite   

spark에서 아래 옵션을 이용해서 파티션을 동적 또는 정적으로 overwrite 할 수 있다.   

```
.config("spark.sql.sources.partitionOverwriteMode", "dynamic") // dynamic or static
```

default overwrite는 static 모드이며, 먼저 static mode 예시를 보자.  

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

`주의해야 할점은 파티션 없이 아래와 같이 insert overwrite 할 경우는 
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

위 결과를 보면 파티션 절이 없이 때문에 기존에 존재하던 
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

<https://wikidocs.net/228567>   
<https://iomete.com/resources/reference/iceberg-tables/maintenance>   
<https://magpienote.tistory.com/255>    
<https://iceberg.apache.org/docs/latest/spark-queries/>   
<https://developers-haven.tistory.com/50>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







