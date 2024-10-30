---
layout: post
title: "[Spark] Spark에서 Iceberg 테이블 다루기"
subtitle: "테이블 생성 및 업데이트, 병합 쿼리" 
comments: true
categories : Spark
date: 2024-10-09
background: '/img/posts/mac.png'
---

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

> spark_catalog는 해당 catalog의 이름이다.   

위의 코드에서 `catalog.type을 hive`로 지정하였고, 이는 hive 메타스토어를 사용하여 
테이블의 메타데이터를 관리한다.   
hive를 사용하는 경우는 기존에 hive 생태계를 사용하고 있어서 
여러 어플리케이션이 메타데이터를 공유해야 하는 경우에 주로 사용한다.   

반면 `hadoop으로 설정하면 hive 메타스토어를 사용하지 않고, Iceberg가 
자체적으로 hdfs나 s3와 같은 파일 시스템을 통해 메타데이터 파일을 관리`한다.   
메타데이터는 테이블의 메타데이터 디렉토리에 json 파일 형식으로 저장된다.  

- - - 

## 2. 테이블 생성   


```python
// Iceberg 테이블 생성
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

## 3. merge

```python
// Iceberg 테이블에 조건부 업데이트/삽입 (MERGE INTO)
spark.sql("""
  MERGE INTO my_catalog.db.my_table t
  USING updates u
  ON t.id = u.id
  WHEN MATCHED THEN UPDATE SET *
  WHEN NOT MATCHED THEN INSERT *
""")
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







