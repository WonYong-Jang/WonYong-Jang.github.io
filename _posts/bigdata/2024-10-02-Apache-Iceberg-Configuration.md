---
layout: post
title: "[Iceberg] Apache Iceberg 주요 설정 및 테이블 생성"
subtitle: "iceberg 테이블 생성 및 주요 설정 / snapshot 및 메타데이터 관리 옵션 / 테이블 복구 및 유지보수" 
comments: true
categories : BigData
date: 2024-10-02
background: '/img/posts/mac.png'
---

이번글 에서는 Apache Iceberg 테이블의 주요 설정 및 
메타데이터를 관리하기 위한 여러가지 방법 및 옵션에 대해 살펴보자.    

- - - 

## 1. 테이블 생성

아래와 같이 iceberg 테이블 생성 예시를 통해 
[주요 옵션](https://iceberg.apache.org/docs/latest/configuration/#reserved-table-properties)에 대해서 살펴보자.  

```
CREATE TABLE my_catalog.my_db.my_table (
    id BIGINT,
    created_at TIMESTAMP
)
USING iceberg
PARTITIONED BY (days(created_at))
TBLPROPERTIES (
    'format-version' = '2',  
    'write.target-file-size-bytes' = '134217728', -- 128MB
    'write.metadata.delete.after-commit.enabled' = 'true',
    'write.metadata.previous-versions-max' = 10
    'read.split.target-size' = '134217728', -- 128MB
    'write.parquet.row-group-size-bytes' = '8388608', -- 8MB
    'write.delete.mode' = 'copy-on-write',
    'write.update.mode' = 'copy-on-write',
    'write.merge.mode' = 'copy-on-write',
    'history.expire.max-snapshot-age-ms' = '2592000000',
    'history.expire.min-snapshots-to-keep' = 5
);
```

#### external.table.purge   

`테이블 삭제시 데이터 파일의 삭제 여부를 제어하는 속성이며, true로 설정되어 있으면 
테이블을 삭제할 때 데이터 파일까지 함께 삭제된다.`      

```sql
CREATE EXTERNAL TABLE my_table (
    id BIGINT,
    name STRING
)
USING iceberg
LOCATION 's3://my-bucket/my_table'
TBLPROPERTIES ('external.table.purge' = 'true');
```



#### format-version

iceberg 테이블의 포맷 버전을 설정한다. 포맷 버전 2를 사용하면 
Row-level Deletes, Position Deletes, Equality Deletes와 
같은 기능을 지원한다.   

> 버전 2로 설정할 경우 더 많은 기능을 제공하지만 
Spark, Flink 등 호환 되는지 확인이 필요하다.  

#### write.format.default   

iceberg 테이블에서 데이터를 저장할 기본 파일 형식을 설정한다.    

> parquet, orc, avro 등

#### write.parquet.compression-codec / write.orc.compression-codec

데이터 파일의 압축 방식을 설정한다.   

> snappy, zlib, zstd, gzip 등이 있다.  

#### write.metadata.delete.after-commit.enabled 

커밋 후 사용되지 않는 `메타데이터 파일을 자동으로 삭제할지 여부를 설정한다.`      
메타데이터가 빠르게 축적되는 대규모 테이블에서는 이를 true로 활성화 하여 
메타데이터 파일을 관리할 수 있다.   

> 메타데이터 파일은 테이블의 상태를 기록한 메타데이터의 JSON 파일이다.   
> default: false   

#### write.metadata.previous-versions-max   

`메타데이터 파일 버전의 개수를 제한한다.`   
`새 메타데이터가 생성될 때 이 값을 초과하는 이전 버전이 있으면, 
    자동으로 가장 오래된 메타데이터 파일이 삭제된다.`     

> 메타데이터는 스키마 변경 및 테이블 속성 등을 변경할 때 신규로 생성된다.   

#### write.delete.mode / write.update.mode / write.merge.mode  

`iceberg 에서는 데이터의 삭제, 업데이트, 병합 작업을 수행할 때 
다양한 모드를 설정할 수 있다.`      
`이 모드들은 데이터 처리 방식과 쿼리 성능에 큰 영향을 미치기 때문에, 
    각 모드의 특징과 동작 방식을 이해하고 적절히 사용해야 한다.`      


- copy-on-write(기본값)   
    - 분석 작업 위주로 데이터를 자주 읽고, 업데이트 및 삭제가 드문 경우 copy-on-read를 사용하여 빠른 처리가 가능하도록 설정할 수 있다.   
    - 읽기 성능이 중요할 때 적합하다.   

- merge-on-read   
    - 실시간 스트리밍 데이터처럼 빈번한 업데이트와 삭제가 필요한 경우 merge-on-read를 사용하여 빠른 처리가 가능하도록 설정할 수 있다.   
    - 업데이트 및 삭제 작업 성능이 중요할 때 적합하다.   

#### history.expire.max-snapshot-age-ms    

오래된 스냅샷을 자동으로 정리(삭제)하기 위한 설정이다.   
`이 설정을 통해 일정 기간이 지난 스냅샷을 제거함으로써, 테이블의 
메타데이터와 저장소를 효율적으로 관리할 수 있다.`      

`2592000000 밀리초는 30일(30 * 24 * 60 * 60 * 1000)을 의미하며, 
           이 설정은 30일이 지난 스냅샷을 자동으로 
           만료시켜 정리하도록 한다.`      

#### history.expire.min-snapshots-to-keep   

`스냅샷을 정리 작업을 수행할 때, 삭제되지 않고 항상 유지해야할 
최소 스냅샷 개수를 지정하는 옵션이다.`      
오래된 스냅샷을 자동으로 만료시킬 때, iceberg는 이 설정을 기준으로 
최소한으로 유지해야 할 스냅샷의 개수를 보장한다.   


- - -   

## 2. 테이블 복구 및 재구축   

Iceberg 테이블을 운영하다 보면, 여러 가지 이유로 테이블을 복구하거나 다시 설정해야 하는 상황이 발생할 수 있다.   
다음은 테이블 복구 및 재구축을 위해 사용되는 주요 방법들이다.   

### 2-1) 카탈로그에서 테이블이 제거된 경우    

`데이터와 메타데이터 파일이 정상적으로 존재하지만, 카탈로그에서 테이블이 삭제된 경우 아래 명령`을 사용해 
[테이블을 다시 등록](https://iceberg.apache.org/docs/1.6.1/spark-procedures/#register_table)할 수 있다.   
이 방법을 통해 기존 데이터 구조를 유지하면서 빠르게 테이블을 복구할 수 있다.     

```python
# 기존 메타데이터 파일을 사용해 테이블을 등록
spark.sql("CALL spark_catalog.system.register_table(table => 'db.sample', metadata_file => 'hdfs://{metadata_path}/metadata.json')")
```  

### 2-2) 데이터 파일만 존재하는 경우   

`테이블의 데이터 파일은 남아 있지만, 메타데이터가 손실된 경우 아래와 같이 진행`할 수 있다.    
이 경우 아래 명령을 사용해 데이터 파일을 새롭게 iceberg 테이블로 등록할 수 있다. 
이를 통해 parquet 등 다른 포맷으로 저장된 데이터를 손쉽게 Iceberg 테이블로 등록할 수 있다.   

```python
# 데이터 파일을 Iceberg 테이블로 추가
spark.sql("CALL system.add_files(table => 'db.sample', source_table => 'parquet.`hdfs://{path}/data`')")
```

### 2-3) 기존 테이블을 Iceberg로 변환   

다른 포맷으로 저장된 기존 테이블을 iceberg 테이블로 변경하고 싶을 때는 [migrate 명령](https://iceberg.apache.org/docs/1.6.1/spark-procedures/#migrate)을 사용할 수 있다.   
이 명령을 통해 기존 데이터를 유지하면서 iceberg의 장점을 활용할 수 있다.   

```python
# 기존 테이블을 Iceberg 포맷으로 마이그레이션
spark.sql("CALL spark_catalog.system.migrate('db.sample')")
```


- - -    

## 3. Iceberg 유지보수 및 운영 팁   

Iceberg의 메타데이터는 읽기 성능에 큰 영향을 미치기 때문에 
주기적으로 정리하고 최적화 해야 한다.   

아래 정보를 이용하여 테이블 상태 확인 및 최적화가 가능하다.   

```python
snapshot_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.snapshots")
manifest_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.manifests")
data_files_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.files")
partitions_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.partitions")
row_count_df = spark.sql(f"select count(1) as row_count from spark_catalog.{table}")
delete_files_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.delete_files")
```    






- - -

<https://toss.tech/article/datalake-iceberg>   
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







