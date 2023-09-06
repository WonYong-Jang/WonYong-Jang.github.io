---
layout: post
title: "[Spark] 아파치 스파크(spark) SQL과 DataFrame"
subtitle: "DataFrame 의 주요 연산 사용법 / Catalyst Optimizer / Tungsten execution engine / Encoder"    
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

## 2. Spark SQL 구현하기   

`Spark SQL을 구현하기 위해서는 가장 먼저 SparkSession을 생성해야 한다.`   

```scala
import org.apache.spark.sql.SparkSession   

val spark = SparkSession
    .builder()
    .appName("myAppName")
    .master("master")
    .getOrCreate()

```

다음으로 DataFrame을 생성하는 2가지 방법에 대해 살펴보자.    

### 2-1) 리플렉션을 통한 데이터 프레임 생성    

앞에서 언급한 대로 데이터프레임은 데이터베이스의 테이블과 유사한 로우와 컬럼 구조를 띠고 있다. 따라서 
RDD를 비롯해 로우와 컬럼 형태로 만들 수 있는 컬렉션 객체만 있다면 이를 이용해 
새로운 데이터프레임을 만들 수 있다.     

```scala 
val data = List(row1, row2, row3)

val result: DataFrame = spark.createDataFrame(data) 

// 또는
// scala의 경우 암묵적 형변환이 가능하다.   
import spark.implicits._
val result: DataFrame = data.toDF()

result.show() // 행 과 레코드 확인   
result.limit(10).show() // 출력 갯수 10개 제한

result.show(truncate=false) // row 길이가 길어도 짤리지 않고 모두 표기   
```

`위처럼 특별한 스키마 정의를 주지 않아도 컬렉션에 포함된 오브젝트 속성값으로부터 
알아서 스키마 정보를 추출하고 데이터 프레임을 만드는 방법을 리플렉션을 
이용한 데이터프레임 생성방법이라고 한다.`     


### 2-2) 명시적 타입 지정을 통한 데이터프레임 생성      

리플렉션 방식을 통한 데이터프레임 생성 방법은 스키마 정보를 일일이 지정하지 않아도 된다는 점에서 사용하기에 편리 하다는 
장점이 있다. 하지만 이 경우 데이터프레임 생성을 위한 케이스 클래스 같은 것들을 따로 정의해야 하는 불편함이 있고 
상황에 따라서는 원하는 대로 직접 스키마 정보를 구성할 수 있는 방법이 더 편리할 수 있다.     

스파크 SQL은 이런 경우를 위해 개발자들이 직접 스키마를 지정할 수 있는 방법을 제공하는데 리플렉션 방식과 비교해보자.   

```scala
import org.apache.spark.sql.SparkSession

val spark = SparkSession.builder()
  .master("local[1]")
  .appName("SparkByExamples.com")
  .config("spark.driver.bindAddress", "127.0.0.1")
  .getOrCreate()

val sf1 = StructField("name", StringType, nullable = true)
val sf2 = StructField("age", IntegerType, nullable = true)
val sf3 = StructField("job", StringType, nullable = true)
val schema = StructType(List(sf1, sf2, sf3))

val r1 = Row("mike", 10, "student")
val r2 = Row("mark", 11, "teacher")
val r3 = Row("herry", 10, "teacher")
val rows = spark.sparkContext.parallelize(List(r1, r2, r3))
val df = spark.createDataFrame(rows, schema)
df.printSchema() // 스키마 확인
```

Output   

```
root
 |-- name: string (nullable = true)
 |-- age: integer (nullable = true)
 |-- job: string (nullable = true)
```   

### 2-3) Load data in DataFrame   

데이터 소스(Hive table, Parquet, Json 등)로 부터 데이터를 읽어와서 DataFrame으로 만드는 방법은 아래와 같다.   

```scala
val df = spark.read.json("/people.json")  

// parquet 파일을 직접 FROM 절을 통해 바로 읽어 올 수도 있다.   
val df = spark.sql("SELECT * FROM parquet `/users.parquet`")
```

읽어온 DataFrame을 이용하여 DataFrame 에서 제공하는 여러 api를 사용할 수 있다.   

```scala
// Write Programmatic Queries against DataFrame  
// $는 컬럼을 나타낸다.   
df.select($"name", $"age").filter($"age">21).groupBy("age").count()  

// Apply Functional Transformations to DataSet
df.map(row => row.getAs[Long]("age") + 10)
```

또한, 자바 또는 스칼라의 경우 위처럼 DataSet으로 함수형 api로 사용할 수도 있다.   

`읽어 온 DataFrame을 SQL 문을 통해 처리하고 싶을 때 아래처럼 temp view로 등록할 수 있다.`   

```scala
df.createOrReplaceTempView("people")

val sqlDf = spark.sql("SELECT * FROM people")  
```

