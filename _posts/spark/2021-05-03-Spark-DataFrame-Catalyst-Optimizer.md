---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL 의 Catalyst Optimizer"
subtitle: "Spark SQL 사용시 엔진 차원에서 성능 최적화 / Optimized Query Plan"    
comments: true
categories : Spark
date: 2021-05-03
background: '/img/posts/mac.png'
---

이번 글에서는 Spark SQL을 사용할 때 성능 최적화를 위해 
제공해주는 Catalyst Optimizer에 대해서 deep dive 해보자.    

- - -   

## 1. Catalyst Optimizer   

`아래 그림과 같이 Spark에서 작성한 SQL Query(ANSI SQL, Hive QL 등) 와 DataFrame 코드는 
실행할 때 실행 계획에 따른 최적화가 이루어 지는데 이를 Catalyst Optimizer라고 한다.`     

<img width="800" alt="스크린샷 2023-12-15 오전 7 36 23" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/2951a1e3-719c-4843-9530-f7248b702ccb">   

먼저 `Unresolved Logical Plan`은 작성한 코드를 파싱하여 문법적 오류가 없는지 체크 한다.   

문법적 오류가 없다면 `Logical Plan`을 만드는데 그 전에 `Catalog`를 확인하여  
작성한 코드의 대상 테이블 및 컬럼 정보(이름, 타입) 또는 사용한 함수, UDF 등 
실제로 존재하는지 체크한다.   

> 해당 정보는 Catalog의 메타 데이터로 등록 되어 있다.  

그 후 Optimized Logical Plan은 최적화 과정이 이루어짐을 의미한다.    

> 최적화에 대한 내용은 아래에서 더 자세히 다룰 예정이다.   

Optimized Logical Plan 거치고 나면 `물리 계획(Physical Plans)`를 세우게 된다.   

> 물리 계획이란 어느 경로에서 어떤식으로 파일을 읽어서 처리할 건지에 대한 계획이다.   

여러 물리 계획을 세운 후 그 중에서 `비용이 적게 드는 모델(Cost Model)`을 선택하게 되며, 
    `선택된 모델을 가지고(Selected Physical Plan)` 실제로 RDD 베이스 코드를 만들어 낸다.  

> SQL Query, DataFrame 코드로 작성하여도 Spark는 내부적으로 RDD로 실행 된다.   

- - - 

## 2. Catalyst Optimizer 예시   

아래 코드를 RDD로 만드는 과정을 확인해보면서 
Catalyst Optimizer 가 어떻게 최적화를 진행하는지 이해해보자.   

<img width="400" alt="스크린샷 2023-12-15 오전 8 13 58" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/237ecd8e-c404-4a3a-9921-32b4da64c3c4">   

위 코드를 RDD로 만든다고 가정해보면, 2가지 방식을 생각해 볼 수 있다.   

첫번째는 가장 심플하게 코드 그대로 아래와 같이 작성할 수 있다.   

<img width="650" alt="스크린샷 2023-12-16 오후 3 16 01" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/b736b163-107d-4827-8ebe-b366141a7be3">   

두 RDD를 cartesian 곱을 통해 모든 짝의 경우의 수를 
만들어 내고 where 조건을 filter 함수로 동일하게 수행되도록 하였다.   

> cartesian() 함수는 두 RDD 의 모든 경우의 수의 짝을 구하기 때문에 데이터 수가 많다면 비용이 많이 드는 함수이다.    

그 후 t1 만 select 하기 때문에 map 함수로 추출 후 count 함수로 최종 결과 값을 추출 하였다.   

두번째 방법은 아래와 같이 조인할 대상을 미리 filter하여 최적화를 할 수도 있다.   

<img width="589" alt="스크린샷 2023-12-16 오후 3 29 22" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1bca1738-6372-499b-9e7e-1048a55219fc">

위 방식은 cartesian 함수와는 다르게 같은 키 값으로 조인을 하는 
inner join을 진행하였다.     

Spark 진영에서 확인한 결과 당연하게 Solution 2가 훨씬 높은 성능을 보였다.    

<img width="500" alt="스크린샷 2023-12-16 오후 3 35 54" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/664cd87a-e612-418e-84c7-bd373a340874">   

`위 결과에서 확인할 수 있는 것처럼 Spark 엔진은 RDD 베이스 코드로 실행이 되며 
동일한 동작을 하는 코드라도 어떻게 작성하느냐에 따라서 
큰 성능 차이가 발생할 수 있다.`      

`따라서 Spark에서 SQL Query 또는 DataFrame으로 코드를 작성하면, 
    Catalyst Optimizer가 개입하여 실행계획을 세우고 최적화를 진행한다.`    

- - - 

