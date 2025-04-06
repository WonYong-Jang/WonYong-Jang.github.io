---
layout: post
title: "[Iceberg] Manifest 구조와 데이터 파일"
subtitle: "Iceberg 1.4.0 issue 분석 / Iceberg에서 splitOffsets 역할" 
comments: true
categories : Data-Engineering   
date: 2025-04-06
background: '/img/posts/mac.png'
---

현재 업무에서 Iceberg 테이블을 사용하여 여러 데이터를 동기화하고 있고, 
    특정 버전에서 이슈가 확인되어 이를 자세히 살펴볼 예정이다.   

- - -    

## 1. Iceberg 1.4.0 issue   

Spark 배치를 통해서 데이터를 Iceberg 테이블에 동기화 하는 과정에서 아래와 
같은 에러 발생하면서 배치가 실패하였다.   

```
java.lang.IllegalArgumentException: requirement failed: length (-6235972) cannot be smaller than -1
```

버전 정보는 아래와 같다.   

- Iceberg 1.4.0
- Spark 3.4.1 
- EMR Cluster 6.15.0 

확인해보니, Iceberg 1.4.0 을 사용할 경우 발생할 수 있는 known issue로 확인했다.   
`결과적으로 1.4.1 버전부터 해당 이슈가 fix 되었고, 버전 업그레이드 후 
데이터 파일을 rewrite 하면서 문제는 해결되었다.`   

```
CALL spark_catalog.system_rewrite_data_files(table => 'db.table', options => map('target-file-size-bytes', '251658240', 'delete-file-threshold', '0'))    
```

그럼 이러한 이슈가 왜 발생했고, 어떻게 수정되었는지 살펴보자.   

[#8834](https://github.com/apache/iceberg/pull/8834)를 자세히 살펴보면 manifest 로부터  
split offsets을 읽는 과정에서 발생한 버그로 확인했다.   

[#8336](https://github.com/apache/iceberg/pull/8336) 에서 BaseFile 객체의 split offsets을 캐싱하도록 변경하였는데, 
Avro 리더가 BaseFile 인스턴스를 재사용하면서 첫 번째 오프셋이 모든 파일에 재사용되면서 문제가 발생할 수 있음을 확인했다.     

```
Snapshot (manifest list, e.g. snap-123.avro)
│
├── Manifest File 1 (manifest-abc.avro)
│   ├── DataFile 1 (data-001.parquet)
│   ├── DataFile 2 (data-002.parquet)
│
├── Manifest File 2 (manifest-def.avro)
│   ├── DataFile 3 (data-003.parquet)
│   └── DataFile 4 (data-004.parquet)
```

여기서 Avro 포맷은 manifest file 을 의미하며 data file 의 정보를 기록하고 있다.   

또한, `BaseFile은 iceberg에서 DataFile, DeleteFile 등을 나타내는 인터페이스이다.`     
`즉, file path, file format, partition 정보, splitOffsets, record count, size 등의 
정보를 가지고 있다.`      

```sql
select * from "db"."table$files";

-- 아래 정보들을 확인할 수 있다.   
-- upper_bounds, lower_bounds
-- split_offsets
-- file_path
-- partition
-- record_count
-- file_size_in_bytes   
```

이 이슈를 정리해보면 아래와 같다.   

- Avro 파일(manifest)을 읽는 과정에서 BaseFile 객체가 재사용되었다.  
- splitOffsets 정보가 있는 여러 파일이 순차적으로 매니페스트에 기록된다.   
- 첫번째 파일의 splitOffsets 값이 그대로 다른 파일에도 복사되어 문제가 발생한다.   

`여기서 핵심은 하나의 manifest file 안에 여러 data file 들이 있을 때만 발생하며, 
    하나의 manifest file 안에 하나의 data file 만 존재할 경우는 
    이슈가 발생하지 않는다.`   


그럼 이를 어떻게 수정하여 해결하였는지 살펴보자.  

![Image](/img/posts/data-engineering/2025-04-06-1.29.20.png)


`기존 구현에서 Avro 리더가 하나의 BaseFile 인스턴스를 재사용하는 구조였지만 
이를 재사용하지 않도록 새로운 인스턴스를 매번 생성하도록 수정되었다.`   

- - - 

## 2. Iceberg 에서 splitOffsets   

splitOffsets는 iceberg의 data file 내에 
split(데이터 블록)의 물리적인 위치(offset)정보를 담고 있다.   

예를 들어 Parquet 파일 하나가 3개의 row group(=split)으로 구성돼 있다면 아래와 같다.   

> row group은 보통 128MB이며, 이를 넘을 경우 여러 row group으로 나뉘게 된다.    

```
splitOffsets = [0, 1048576, 2097152] // 각 row group의 시작 위치
```

`이는 Query Planning 시 pruning 이나 parallel read에 활용된다.`   
`즉, 파일을 split 단위로 분산 처리할 수 있도록 도와준다.`   



- - -

<https://github.com/apache/iceberg/pull/8834>   
<https://github.com/apache/iceberg/issues/8863>   
<https://github.com/apache/iceberg/issues/9689>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







