---
layout: post
title: "[Iceberg] Apache Iceberg 등장"
subtitle: "Hive와 비교하여 Iceber만의 특징(Snapshot, Hidden Partition) / Hive 사용시 문제점"
comments: true
categories : BigData
date: 2024-10-01
background: '/img/posts/mac.png'
---

## 1. Apache Iceberg의 등장   

기존의 Apache Hive에서 대용량 데이터를 다룰 때 규모/성능/사용성에 대한 
문제가 존재했고 이를 해결하기 위해 등장하게 되었다.   
Netflix에서 개발되었으며 페타바이트 규모의 테이블을 위해 설계된 
개방형 테이블 형식으로 설계 되어 모든 파일 포맷을 관리 구성 및 추적하는 
방법을 결정하여 snapshot 방식으로 파일을 관리한다.   

`간단히 요약하자면 Iceberg는 오픈 소스 테이블 포맷을 의미하며 구조상 
대용량 데이터를 쉽게 다룰 수 있는 이점이 있는데, Iceberg의 
구조와 특징에 대해 자세히 알아보자.`   

그 외에도 Uber에서 개발한 Hudi, Databricks에서 지원하는 delta lake 가 존재하며,
    이 글에서는 Iceberg에 대해서 다룰 예정이다.

- - - 

## 2. Iceberg 구조   

`Iceberg는 크게 data layer, metadata layer, iceberg catalog로 계층적인 
구조로 이루어져 있다.`      

<img width="650" alt="스크린샷 2024-10-01 오후 12 04 25" src="https://github.com/user-attachments/assets/f91dcc7f-dc83-40ab-a4ce-58918cd8d520">   

### 2-1) Iceberg catalog   

catalog는 특정 데이터 소스에 접근을 가능하게 만들어주는 설정으로, 
    `Iceberg catalog는 현시점의 테이블 metadata를 찾을 수 있게` 도와 준다.  
그리고 쿼리가 실행되면 쿼리가 찾는 metadata file을 찾기 위해 사용된다.   

### 2-2) metadata layer

##### metadata file  

`테이블 형상은 metadata file로 관리되며, 테이블 내용에 변경이 생기면 
새로운 metadata file이 만들어지고 기존의 것을 대체 한다.`        

`metadata file은 스키마, 파티션, 스냅샷에 대한 정보를 가지고 있다.`  

> 참고로, Hive는 MetaStore에서 메타데이터를 관리하여 RDB 스토리지 부하 문제가 발생할 수 있다.   

`Iceberg는 스냅샷 기능을 통해 특정 시점의 테이블 형상을 파일로 기록해주는데, 
    이는 특정 시점에 대한 rollback이 가능하게 해준다.`      



##### manifest list   

스냅샷(특정 시점의 테이블 형상을 기록한 파일)은 하나의 manifest list를 참조하며, 
    manifest list는 하나 이상의 manifest file에 대한 메타 정보를 저장하고 있다.   

`쉽게 생각하면, manifest list를 통해 스냅샷과 연관된 manifest file 위치를 찾아내는 것이다.`   

```sql
-- 테이블 스냅샷 조회(시점별 스냅샷에 대한 manifest list 확인 가능)
SELECT * FROM mydb.iceberg_table.snapshots;   
```


##### manifest file   

결국, `스냅샷은 하나 이상의 manifest file`로 이루어지게 된다.   

`manifest file은 data file에 대한 모든 정보(data file 위치, 파티션 정보)와 통계 정보(null, nan 갯수)를 가지고 있다.`   

### 2-3) data layer   

`실제 데이터 파일을 저장하는 곳`으로, 테이블에 정의된 파일 포맷(orc, parquet)형식으로 데이터 파일을 저장해 준다.    
manifest file의 메타 정보를 이용하여 필요한 데이터 파일에 접근할 수 있게 된다.   

정리해보면 Iceberg는 metadata -> manifest 를 거쳐서 원하는 데이터를 쉽게 찾을 수 있다.  
만약 특정 파티션 값의 데이터를 조회하는 쿼리가 실행된다면 
manifest list의 파티션 정보로 필터링 -> 필터링된 manifest를 거쳐서 데이터 
파일을 가져올 수 있다.     