## 3. How Catalyst Works   

`Catalyst Optimizer는 실제 동작을 할 때 추상화된 tree 를 만들어 내며 
이를 개선해 나간다.`     

<img width="526" alt="스크린샷 2023-12-16 오후 3 48 25" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/492f4abf-4e9f-4340-85e6-97b03d3e7f4a">     

위 예제와 조금 다른 예제를 통해서 어떻게 성능을 최적화 해나가는지 
살펴보자.    

<img width="686" alt="스크린샷 2023-12-16 오후 3 52 07" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/540a5017-053a-4f76-b5c8-0c7014792060">   

`첫번째로 Query를 우선 가장 심플하게 트리 형태로 만들어 낸다.`      

`두번째는 Transformations 단계이며, 
    처음 만들어낸 tree 를 기반으로 특정 룰들에 따라서 최적화를 진행한다.`      
아래 그림과 같이 filter를 먼저 진행하여 join 대상을 줄였고, cartesian 이 아닌 
inner join으로 변경하였다.(`Predicate Pushdown 룰`)     

<img width="800" alt="스크린샷 2023-12-16 오후 4 02 50" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/47206f66-bf88-4933-9431-d6fc517df91a">     

그 후 `Constant Folding 룰`에 의해 최적화를 진행하였다.   
아래 그림에서 50 * 1000 연산은 모든 row 마다 진행해 주어야 하기 때문에 
미리 50000으로 만들어서 최적화 한다.  

동일하게 1+2 와 같은 연산도 미리 3으로 만든 후 진행하며 Spark는 보통 대용량 데이터를 
처리하기 때문에 이러한 작은 차이가 성능에 영향을 끼칠 수 있다.   

<img width="700" alt="스크린샷 2023-12-16 오후 4 07 12" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/20b0f117-143d-4376-9c24-4ffcbdca7463">   

`Column Pruning 룰`에 의해 미리 불필요한 컬럼을 필터하여 
각 단계마다 모든 컬럼들을 가지고 다닐 필요가 없게 최적화 하였다.   

<img width="700" alt="스크린샷 2023-12-16 오후 4 09 23" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/0a76e92c-f8a1-4af9-9924-3b896f45e28b">   

이로써 모든 최적화가 완료되었다.   

- - - 

## 4. Details for Query   

이제 Spark SQL을 실행하였을 때 확인할 수 있는 쿼리 플랜을 살펴보자.   

<img width="900" alt="스크린샷 2023-12-16 오후 4 35 49" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/58632411-b967-4b81-8147-094218906f64">   

`위 그림에서 Analyzed Logical Plan은 최적화 전 단계이며, 아래에서부터 위로 
순차적으로 살펴보면 모든 컬럼을 추출 하여 연산을 하는 것을 
확인할 수 있다.`   

> 위에서 살펴봤던 것처럼 먼저 있는 그대로 실행계획을 세웠다.      

`Optimized Logical Plan 은 최적화한 실행 계획이며 필터 먼저 적용 후 
특정 룰에 의해 최적화가 된 것을 확인할 수 있다.`   

> filter를 통해 조인 건수를 줄이고, 필요한 컬럼만 가져왔다.    

- - - 

## 5. 마무리   

정리해 보면 Spark에서 SQL Query, DataFrame, DataSet 등으로 코드를 작성하게 되면 
Catalyst Optimizer가 개입하여 최적화를 진행해 준다.   

<img width="600" alt="스크린샷 2023-12-16 오후 5 21 10" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/8d1b29d6-69ae-4ef8-a131-6db832389e4e">   

`Spark 1.x 에서는 Spark SQL 성능이 좋지 못했지만 Spark 2.0 버전 부터는 
Catalyst Optimizer와 다른 성능 향상 기법들이 도입되었기 때문에 
성능 향상이 되었다.`   

<img width="1053" alt="스크린샷 2023-12-16 오후 5 23 30" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/1f27a9c7-9fbc-4394-8cdb-54d8f3ac4797">   

기존에는 Spark 진영에도 ML 또는 스트리밍을 모두 RDD로 제공했지만, 
      현재는 모두 SQL 베이스로 제공하고 있으며 릴리즈 노트를 보면 
      Spark SQL의 성능 향상에 많은 고민을 하고 있는 것을 확인할 수 있다.   

> 물론 SQL도 결국 Spark 내부적으로는 RDD로 실행되지만 이를 엔진이 직접 최적화를 해준다.   

- - - 

**Reference**    

<https://yeo0.tistory.com/entry/Spark-Core-of-Spark-SQL-Engine-Catalyst-Optimizer-Tungsten>   
<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>   
<https://fastcampus.co.kr/courses/209522/clips/>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

