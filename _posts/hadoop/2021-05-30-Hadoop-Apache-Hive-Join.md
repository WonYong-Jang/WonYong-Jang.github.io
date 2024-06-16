---
layout: post
title: "[Hive] Apache hive 에서의 조인 유형"
subtitle: "일반 조인, 맵 조인, 스큐 조인, 버킷 조인"       
comments: true
categories : Hadoop
date: 2021-05-30 
background: '/img/posts/mac.png'
---

이번글에서는 하이브에서 두 개 이상의 테이블을 조인할 때 사용하는 조인 유형에 대해서 
살펴보자.   

- INNER JOIN    
- LEFT OUTER JOIN   
- RIGHT OUTER JOIN   
- FULL OUTER JOIN   
- CROSS JOIN(CARTESIAN PRODUCT JOIN)   
- MAP SIDE JOIN   

- - -    

## 1. Inner Join   


<img width="600" alt="스크린샷 2024-06-16 오후 8 38 17" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/28c055f6-5695-444d-9117-4ce1e1ac4bc1">   

```
// 쿼리 예시 
SELECT a.var1, a.var2, b.var2    
FROM mytable_1 a JOIN mytable_2 b     
ON a.var1 = b.var1 
WHERE a.prd_cd = 'ABC' AND b.prd_cd = 'DEF';
```

참고로 Left Semi Join 은 ON 조건을 만족하는 레코드를 찾을 경우 
왼쪽 테이블의 레코드를 반환한다.      

```
// 쿼리 예시  
select a.col_1, a.col_2
from tbl_a as a
left semi join tbl_b as b on a.col_1 = b.col_1 and a.col_2 = b.col_2
```

`하이브에서 세미 조인이 내부 조인보다 효율적인 이유는 
왼쪽 테이블의 한 레코드에 대해서 오른쪽 테이블에서 일치하는 
레코드를 찾으면 더 이상 일치하는 레코드를 찾지 않고 
바로 데이터를 반환하고 멈추기 때문이다.`         

- - -    

## 2. Left Outer Join   


<img width="600" alt="스크린샷 2024-06-16 오후 8 41 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/2a1abf54-d2ec-435c-8c02-8db3cb566a17">   


```
// 쿼리 예시
SELECT a.var1, a.var2, a.var3, b.var4    
FROM mytable_1 a LEFT OUTER JOIN mytable_2 b     
ON a.var1 = b.var1 AND a.var2 = b.var2    
WHERE a.prd_cd = 'ABC';
```

- - -   

## 3. Right Outer Join   

<img width="600" alt="스크린샷 2024-06-16 오후 8 48 22" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/82de84c3-af96-4283-ac7f-ba8cf8dd1f6c">


```
// 쿼리 예시   
SELECT a.var1, a.var2, a.var3, b.var4    
FROM mytable_1 a RIGHT OUTER JOIN mytable_2 b     
ON a.var1 = b.var1 AND a.var2 = b.var2    
WHERE a.prd_cd = 'ABC';
```   

- - -    

## 4. Full Outer Join    

<img width="600" alt="스크린샷 2024-06-16 오후 8 50 48" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/985e31f2-0ad3-4b7a-bf82-e32d0d138594">   


```
// 쿼리 예시    
SELECT a.var1, a.var2, a.var3, b.var4
FROM mytable_1 a FULL OUTER JOIN mytable_2 b
ON a.var1 = b.var1 AND a.var2 = b.var2
WHERE a.prd_cd = 'ABC';
```

- - -

## 5. Cross Join(Cartesian Product Join)      

굉장히 비효율적인 방식으로 조인을 진행하기 때문에 
CROSS JOIN 사용은 지양해야 한다.   

<img width="600" alt="스크린샷 2024-06-16 오후 8 55 37" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/011ff0eb-18b9-4602-9cf8-6346bca9bfc2">    

```
// 쿼리 예시 
SELECT * FROM mytable_1 JOIN mytable_2;
```

## 6. Map Side Join   

`맵 사이드 조인을 하려면 먼저 set hive.auto.convert.join=true; 로 설정을 
추가해야 한다.`  
또한, 크기가 작은 테이블을 메모리에 캐시하고 큰 테이블은 매퍼로 보낸 후에 
캐시한 작은 테이블과 조인을 한다.   

`일반 조인과 달리 리듀스 단계를 건너뛸 수 있어서 속도가 빠른 장점이 있다.`    

<img width="600" alt="스크린샷 2024-06-16 오후 9 00 22" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/79f0f753-a6a7-4d49-ac2c-081a25ca51d6">   

```
// 쿼리 예시   
hive> set hive.auto.convert.join=true; -- default is false
 
SELECT a.var1, a.var2, a.var3, b.var4    
FROM mytable_1 a JOIN mytable_2 b -- 큰 테이블은 왼쪽, 크기가 작은 테이블은 오른쪽!    
ON a.var1 = b.var1 AND a.var2 = b.var2    
WHERE a.prd_cd = 'ABC';
```


- - - 

**Reference**   

<https://aldente0630.github.io/data-engineering/2018/12/28/join_type_in_hive.html>    
<https://weidongzhou.wordpress.com/2017/06/06/join-type-in-hive-common-join/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
