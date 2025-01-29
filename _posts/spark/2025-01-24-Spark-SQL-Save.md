---
layout: post
title: "[Spark] Spark에서 테이블 저장"
subtitle: "save, saveAsTable 비교 / writeTo, insertInto" 
comments: true
categories : Spark
date: 2025-01-24
background: '/img/posts/mac.png'
---

## 1. save()와 saveAsTable() 차이   

둘의 차이를 이해하기 위해서는 먼저 메타스토어를 이해해야 한다.     
spark는 RDB처럼 자신이 직접 메타데이터를 관리하지 않는다.     

`메타스토어는 테이블, 스키마, 파티션 등 메타데이터를 저장하는 저장소이며, 
    Spark 뿐만 아니라 Hive, Presto, Trino 등 여러 시스템이 메타스토어를 공유하여 사용할 수 있다.`  

> spark를 사용하면 hive 메타스토어를 많이 사용하게 되며, Hive 를 통해 생성한 테이블을 
Spark에서 조회할수 있는 이유도 메타스토어를 공유하기 때문이다.   



### 1-1) save()

`save() 는 location 기반으로 데이터프레임을 저장`하며 S3, HDFS, Local 등의 
파일시스템에 저장한다.   

`메타스토어에 테이블로 쓰지 않는다. 
즉, 메타스토어에 메타데이터를 갱신하지 않는다.`   

즉, 메타스토어에는 테이블이 등록되지 않고, 파일시스템에만 데이터가 저장되어 있기 때문에 
Spark SQL 에서 select * from table; 과 같은 SQL로 직접 조회할 수 없다.   

아래와 같이 데이터 프레임을 저장할 수 있다.   

```python   
df.write.format("parquet").mode("append").save("/path/to/destination")
```

해당 데이터를 읽기 위해서는 아래와 같이 가능하다.   

```python
spark.read.parquet("/path/to/destination")   
```


### 1-2) saveAsTable()   

saveAsTable() 는 파일시스템에 데이터를 쓰면서,  
테이블로 쓰기 때문에 `메타스토어에 메타데이터가 저장`된다.   

이때 SaveMode 에 따라서 동작 방식이 달라진다.   

##### SaveMode.Append

기존 테이블이 존재하면 새로운 데이터를 기존 테이블에 추가하며, 테이블이 없다면 
새로운 테이블을 생성한다.   

##### SaveMode.Overwrite   

`기존 테이블이 존재하면 테이블을 삭제(Drop Table) 한 후 새롭게 테이블 생성 하여 
데이터를 쓴다.`   

`주의해야할 부분은 파티션 된 테이블에서도 특정 파티션만 overwrite 하는 것이 아니라, 기존 테이블 삭제 후 
다시 생성한다는 것이다.`   

`따라서, 특정 파티션만 덮어씌워야 한다면 아래와 같이 partitionOverwriteMode를 추가해야 한다.`   

```python
df.write
    .mode("overwrite")
    .option("partitionOverwriteMode", "dynamic") 
    .saveAsTable("sales")   
```    

- - -    


## 2. insertInto()   

위에서 saveAsTable과 달리 컬럼 이름이 아니라 `포지션을 이용해 데이터를 적재하므로, 
    컬럼개수 및 순서가 맞아야 한다.`      

또한, 테이블이 이미 존재해야만 사용이 가능하다.   

- - - 

## 3. writeTo()   

Iceberg, Delta Lake 등의 테이블을 대상으로 데이터를 추가(append), 덮어쓰기(overwrite), 병합(merge) 
    할수 있다.   

기존 Hive 방식이 아닌, Spark SQL의 Table Catalog를 직접 조작하는 방식이다.   

```python
df.writeTo(t).create() # is equivalent to CREATE TABLE AS SELECT
df.writeTo(t).replace() # is equivalent to REPLACE TABLE AS SELECT
df.writeTo(t).append() # is equivalent to INSERT INTO
df.writeTo(t).overwritePartitions() # is equivalent to dynamic INSERT OVERWRITE
```

- - -

Reference

<https://iceberg.apache.org/docs/1.5.0/spark-writes/#writing-with-dataframes>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







