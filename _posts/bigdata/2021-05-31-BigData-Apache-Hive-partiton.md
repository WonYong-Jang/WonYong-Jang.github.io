---
layout: post
title: "[Hive] Apache hive 파티션 타입 및 종류"
subtitle: "정적, 동적 파티션"       
comments: true
categories : BigData
date: 2021-05-31
background: '/img/posts/mac.png'
---

Hive 파티션(partiton)의 개념은 RDBMS와 크게 다르지 않다. 테이블을 하나 이상의 
키로 파티셔닝(partitioning) 할 수 있다.    

일자별로 데이터를 만드는 테이블이 있다고 가정해보자. 이 테이블에서 특정 날짜의 
데이터를 찾는다면, 전체 테이블을 다 탐색해야만 원하는 결과를 얻을 수 있다.   
여기서 전체를 찾지 않고 날짜별로 Directory를 만든다고 생각해보자.  
원하는 날짜가 아니면 파일이 아닌 Directory 단위로 지나칠 수 있다.  

<img width="630" alt="스크린샷 2021-06-01 오후 11 12 40" src="https://user-images.githubusercontent.com/26623547/120338126-e43c4880-c32e-11eb-97de-eeda13b5e60c.png">    

`데이터를 조회 할 때 파티션 키 값을 잘 구성해야 hive 내부적으로 skip-scan이 
발생하여 불필요한 I/O를 최소화 할 수 있다. 또한 파티션 키의 순서에 따라 
hdfs 상의 디렉토리 구조가 결정됨으로 워크로드에 따라 그 순서도 적절히 
결정해야 한다.` 그러면 hive 파티션에 대해 알아보자.    

- - - 

## 1. 파티션 테이블 생성    

일반적으로 hive의 non-partiton 테이블은 아래와 같이 생성 한다.   

```
create table delivery (
    id bigint,
    orderid bigint,
    createdat string 
)
```    

위의 테이블에서 createdat 컬럼을 partition key로 설정하기 위해서는 아래와 같이 
partitioned by를 사용하면 된다.   

```
-- 1. Single Partition 테이블의 Create문 
create table delivery (
    id bigint,
    orderid bigint
) partitioned by (createdat string)   

-- 2. Multi Partition 테이블의 Crreate 문   
create table delivery (
    id bigint,
    orderid bigint
) partitioned by (createdat string, cd int)
```   

HDFS 관점에서 보면 파티션은 테이블 Directory 하위에 생성된 sub Directory 이다.   
위에서 생성한 1번과 2번의 테이블 Directory 구조의 차이는 아래와 같다.   

```
/user/hive/warehouse/production.db/supply/createdat=20210101/file1   

/user/hive/warehouse/production.db/supply/createdat=20210101/cd=22/file1    
```

- - - 

## 2. 파티셔닝 방법    

파티션 테이블에 데이터를 넣는 방법은 다양하다. 일반 파티셔닝 방법에 따라 
아래와 같이 나눌 수 있다.   

- 정적 파티션 ( static partiton )   
- 동적 파티션 ( dynamic partion )   

- - -  

#### 2-1) 정적 파티션   

정적 파티션은 partiton의 값을 명시적으로 입력해야 한다.     

```
-- Static Partitioning 예시
INSERT INTO TABLE delivery PARTITION(day=20210101)
SELECT * FROM delivery WHERE day=20210101;
```



#### 2-2) 동적 파티션    

특정 Partition 값을 지정하는 것이 아니라 전체 Partition에 대해서 Insert를 한다고 가정해보자.   
그러면 Static Partitioning과 같이 어떤 파티션이 있는지 찾아야 하고 
그에 대해서 일일이 insert 하는 것은 상당히 수고스럽다.   
`따라서 hive에서는 insert할 때, Partition key를 지정하면 자동으로 source table에 있는 partition이 생성된다.`         

`해당 파티션이 없는 경우에 파티션을 만들어서 입력해주는 방법이다.`    

```
-- Dynamic Paritioining 예시
INSERT INTO TABLE supply PARTITION (day,cd)
SELECT id,part,quantity FROM source ;

-- 위 내용을 조금만 응용해보면, mix dynamic and static partitioning을 할 수 있다.
-- 말 그대로, multi partion인 Table의 경우 하나의 Partition은 고정된 값이고 
-- 다른 하나의 Partition은 dynamic value인 것이다.

INSERT INTO TABLE supply PARTITION (day=20190621,cd)
SELECT id,part,quantity FROM source ;
-- 위 쿼리를 적용하면 day가 20190621일 때, cd 파티션은 자동으로 생성되고 적재된다.
-- 주의할 점은, static partition key가 dynamic partition key 보다 상위 partition이어야 한다.
```


이것을 사용하기 전에 동적 파티션을 위한 아래와 같은 parameter 설정이 필요하다.   
해당 option이 있는 이유는 과도한 partiton 생성으로 생기는 side effect를 막고자 함에 있다.   