- - - 

## 3. Hive Table의 문제점   

Hive는 데이터를 관리할 때 MetaStore(RDB) + 데이터(HDFS 안에 있는 실제 데이터 파일)로 
나뉘어서 관리 된다.   
DB에서 파일이 어디에 있는지 어떤 데이터를 추출해야 하는지 스키마나 파티션 정보들을  
관리하고 실제 데이터는 HDFS나 S3 등에 적재 되어 있다.   

Hive Table을 사용할 때 아래와 같은 문제점이 발생할 수 있다.   
자세한 내용은 [Line Data Platform 영상](https://www.youtube.com/watch?v=7y9gNwqLNtU) 과 [링크](https://magpienote.tistory.com/255) 
확인해보자.   

##### ACID 완벽하게 지원되지 않는 문제     

Hive Table은 기본적으로 HDFS를 사용하므로 update를 지원하지 않기 때문에 
트랜잭션 처리에 문제가 있다.   

> 트랜잭션이 일부 지원하지만 완벽하게 지원되지 않는다.   

##### 병목현상   

Hive는 MetaStore라는 메타데이터 저장소를 RDB를 활용하여 구축하고 
실제 데이터는 HDFS 또는 s3에 저장하고 관리하기 때문에 데이터가 쌓일 수록 RDB의 
성능 문제가 발생할 수 있다.   


##### 스키마 확장성 미지원  

메타데이터를 직접 관리하지 않기 때문에 기본적으로 스키마를 확장할 수 없다.  
파티션이나 스키마를 다시 지정하고 싶다면 테이블을 지우고 다시 생성해야 한다.  

> 물론 파일 포맷에 따라 다르며, orc 또는 parquet 의 경우 컬럼 추가는 
스키마 제거 없이 추가 가능하다.   



- - - 

## 4. Iceberg의 장점 및 Hive와 비교   

### 4-1) 트랜잭션 지원   

`Iceberg는 ACID(Atomicity, Consistency, Isolation, Durability) 트랜잭션을 지원한다.`   

기존에 Hive는 ORC 파일 포맷을 이용할 때만 ACID 트랜잭션을 지원했지만 
Iceberg에서는 분산환경에서도 ACID 트랜잭션을 지원하며 데이터 일관성과 
무결성을 보장한다.   


### 4-2) Hidden Partition    

파티션은 해당 데이터에만 접근하여 쿼리 속도를 향상시키게 만들어준다.  

Hive의 경우 파티션을 컬럼처럼 분명히 명시해줘야 했다.    
즉, Hive에서는 매번 새로운 데이터가 추가될 때마다 파티션 디렉토리를 명시적으로 
관리 해야 하며, 조회 할때 또한 파티션 키를 잘못 사용했을 경우 성능 저하가 
발생할 수 있다.  


```sql
-- event_date를 파티션 열로 지정한 경우
SELECT *
FROM events
WHERE event_date = '2024-10-01';
```

`Iceberg에서는 사용자가 직접 파티션 열을 지정하지 않아도 Iceberg가 
내부적으로 파티션을 생성하고 관리한다.`    
이는 Iceberg의 Hidden partition 기능 덕분이며, 데이터 타입에 따라 자동으로 
적절한 파티셔닝을 수행하며, 쿼리 시 사용자는 이를 
인식할 필요가 없다.   

### 4-3) Time Travel & Rollback   

`Iceberg는 데이터의 각 스냅샷을 관리한다. 그렇기 때문에 과거 시점의 데이터를 
조회할 수도 있고 데이터를 롤백할 수 있도록 제공한다.`   
Time Travel은 Iceberg가 스냅샷을 관리하기 때문에 특정 시점의 
데이터 상태를 조회할 수 있도록 제공하는 기능이다.  
이를 통해 데이터 변경 이력을 추적하고 분석할 수 있다.   


```sql   
-- 특정 스냅샷 시점의 데이터 조회
SELECT * FROM mydb.iceberg_table.snapshot_at('2023-09-01T00:00:00');
```


- - -

<https://magpienote.tistory.com/255>    
<https://iceberg.apache.org/docs/latest/spark-queries/>   
<https://developers-haven.tistory.com/50>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







