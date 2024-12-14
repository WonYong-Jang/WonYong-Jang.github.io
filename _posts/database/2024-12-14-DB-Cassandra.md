---
layout: post
title: "[DB] 카산드라(cassandra) "
subtitle: ""
comments: true
categories : Database
date: 2024-12-14
background: '/img/posts/mac.png'
---   

## 1. 카산드라(Cassandra) 개요   

아파치 카산드라(Apache Cassandra)는 비정형 데이터를 여러 노드에 분산 
저장하여 대량의 트래픽을 신속히 처리하는 분산 저장형 데이터베이스이다.   
클러스터 중단 없이 노드 수를 손쉽게 증가할 수 있어 확장성과 
고가용성이 필요한 대용량 데이터 관리에 최적화되어 있다.   



- - - 

## 2. 카산드라 특징   

카산드라는 SQL과 비슷한 Cassandra Query Language(CQL)을 이용한다.   

- Keyspace: 데이터세트를 어떻게 구성할 것인지에 대한 정의를 한다.   
- Table: 데이터 스키마를 정의한다.   
- Partition: 모든 행에 이
- Row: 
- Column: 해당 테이블에서 행에 속하는 열을 말한다.   

- - - 

## 3. 카산드라 장점   

### 3-1) 고성능 분산처리   

카산드라는 여러 노드에 클러스터를 분산하여 저장할 수 있다.      
링 구조로 된 노드들은 마스터 노드가 따로 존재하지 않고 모든 노드가 
각자 들어온 요청을 처리하는 구조이므로 대용량 데이터를 신속하게 병렬 
처리 가능하다.   


### 3-2) 탄력적인 확장성   

하드웨어 용량을 늘리는 수직 확장 대신 노드를 추가하여 요청을 분산해서 
처리하는 수평 확장으로 간편하게 클러스터 처리 용량을 확대할 수 있다.   
노드는 클러스터 재구성 없이 손쉽게 증가, 감소 시킬수 있으며 
트랜잭션 처리 성능은 노드를 추가한 만큼 선형적으로 증가한다.    




- - - 

## 4. 카산드라 단점   

### 4-1) 높은 진입장벽   

컬럼형 데이터베이스로 로우형 데이터베이스인 관계형 데이터베이스와는 
다른 생소한 개념이라 진입장벽이 높다.   

### 4-2) 복잡한 조건의 검색 불가   

`복잡한 조건의 검색이 불가능하며, 대량이지만 검색 조건은 단순한 
서비스에 적합하다.`   

- - - 

## 5. 카산드라 데이터 구조   

카산드라의 데이터 구조는 비교적 간단하다.    
`최상위에 논리적 데이터(Data) 저장소인 키 스페이스(keyspace)가 있고, 
    키 스페이스 아래에는 테이블이 존재한다.`      

테이블은 다수의 row 들로 구성되어 있으며 각 row는 키 값(key value)으로 
이루어진 컬럼들로 구성된다.

<img width="774" alt="스크린샷 2024-12-14 오후 5 29 15" src="https://github.com/user-attachments/assets/d2ec4cfc-11db-4988-8d51-3298017db33f" />   

`카산드라는 기본적으로 링(Ring) 구조를 가지며, 
    링을 구성하는 각 노드에 데이터를 분산하여 저장한다.`   
파티션 키라고 불리는 데이터의 해시(hash)값을 기준으로 
데이터를 분산하게 된다.   





<img width="816" alt="스크린샷 2024-12-14 오후 5 32 03" src="https://github.com/user-attachments/assets/2ec56765-c3a2-4ce3-baa5-c31d7bf120e2" />   




- - -
Referrence

<https://meetup.nhncloud.com/posts/58>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

