---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL과 DataFrame "
subtitle: "DataFrame 의 주요 연산 사용법  "    
comments: true
categories : Spark
date: 2021-05-01
background: '/img/posts/mac.png'
---

[이전글](https://wonyong-jang.github.io/bigdata/2021/04/11/BigData-Spark.html)에서 RDD를 
이용해 데이터를 처리하는 방법을 살펴보았다.   
RDD를 사용함으로써 얻을 수 있는 장점은 분산환경에서 메모리 기반으로 빠르고 
안정적으로 동작하는 프로그램을 작성할 수 있다는 점이다.
`하지만, RDD에도 한 가지 아쉬운 점이 있는데, 바로 데이터 값 자체는 
표현이 가능하지만 데이터에 대한 메타 데이터, 소위 '스키마'에 대해서는 
표현할 방법이 따로 없다는 점이다.`    

스파크는 SQL은 RDD의 이 같은 단점을 보완할 수 있도록 또 다른 유형의 
데이터 모델과 API를 제공하는 스파크 모듈이다.   
스파크 SQL이라는 이름만 보면 "아.. 스파크에서도 데이터 베이스에서 
사용하던 SQL을 사용할 수 있게 해주는 모듈이구나!"라고 생각할 수도 
있다. 
하지만, 스파크 SQL이 제공하는 기능은 단순히 SQL을 처리해 주는 것 
이상이라고 할 수 있다.   
이제부터 스파크 SQL과 데이터 프레임에 대해 살펴보자.     

- - - 

# DataFrame      

Spark 1.3.X 부터 릴리즈된 DataFrame은 RDB Table 처럼 Schema를 가지고 있고 SparkSQL에서 사용하는 데이터 모델이다.   
`DataFrame의 가장 큰 특징은 기존 RDD와는 전혀 다른 형태를 가진 
SQL과 유사한 방식의 연산을 제공하는 것이다.`    

> 스파크 2.0 부터 스파크SQL의 또 다른 데이터 모델인 데이터 셋과 
통합되면서 org.apache.spark.sql.Row 타입의 요소를 가진 데이터셋을 가르키는 
별칭으로 사용되고 있다.   

Spark내부에서 최적화 할 수 있도록 하는 기능들이 추가되었다. 또한, 기존 RDD에 
스키마를 부여하고 질의나 API를 통해 데이터를 쉽게 처리 할 수 있다.    
대규모의 데이터 셋을 더욱 쉽게 처리 할 수 있도록 High-level API를 지원하여 RDD programming 보다 
더 직관적으로 구현이 가능하도록 추상적인 인터페이스를 지원한다.   

DataFrame을 생성하는 2가지 방법에 대해 살펴보자.    

### 1. 리플렉션을 통한 데이터 프레임 생성    

앞에서 언급한 대로 데이터프레임은 데이터베이스의 테이블과 유사한 로우와 컬럼 구조를 띠고 있다. 따라서 
RDD를 비롯해 로우와 컬럼 형태로 만들 수 있는 컬렉션 객체만 있다면 이를 이용해 
새로운 데이터프레임을 만들 수 있다.     

```
val data = List(row1, row2, row3)

val result: DataFrame = spark.createDataFrame(data) 
// 또는
import spark.implicits._
val result: DataFrame = data.toDF()

result.show() // 행 과 레코드 확인   
```

`위처럼 특별한 스키마 정의를 주지 않아도 컬렉션에 포함된 오브젝트 속성값으로부터 
알아서 스키마 정보를 추출하고 데이터 프레임을 만드는 방법을 리플렉션을 
이용한 데이터프레임 생성방법이라고 한다.`     


### 2. 명시적 타입 지정을 통한 데이터프레임 생성      






`이러한 DataFrame은 RDD에 비해 풍부한 API와 옵티마이저를 기반으로 한 
높은 성능으로 복잡한 데이터 처리를 더욱 수월하게 수행할 수 있다는 
장점이 있었지만 처리해야하는 작업의 특성에 따라서는 직접 프로그래밍이 
가능한 RDD를 사용하는 것에 비해 복잡한 코드를 작성해야 하거나 컴파일 타임 
오류 체크 기능을 사용할 수 없다는 단점도 있었다.`    

이는 DataSet이 등장하면서 DataFrame이 제공하던 성능 최적화와 
같은 장점들을 유지하면서 RDD에서만 가능했던 컴파일 타임 
오류 체크 등의 기능을 사용할 수 있게 되었다.       

- - -






- - - 

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

