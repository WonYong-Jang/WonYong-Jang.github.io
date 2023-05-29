---
layout: post
title: "[Spark ML] Spark ML 데이터 전처리"
subtitle: "Label Encoding(StringIndexer, IndexToString) / OneHotEncoderEstimator / Scaling(StandardScaler, MinMaxScaler)" 
comments: true
categories : Spark
date: 2023-04-02
background: '/img/posts/mac.png'
---

이번글에서는 [사이킷런에서 제공하는 데이터 전처리](https://wonyong-jang.github.io/ml/2022/09/15/Machine-Learning-Sklearn-Pre-Processing.html)와 
비교하여 Spark ML에서 제공하는 데이터 전처리 방법에 대해서 살펴보자.   

- - -

## 1. 레이블 인코딩(Label Encoding)   

`사이킷런에서 제공하는 Label Encoding은 
Spark ML에서는 StringIndexer 클래스로 제공한다.`   

StringIndexer는 string 컬럼을 index 컬럼으로 인코딩을 진행한다.    
인코딩에 대한 자세한 내용은 [공식문서](https://spark.apache.org/docs/latest/ml-features.html#stringindexer)를 
살펴보자.   

이제 아래 예시로 실습해보자.   

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
Spark ML에서는 OneHotEncoderEstimator 클래스로 제공한다.`    

`OneHotEncoder는 숫자형의 값만 원 핫 인코딩 할 수 있으므로 문자형을 원 핫 
인코딩하려면 먼저 숫자형으로 Label Encoding 되어 있어야 한다.`       

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


`추가적으로 StringIndexer를 사용할 때, Unseen label에 주의해야 하며 이를 해결하기 위한 옵션을 제공한다.`   

> Unseen label is a generic message which doesn't correcspond to a specific column.

더 자세한 내용은 [링크](https://stackoverflow.com/questions/35224675/spark-ml-stringindexer-throws-unseen-label-on-fit)를 참고하자.   

특히 아래와 같이 pipeline을 이용할 때 에러가 발생할 수 있다.   

```scala
val stage1 = columns.map(colName => {
    new StringIndexer()
    .setInputCol(colName)
    .setOutputCol(colName + "LabelEncoded")
})

val stage2 = new OneHotEncoderEstimator()
    .setDropLast(false) // 마지막 인자를 제외 여부 default: true
    .setInputCols(labelEncodedColumns)
    .setOutputCols(oneHotEncodedColumns)

val stage3 = new VectorAssembler()
    .setInputCols(oneHotEncodedColumns)
    .setOutputCol("features")


val stage4 = new RandomForestClassifier()
    .setFeaturesCol("features")
    .setLabelCol("Survived")
    .setNumTrees(10)

val pipeline = new Pipeline().setStages(stage1 ++ Array(stage2, stage3, stage4)) 
val model = pipeline.fit(trainDf)
val predictions = model.transform(testDf)
```

위처럼 파이프라인을 만들어 놓고 실행할 때 아래와 같은 에러가 발생할 수 있다.  

```
Caused by: org.apache.spark.SparkException: Unseen label: foobar.  To handle unseen labels, set Param handleInvalid to keep.
```

위 상황을 이해하기 쉽게 재현을 해보자.   

```scala
val train = List((1,"foo"),(2,"bar"))
val test = List((3,"foo"),(4,"foobar"))

val trainDf = spark.sparkContext.parallelize(train).toDF("k", "v")
val testDf = spark.sparkContext.parallelize(test).toDF("k", "v")

val indexer = new StringIndexer()
    .setInputCol("v")
    .setOutputCol("vi")

indexer.fit(trainDf).transform(testDf).show()
```

위 예시를 실행해보면, 동일하게 에러가 재현이 된다.  
`StringIndexer를 통해 trainDf 데이터를 인덱싱하기 위한 모델을 만들었고, 
    이를 이용하여 testDf 데이터에 transform를 통해 적용을 시도했다.`     

`하지만 trainDf에 없는 데이터 foobar가 testDf에 존재하기 때문에 unseen label 에러를 발생시킨다.`   

`StringIndexer는 default로 unseen label에 대해서 exception을 발생시키며, 이를 skip 할 수도 있고 
keep 옵션을 통해 추가 시킬수도 있다.`   

```scala
indexer.setHandleInvalid("skip").fit(train).transform(test).show()

## +---+---+---+
## |  k|  v| vi|
## +---+---+---+
## |  3|foo|1.0|
## +---+---+---+
```

```scala
indexer.setHandleInvalid("keep").fit(train).transform(test).show()

## +---+------+---+
## |  k|     v| vi|
## +---+------+---+
## |  3|   foo|0.0|
## |  4|foobar|2.0|
## +---+------+---+
```

각 옵션을 추가해주면, 위와 같은 결과를 확인할 수 있다.   

또는 `파이프라인을 분리 하여 아래와 같이 해결할 수도 있다.`     
인코딩 하는 파이프라인에는 train, test 데이터가 나뉜게 아닌 전체 데이터에 
인코딩을 진행시킨다.  
그 이후 학습 및 검증 하는 파이프라인은 따로 추가하여 진행하였다.   

```scala
val stage1 = columns.map(colName => {
    new StringIndexer()
    .setInputCol(colName)
    .setOutputCol(colName + "LabelEncoded")
})

val stage2 = new OneHotEncoderEstimator()
    .setDropLast(false) // 마지막 인자를 제외 여부 default: true
    .setInputCols(labelEncodedColumns)
    .setOutputCols(oneHotEncodedColumns)

val stage3 = new VectorAssembler()
    .setInputCols(oneHotEncodedColumns)
    .setOutputCol("features")


val stage4 = new RandomForestClassifier()
    .setFeaturesCol("features")
    .setLabelCol("Survived")
    .setNumTrees(10)

// 인코딩 파이프라인
val encodingPipeline = new Pipeline().setStages(stage1 ++ Array(stage2))

// 학습 및 검증 파이프라인
val classifierPipeline = new Pipeline().setStages(Array(stage3, stage4)) 

val encodingModel = encodingPipeline.fit(inputDf) // 전체 데이터를 인코딩  
val encodedDf = encodingModel.transform(inputDf)

// randomSplit() 을 이용 하여 train 과 test 용 DataFrame 으로 분할
val randomSplitArray = encodedDf.randomSplit(Array(0.8, 0.2), seed = 41)
val trainDf = randomSplitArray(0).cache()
val testDf = randomSplitArray(1).cache()

val model = classifierPipeline.fit(trainDf) // train data
val predictions = model.transform(testDf)   // test data
```

- - - 

## 4. StandardScaler, MinMaxScaler     

[사이킷런의 데이터 스케일링](https://wonyong-jang.github.io/ml/2022/09/15/Machine-Learning-Sklearn-Pre-Processing.html) 에서 
제공하는 Standard 스케일링과 MinMax 스케일링 또한, Spark ML에서 제공한다.   

`Spark ML에서 사용할 때 주의할 점은 Scaling 사용시 일반 컬럼형(숫자형)이 아니라 vector형에만 적용이 가능하다는 점이다.`   
`즉, Scaling 적용할 때 반드시 VectorAssembler로 변환 후 적용 해야 한다.`   

먼저, Standard 스케일러를 하나의 컬럼에 대해서만 적용하는 코드는 아래와 같다.     

```scala  
import org.apache.spark.ml.feature.{MinMaxScaler, StandardScaler, VectorAssembler}

val columns = Array("sepal_length")
val vectorAssembler = new VectorAssembler()
  .setInputCols(columns)
  .setOutputCol("sepal_length_vector")

val vectoredDf = vectorAssembler.transform(df)

val standardScaler = new StandardScaler()
  .setInputCol("sepal_length_vector")
  .setOutputCol("standard_scaling_vector_01")

val model: StandardScalerModel = standardScaler.fit(vectoredDf)
model.transform(vectoredDf).show()
```

Output

```
+------------+-----------+------------+-----------+------+-------------------+--------------------------+
|sepal_length|sepal_width|petal_length|petal_width|target|sepal_length_vector|standard_scaling_vector_01|
+------------+-----------+------------+-----------+------+-------------------+--------------------------+
|         5.1|        3.5|         1.4|        0.2|     0|              [5.1]|      [-0.8976738791967...|
|         4.9|        3.0|         1.4|        0.2|     0|              [4.9]|      [-1.1392004834649...|
|         4.7|        3.2|         1.3|        0.2|     0|              [4.7]|      [-1.3807270877331...|
|         4.6|        3.1|         1.5|        0.2|     0|              [4.6]|      [-1.5014903898672...|
|         5.0|        3.6|         1.4|        0.2|     0|              [5.0]|      [-1.0184371813308...|
|         5.4|        3.9|         1.7|        0.4|     0|              [5.4]|      [-0.5353839727944...|
|         4.6|        3.4|         1.4|        0.3|     0|              [4.6]|      [-1.5014903898672...|
|         5.0|        3.4|         1.5|        0.2|     0|              [5.0]|      [-1.0184371813308...|
|         4.4|        2.9|         1.4|        0.2|     0|              [4.4]|      [-1.7430169941354...|
|         4.9|        3.1|         1.5|        0.1|     0|              [4.9]|      [-1.1392004834649...|
|         5.4|        3.7|         1.5|        0.2|     0|              [5.4]|      [-0.5353839727944...|
|         4.8|        3.4|         1.6|        0.2|     0|              [4.8]|      [-1.2599637855990...|
|         4.8|        3.0|         1.4|        0.1|     0|              [4.8]|      [-1.2599637855990...|
|         4.3|        3.0|         1.1|        0.1|     0|              [4.3]|      [-1.8637802962695...|
|         5.8|        4.0|         1.2|        0.2|     0|              [5.8]|      [-0.0523307642581...|
|         5.7|        4.4|         1.5|        0.4|     0|              [5.7]|      [-0.1730940663922...|
|         5.4|        3.9|         1.3|        0.4|     0|              [5.4]|      [-0.5353839727944...|
|         5.1|        3.5|         1.4|        0.3|     0|              [5.1]|      [-0.8976738791967...|
|         5.7|        3.8|         1.7|        0.3|     0|              [5.7]|      [-0.1730940663922...|
|         5.1|        3.8|         1.5|        0.3|     0|              [5.1]|      [-0.8976738791967...|
+------------+-----------+------------+-----------+------+-------------------+--------------------------+
```

다음으로 전체 컬럼에 대해서 Standard 스케일링을 적용해보자.   

```scala
val columns = Array("sepal_length", "sepal_width", "petal_length", "petal_width")
val vectorAssembler = new VectorAssembler()
  .setInputCols(columns)
  .setOutputCol("features")

val vectoredDf = vectorAssembler.transform(df)

val standardScaler = new StandardScaler()
  .setInputCol("features")
  .setOutputCol("standard_scaling_features")
  .setWithMean(true) // 평균 0 로 잡아줌
  .setWithStd(true)  // 표준편차 1 로 잡아줌

val model: StandardScalerModel = standardScaler.fit(vectoredDf)
model.transform(vectoredDf).show(truncate = false)
```

마지막으로 당연히 pipeline으로 간단하게 사용할 수 있다.   

```scala
val pipeline = new Pipeline()
  .setStages(Array(vectorAssembler, standardScaler))

pipeline.fit(df).transform(df).show()
```

MinMax 스케일링은 사용하는 방법은 동일하며, 아래와 같이 사용가능하다.   

```scala
import org.apache.spark.ml.feature.{MinMaxScaler, VectorAssembler}

val minMaxScaler = new MinMaxScaler()
  .setInputCol("features")
  .setOutputCol("minMax_scaling_features")
```

- - -    

Referrence 


<https://stackoverflow.com/questions/35224675/spark-ml-stringindexer-throws-unseen-label-on-fit>   
<https://spark.apache.org/docs/latest/ml-features.html#stringindexer>   
<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

