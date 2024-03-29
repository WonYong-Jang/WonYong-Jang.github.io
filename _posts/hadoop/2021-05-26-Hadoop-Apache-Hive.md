---
layout: post
title: "[Hive] Apache hive architecture 와 성능 최적화"
subtitle: "Hive QL의 테이블 생성 프로퍼티, 성능 최적화 설정"       
comments: true
categories : Hadoop
date: 2021-05-26 
background: '/img/posts/mac.png'
---

# Apache Hive 의 이해    

`hive는 빅데이터 오픈소스 진영에서 가장 많이 활용되는 SQL on Hadoop 요소로써 
많은 사용자들이 사용하는 데이터 웨어하우징용 솔루션이다.`             

하이브는 하이브QL 이라는 SQL문과 유사한 언어를 제공한다. 대부분의 기능은 
SQL과 유사하지만 다음과 같은 차이점이 있다.    

- 하이브에서 사용하는 데이터가 HDFS에 저장되는데, HDFS가 한번 저장한 
파일은 수정할 수 없기 때문에 UPDATE와 DELETE는 사용할 수 없다. 또한, INSERT도 비어 있는 
테이블에 입력하거나 이미 입력된 데이터를 덮어 쓰는 경우에만 가능하다. 따라서 하이브 
QL은 INSERT OVERWRITE라는 키워드를 사용한다.  

