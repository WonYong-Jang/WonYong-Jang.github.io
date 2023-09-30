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

이러한 distributed computing program 은 local 또는 작은 데이터 셋으로 
테스트하기 어렵기 때문에 spark 를 단위 테스트 할 수 있는 
라이브러리를 이용하여 살펴볼 예정이다.   

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

`다음은 DataFrame 테스트 예시이며, assertDataFrameEquals 는 
spark-testing-base 에서 제공하는 메소드이다.`   

```scala

```

- - - 

## 4. Test for DataSet   



- - - 

**Reference**   

<https://medium.com/analytics-vidhya/spark-testing-base-scalatest-scalacheck-808009688245>   
<https://github.com/holdenk/spark-testing-base>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

