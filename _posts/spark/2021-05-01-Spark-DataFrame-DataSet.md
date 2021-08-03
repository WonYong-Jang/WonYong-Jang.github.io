---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL과 DataFrame, DataSet "
subtitle: "DataFrame, DataSet 각 데이터 구조 파악하기 "    
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
이제부터 스파크 SQL과 데이터 프레임, 데이터 셋에 대해 살펴보자.     

- - - 

## DataFrame      

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

`RDD와 데이터프레임이라는 훌륭한 데이터 모델이 있음에도 또 다른 데이터 
모델을 제시하게 된 가장 큰 이유는 데이터 프레임과 RDD간의 
데이터 타입(Type)을 다루는 방식의 차이 때문이다.`    

위의 예시를 한가지 들어보면, 
    rdd의 경우 아래와 같이 함수 내부에서 charAt과 같은 
    String 클래스의 메서드를 직접 사용할 수 있다.   

```scala 
rdd.map { v => v.charAt(0) }
```   

`하지만 데이터 프레임의 경우에는 모든 데이터가 Row 타입으로만 
처리되기 때문에 비록 데이터프레임에 포함된 데이터가 모두 문자열이라고 
할지라도 String 클래스의 메서드를 직접 호출할 방법이 없다.`       

물론 데이터프레임의 이런 특징은 RDD 보다 더 뛰어난 성능을 얻기 위한 
최적화 과정에서 발생하는 것이다. 하지만 개발 과정에서의 
불편함이 남아 있기 때문에 스파크에서는 `데이터 프레임 고유의 
성능 최적화 특성을 유지하면서도 IDE를 통한 개발 편의성과 
컴파일 타입 오류 검증이 가능한 새로운 모델을 제공하게 되는데 
그것이 바로 데이터 셋 모델이다.`      

> 위에서 설명했듯이 데이터 프레임은 데이터 셋과 다르지 않은 
완전히 동일한 클래스이다. 즉, 데이터셋과 데이터프레임은 동일한 
데이터를 서로 다른 방식으로 표현하기 위한 모델이지 서로 다른 것이 아니다.   
> 그렇기 때문에 데이터 프레임과 데이터셋은 자유롭게 변환이 가능하다.    

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

#### 1) SparkSession   

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


#### 2) DataSet 생성    

아래 코드를 살펴보면, DataFrame 생성할 때와 비슷하지만, `데이터 셋을 
생성할 때는 데이터셋에서 사용할 인코더(org.apache.spark.sql.Encoder) 정보를 
반드시 설정해야 한다는 점에서 차이가 있다.`    

```java
// 기존 객체를 이용한 데이터 셋 생성 (자바)
Person row1 = new Person("hayoon", 7, "student");
Person row2 = new Person("sunwoo", 13, "student");
Person row3 = new Person("hajoo", 5, "student");
Person row4 = new Person("jinwoo", 13, "student");   

List<Person> data = Arrays.asList(row1, row2, row3, row4);
Dataset<Person> df2 = spark.createDataset(data, Encoders.bean(Person.class));
```

`인코더는 자바 객체와 스파크 내부 바이너리 포맷 간의 변환을 처리하기 위한 
것으로 스파크 1.6에서 데이터셋과 함께 처음 소개되었다.`   
`인코더가 하는 역할은 기존 자바 직렬화 프레임워크나 Kyro와 같은 
자바 객체를 바이너리 포맷으로 변환하는 것이다.`   

> 기존 직렬화 프레임워크처럼 단순히 네트워크 전송 최적화를 위한 
바이너리 포맷을 만드는 것에 그치는 것이 아니라 데이터의 타입과 
그 데이터를 대상으로 수행하고자 하는 연산, 데이터를 처리하고 있는 
하드웨어 환경까지 고려한 최적화된 바이너리를 생성하고 다룬다는 점에서 
그 차이를 찾아볼 수 있다.    

자바의 경우 반드시 인코더를 지정해야 하는데, 스칼라의 경우는 
`import spark.implicits._` 형태로 임포트하면 기본 데이터 타입에 
대해서는 별도의 인코더를 지정하지 않고도 사용할 수 있다.     

> 하지만 스칼라를 사용하더라도 위 방식으로 처리할 수 있는 기본 타입이 
아니거나 자바 언어를 사용하는 경우에는 org.apache.spark.sql.Encoders 객체가 
제공하는 인코더 생성 메서드를 이용해 직접 인코더를 생성 및 지정해야 한다.   


```scala 
case class Person(name: String, age: Int, job: String)

import spark.implicits._

val row1 = Person("hayoon", 7, "student")
val row2 = Person("sunwoo", 8, "student2")
val data = List(row1, row2)
val df2: Dataset[Person] = spark.createDataset(data)
val df2_1: Dataset[Person] = data.toDS
```

데이터 셋은 자바 객체 또는 기존 RDD, 데이터프레임으로부터 생성될 수 있다.   
또한, DataFrame으로 부터 DataSet을 생성하려면 아래와 같이 
as() 메서드를 사용하면 된다.     

```scala 
val ds = List(1,2,3).toDF().as[Int]
ds.show()
```

- - - 

### RDD vs DataFrame vs DataSet 언제 쓸까?     

나중에 나온 기술이 이전 기술을 보완하고 있기 때문에 더 좋을 것이다.      
개인적인 의견은 RDD의 경우 데이터를 직접적으로 핸들링 해야 하는 경우라면 
낮은 수준의 API를 제공하므로 RDD를 고수할 수 있겠지만 추상화된 API를 사용하여 
간결하게 코드를 작성하고 Catalyst Optimizer를 통해 성능 향상을 꾀하고자 한다면 
DataFrame, DataSet을 고려해 볼 수 있다.       
데이터 엔지니어냐 데이터 분석가냐에 따라 사용하기 편한 언어와 환경은 
다를 수 있다.      
Scala/Java 개발자라면 Encoder의 장점을 활용하는 DataSet을 추천한다.   





- - - 

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

