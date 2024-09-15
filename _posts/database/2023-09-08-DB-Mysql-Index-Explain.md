---
layout: post
title: "[DB] Mysql 인덱스 실행계획 분석하기"
subtitle: "Extra 컬럼을 통한 실행계획 분석 / filtered / rows / type  "
comments: true
categories : Database
date: 2023-09-08
background: '/img/posts/mac.png'
---   

## 1. Rows     

MySQL 옵티마이저는 각 처리 방식이 얼마나 많은 레코드를 읽고 
비교해야 하는지 예측해서 비용을 산정한다.   
이 때 rows 컬럼 값은 실행 계획의 효율성 판단을 위해 
얼마나 많은 레코드를 체크해야 하는지 예측한 레코드 건수를 
보여준다. 

> 예측일 뿐이지 정확하진 않다.   


- - - 

## 2. Filtered

SQL 문을 통해 스토리지 엔진으로 가져온 데이터 대상으로 필터 조건에 
따라 어느 정도의 비율로 데이터를 제거했는지를 의미하는 항목이다.

<img width="721" alt="스크린샷 2024-09-12 오후 5 05 09" src="https://github.com/user-attachments/assets/cd275318-3813-4a52-ae78-d982053f8711">   

스토리지 엔진으로 100건의 데이터를 가져왔다고 가정해보면 
위와 같은 where 조건으로 100건의 데이터가 10건으로 필터링 되었다고 
했을 때 10%로 표기 된다.   

- - - 

## 3. Extra  

실행 계획에서 성능과 관련된 중요한 내용이 Extra 컬럼에 자주 표기된다.  

### 3-1) Using index(커버링 인덱스)    

쿼리가 인덱스를 사용하여 필요한 데이터를 가져올 수 있음을 나타낸다.    
테이블의 행을 읽지 않고도 인덱스만으로 결과를 얻을 수 있는 상황이기 때문에 
효율적인 실행 방식이다.   


### 3-2) Using index condition   

`스토리지 엔진의 데이터 결과를 MySQL 엔진으로 전송하는데 
데이터양을 줄여 성능 효율을 높일 수 있는 
옵티마이저의 최적화 방식이다.`      


### 3-3) Using where

where 절의 조건을 사용하여 행을 필터링하는 작업이 필요함을 나타낸다.    

MySQL 은 스토리지 엔진과 MySQL 엔진이라는 두 개의 레이어로 나뉘어져 있다.   

> 스토리지 엔진은 레코드를 읽거나 저장하는 역할을 하고(I/O 발생), MySQL 엔진은 
스토리지 엔진으로부터 전달 받은 레코드를 조인, 필터링 등과 
같은 가공 또는 연산 작업을 수행한다.   

만약 스토리지 엔진에서 200건의 레코드를 읽고, MySQL 엔진에서 
별도의 필터링이나 가공 처리 필요 없이 클라이언트에게 전달하면 
Using where 메시지는 표시되지 않는다.  


### 3-4) Using temporary   

쿼리 실행을 위해 임시 테이블이 생성되어야 함을 나타낸다.   
`보통 distinct, group by, order by 절이 포함된 쿼리에서 발생할 수 있다.`      
임시 테이블을 메모리에 생성하거나 메모리 영역을 
초과하여 디스크에 임시 테이블을 생성하면 Using temporary는 
성능 저하의 원인이 될 수 있기 때문에 튜닝의 대상이 된다.   


### 3-5) Using filesort   

`order by 처리가 인덱스를 사용하지 못할 때` Using filesort가 표시된다.   
`보통 쿼리의 결과가 인덱스 순서와 일치하지 않아 추가적인 정렬 작업이 필요한 경우 발생한다.`      

이 메시지가 표시되는 쿼리는 많은 부하를 일으키므로 쿼리 튜닝이나 
인덱스를 생성하는 것이 좋다.     


### 3-6) Using join buffer   

조인 작업을 수행할 때 조인 버퍼를 사용하고 있음을 나타낸다.   
조인 버퍼는 빠른 조인 처리를 위해 사용되지만, 이 방식은 메모리 사용량이 
높을 수 있다.   

