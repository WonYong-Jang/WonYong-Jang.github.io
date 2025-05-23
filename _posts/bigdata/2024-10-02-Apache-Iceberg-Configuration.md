---
layout: post
title: "[Iceberg] Apache Iceberg 주요 설정 및 테이블 생성, 복구, 유지보수"
subtitle: "테이블 생성 및 주요 설정 / snapshot 및 메타데이터 관리 옵션 / 테이블 복구 및 유지보수 / 테이블 전환 / copy-on-write, merge-on-read" 
comments: true
categories : BigData
date: 2024-10-02
background: '/img/posts/mac.png'
---

이번글 에서는 Apache Iceberg 테이블의 주요 설정 및 
메타데이터를 관리하기 위한 여러가지 방법에 대해 살펴보자.    

- - - 

## 1. 테이블 생성

아래와 같이 iceberg 테이블 생성 예시를 통해 
[주요 옵션](https://iceberg.apache.org/docs/latest/configuration/#reserved-table-properties)에 대해서 살펴보자.  

```sql
CREATE TABLE my_catalog.my_db.my_table (
    id BIGINT,
    created_at TIMESTAMP
)
USING iceberg
PARTITIONED BY (days(created_at))
TBLPROPERTIES (
    'format-version' = '2', 
    'external.table.purge'='true',
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

테이블 생성 후 테이블에 대한 상세 정보는 아래와 같이 확인 가능하다.   

```sql
describe formatted db.sample
```

#### external.table.purge   

`테이블 삭제시 데이터 파일의 삭제 여부를 제어하는 속성이며, true로 설정되어 있으면 
테이블을 삭제할 때 데이터 파일까지 함께 삭제된다.`     

`external table로 생성 후 아래 설정을 true로 지정하게 되면 drop table 시 
데이터가 손실되기 때문에 반드시 false로 설정해두어야 한다.`   

```sql
CREATE EXTERNAL TABLE my_table (
    id BIGINT,
    name STRING
)
USING iceberg
LOCATION 's3://my-bucket/my_table'
TBLPROPERTIES ('external.table.purge' = 'true');
```

TBLPROPERTIES 변경은 아래와 같이 가능하다.   

```sql
ALTER TABLE my_table SET TBLPROPERTIES('external.table.purge'='false');
```


#### format-version

iceberg 테이블의 포맷 버전을 설정한다. 포맷 버전 2를 사용하면 
Row-level Deletes, Position Deletes, Equality Deletes와 
같은 기능을 지원한다.   

> 버전 2로 설정할 경우 더 많은 기능을 제공하지만 
Spark, Flink 등 호환 되는지 확인이 필요하다.  

#### write.format.default   

`iceberg 테이블에서 데이터를 저장할 기본 파일 형식`을 설정한다.    

> parquet, orc, avro 등

#### write.parquet.compression-codec / write.orc.compression-codec

`데이터 파일의 압축 방식`을 설정한다.   

> snappy, zlib, zstd, gzip 등이 있다.  

#### write.metadata.delete.after-commit.enabled 

커밋 후 사용되지 않는 `메타데이터 파일을 자동으로 삭제할지 여부를 설정한다.`      
메타데이터가 빠르게 축적되는 대규모 테이블에서는 이를 true로 활성화 하여 
메타데이터 파일을 관리할 수 있다.  

<img width="604" alt="스크린샷 2024-12-05 오전 8 46 16" src="https://github.com/user-attachments/assets/2503be00-659d-4b76-98e9-ac37beed0208">


> 메타데이터 파일은 테이블의 상태를 기록한 메타데이터의 JSON 파일이다.   
> default: false   

#### write.metadata.previous-versions-max   

`write.metadata.delete.after-commit.enabled 옵션이 활성화 되어 있다면 
메타데이터 파일 버전의 개수를 제한한다.`   
`새 메타데이터가 생성될 때 이 값을 초과하는 이전 버전이 있으면, 
    자동으로 가장 오래된 메타데이터 파일이 삭제된다.`     

> 메타데이터는 스키마 변경 및 테이블 속성 등을 변경할 때 신규로 생성된다.   

#### write.delete.mode / write.update.mode / write.merge.mode  

`iceberg 에서는 데이터의 삭제, 업데이트, 병합 작업을 수행할 때 
다양한 모드를 설정할 수 있다.`      
`이 모드들은 데이터 처리 방식과 쿼리 성능에 큰 영향을 미치기 때문에, 
    각 모드의 특징과 동작 방식을 이해하고 적절히 사용해야 한다.`      


- copy-on-write(기본값)   
    - `분석 작업 위주로 데이터를 자주 읽고, 업데이트 및 삭제가 드문 경우 copy-on-read를 사용하여 빠른 처리가 가능하도록 설정할 수 있다.`   
    - `다른 데이터 처리 작업 없이 바로 파일을 읽으면 되므로 read 성능이 좋다.`      
    - 변경된 데이터 파일을 다시 write 해야하므로 업데이트가 자주 발생하는 테이블에는 적합하지 않다.   
    - 데이터 변경(업데이트 or 삭제)이 발생하면 변경 row가 포함된 파일에서 변경 내용을 적용해서 새로운 데이터 파일을 생성한다.    

<img width="650" alt="Image" src="https://github.com/user-attachments/assets/1d218339-5650-45b8-8123-16443f558fb3" />    

- merge-on-read   
    - `실시간 스트리밍 데이터처럼 빈번한 업데이트와 삭제가 필요한 경우 merge-on-read를 사용하여 빠른 처리가 가능하도록 설정할 수 있다.`      
    - `업데이트 및 삭제 작업 성능이 중요할 때 적합하다.`       
    - 원본 데이터는 변경하지 않고 변경 내용만 delta 파일에 기록해둔다. 이후 테이블 접근시 원본과 delta 파일을 merge하여 읽는다.   
    - 변경 내용만 기록하면 되므로 write에 대한 처리 속도가 빠르다.   
    - 변경 이력에 대한 트랜잭션 수 만큼 delta 파일도 증가하며, delta 파일이 많아지면 read할 때 merge해야 하므로 성능에 영향을 받는다.   
    - 따라서 주기적으로 compaction 과정 등 고려가 필요하다.   

<img width="650" alt="Image" src="https://github.com/user-attachments/assets/37b9c731-915d-4b8f-aa5c-3871081cc1ef" />


#### history.expire.max-snapshot-age-ms    

오래된 스냅샷을 자동으로 정리(삭제)하기 위한 설정이다.   
`이 설정을 통해 일정 기간이 지난 스냅샷을 제거함으로써, 테이블의 
메타데이터와 저장소를 효율적으로 관리할 수 있다.`      

`2592000000 밀리초는 30일(30 * 24 * 60 * 60 * 1000)을 의미하며, 
           이 설정은 30일이 지난 스냅샷을 자동으로 
           만료시켜 정리하도록 한다.`     

> 해당 옵션만으로는 실제 스냅샷 데이터를 제거하지는 않기 때문에 특정 프로시저를 
이용해 직접 제거해주어야 한다.   

#### history.expire.min-snapshots-to-keep   

`스냅샷을 정리 작업을 수행할 때, 삭제되지 않고 항상 유지해야할 
최소 스냅샷 개수를 지정하는 옵션이다.`      
오래된 스냅샷을 자동으로 만료시킬 때, iceberg는 이 설정을 기준으로 
최소한으로 유지해야 할 스냅샷의 개수를 보장한다.   

> 해당 옵션만으로는 실제 스냅샷 데이터를 제거하지는 않기 때문에 특정 프로시저를
이용해 직접 제거해주어야 한다.    

- - -   

## 2. 테이블 복구 및 재구축   

Iceberg 테이블을 운영하다 보면, 여러 가지 이유로 테이블을 복구하거나 다시 설정해야 하는 상황이 발생할 수 있다.   
이때, iceberg에서 제공하는 [procedures](https://iceberg.apache.org/docs/1.7.0/spark-procedures/)를 사용할 수 있다.    

`모든 procedures는 system이라는 namespace를 사용`하며, spark에서 사용하기 위해서는 
[sql extension](https://iceberg.apache.org/docs/1.7.0/spark-configuration/#sql-extensions)이 함께 필요하다.   


### 2-1) 카탈로그에서 테이블이 제거된 경우    

`데이터와 메타데이터 파일이 정상적으로 존재하지만, 카탈로그에서 테이블이 삭제된 경우 아래 명령`을 사용해 
[테이블을 다시 등록](https://iceberg.apache.org/docs/1.6.1/spark-procedures/#register_table)할 수 있다.   
이 방법을 통해 기존 데이터 구조를 유지하면서 빠르게 테이블을 복구할 수 있다.     

```python
# 기존 메타데이터 파일을 사용해 테이블을 등록
spark.sql("CALL spark_catalog.system.register_table(table => 'db.sample', metadata_file => 's3://{metadata_path}/metadata/0001-metadata.json')")
```  

> metadata는 json 파일 형식으로 되어 있다.     

### 2-2) 데이터 파일만 존재하는 경우   

테이블의 데이터 파일은 남아 있지만, 메타데이터가 손실된 경우 아래와 같이 진행할 수 있다.    
이 경우 아래 명령을 사용해 데이터 파일을 새롭게 iceberg 테이블로 등록할 수 있다. 
이를 통해 parquet 등 다른 포맷으로 저장된 데이터를 손쉽게 Iceberg 테이블로 등록할 수 있다.   

자세한 내용은 [공식문서](https://iceberg.apache.org/docs/1.6.1/spark-procedures/#examples_9)를 
참고하자.   

```python
# 데이터 파일을 Iceberg 테이블로 추가
CALL spark_catalog.system.add_files(
  table => 'db.tbl',
  source_table => '`parquet`.`path/to/table`'
);
```

### 2-3) 기존 테이블을 Iceberg로 변환   

다른 포맷으로 저장된 기존 테이블을 iceberg 테이블로 변경하고 싶을 때는 [migrate 명령](https://iceberg.apache.org/docs/1.6.1/spark-procedures/#migrate)을 사용할 수 있다.   
이 명령을 통해 기존 데이터를 유지하면서 iceberg의 장점을 활용할 수 있다.   

```python
# 기존 테이블을 Iceberg 포맷으로 마이그레이션
spark.sql("CALL spark_catalog.system.migrate('db.sample')")
```

`하지만 위 Procedures 는 Avro, Parquet, and ORC 파일 포맷만 지원하기 때문에 
다른 포맷의 경우는 사용할 수 없다.`   

현재 업무에서 Json Serde 포맷을 사용하는 hive 테이블을 ORC 포맷의 Iceberg 테이블로 
전환이 필요했고, 아래 방식으로 전환하였다.   

> json 파일 포맷을 가진 hive 테이블에서 customer 테이블 이름을 동일하게 사용하되 iceberg 테이블로 
전환이 필요하다고 가정해보자.  

- iceberg 테이블 스키마를 생성 ( table name: customer-backup )   
- 기존 hive 테이블 데이터를 iceberg 테이블로 insert overwrite 진행   
- 기존 hive 테이블의 이름을 다른 이름으로 rename 
- iceberg 테이블의 이름을 customer 라는 이름으로 rename 하여 전환 완료
    - alter table customer-backup rename to customer


- - -   

## 3. Iceberg Maintenance

Apache Iceberg를 사용할 때, 데이터 변경이 발생할 때마다 스냅샷이
생성되어 s3와 같은 스토리지에 저장된다.
이 스냅샷들이 누적되면서 저장 공간을 많이 차지하며 성능에 영향을 끼칠 수 있기 때문에
    실무에서는 주기적으로 스냅샷을 정리하는 것이 중요하다.

이를 위해 Iceberg는 스냅샷과 데이터 파일 관리를 위한
몇 가지 방법을 제공한다.

### 3-1) Expire Snapshots(스냅샷 만료)

Iceberg는 오래된 스냅샷을 삭제하는 메커니즘을 제공하며,
    일정 기간 이전의 스냅샷을 만료시킴으로써 스토리지 비용을 줄일 수 있다.

아래와 같이 특정 날짜 이전의 모든 스냅샷을 삭제하여 테이블의
메타데이터를 정리하고 스토리지 사용량을 줄이는데 사용된다.  

<img width="516" alt="스크린샷 2024-12-05 오전 8 52 54" src="https://github.com/user-attachments/assets/9f349dc9-30d2-4905-928e-eaead2e6ad9b">



```
CALL <catalog_name>.<namespace>.expire_snapshots('<table_name>', TIMESTAMP '<expiration_time>')

- catalog_name: Iceberg의 카탈로그의 이름
- namespace: Iceberg 테이블이 포함된 데이터베이스 이름
- table_name: 스냅샷을 만료시킬 Iceberg 테이블의 이름
- expiration_time: 삭제할 스냅샷의 기준 날짜이며, 이 날짜 이전에 생성된 모든 스냅샷이 삭제된다.
```

아래 예시는 2023년 1월 1일 이전에 생성된 모든 스냅샷을 삭제한다.

```sql
CALL spark_catalog.my_database.expire_snapshots('my_table', TIMESTAMP '2023-01-01 00:00:00')
```

다만, 작업 중 간혹 org.apache.iceberg.exceptions.NotFoundException: File does not exist Avro 와
같은 오류가 발생할 수 있는데, 이는 특정 스냅샷 파일이 사라졌을 때 생기는 문제이다.
`이를 방지하기 위해 아래와 같이 최근 2개의 스냅샷을 유지한 상태에서 오래된 스냅샷을 제거하는 방식으로
관리하는 게 좋다.`

`즉 현재 버전 스냅샷 1개와 이전 버전 스냅샷 1개를 최소 스냅샷 갯수로 유지해야 한다.`

아래는 스냅샷 관리 시, 만료 기간이 지났음에도 가장 최근
스냅샷 만큼 유지하는 옵션이 있으며, 아래 예시를 보자.

```sql
CALL spark_catalog.system.expire_snapshots(
        table => '{table}',
        older_than => TIMESTAMP '2099-12-31 23:59:59.999',
        retain_last => 2
)

-- retain_last: defaults to 1 
-- older_than: default: 5 days ago
-- 2099년 12월 31일 이전의 생성된 모든 스냅샷을 삭제하되, 가장 최근 2개의 스냅샷은 삭제하지 않고 유지
```

### 3-2) Remove Orphan Files(고아 파일 제거)   

Iceberg의 메타데이터와 연결되지 않은 고아 파일(Orphan Files)이
있을 수 있다. 이러한 파일을 정리하지 않으면 스토리지가 낭비될 수 있기
때문에, 주기적으로 고아 파일을 삭제하는 것이 좋다.   

<img width="600" alt="스크린샷 2024-12-05 오전 8 50 25" src="https://github.com/user-attachments/assets/b5902bb7-7bce-458c-b07e-81832074ac98">


> spark 와 같은 분산처리 시스템에서 task 또는 job 실패시 orphan file로 
남을 수 있다.   

```sql
CALL spark_catalog.system.remove_orphan_files('db.sample')
```

`주의해야할 점은 iceberg 파일이 현재 쓰기 작업 중이라면, 
    그 파일은 orphan 상태로 인식될 수 있다. 이때 해당 명령을 
    실행하면 쓰기 작업이 실패할 수 있으며, 이는 
    메타데이터 손상으로 이어져 테이블을 읽지 못하게 된다.`    

이런 문제는 주로 아래와 같은 상황에서 발생할 수 있다.   

##### 스트리밍 작업 중단과 데이터 입수 재개 타이밍 문제   

스트리밍 데이터가 한동안 들어오지 않다가 다시 쓰기 작업이 
시작되는 시점에 해당 명령을 실행하면, 새로 생성 중인 파일이 
아직 메타데이터에 등록되지 않아 고아 파일로 잘못 간주될 수 있다.   

##### older_than 설정이 너무 짧은 경우   

Iceberg는 기본적으로 3일 이상된 파일을 orphan file로 간주한다.   
하지만 해당 설정을 너무 짧게 설정하면, 쓰기 중인 파일이 삭제 대상에 
포함될 가능성이 높아진다.     

`따라서 아래와 같이 older_than 파라미터를 적절하게 설정해줘야 한다.`   

```python
expiration_timestamp = datetime.now() - timedelta(days=7)

df=spark.sql(f"""
    CALL spark_catalog.system.remove_orphan_files(
        table => '{table}',
        older_than => TIMESTAMP '{expiration_timestamp.strftime("%Y-%m-%d %H:%M:%S.%f")}'
    )
""")

## older_than: defaults to 3 days ago
```   

##### 메타데이터 업데이트 지연    

Iceberg 는 데이터를 저장한 뒤 메타데이터를 갱신한다. 이 갱신 과정이 
지연되면, 메타데이터에 아직 등록되지 않은 파일이 orphan files로 간주 될 수 있다.   

`위의 문제를 방지하기 위해 스트리밍 파이프라인을 잠시 중단한 뒤 
고아 파일 제거 명령을 실행할 수도 있다.`      
`또는 dry_run 옵션을 사용해 삭제 대상 파일을 미리 확인한 후, 검토를 거쳐 
안전하다고 판단되면 삭제 작업을 진행하게 되면 스트리밍 작업을 중단하지 
않고도 문제없이 작업을 수행할 수 있다.`    


### 3-3) Table Compaction(테이블 압축)

데이터 파일을 정리하고, 작은 파일들을 합치는 작업(Compaction)을
주기적으로 수행하여 읽기 성능을 최적화하고, 스토리지 효율성을
높일 수 있다.

<img width="608" alt="스크린샷 2024-12-05 오전 9 08 59" src="https://github.com/user-attachments/assets/e8b8620d-b9f2-4b10-aded-76e779533f37">


`실시간성 스트리밍 데이터에서 주로 필요하며, 작은 용량의 파일이 
여러개 들어올 때 compaction 기능을 사용한다.`  

> 여러개 작은 파일 -> compaction -> 큰 파일 생성 -> 새로운 메타, 스냅샷 -> 새로운 스냅샷 참조해서 쿼리 속도 향상   

```sql
CALL spark_catalog.system.rewrite_data_files('db.sample');
```

CDC 테이블처럼 delete 파일이 발생하는 경우, 유지보수 작업을 진행할 때 
입수 작업을 잠시 중단하는 것이 안전하다.   
`데이터 쓰기 작업과 rewrite 작업이 동시에 이루어지면 메타데이터 손상될 
위험이 있기 때문이다.`    

`또한, delete 파일을 효율적으로 정리하기 위해 delete-file-threshold 옵션을 0으로 
설정하여 불필요한 파일을 제거할 수 있다.`    

```sql
CALL system.rewrite_data_files(table => '{table}', options => map('target-file-size-bytes', '251658240', 'delete-file-threshold', '0'))

-- target-file-size-bytes: This will set the intended size of the output files. (default: 512 MB)    
-- max-concurrent-file-group-rewrites: 동시에 write할 파일 갯수를 지정하며 기본값은 5 이기 때문에 더 빠르게 compaction이 필요하다면 해당 설정을 증가시킬 수 있다.    
```

`위와 같이 유지보수 시간을 단축하기 위해 동시에 write할 파일 갯수를 증가시키거나, 
    전체 데이터를 재정리하는 대신 where 옵션을 이용하여 특정 날짜 이후의 데이터만 
    정리할 수 있다.`   

더 자세한 내용은 [공식문서](https://iceberg.apache.org/docs/1.7.0/spark-procedures/#rewrite_data_files)를 참고하자.   

- - - 

## 4. Iceberg 유지보수를 위한 쿼리      

Iceberg의 메타데이터는 읽기 성능에 큰 영향을 미치기 때문에 
주기적으로 정리하고 최적화 해줘야 한다.
따라서 이를 확인하기 위한 쿼리를 살펴보자.    

아래와 같이 spark sql을 이용하여 테이블 상태 확인 및 최적화가 가능하다.   

```python
snapshot_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.snapshots")
manifest_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.manifests")
data_files_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.files")
partitions_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.partitions")
row_count_df = spark.sql(f"select count(1) as row_count from spark_catalog.{table}")
delete_files_df = spark.sql(f"SELECT * FROM spark_catalog.{table}.all_delete_files")
```    

아래는 trino(presto)에서 조회가 가능하다.   

```sql
select * from "db"."table_name$snapshots"
select * from "db"."table_name$manifests"
select * from "db"."table_name$files"
select * from "db"."table_name$partitions"
```




- - -

<https://www.oreilly.com/library/view/apache-iceberg-the/9781098148614/ch04.html>   
<https://www.tabular.io/blog/table-maintenance-the-key-to-keeping-your-iceberg-tables-healthy-and-performant/>   
<https://www.dremio.com/blog/maintaining-iceberg-tables-compaction-expiring-snapshots-and-more/>   
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