INSERT OVERWRITE를 사용할 때 주의할점은 [참고링크](http://www.hadoopadmin.co.in/tag/insert-overwrite/)를 참고하자.   

- SQL은 어떠한 절에서도 서브쿼리를 사용할 수 있지만 하이브 QL은 FROM 절에서만 
서비 쿼리를 사용할 수 있다.    

- SELECT 문을 사용할 때 HAVING 절을 사용 할 수 없다.   


SQL은 너무도 잘 알려진 정형화된 Query 언어이다. 하둡은 HDFS(하둡 
분산 파일 시스템)과 맵리듀스가 합쳐진 용어 인데, 하둡에서 SQL로 
편하게 질의하고 데이터를 가져올 수 있는 툴 정도로 이해하면 된다.    

- - - 

## 1. Hive Architecture 이해   

Hive의 이해를 위해 먼저 Architecture를 간략히 살펴보자.    

<img width="652" alt="스크린샷 2021-05-26 오후 4 24 44" src="https://user-images.githubusercontent.com/26623547/119619462-fbff6280-be3e-11eb-8793-59e5ea86f5cb.png">   

위 그림에서 중요한 몇가지를 살펴보자.    

#### 1) Meta store   

Meta Store는 물리적으로 Mysql이나 Oracle 등의 DB로 구성된다. Meta Store에 
저장되는 것은 Hive가 구동될 때 필요로 하는 테이블의 스키마 구조나 
다양한 설정값들이 저장된다. `그렇기 때문에 hive를 구성하는 가장 중요한 
요소중의 하나이며, 만약 Meta Store가 깨지거나 장애가 생길 경우 hive는 
정상적으로 구동되지 않는다고 봐야한다.`   
실제 운영을 하기 위해서는 반드시 Meta Store의 장애나 데이터 유실시 
Back up 할수 있는 정책을 가지고 있어야 한다.    

#### 2) Hive Server    

`Hive Server는 Hive에 질의하는 가장 앞단의 서버라고 보면 된다. 쉽게 말해 
JDBC나 ODBC로 부터 질의를 받아서 이를 Driver에 전달하는 역할이다.`    
Hive Server를 통해야 여러 권한 체크나, 접근성을 검증할 수 있다.    
Hive Server 상단 박스에 CLI(Comment Line Interface)가 보일 텐데 CLI를 
통할 경우 바로 Driver로 접속 되기 때문에 기타 권한이나 제어권을 
상실한체 바로 모든 컨트롤이 가능해진다.     
그렇기 때문에 실제 운영을 하기 위해서는 CLI가 아닌 Hive Server에 접근하는 
방안을 고려 해야 한다.   

#### 3) Driver    

Driver는 Hive의 엔진으로써 여러 질의에 대해 Optimizer를 통해 Hive SQL의 
연산 방식을 계산하고 MR, Spark 등의 여러 엔진등과 연동하는 역할을 담당한다.    

위의 내용을 통해 Hive를 다시 한번 정리해보면, 
    `Hive는 HDFS의 데이터에 대해서 Meta Store에 저장된 스키마(테이블)를 기준으로 
    데이터를 MR, Spark 등의 기타 분산 엔진등을 통해 처리하고 이를 사용자에게 
    결과를 정형화된(테이블 화된) 결과를 제공하는 SQL 툴이라고 정리할 수 있다.`    

Hive가 빅데이터 엔지니어링의 기본중의 기본이라고 말하는 이유는, Hadoop 진영의 
오픈소스에서 가장 오래 활용되었을 뿐 아니라 SQL의 자유도나 기타 하둡 Eco라 불리는 
오픈소스 엔진과의 융합성도 좋기 때문이다.    


- - - 

## 2. Hive 테이블     

`하이브에서 테이블은 HDFS 상에 저장된 파일과 디렉토리 구조에 대한 메타 정보라고 할 수 있다.`    
실제 저장된 파일의 구조에 대한 정보와 저장위치, 입력 포맷, 출력 포맷, 파티션 정보, 프로터티에 대한 정보 등 
다양한 정보를 가지고 있다.    

테이블을 생성할때 사용하는 키워드와 옵션 정보에 대해 알아보자.   

#### 2-1) 저장 위치    

- LOCATION   

테이블의 저장위치는 테이블에 쓰는 데이터의 저장위치이다. 사용자가 입력하지 않으면 데이터베이스의 
저장위치 아래 테이블 이름의 폴더로 기본 생성된다.   


#### 2-2) 테이블 타입   

- MANAGED    

테이블 생성시 옵션을 따로 주지 않으면 MANAGED 테이블이 생성된다. 세션이 종료되어도 
테이블의 테이터와 파일은 유지 된다. 테이블을 DROP 하면 파일도 함께 삭제 된다.    

- EXTERNAL    

`EXTERNAL 옵션은 MANAGED 테이블과 파일 삭제 정책을 제외하고 동일하다. EXTERNAL 테이블은 
DROP 하면 파일은 그대로 유지된다. 사용자의 실수로 인한 파일 삭제를 
방지하기 위해서는 EXTERNAL 테이블로 관리하는 것이 좋다.`    

- TEMPORARY   

TEMPORARY 옵션은 현재 세션에서만 사용하는 테이블을 생성 할 수 있다. 현재 
세션이 종료되면 제거되기 때문에 임시 테이블 생성에 사용하면 좋다.    


#### 2-3) 파티션    

- PARTITIONED BY   

파티션은 폴더 구조로 데이터를 분할하여 저장한다. PARTITIONED BY에 지정한 
컬럼의 정보를 이용하여 폴더 단위로 데이터가 생성된다. 파티션 생성시 
정보의 제공 유무에 따라 다이나믹 파티션과 스태틱 파티션이 있다.   

하이브는 폴더 단위로 데이터를 읽기 때문에 파티션이 없다면 테이블의 
모든 데이터를 읽게 된다. 시간이 갈 수록 데이터가 쌓이게 되면 점점 
조회 시간이 길어진다. 이를 방지하기 위하여 일자나 특정 조건을 이용하여 
파티션을 지정하고, 조회시에 파티션을 이용하여 데이터를 조회하면 
조회 속도를 높일 수 있다.    

```
-- 일자를 기준으로 파티션 생성 
CREATE TABLE tbl(
  col1 STRING
) PARTITIONED BY (yymmdd STRING);

-- 데이터 저장 구조 
hdfs://tbl/yymmddval=20180501/0000_0
hdfs://tbl/yymmddval=20180502/0000_0
hdfs://tbl/yymmddval=20180503/0000_0

-- 조회
SELECT yymmdd, count(1)
  FROM tbl
 WHERE yymmdd between '20180501' and '20180503'
 GROUP BY yymmdd
```


#### 2-4) 버켓팅, 스큐    

- CLUSTERED BY SORTED BY INTO BUCKETS    

버켓팅은 CLUSTERED BY 를 이용하여 설정한다. 일반적으로 SORTED BY와 함께 
사용한다. 설정한 버켓의 개수(파일의 개수)에 지정한 컬럼의 데이터를 
해쉬처리하여 저장한다.   

버켓팅한 테이블은 조인시에 SMB 조인으로 처리할 수 있게 되어 조인시에 속도가 
빨라진다.    

```
-- col2 를 기준으로 버켓팅 하여 20개의 파일에 저장 
CREATE TABLE tbl(
  col1 STRING,
  col2 STRING
) CLUSTERED BY col2 SORTED BY col2  INTO 20 BUCKETS
```

#### 2-5) SKEWED BY    

스큐는 값을 분리된 파일에 저장하여 특정한 값이 자주 등장할 때 속도를 높이는 방법이다.   

```
-- col1의 col_value 값을 스큐로 저장  
CREATE TABLE tbl (
  col1 STRING,
  col2 STRING
) SKEWED BY (col1) on ('col_value');
```

- - - 

## 3. Hive 테이블 포맷    

`테이블 포맷(ROW FORMAT)은 데이터를 컬럼 단위로 구분하는 구분자(delimeter)와 
데이터를 해석하는 방법을 지정하는 서데(SerDe)를 지정한다.`    
사용자가 지정하지 않으면 기본 구분자와 서데를 사용한다.   

- DELIMITED   

하이브는 구분자에 따라서 데이터를 분리하여 컬럼 단위로 보여준다. 하이브의 
구분자를 설정하는 방법은 아래와 같다.    

    - 기본 구분자 
    - 컬럼 구분자: \001,
    - 콜렉션 아이템 구분자: \002,
    - 맵 아이템 구분자: \003    

```
-- 하이브의 기본 구분자를 이용한 테이블 생성 
--   입력 데이터
$ cat sample.txt 
a,val1^val2^val3,key1:val1^key2:val2

-- ROW FORMAT을 이용한 테이블 생성 
CREATE TABLE tbl (
 col1 STRING,
 col2 ARRAY<STRING>, 
 col3 MAP<STRING, STRING>
) ROW FORMAT DELIMITED
   FIELDS TERMINATED BY ','
   COLLECTION ITEMS TERMINATED BY '^'
   MAP KEYS TERMINATED BY ':';

-- 데이터 로드 
LOAD DATA LOCAL INPATH './sample.txt' INTO TABLE tbl;

-- 데이터 조회, 구분자에 따라 데이터가 구분 됨 
hive> select * from tbl;
OK
a   ["val1","val2","val3"]  {"key1":"val1","key2":"val2"}

-- 지정가능한 구분자 
  FIELDS TERMINATED BY '\t'            -- 칼럼을 구분하는 기준
  COLLECTION ITEMS TERMINATED BY ','   -- 리스트를 구분하는 기준
  MAP KEYS TERMINATED BY '='           -- 맵데이터의 키와 밸류를 구분하는 기준
  LINES TERMINATED BY '\n'             -- 로(row)를 구분하는 기준
  ESCAPED BY '\\'                      -- 값을 입력하지 않음
  NULL DEFINED AS 'null'               -- null 값을 표현(0.13 버전에서 추가)
```


- - - 

## 4. Hive 서데(SerDe)    

서데는 데이터를 해석하는 방법을 지정한다. 하이브에서 제공하는 서데는 
기본서데, 정규식(RegExSerDe), JSON(JsonSerDe), CSV(OpenCSVSerde)가 
존재한다. 사용자가 개발하여 적용할 수도 있다.    
각 서데의 상세한 사용법은 [하이브 위키](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL-RowFormats&SerDe)를 참고하면 된다.    

각 서데의 사용법은 아래와 같다.   


```   
-- RegEx 서데 
-- 127.0.0.1 - frank [10/Oct/2000:13:55:36 -0700] "GET /apache_pb.gif HTTP/1.0" 200 2326
CREATE TABLE apachelog (
  host      STRING,
  identity  STRING,
  user      STRING,
  time      STRING,
  request   STRING,
  status    STRING,
  size      STRING,
  referer   STRING,
  agent     STRING )
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
  "input.regex" = "([^]*) ([^]*) ([^]*) (-|\\[^\\]*\\]) ([^ \"]*|\"[^\"]*\") (-|[0-9]*) (-|[0-9]*)(?: ([^ \"]*|\".*\") ([^ \"]*|\".*\"))?"
);

-- JSON 서데 
CREATE TABLE my_table(
  a string, 
  b bigint 
) ROW FORMAT SERDE 'org.apache.hive.hcatalog.data.JsonSerDe'
STORED AS TEXTFILE;

-- CSV 서데 
CREATE TABLE my_table(
  a string, 
  b string
) ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.OpenCSVSerde'
WITH SERDEPROPERTIES (
   "separatorChar" = "\t",
   "quoteChar"     = "'",
   "escapeChar"    = "\\"
)  
STORED AS TEXTFILE;
```   


- - - 

## 5. 저장 포맷(STORED AS)    

STORED AS는 데이터를 저장하는 파일 포맷을 지정한다. 저장 포맷은 TEXTFILE, SEQUENCEFILE, ORC, PARQUET 등이 존재한다. 
사용자가 개발하여 적용할 수도 있다.    

가장 많이 쓰이는 TEXTFILE은 데이터가 많을 수록 데이터 저장 공간과 
처리 속도면에서 고려를 해야 한다.    
대표적으로 delimiter를 이용하여 구분한 CSV(Character separated value)가 있다.   

```
직업,이름,성별   
학생,David,M
회사원,Kaven,M
```


Parquet, ORC는 모두 스키마를 가지고 있으며 처리 속도가 빠르다는 장점이 있다.    
또한, `컬럼 기반 저장 포맷(열 지향 스토리지)` 이기 때문에 데이터를 미리 컬럼 
단위로 정리해 둠으로써 필요한 컬럼만을 로드하여 디스크 I/O를 줄인다.   
그렇기 때문에 데이터의 압축률도 우수하며 데이터 집계에 최적화 되어 있다.   

> 반대로 행 지향 스토리지의 예는 RDB(Oracle, MySQL)가 있으며 행(레코드) 단위로 
읽고 쓰기에 최적화 되어 있다. 하지만, 데이터 집계를 진행 할 때 행 단위이기 때문에 
사용하지 않는 컬럼도 읽게 된다.   

> 데이터 분석에는 어떤 컬럼이 사용되는지 미리 알 수 없기 때문에 
인덱스를 작성했다고 해도 거의 도움이 되지 않는다. 필연적으로 대량의 
데이터 분석은 항상 디스크 I/O를 동반한다. 따라서, 인덱스에 의지하지 
않는 고속화 기술이 필요하다.   


`하지만 ORC는 Hive에 최적화된 형식이고, Parquet는 스파크에 최적화된 형식이다.`    




상세한 내용은 [하이브 위키](https://cwiki.apache.org/confluence/display/Hive/LanguageManual+DDL#LanguageManualDDL-StorageFormatsStorageFormatsRowFormat,StorageFormat,andSerDe)를 확인하자.    

- - - 

## 6. Hive 성능 최적화      

하이브의 성능을 최적화 하기 위한 설정에 대해 알아보자.    

#### 6-1) 작업 엔진 선택: TEZ 엔진 사용    

`맵리듀스(MR)엔진은 연산의 중간 파일을 로컬 디스크에 쓰면서 진행하여 이로 인한 
잦은 IO 처리로 작업이 느려진다. 테즈(TEZ)엔진은 작업 처리 결과를 메모리에 
저장하여 맵리듀스보다 빠른 속도로 작업을 처리할 수 있다.`   

```
set hive.execution.engine=tez;  
``` 



#### 6-2) 파일 저장 포맷: ORC 파일 사용    

테이블의 데이터 저장에 ORC 파일을 사용하여 처리 속도를 높일 수 있다. 
ORC 파일 포맷은 데이터를 컬럼 단위로 저장하기 때문에 검색 속도가 빠르고, 
    압축률이 높다.    

```
CREATE TABLE table1 (
) STORED AS ORC;
```

#### 6-3) 데이터 처리 방식: 벡터화(Vectorization) 사용     

벡터화 처리는 한 번에 1행을 처리하지 않고, 한 번에 1024행을 처리하여 
속도를 높이는 기술이다. `ORC 파일 포맷에서만 사용가능하다. 필터링, 조인, 집합 
연산에서 40~50% 정도의 성능 향상을 기대할 수 있다.`                  

```
set hive.vectorized.execution.enabled=true;    
```

#### 6-4) 데이터 저장 효율화: 파티셔닝, 버켓팅 사용    

하이브는 디렉토리 단위로 데이터를 처리하기 때문에 검색에 사용되는 
데이터를 줄이기 위한 방안으로 파티셔닝, 버켓팅 기능을 이용하면 좋다.   

`파티셔닝은 데이터를 폴더 단위로 구분하여 저장하고, 버켓팅은 지정한 개수의 
파일에 컬럼의 해쉬값을 기준으로 데이터를 저장한다. 이를 이용하여 
한번에 읽을 데이터의 크기를 줄일 수 있다.`     



```
CREATE TABLE table1 (
) PARTITIONED BY(part_col STRING);
```

#### 6-5) 통계정보 이용: 하이브 stat 사용    

하이브는 테이블, 파티션의 정보를 메타스토어에 저장하고 조회나 count, sum 같은 집계함수를 
처리할 때 이 정보를 이용할 수 있다. 맵리듀스 연산없이 바로 작업을 할 수 있기 때문에 
작업의 속도가 빨라진다.   

```
set hive.stats.autogather=true;
```

#### 6-6) 옵티마이저 이용: CBO   

하이브는 카탈리스트 옵티마이저를 이용하여 효율적으로 작업을 처리할 수 있다. explain을 이용하여 
작업 분석 상태를 확인할 수 있다.   

```
set hive.cbo.enable=true;

hive> explain select A from ta, tb where ta.id = tb.id;
```


- - - 

**Reference**   

<https://wikidocs.net/23572>   
<https://wikidocs.net/23469>   
<https://datacookbook.kr/88>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
