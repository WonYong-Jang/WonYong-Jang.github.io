---
layout: post
title: "[Iceberg] Apache Iceberg 주요 설정"
subtitle: "iceberg 테이블 생성 및 주요 설정" 
comments: true
categories : BigData
date: 2024-10-02
background: '/img/posts/mac.png'
---


## 6. 테이블 생성

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
    'read.split.target-size' = '134217728', -- 128MB
    'write.parquet.row-group-size-bytes' = '8388608' -- 8MB
);
```

#### 6-1) format-version

iceberg 테이블의 포맷 버전을 설정한다. 포맷 버전 2를 사용하면 
Row-level Deletes, Position Deletes, Equality Deletes와 
같은 기능을 지원한다.   

> 버전 2로 설정할 경우 더 많은 기능을 제공하지만 
Spark, Flink 등 호환 되는지 확인이 필요하다.  
> default 1

#### 6-2) write.format.default   

iceberg 테이블에서 데이터를 저장할 기본 파일 형식을 설정한다.    

> parquet, orc, avro 등

#### 6-3) write.parquet.compression-codec / write.orc.compression-codec

데이터 파일의 압축 방식을 설정한다.   

> snappy, zlib, zstd, gzip 등이 있다.  

#### 6-4) write.metadata.delete.after-commit.enabled 

커밋 후 사용되지 않는 메타데이터 파일을 자동으로 삭제할지 여부를 설정한다.   
메타데이터가 빠르게 축적되는 대규모 테이블에서는 이를 true로 활성화 하여 
메타데이터 파일을 관리할 수 있다.   


#### 6-5) write.delete.mode   

#### 6-6) write.merge.mode  



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







