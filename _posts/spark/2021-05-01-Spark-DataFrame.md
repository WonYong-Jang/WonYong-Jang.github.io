---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL과 DataFrame"
subtitle: "RDD vs DataFrame / Catalyst Optimizer / Tungsten execution engine / Encoder"    
comments: true
categories : Spark
date: 2021-05-01
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/spark/2021/04/11/Spark.html)에서 RDD를 
이용해 데이터를 처리하는 방법을 살펴보았다.     
RDD를 사용함으로써 얻을 수 있는 장점은 분산환경에서 메모리 기반으로 빠르고 
안정적으로 동작하는 프로그램을 작성할 수 있다는 점이다.    


`하지만, RDD에도 한 가지 아쉬운 점이 있는데, 바로 데이터 값 자체는 
표현이 가능하지만 데이터에 대한 메타 데이터, 소위 '스키마'에 대해서는 
표현할 방법이 따로 없다는 점이다.`    

스파크 SQL은 RDD의 이 같은 단점을 보완할 수 있도록 또 다른 유형의 
데이터 모델과 API를 제공하는 스파크 모듈이다.   
스파크 SQL이라는 이름만 보면 "아.. 스파크에서도 데이터 베이스에서 
사용하던 SQL을 사용할 수 있게 해주는 모듈이구나!"라고 생각할 수도 
있다.    
하지만, 스파크 SQL이 제공하는 기능은 단순히 SQL을 처리해 주는 것 
이상이라고 할 수 있다.   
이제부터 스파크 SQL과 데이터 프레임에 대해 살펴보자.     

- - - 

## 1. DataFrame      

Spark 1.3.X 부터 릴리즈된 DataFrame은 
RDB Table 처럼 Schema를 가지고 있고 SparkSQL 에서 사용하는 데이터 모델이다.   
`DataFrame의 가장 큰 특징은 기존 RDD와는 전혀 다른 형태를 가지며,  
SQL과 유사한 방식의 연산을 제공한다는 것이다.`          

##### Performance - Catalyst Optimizer, Encoder   

DataFrame은 Spark 엔진에서 최적화 할 수 있도록 하는 기능들이 추가되었다.   
`RDD를 사용할 때는 각 연산들을 함수로 생성하여 전달하면, Spark 엔진은 각 함수를 
파싱하지 않고 전달 받은 함수를 처리하기만 한다.`   
`반면, DataFrame 기반 코드는 Spark 엔진이 실행 전에 이를 파싱 및 실행 계획을 
세우게 된다.`   
`즉, 실행 계획에 따라 내부적으로 최적화를 진행하기 때문에 RDD에 비해 성능이 빠르다(Catalyst Optimizer)`       

<img width="1198" alt="스크린샷 2023-09-03 오후 6 29 12" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/d363f001-9300-4090-897a-b68845a2000d">    

또한, `RDD에 비해 직렬화, 역직렬화 하는 방식도 다르며, 성능도 빠르다.`   
`RDD를 사용할 때 java serialization 또는 kryo(크라이오) 를 사용했지만 DataFrame은 Encoder를 사용한다.`     
보통 데이터를 filter, sorting, hashing 하는 경우 당연하게 데이터가 메모리에 역직렬화 되어 있어야 한다.   
하지만, DataFrame은 Encoder를 사용하기 때문에, byte code 형태(직렬화) 그대로 연산 처리가 가능하다.   

> 데이터를 처음 읽어 오거나, 메모리에 캐싱 또는 네트워크를 타고 데이터가 이동했을 때 직렬화 상태일 것이다.   
> 해당 데이터를 연산하기 위해 반드시 역직렬화를 해야 한다 (object 형태)   

`즉, DataFrame의 경우 filter, sorting 또는 hashing 등의 연산에는 직렬화 및 역직렬화를 하기 위한 비용이 들지 않는 다는 것이다.`      

##### Performanc - RDD vs DataFrame   

그림과 같이 RDD를 사용했을 때 보다 2~10배 빠르다라고 알려져 있고, RDD는 언어에 따라
성능차이가 많이 나는 반면, `DataFrame은 어떠한 언어를 사용하든지 빠른 성능을 보장받을 수 있다.`    

<img width="1096" alt="스크린샷 2023-09-03 오후 6 33 16" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/38795353-b541-412f-a713-11d74182cf7a">    

DataFrame은 다른 언어로 작성하더라도 함수형 프로그래밍이 아니고, 표현식(expression) 이기 때문에 
언어가 다르더라도 동일한 실행 계획을 세우고 최적화 할 수 있게 된다.   

> 비슷한 예로 자바 또는 파이썬에서 각각 오라클 sql를 처리할 때 동일한 성능을 보장 받을 수 있는 것과 같다.   

##### Performance - Read Less Data   

DataFrame은 데이터 소스(db, file 등)와 상관없이 데이터를 읽어와서 
내부 메모리에서 처리할 때는 효율적인 구조로 사용할 수 있도록 제공한다.   

> 예를 들면 컬럼 지향 적인 포맷인 parquet 사용 또는 적절하게 압축도 진행한다.     

또한, 파티션을 적절하게 사용한다면 데이터를 읽을 때 full scan을 할 필요가 없다.  

> 물론, 분산 병렬로 처리가 되긴 하지만 적절하게 파티션으로 나눈다면 full scan을 하지 않는다.   
> 예를 들면 year 별, month 별로 파티션을 나눈다.   


##### Simplicity   

마지막으로 DataFrame은 대규모의 데이터 셋을 더욱 쉽게 처리 할 수 있도록 High-level API를 지원하여 RDD programming 보다 
더 직관적으로 구현이 가능하도록 추상적인 인터페이스를 지원한다.   

<img width="500" alt="스크린샷 2023-09-04 오전 11 57 54" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/50a4fc46-a3eb-4235-ab9b-82f4dbe6d9aa">     

> 위에서 설명한 것처럼 RDD에서 map, reduceByKey 안에 작성한 것은 함수형 프로그래밍에 의해 우리가 작성한 
코드이며, 해당 함수는 Spark 엔진은 전달 받아서 실행하는 역할만 한다.  
> 반면, DataFrame 코드는 각각 표현식(expression)이기 때문에 Spark 엔진은 이를 파싱하여 실행계획을 세우고 
Catalyst Optimizer가 개입하여 최적화 한다.   


- - - 

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