- - - 

## 3. Spark SQL 기본 연산     

Spark SQL에서 사용할 수 있는 기본 연산들에 대해 살펴보자.   

### 2-1) dtypes, printSchema, explain   

아래 코드에서 avro 포맷의 형태 데이터를 load 했다.   
`이때까지는 DataFrame은 데이터를 읽어 오진 않은 상태이며, 
    스키마 정보를 읽어와서 실행 계획을 세워 둔다.`   

따라서, dtypes, printSchema 함수를 통해 스키마 정보를 확인할 수 있다.   

```scala
val df=spark.read
    .format("avro")
    .load("/users.avro")

df.dtypes

df.printSchema
```

실행 계획을 보려면 아래와 같이 실행하면 된다.   

```scala   
df.explain(true)
```

Output   


```
== Parsed Logical Plan ==   
// 

== Analyzed Logical Plan == 
//...

== Optimized Logical Plan ==   
//...

== Physical Plan ==
//
```

#### 2-2) cache(), persist()    

RDD에서 마찬가지로 작업 중인 데이터를 메모리에 저장한다.    
`스파크SQL의 기본값인 MEMORY_AND_DISK 타입을 사용한다.`   

스파크의 메모리 기반 캐시는 같은 작업을 반복해서 수행할 때 처리 속도를 
높일 수 있는 좋은 방법이다.   
하지만 캐시를 수행하기 위해서는 데이터 저장을 위한 충분한 메모리 
공간이 필요하고 오브젝트를 읽고 쓰기 위한 추가 연산도 필요하다.   
따라서 무조건 캐시만 하면 성능이 좋아진다는 보장이 없으며 데이터의 
특성에 따라 캐시를 사용하지 않는 것이 더 나은 경우도 
발생할 수 있다.     

스파크는 동일한 메모리를 일정한 비율로 나누어 일부는 데이터 처리를 
위한 작업 공간으로 사용하고 나머지는 캐시를 위한 공간으로 
사용하는데(이 값은 설정에 의해 조정할 수 있다.)     
    한번 정해진 크기가 작업이 끝날 때까지 고정돼 있는 것이 아니라 
    데이터를 처리하는 과정에서 용량이 부족하면 여유 있는 상대방 
    공간을 더 사용할 수 있다.    
하지만 데이터 처리 중 작업 공간과 저장 공간이 모두 부족한 경우가 되면 작업 공간을 
우선 할당하게 되어 메모리 기반의 캐시는 공간이 부족한 상황에 놓이게 된다.   
이때 파일 캐시를 허용해 부족한 캐시 공간을 보완한다고 하더라도 전체적인 
처리 성능은 기대했던 것에 한참 미치지 못할 가능성이 있다.   
물론 그렇다고해서 무조건 메모리를 크게 할당하면 GC 수행으로 인한 
또 다른 문제가 발생할 위험이 커지게 된다. 따라서 무조건 
캐시하고 보자는 생각보다는 처리하고자 하는 데이터의 특성과 용량, 
    사용 가능한 클러스터 자원을 신중히 고려해서 캐시 정책을 
    세우는 것이 중요하다.   

- - - 

## 4. 여러 연산을 통한 전처리 

파이썬의 판다스를 사용했을 때 info라는 메서드를 사용하면 
각 컬럼마다 null 갯수가 몇개인지 확인이 가능했다.   

하지만 spark에서는 지원하지 않는 함수이므로 아래와 같이 직접 
구현하여 작성 가능하다.   

```scala
import org.apache.spark.sql.functions.{col,when, count}
    def countCols(columns:Array[String]):Array[Column]={
      columns.map(c=>{
        count(when(col(c).isNull,c)).alias(c)
      })
    }
    df.select(countCols(df.columns):_*).show()
```

Output

```
+----+---+---+
|name|age|job|
+----+---+---+
|   0|  0|  0|
+----+---+---+
```


- - - 


`이러한 DataFrame은 RDD에 비해 풍부한 API와 옵티마이저를 기반으로 한 
높은 성능으로 복잡한 데이터 처리를 더욱 수월하게 수행할 수 있다는 
장점이 있었지만 처리해야하는 작업의 특성에 따라서는 직접 프로그래밍이 
가능한 RDD를 사용하는 것에 비해 복잡한 코드를 작성해야 하거나 컴파일 타임 
오류 체크 기능을 사용할 수 없다는 단점도 있었다.`    

이는 DataSet이 등장하면서 DataFrame이 제공하던 성능 최적화와 
같은 장점들을 유지하면서 RDD에서만 가능했던 컴파일 타임 
오류 체크 등의 기능을 사용할 수 있게 되었다.       

다음 장에서는 DataSet에 대해 알아보자.    





- - - 

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

