---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL 의 Catalyst Optimizer"
subtitle: "Catalyst Optimizer "    
comments: true
categories : Spark
date: 2021-05-03
background: '/img/posts/mac.png'
---

이번 글에서는 Spark SQL을 사용할 때 성능 최적화를 위해 
제공해주는 Catalyst Optimizer에 대해서 deep dive 해보자.    

- - -   

## 1. Catalyst Optimizer   

`아래 사진과 같이 Spark에서 작성한 SQL Query(ANSI SQL, Hive QL 등) 와 DataFrame 코드는 
실행할 때 실행 계획에 따른 최적화가 이루어 지는데 이를 Catalyst Optimizer라고 한다.`     

<img width="800" alt="스크린샷 2023-12-15 오전 7 36 23" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/2951a1e3-719c-4843-9530-f7248b702ccb">   

먼저 `Unresolved Logical Plan`은 작성한 코드를 파싱하여 문법적 오류가 없는지 체크 한다.   

문법적 문제가 없다면 `Logical Plan`을 만드는데 그 전에 `Catalog`를 확인하여  
작성한 코드의 대상 테이블 및 컬럼 정보(이름, 타입) 또는 사용한 함수, UDF 등 
실제로 존재하는지 체크한다.   

> 해당 정보는 Catalog의 메타 데이터로 등록 되어 있다.  

그 후 Optimized Logical Plan은 최적화 과정이 이루어짐을 의미한다.    

> 최적화에 대한 내용은 아래에서 더 자세히 다룰 예정이다.   

Optimized Logical Plan 거치고 나면 `물리 계획(Physical Plans)`를 세우게 된다.   

> 물리 계획이란 어느 경로에서 어떤식으로 파일을 읽어서 처리할 건지에 대한 계획이다.   

물리 계획을 세운 후 그 중에서 `비용이 적게 드는 모델(Cost Model)`을 선택하게 되며, 
    `선택된 모델을 가지고(Selected Physical Plan)` 실제로 RDD 베이스 코드를 만들어 낸다.  

> Spark SQL은 내부적으로 RDD로 실행 된다.    


- - - 

**Reference**    

<https://yeo0.tistory.com/entry/Spark-Core-of-Spark-SQL-Engine-Catalyst-Optimizer-Tungsten>   
<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

