---
layout: post
title: "[Spark] 아파치 스파크(spark) DataFrame 구현하기"
subtitle: "DataFrame 주요 연산 / groupBy / UDF(User Define Function) / join "    
comments: true
categories : Spark
date: 2021-05-02
background: '/img/posts/mac.png'
---

이번 글에서는 Spark DataFrame에서 제공하는 여러 연산에 대해서 자세히 살펴보자.   

DataFrame에 대한 이론은 [링크](https://wonyong-jang.github.io/spark/2021/05/01/Spark-DataFrame.html)를 
참고하자.   

- - - 

## 1. Spark SQL 시작하기    

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

### 1-1) 리플렉션을 통한 데이터 프레임 생성    

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


### 1-2) 명시적 타입 지정을 통한 데이터프레임 생성      

리플렉션 방식을 통한 데이터프레임 생성 방법은 스키마 정보를 일일이 지정하지 않아도 된다는 점에서 사용하기에 편리 하다는 
장점이 있다.    
하지만 이 경우 데이터프레임 생성을 위한 케이스 클래스 같은 것들을 따로 정의해야 하는 불편함이 있고 
상황에 따라서는 원하는 대로 직접 스키마 정보를 구성할 수 있는 방법이 더 편리할 수 있다.     

스파크 SQL은 이런 경우를 위해 개발자들이 직접 스키마를 지정할 수 있는 방법을 제공하는데 리플렉션 방식과 비교해보자.   

> Row object는 아래에서 자세히 다룰 예정이다.   

```scala
import org.apache.spark.sql.SparkSession
import org.apache.spark.sql.Row

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
// org.apache.spark.rdd.RDD[org.apache.spark.sql.Row]

val df = spark.createDataFrame(rows, schema)
// org.apache.spark.sql.DataFrame   

df.printSchema() // 스키마 확인
```

Output   

```
root
 |-- name: string (nullable = true)
 |-- age: integer (nullable = true)
 |-- job: string (nullable = true)
```   

### 1-3) Load data in DataFrame   

데이터 소스(Hive table, Parquet, Json 등)로 부터 데이터를 읽어와서 DataFrame으로 만드는 방법은 아래와 같다.   

```scala
val df = spark.read.json("/people.json")  

// parquet 파일을 직접 FROM 절을 통해 바로 읽어 올 수도 있다.   
val df = spark.sql("SELECT * FROM parquet.`/users.parquet`")
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

// 또는   
val sqlDf = spark.sql(""" SELECT * FROM json.`/people.json` WHERE name LIKE "A%" """)   
```

- - - 

## 2. Spark SQL 기본 연산     

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

#### 2-2) join    

기본적으로 타입을 지정하지 않으면 inner join으로 실행되며, 
    그외에 모든 join 들도 제공 하고 있다.   

> inner, outer, left_outer, right_outer 등   

```scala
df.join(df2, "id").show // inner join


// 조인 조건에 해당하는 컬럼 하나 이상일 때 Array를 사용한다.
// ex) Array("age", "name")
df.join(df2, Array("age"), "left_outer").show // left_outer 조인 
```

컬럼명 다르지만 조인이 필요한 경우 아래와 같이 가능하다.   

```scala
df.join(df3, $"age" === $"age3").show
```


#### 2-3) cache(), persist()    

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

## 3. GroupBy - Now safe!   

RDD를 이용하여 groupBy를 사용할 때, 성능 및 메모리 이슈가 있을 수 있기 때문에 
가급적 reduceByKey 등을 사용할 것을 권장하고 있다.   

DataFrame을 사용할 때 groupBy는 안정적으로 동작하기 때문에 이러한 걱정을 할 필요가 없다.   

`groupBy를 사용했을 때 RelationalGroupedDataset 클래스를 리턴한다.`   

> RelationalGroupedDataset은 다양한 집계와 관련된 api 들을 제공한다.    

```scala
ticketDf.groupBy("ticketId").max("occurredAt")

// OR   
import org.apache.spark.sql.functions._
df.groupBy("age").agg(max("occurredAt"))
```
- - - 

## 4. UDF(User Define Function)   

DataFrame을 사용할 때 커스텀하게 함수를 생성하여 사용할 수도 있다.    
사용방법은 아래와 같다.   


```scala
spark.udf.register("myUDF", (arg1: Int, arg2: String) => arg2 + arg1)    
```


```scala
import org.apache.spark.sql.functions._

```


- - - 

## 5. DataFrame 과 RDD      

DataFrame은 기본적으로 RDD 위에서 구현되어 있다.   

`즉, DataFrame은 RDD의 각 element의 타입이 Row object로 구성되어 있다.`   

> Row objects는 컬럼들을 가지고 있으며, 해당 컬럼은 이름 및 타입 등을 가지고 있다.   

따라서, 모든 DataFrame은 기본적으로 RDD 위에서 구현되어 있기 때문에 RDD로 변경할 수 있다.   

```scala
val rdd: RDD[Row] = peopleDF.rdd
// org.apache.spark.rdd.RDD[org.apache.spark.sql.Row]    

peopleDF.rdd.collect
Array[org.apache.spark.sql.Row] = Array([null, Michael], [30, Andy], [19, Justin])
```

### 3-1) Row Objects   

Row object는 컬럼 정보들을 가지고 있으며, Array와 비슷하게 동작한다.    

Row object 사용방법은 아래와 같다.   

아래와 같이 인덱스를 이용하여 row(n)을 사용하면, 값을 가져 올 수 있으며 
이때 타입은 Any 이다.  
해당 타입을 명시적으로 지정하여 가져오려면 row.getString(n), row.getInt(n) 등을 
사용할 수 있다.   

`컬럼 이름을 알고 있을 때는 타입과 함께 row.getAs 함수를 사용할 수 있으며, 해당 함수를 
자주 사용하게 될 것이다.`   

```scala
import spark.implicits._

val ticketDf = List(
      Ticket(1L, "closed"),
      Ticket(2L, "closed"),
      Ticket(3L, "open")
    ).toDF()

ticketRdd.foreach(row => {
    println("row(n) returns element in the nth column: " + row(1))

    println("row.fieldIndex returns index of the age column: " + row.fieldIndex("status"))

    println("row.getAs get correctly typed values: " + row.getAs[String]("status"))
})

// row(n) returns element in the nth column
// row.fieldIndex("status") returns index of the age column
// row.getAs[String]("status") get correctly typed values

// Use type-specific get methods to return typed values   
// - row.getString(n) returns nth column as a string
// - row.getInt(n) returns nth column as an integer    
```

Output

```
row(n) returns element in the nth column: closed
row(n) returns element in the nth column: open
row.fieldIndex returns index of the age column: 1
row.fieldIndex returns index of the age column: 1
row.getAs get correctly typed values: open
row.getAs get correctly typed values: closed
row(n) returns element in the nth column: closed
row.fieldIndex returns index of the age column: 1
row.getAs get correctly typed values: closed
```

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

**Reference**    

<https://databricks.com/blog/2015/04/13/deep-dive-into-spark-sqls-catalyst-optimizer.html>   
<https://www.popit.kr/spark2-0-new-features1-dataset/>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

