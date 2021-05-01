---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL과 DataFrame, DataSet "
subtitle: "DataFrame, DataSet 각 데이터 구조 파악하기 / Spark 2.0 API"    
comments: true
categories : BigData
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
스파크는 RDD 외에도 DataFrame과 DataSet을 제공한다.     
이번 글에서는 DataFrame과 DataSet에 대해 살펴보자.     

- - - 

## DataFrame      

Spark 1.3.X 부터 릴리즈된 DataFrame은 RDB Table 처럼 Schema를 가지고 있고 SparkSQL에서 사용하는 데이터 모델이다.   
`DataFrame의 가장 큰 특징은 기존 RDD와는 전혀 다른 형태를 가진 
SQL과 유사한 방식의 연산을 제공하는 것이다.`    

Spark내부에서 최적화 할 수 있도록 하는 기능들이 추가되었다. 또한, 기존 RDD에 
스키마를 부여하고 질의나 API를 통해 데이터를 쉽게 처리 할 수 있다.    
대규모의 데이터 셋을 더욱 쉽게 처리 할 수 있도록 High-level API를 지원하여 RDD programming 보다 
더 직관적으로 구현이 가능하도록 추상적인 인터페이스를 지원한다.   

`이러한 DataFrame은 RDD에 비해 풍부한 API와 옵티마이저를 기반으로 한 
높은 성능으로 복잡한 데이터 처리를 더욱 수월하게 수행할 수 있다는 
장점이 있었지만 처리해야하는 작업의 특성에 따라서는 직접 프로그래밍이 
가능한 RDD를 사용하는 것에 비해 복잡한 코드를 작성해야 하거나 컴파일 타임 
오류 체크 기능을 사용할 수 없다는 단점도 있었다.`    

이는 DataSet이 등장하면서 DataFrame이 제공하던 성능 최적화와 
같은 장점들을 유지하면서 RDD에서만 가능했던 컴파일 타임 
오류 체크 등의 기능을 사용할 수 있게 되었다.    

- - -

## DataSet   

`데이터셋은 Spark 1.6 버전에서 처음 소개되었으며, Spark SQL에서 
사용하는 분산 데이터 모델이다.`            
자바와 스칼라 언어에서만 
사용할 수 있었고 그 이전에는 DataFrame이라는 클래스를 구현 언어와 
상관없이 사용하고 있었다.   

하지만, Spark 2.0부터는 데이터 프레임 클래스가 데이터 셋 클래스로 통합되면서 
변화가 생겼다.   
Spark 2.0부터는 스칼라 언어를 사용하는 경우 DataFrame과 DataSet을 사용 할 수 있고 
자바를 사용하는 경우 DataSet을, 파이썬과 R을 사용하는 경우는 
DataFrame 만을 사용할 수 있게 되었다.   

DataSet도 DataFrame과 마찬가지로 Catalyst Optimizer를 통해 실행 시점에 코드 최적화를 
통해 성능을 향상하고 있다.    

아래와 같이 List를 데이터셋으로 생성할 수 있다.    
이를 조회할 때 show()를 이용 할 수 있으며, 출력을 위한 println() 메서드를 
사용하지 않았는데도 데이터의 내용을 보기 좋게 표시해준다.   


```scala 
val ds = List(1, 2, 3).toDS
ds.show()
```

Output   

```
+-----+
|value|
+-----+
|    1|
|    2|
|    3|
+-----+
```

또한, printSchema라는 명령어를 사용하면 아래와 같이 스키마 정보도 볼 수 있다.   
`데이터 셋은 이처럼 값 뿐만 아니라 스키마 정보까지 함께 포함하기 때문에 
스키마 기반으로 한 데이터 처리와 내부적인 성능 최적화를 함께 제공할 수 있다는 
장점이 있다.`   

```scala 
ds.printSchema   
```

Output   

```
root
 |-- value: integer (nullable = false)
```

#### SparkSession   

`데이터프레임 또는 데이터 셋을 다루기 위해 가장 먼저 알아야 할 것은 
SparkSession이다. RDD를 생성하기 위해 SparkContext가 필요했던 것처럼 
데이터 프레임 또는 데이터 셋을 다루기 위해서는 SparkSession이 필요하다.`   

가장 먼저 SparkSQL 모듈에 대한 의존성 정보를 아래와 같이 설정 후 
SparkSession을 생성 할 수 있다.   

```
implementation group: 'org.apache.spark', name: 'spark-sql_2.11', version: '2.3.0'
```

```scala 
val ss = SparkSession
      .builder()
      .appName("RDDTest")
      .master("local[*]")
      .getOrCreate()
// builder() 메서드는 스파크 세션을 생성할 수 있는 빌더 인스턴스를 생성한다.   
// 추가적인 설정이 더 필요하다면 빌더가 제공하는 config() 메서드를 이용하면 된다.   
// ex) .config("spark.driver.host","127.0.0.1")   
```

의존성 설정이 끝나면 코드를 작성하는데 아래와 같은 단계로 SparkSQL 코드를 작성한다.   

1. SparkSession 생성   
2. SparkSession으로부터 DataSet 또는 DataFrame 생성   
3. 생성된 DataSet 또는 DataFrame을 이용해서 데이터 처리   
4. 처리된 결과 데이터를 외부 저장소에 저장   
5. SparkSession 종료   

위를 보면서 RDD를 사용할 때와 거의 비슷하다는 것을 확인 할 수 있다.    
RDD를 생성하는 부분을 DataFrame 또는 DataSet으로 변경한 것이다.   



- - - 

### RDD vs DataFrame vs DataSet 언제 쓸까?     

나중에 나온 기술이 이전 기술을 보완하고 있기 때문에 더 좋을 것이다. 
개인적인 의견은 RDD의 경우 데이터를 직접적으로 핸들링 해야 하는 경우라면 
낮은 수준의 API를 제공하므로 RDD를 고수할 수 있겠지만 추상화된 API를 사용하여 
간결하게 코드를 작성하고 Catalyst Optimizer를 통해 성능 향상을 꾀하고자 한다면 
DataFrame, DataSet을 고려해 볼 수 있다.    
데이터 엔지니어냐 데이터 분석가냐에 따라 사용하기 편한 언어와 환경은 
다를 수 있다. Scala/Java 개발자라면 Encoder의 장점을 활용하는 DataSet을 
추천한다.   





- - - 

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