```
set hive.exec.dynamic.partition=true;     
 --true: hive가 동적 파티션을 수행할 수 있도록 허용 

set hive.exec.dynamic.partition.mode=nonstrict;   
 -- strict: 최소 하나의 정적 파티션이 있어야 한다.(human error 방지) 
 -- nonstrict: 모든 파티션 키가 동적으로 생성된다. 

set hive.exec.max.dynamic.partitions=1000;    
 -- 동적으로 생성될 수 있는 파티션 최대 개수 (기본값:1000)
 
set hive.exec.max.dynamic.partitions.pernode=100; 
 -- mapper/reducer 노드별 생성될 수 있는 파티션 수 (기본값:100)
 
set hive.optimize.sort.dynamic.partition=true;
 -- 전역적으로 파티션 키에 대한 정렬 작업을 수행하여 하나의 파티션 키에 대한 reducer가 1개만 수행되도록 한다. 

set hive.merge.tezfiles = true 
 -- tez작업결과 일정 크기 이하의 파일들을 합쳐준다. (기본값:false)
 
set hive.merge.smallfiles.avgsize=32000000;
 -- 설정한 사이즈 이하의 파일을 합친다. (기본값:약16MB)

set hive.merge.size.per.task =256000000;
 -- merge된 파일의 크기 (기본값:약256MB)
```

`동적 파티션의 경우 편리하게 파티셔닝을 할 수 있다는 장점과 함께 너무 
작은 파일이 생길 수 있다는 단점이 있다.`   
작은 파일이 너무 많이 생기는 경우, 조회작업이 느려지는 현상이 발생할 수 있기 
때문에 merge와 관련된 옵션을 같이 사용하는 것이 좋다.    

- - - 

## 3. 파티션의 필요성    

아래와 같은 쿼리를 수행한다고 해보자.    

```
select * from delivery where orderid=111 and createdat ='2021-01-01';
```

`delivery 는 파티션이 되어 있지 않기 때문에 2021년 1월 1일 데이터를 읽기 위해서 
full-scan 작업을 거쳐야 한다. 그러나 동일한 쿼리를 파티션이 되어 수행하는 경우 
2021-01-01 의 값을 갖는 파티션만 탐색하면 됨으로 훨씬 작은 자원과 
시간으로 쿼리를 수행할 수 있다. 이러한 특성은 
테이블이 커질 수록 점점 더 큰 성능 향상을 나타낸다.`      

#### 3-1) partiton에 대한 다양한 명령어   

```
#1 테이블 정보 및 로케이션 확인
desc formatted [테이블명];

#2 Partition 조회하기
SHOW PARTITIONS supply;
day=20190621/cd=21
day=20190621/cd=22
day=20190622/cd=14

특정 파티션의 sub partition을 확인하려면
SHOW PARTITONS supply(day=20190621)
day=20190621/cd=21
day=20190621/cd=22

#3 Partition Description(정보) 보기
DESCRIBE FORMATTED supply PARTITION(day=20190621,cd=25);

#4 ALTER PARTITIONS
#파티션 삭제
ALTER TABLE supply (DROP IF EXISTS) PARTITION(day=20190621, cd=21);
```

- - -

## 4. 파티션 수정    

Drop 파티션, rename 파티션을 위해서는 alter 명령어를 통해 수행할 수 있다.    

```
--파티션 이름 변경
alter table delivery partition (createdat=2021-01-01) rename to partition (createdat=2021-02-02);

-- 파티션 Location 수정 
alter table delivery partition (createdat=2021-01-01) set location 's3://directory';

-- 기본적인  파티션 삭제 
alter table delivery drop if exists partition (createdat=2021-0101);

-- 2개 이상의 파티션 삭제     
alter table delivery drop if exists partition (type ='order', createdat='2021-01-01');   
-- order 라는 partiton 내의 createdat 이 2021-01-01인 모든 파티션 데이터가 지워진다.   

-- 범위 지정 파티션 지우기     
alter table delivery drop if exists partition (type ='order', createdat <'2021-01);   
-- order 라는 partition 내의 createdat 이 2021-0101보다 과거의 파티션 데이터가 지워진다.   
```

- - - 

파티션을 만들고 관리하는 것은 hive의 시작이라고 할 수 있다. RDBMS에는 
트랜잭션 단위의 데이터 처리에 대한 응답성은 매우 빠르지만, 페타 단위의 
큰 데이터가 적재되지도 않거니와 테라 단위의 데이터를 쿼리한다는 것은 
매부 어려운 일이다.   

하지만 Hive 같은 경우 대용량의 데이터를 높은 처리량(throughput)으로 처리할 수 
있도록 설계되었기 때문에 작은 데이터를 처리하거나 빠른 응답성을 
기대하는 건 무리이다.            

처리하는 데이터 단위가 다르기 때문에 I/O에 더 민감하다. 그래서 RDBMS에서 
인덱스 설계를 고심하듯, Hive에서는 반드시 파티션에 대한 설계를 
공들여야 한다. 그러고나면 Hive가 보장해 줄 수 있는 최소한의 성능을 
제공받을 수 있을 것이다.    

- - - 

**Reference**   

<https://pskim-b.github.io/posts/hive/hive_partition_type/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
