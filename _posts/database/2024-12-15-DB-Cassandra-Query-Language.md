---
layout: post
title: "[DB] 카산드라 CQL(Cassandra Query Language)"
subtitle: "데이터 타입(Data Type) 및 쿼리 사용법 / Partition key, Primary key, Clustering key"
comments: true
categories : Database
date: 2024-12-15
background: '/img/posts/mac.png'
---   

Cassandra Query Language는 테이블에 저장된 데이터를 
찾기 위한 Query로 사용된다.   

관계형 데이터베이스에서는 다른 테이블의 데이터와 연관짓기 위해 
FK를 테이블에 지정하고 조인을 통해 데이터를 조회한다.   
`하지만 카산드라에서는 단일 테이블에 접근하는 것이 최고의 설계이며, 
    쿼리에 포함된 모든 엔티티는 하나의 테이블에 포함되어 있어야 
    가장 빠른 접근이 가능하다.`   

관계형 데이터베이스에서 여러개의 테이블 데이터를 불러오기 위하여 
조인이 사용되었던 것과는 다르게 `카산드라는 조인을 지원하지 않는다.`   
따라서 필요한 모든 필드는 하나의 테이블에 모여있어야 한다.   

이처럼 CQL과 SQL은 사용방법에 차이가 발생하며, 차이가 발생하는 주요 원인은 
카산드라는 분산 데이터를 다루며 비효율적인 쿼리를 방지하는 것을 목표로 삼기 때문이다.   
특히 CQL where 절에서 CQL과 SQL의 차이가 두드러지며 
이번글에서는 이러한 부분에 대해서 자세히 살펴보자.   


- - - 

## 1. Cassandra Query Language  

SQL과 유사한 방식으로 CQL 를 사용하며 CRUD 연산을 수행한다.   
다양한 데이터 타입을 지원하는데, 그 중에서 가장 일반적인 
Built-in type, Collection, 그리고 User-definded 타입 이렇게 세가지 타입을 
먼저 살펴보자.   

> CQL의 keyspace는 SQL의 database와 비슷한 개념이다.   


### 1-1) Data type

먼저 Built-in data type을 아래와 같다. 


### 1-2) CQL key   

Primary key와 Partiton key의 선택은 클러스터에 데이터를 
분배하기 위하여 중요하다.   


카산드라는 클러스터의 노드에 분산해서 데이터를 저장하는 
분산 시스템이다.   
`partition key가 노드에 데이터를 분산하는데 사용`된다.   
카산드라는 데이터 분배를 위해 일관된 해싱을 사용하여 데이터를 분배한다.  
`Partition key는 Primary key의 첫번째 필드로 결정되며, 
          적은 Partition은 Query에 대한 응답을 빠르게 한다.`   

아래 예제에서 테이블 t 는 Primary key인 id를 가지고 있다.   

```sql
CREATE TABLE t (
   id int,
   k int,
   v text,
   PRIMARY KEY (id)
);
```

`클러스터에 데이터 분배를 위한 Partition key는 첫번째 Primary Key 인 
id로 생성된다.`   

테이블 t 가 Primary key로 복합키인 2개 이상의 key를 갖는다고 가정해보자.   

```sql
CREATE TABLE t (
   id int,
   c text,
   k int,
   v text,
   PRIMARY KEY (id,c)
);
```

`클러스터에 데이터 분배를 위한 Partition key는 첫번째 Primary key 인 
id로 생성되고 두번째 필드인 c 는 Clustering key가 되어 
Partition 안에서 Sorting 을 위해 사용된다.`   

> Clustering key를 사용하여 데이터를 정렬하게 되면 데이터 검색에 더 효과적이다.   

일반적으로 Primary key 의 첫번째 필드는 Partition key를 생성하기 위하여 
Hasing되고 남은 필드는 Partition 안에서 정렬을 하기 위한 Clustering key로 
사용된다.   

Partition 된 데이터는 Read 와 Write 의 효율성을 향상시킨다.   
Primary key 외에 다른 필드들은 개별적으로 Indexing 되어 쿼리 성능 향상에 
사용될 수 있다.   

`Partition key는 그룹핑된다면 여러개의 필드로 사용될 수 있다.`      
t 테이블의 다른 버전을 보면 첫번째 Primary key가 
그룹핑되어 2개의 id를 갖는걸 볼 수 있다.   

```sql
CREATE TABLE t (
   id1 int,
   id2 int,
   c1 text,
   c2 text
   k int,
   v text,
   PRIMARY KEY ((id1,id2),c1,c2)
);
```

`id1, id2가 Partition key를 생성하는데 사용되고 
나머지 필드인 c1, c2가 Clustering key로서 사용된다.`   

- - - 



- - -
Referrence

<https://www.datastax.com/ko/blog/deep-look-cql-where-clause>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

