---
layout: post
title: "[Machine Learning] Spark ML 데이터 전처리"
subtitle: "Label Encoding(StringIndexer, IndexToString) / OneHotEncoderEstimator " 
comments: true
categories : ML
date: 2023-02-14
background: '/img/posts/mac.png'
---

이번글에서는 [사이킷런에서 제공하는 데이터 전처리](https://wonyong-jang.github.io/ml/2022/09/15/Machine-Learning-Sklearn-Pre-Processing.html)와 
비교하여 Spark ML에서 제공하는 데이터 전처리 방법에 대해서 살펴보자.   

- - -

## 1. 레이블 인코딩(Label Encoding)   

`사이킷런에서 제공하는 Label Encoding은 
Spark ML에서는 StringIndexer 클래스로 제공한다.`   

아래 예시로 실습해보자.   

```scala
import spark.implicits._
val data = List((0,"a"),(1,"b"),(2,"c"), (3,"a"),(4,"b"))
val df = spark.sparkContext.parallelize(data).toDF("id", "category")
df.show()
```

Output

```
+---+--------+
| id|category|
+---+--------+
|  0|       a|
|  1|       b|
|  2|       c|
|  3|       a|
|  4|       b|
+---+--------+
```


위의 category 컬럼 인코딩은 아래와 같이 할 수 있다.   

`StringIndexer는 fit() 수행시 dataframe을 입력받고, StringIndexerModel 객체를 
반환한다.`    

`StringIndexerModel에 transform()을 적용하면 outputCol로 지정된 컬럼명으로 
Label Encoding 적용한 dataframe이 반환된다.`      

```scala
import org.apache.spark.ml.feature.{StringIndexer, StringIndexerModel}

val stringIndexer = new StringIndexer()
  .setInputCol("category")
  .setOutputCol("categoryEncoded")

val model: StringIndexerModel = stringIndexer.fit(df)
val indexedDf = model.transform(df)

indexedDf.show()
```

Output   

```
+---+--------+---------------+
| id|category|categoryEncoded|
+---+--------+---------------+
|  0|       a|            0.0|
|  1|       b|            1.0|
|  2|       c|            2.0|
|  3|       a|            0.0|
|  4|       b|            1.0|
+---+--------+---------------+
```

`반대로, IndexToString으로 Label Encoding된 값을 원본 값으로 
원복할 수 있다.`   

```scala
val indexToString = new IndexToString()
  .setInputCol("categoryEncoded")
  .setOutputCol("categoryDecoded")

indexToString.transform(indexedDf).show()
```

Output

```
+---+--------+---------------+---------------+
| id|category|categoryEncoded|categoryDecoded|
+---+--------+---------------+---------------+
|  0|       a|            0.0|              a|
|  1|       b|            1.0|              b|
|  2|       c|            2.0|              c|
|  3|       a|            0.0|              a|
|  4|       b|            1.0|              b|
+---+--------+---------------+---------------+
```


- - - 

## 2. 원 핫 인코딩(OneHotEncoder)   

`사이킷런에서 제공하는 원 핫 인코딩은 
Spark ML에서는 OneHotEncoder 클래스로 제공한다.`    

OneHotEncoder는 숫자형의 값만 원 핫 인코딩 할 수 있으므로 문자형을 원 핫 
인코딩하려면 먼저 숫자형으로 Label Encoding 되어 있어야 한다.   

아래 예제로 먼저 살펴보자.   

```scala
import spark.implicits._
val data = List((0.0, 1.0),(1.0, 0.0),(2.0, 1.0), (0.0, 2.0), (0.0, 1.0), (2.0, 0.0))
val df = spark.sparkContext.parallelize(data).toDF("categoryIndex1", "categoryIndex2")
```   

`OneHotEncoderEstimator 클래스를 이용하여 
원 핫 인코딩을 할 수 있다.`        


```scala
val oneHotEncoderEstimator = new OneHotEncoderEstimator()
  .setDropLast(false) // 마지막 인자를 제외 여부 default: true
  .setInputCols(Array("categoryIndex1", "categoryIndex2"))
  .setOutputCols(Array("oneHotEncoded1", "oneHotEncoded2"))

val model: OneHotEncoderModel = oneHotEncoderEstimator.fit(df)
val encodedDf = model.transform(df)

encodedDf.show()
```

Output


```
+--------------+--------------+--------------+--------------+
|categoryIndex1|categoryIndex2|oneHotEncoded1|oneHotEncoded2|
+--------------+--------------+--------------+--------------+
|           0.0|           1.0| (3,[0],[1.0])| (3,[1],[1.0])|
|           1.0|           0.0| (3,[1],[1.0])| (3,[0],[1.0])|
|           2.0|           1.0| (3,[2],[1.0])| (3,[1],[1.0])|
|           0.0|           2.0| (3,[0],[1.0])| (3,[2],[1.0])|
|           0.0|           1.0| (3,[0],[1.0])| (3,[1],[1.0])|
|           2.0|           0.0| (3,[2],[1.0])| (3,[0],[1.0])|
+--------------+--------------+--------------+--------------+
```

위 결과값을 확인 해보면, `전체 인코딩된 값을 sparse 형태로 축약`하여 
보여준다.      

- - - 

## 3. pipeline을 이용한 인코딩   

문자열의 컬럼을 pipeline을 사용하여 
Label Encoding과 One hot Encoding  pipeline으로 
진행해보자.   

```
import spark.implicits._
val data = List((0, "a", "A"),(1, "b", "A"),(2, "c", "K"), (3, "a", "D"), (4, "a", "C"), (5, "c", "B"))
val df = spark.sparkContext.parallelize(data).toDF("id", "categoryIndex1", "categoryIndex2")
```

Output

```
+---+--------------+--------------+
| id|categoryIndex1|categoryIndex2|
+---+--------------+--------------+
|  0|             a|             A|
|  1|             b|             A|
|  2|             c|             K|
|  3|             a|             D|
|  4|             a|             C|
|  5|             c|             B|
+---+--------------+--------------+
```

```scala
val inputCols = Array("categoryIndex1", "categoryIndex2")
val stage1 = inputCols.map(colName => {
  new StringIndexer()
   .setInputCol(colName)
   .setOutputCol(colName + "Encoded")
})

val stage2 = new OneHotEncoderEstimator()
  .setDropLast(false) // 마지막 인자를 제외 여부 default: true
  .setInputCols(Array("categoryIndex1Encoded", "categoryIndex2Encoded"))
  .setOutputCols(Array("oneHotEncoded1", "oneHotEncoded2"))

val pipeline = new Pipeline()
  .setStages(stage1 ++ Array(stage2))

val model = pipeline.fit(df)
val encodedDf = model.transform(df)

encodedDf.show()
```

Output

```
+---+--------------+--------------+---------------------+---------------------+--------------+--------------+
| id|categoryIndex1|categoryIndex2|categoryIndex1Encoded|categoryIndex2Encoded|oneHotEncoded1|oneHotEncoded2|
+---+--------------+--------------+---------------------+---------------------+--------------+--------------+
|  0|             a|             A|                  0.0|                  0.0| (3,[0],[1.0])| (5,[0],[1.0])|
|  1|             b|             A|                  2.0|                  0.0| (3,[2],[1.0])| (5,[0],[1.0])|
|  2|             c|             K|                  1.0|                  3.0| (3,[1],[1.0])| (5,[3],[1.0])|
|  3|             a|             D|                  0.0|                  4.0| (3,[0],[1.0])| (5,[4],[1.0])|
|  4|             a|             C|                  0.0|                  2.0| (3,[0],[1.0])| (5,[2],[1.0])|
|  5|             c|             B|                  1.0|                  1.0| (3,[1],[1.0])| (5,[1],[1.0])|
+---+--------------+--------------+---------------------+---------------------+--------------+--------------+
```

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

