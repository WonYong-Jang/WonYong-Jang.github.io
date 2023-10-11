---
layout: post
title: "[Spark] 테스트 코드 작성하기"   
subtitle: "scalatest, spark-testing-base 라이브러리를 이용한 단위 테스트(rdd, dataFrame, dataSet)"    
comments: true
categories : Spark
date: 2023-09-29
background: '/img/posts/mac.png'
---

Apache Spark는 분석 및 빅데이터 처리를 위한 
Large scale distributed computing framework 이다.  

> distributed computing program 은 local 또는 작은 데이터 셋으로 
테스트하기 어렵다.   

Spark의 전형적인 흐름은 아래와 같다.   

1. Initialize SparkContext of StreamingContext.   
2. Create RDD or DStream for given source (e.g., Kafka, Kinesis)   
3. Evaluate transformations on RDD or DStream API.   
4. Put transformation outcomes(e.g., aggregations) into an external database.    

`위의 흐름에서 가장 테스트가 필요한 부분은 transformation logic 이며, 
    해당 로직은 반드시 class 또는 object로 분리되어 있어야 테스트하기 좋은 
    구조가 된다.`         

transformation logic을 분리한 
[WordCount 예시](https://github.com/mkuthan/example-spark/blob/master/src/main/scala/example/WordCount.scala) 를 
참고해보자.   

`또한, SparkContext 또는 StreamingContext를 쉽게 초기화 할 수 있어야 하며, 
    gracefully하게 context를 종료할 수 있어야 한다.`   

따라서 이번글에서는 이러한 부분을 [spark-testing-base](https://github.com/holdenk/spark-testing-base) 라이브러리를 
사용하여 테스트를 쉽게 할 수 있는 방법을 살펴볼 예정이다.   

> 언어는 scala를 사용할 것이다.     

- - - 

## 1. spark-testing-base 라이브러리    

[scalatest](https://wonyong-jang.github.io/scala/2023/09/25/Scala-Test-Code.html) 와 spark-testing-base 라이브러리를 
사용하여 단위 테스트를 진행할 예정이며, scalatest는 링크를 살펴보자.   

`spark 코드를 단위 테스트 할 때는 테스트하는 데이터의 실제 사이즈를 최소화해야 한다.`   
`즉, 성능이 아닌 기능을 검증하는 것이다.`   

아래와 같이 [spark-testing-base](https://github.com/holdenk/spark-testing-base) 의존성을 spark 버전에 맞춰서 
추가한다.   

```gradle
// https://mvnrepository.com/artifact/com.holdenkarau/spark-testing-base
testImplementation group: 'com.holdenkarau', name: 'spark-testing-base_2.11', version: '2.4.5_0.14.0', {
    exclude group: 'org.scalatest'
}
```

해당 라이브러리는 기본적으로 아래와 같이 편리한 클래스를 제공한다.   

- SharedSparkContext: Provides a SparkContext for each test case   

- RDDComparisons: Base class to provide functions to compare the RDD      

- RDDGenerator: Generator for RDD object   

- DataFrameGenerator: Generator for DataFrame object   

- DataSetGenerator: Generator for DataSet object   

- - - 

## 2. Test for RDDs   

아래는 RDD 테스트 예시이다.   

```scala
import com.holdenkarau.spark.testing.SharedSparkContext
import org.scalatest.FunSpec

class MainTest extends FunSpec with SharedSparkContext {

  describe("RDD test") {
    it("should correctly transform the RDD") {
      val rdd = sc.parallelize(Seq(1, 2, 3, 4))
      val transformed = rdd.map(_ * 2)
      val expected = Array(2, 4, 6, 8)

      assert(expected === transformed.collect())
    }
  }
}
```

- - -   

## 3. Test for DataFrame   

`다음은 DataFrame 테스트 예시이며, DataFrameSuiteBase trait 추가 후 
    assertDataFrameEquals 는 
spark-testing-base 에서 제공하는 메소드이다.`   

```scala
import com.holdenkarau.spark.testing.DataFrameSuiteBase
import org.apache.spark.sql.functions.col
import org.scalatest.FunSpec

class MainTest extends FunSpec with DataFrameSuiteBase {
  
  describe("DataFrame test") {
    it("DataFrame test for addIsEvenColumn") {

      import spark.implicits._

      val data = Seq((1, "A"), (2, "B"), (3, "C"))
      val df = data.toDF("id", "value")

      val transformed = df.withColumn("id_times_two", col("id") * 2)
      val expected = Seq(
        (1, "A", 2), (2, "B", 4), (3, "C", 6)
      ).toDF("id", "value", "id_times_two")

      assertDataFrameEquals(transformed, expected)  // spark-testing-base provides this method
    }
  }
}
```

- - - 

## 4. Test for DataSet   

`다음은 DataSet 테스트 예시이며, DatasetSuiteBase trait 추가 후 
    assertDatasetEquals 를 통해 결과값을 
검증할 수 있다.`       

```scala
import com.holdenkarau.spark.testing.DatasetSuiteBase
import org.apache.spark.sql.Dataset
import org.scalatest.FunSpec

case class Person(name: String, age: Int)

class MainTest extends FunSpec with DatasetSuiteBase {
  def filterAdults(ds: Dataset[Person]): Dataset[Person] = {
    ds.filter(_.age >= 18)
  }

  describe("DataSet test") {
    it("DataSet test for filterAdults") {
      import spark.implicits._

      val data = Seq(Person("Alice", 17), Person("Bob", 20), Person("Charlie", 15), Person("David", 22)).toDS()
      val transformed = filterAdults(data)
      val expected = Seq(Person("Bob", 20), Person("David", 22)).toDS()

      assertDatasetEquals(transformed, expected)  // spark-testing-base provides this method
    }
  }
}

```


- - - 

**Reference**   

<https://medium.com/analytics-vidhya/spark-testing-base-scalatest-scalacheck-808009688245>   
<https://github.com/holdenk/spark-testing-base>   
<https://mkuthan.github.io/blog/2015/03/01/spark-unit-testing/>   
<https://github.com/mkuthan/example-spark>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