- Using join buffer(Block Nested Loop)   
- Using join buffer(Batched Key Access)
- Using join buffer(hash join)   




- - - 

## 4. TYPE    

`각 테이블의 레코드를 어떤 방식으로 읽었는지를 나타낸다.`       


### 4-1) system

레코드가 1건만 존재하는 테이블 또는 한 건도 존재하지 않는 테이블을 
참조하는 형태의 접근 방법을 system이라고 한다.   

> 이 접근 방법은 innoDB 엔진이 아닌 MyISAM 이나 MEMORY 엔진을 
사용하는 테이블에서만 사용된다.   
> 튜닝이 필요 없다.   

### 4-2) const   

`테이블의 레코드 건수에 관계없이 쿼리에 pk나 unique 컬럼을 
이용하는 where 조건절을 가지며, 반드시 1건을 반환하는 
쿼리의 처리 방식을 const 라고 한다.`     

> 튜닝이 필요 없다.  

### 4-3) eq_ref   

여러 테이블이 조인되는 쿼리의 실행 계획에서만 표시된다.   
조인에서 처음 읽은 테이블의 컬럼값을 두번째 테이블의 
pk나 unique key 컬럼의 검색 조건에 사용할 때 표기된다.   

> 튜닝이 필요 없다.   


### 4-4) ref   

`eq_ref와 달리 조인의 순서와 관계없으며 pk나 unique key 제약도 없다. 인덱스의 
종류와 관계없이 equal 조건으로 검색할 때 ref 접근 방법이 사용된다.`   

> 튜닝이 필요 없다.   

### 4-5) fulltext   

fulltext 접근 방법은 MySQL 서버의 전문 검색 인덱스를 사용해 인덱스를 
읽는 접근 방법을 의미한다.   
전문 검색은 MATCH, AGAINST 구문을 사용해서 실행해야 하는데, 이때 
반드시 테이블에 전문 검색용 인덱스가 준비되어 있어야만 한다.   

> 튜닝 또는 확인이 필요하다.   

### 4-6) ref_or_null

이 접근 방법은 ref와 동일한데, NULL 비교가 추가된 형태이다.   


### 4-7) unique_subquery   

where 조건절에서 사용될 수 있는 in(subquery) 형태의 쿼리를 위한 방법이다.   
의미 그대로 서브쿼리에서 중복되지 않는 유니크한 값만 반환할 때 
이 접근 방법을 사용한다.   

```sql
SELECT * FROM tab01 WHERE col01 IN (SELECT Primary Key FROM tab01);
```

> 이 접근 방식도 상당히 빠르다.   

### 4-8) index_subquery  

아래와 같이 pk가 아닌 인덱스를 in 절 안의 서브 쿼리에서 사용하는 경우이다.  

```sql
SELECT * FROM tab01 WHERE col01 IN (SELECT key01 FROM tab02);
```

> 이 접근 방식도 상당히 빠르다.   

### 4-9) range  

우리가 알고 있는 인덱스 레인지 스캔 형태의 접근 방법이다.   
얼마나 많은 레코드를 필요로 하느냐에 따라 
차이가 있겠지만 range 접근 방법도 상당히 빠르다.   
단, 범위가 너무 넓으면 성능 저하의 요인이 될 수 있으므로 
확인이 필요하다.   

### 4-10) index_merge   

두 개의 인덱스가 병합되어(동시에 사용되는) 검색이 이루어지는 경우이다.  

> 전문 인덱스는 제외된다.   


### 4-11) index   

`index 접근 방법은 이름과 다르게 인덱스를 처음부터 끝까지 읽는 
인덱스 풀 스캔(인덱스를 사용하는 의도가 아님)을 의미한다.`    
ALL 유형의 테이블 풀 스캔 방식과 유사하지만 
테이블 풀 스캔 보다는 빠르다.   


### 4-12) ALL   

우리가 알고 있는 풀 테이블 스캔을 의미하는 접근 방법이다.   
가장 비효율적인 방법이며 확인이 필요하다.   


- - -
Referrence

<https://blog.naver.com/seuis398/70111486432>   
<https://jojoldu.tistory.com/243>  
<https://jojoldu.tistory.com/529>   
<https://jojoldu.tistory.com/476>   

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

