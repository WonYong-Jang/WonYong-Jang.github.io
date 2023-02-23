---
layout: post
title: "[Machine Learning] Spark ML 결정 트리"
subtitle: "DecisionTreeClassifier, RandomForestClassifier, GBTClassifier" 
comments: true
categories : ML
date: 2023-02-21
background: '/img/posts/mac.png'
---

이번 글에서는 [결정트리](https://wonyong-jang.github.io/ml/2022/09/24/Machine-Learning-Classification-Decision-Tree.html) 알고리즘을 
Spark ML로 어떻게 구현할 수 있는지 살펴볼 예정이다.   

- - - 

## 1. Iris 데이터로 DecisionTreeClassifier 실습  

Iris 데이터 세트를 이용하여 DecisionTreeClassifier를 실습해보자.   
먼저, 데이터를 로드하고 스키마 확인 및 `describe() 함수를 이용하여 
컬럼 정보를 확인`해보자.   

> 컬럼이 숫자형인 경우 count, mean, stddev, min, max 정보를 확인할 수 있다.   

```scala    
val df = spark.read.schema(schema).csv("/Users/jang-won-yong/dev/ml/iris.data")   

df.describe().show()
```

Output

```
+-------+------------------+-------------------+------------------+------------------+------------------+
|summary|      sepal_length|        sepal_width|      petal_length|       petal_width|            target|
+-------+------------------+-------------------+------------------+------------------+------------------+
|  count|               150|                150|               150|               150|               150|
|   mean| 5.843333333333335| 3.0540000000000007|3.7586666666666693|1.1986666666666672|               1.0|
| stddev|0.8280661279778637|0.43359431136217375| 1.764420419952262|0.7631607417008414|0.8192319205190406|
|    min|               4.3|                2.0|               1.0|               0.1|                 0|
|    max|               7.9|                4.4|               6.9|               2.5|                 2|
+-------+------------------+-------------------+------------------+------------------+------------------+
```

또한 컬럼 별 null 값이 있는지 확인하는 함수를 작성하여 확인하였다.   

```scala
def countIsNullCols(columns:Array[String]):Array[Column]={
      columns.map(c=>{
        count(when(col(c).isNull,c)).alias(c)
  })
}

df.select(countIsNullCols(df.columns):_*).show()
```

Output

```
+------------+-----------+------------+-----------+------+
|sepal_length|sepal_width|petal_length|petal_width|target|
+------------+-----------+------------+-----------+------+
|           0|          0|           0|          0|     0|
+------------+-----------+------------+-----------+------+
```

이제 decision tree를 사용해보자.   

```scala
// VectorAssembler 를 이용하여 모든 feature 컬럼들을 하나의 feature vector 로 변환
val columns = Array("sepal_length", "sepal_width", "petal_length", "petal_width")
val vectorAssembler = new VectorAssembler()
    .setInputCols(columns)
    .setOutputCol("features")

val vectoredDf = vectorAssembler.transform(df)

// randomSplit() 을 이용 하여 train 과 test 용 DataFrame 으로 분할
val randomSplitArray = vectoredDf.randomSplit(Array(0.8, 0.2), seed = 42)
val trainDf = randomSplitArray(0) // 0.8
val testDf = randomSplitArray(1)  // 0.2
trainDf.cache()
testDf.cache()

// DecisionTreeClassifier 알고리즘
val dt: DecisionTreeClassifier = new DecisionTreeClassifier()
    .setFeaturesCol("features")
    .setLabelCol("target")
    .setMaxDepth(5)              // Decision Tree의 최대 깊이 
    .setMinInstancesPerNode(4)   // 분할 후에 자식 노드가 가지는 최소 sample 개수. 이 값보다 작아야 더 이상 분할하지 않음.   
                                 // 사이킷런의 min_samples_split과 유사 

val model: DecisionTreeClassificationModel = dt.fit(testDf)
val predictions: DataFrame = model.transform(testDf)

predictions.show()
```

Output

```
+------------+-----------+------------+-----------+------+-----------------+-------------+-------------+----------+
|sepal_length|sepal_width|petal_length|petal_width|target|         features|rawPrediction|  probability|prediction|
+------------+-----------+------------+-----------+------+-----------------+-------------+-------------+----------+
|         4.4|        2.9|         1.4|        0.2|     0|[4.4,2.9,1.4,0.2]|[7.0,0.0,0.0]|[1.0,0.0,0.0]|       0.0|
|         4.4|        3.0|         1.3|        0.2|     0|[4.4,3.0,1.3,0.2]|[7.0,0.0,0.0]|[1.0,0.0,0.0]|       0.0|
// ...
```

위의 `DecisionTreeClassifier에서 extractParamMap()함수를 이용하여 파라미터`들을 살펴보자.   

```
println(dt.extractParamMap())

{
	dtc_c611b925fa27-cacheNodeIds: false,
	dtc_c611b925fa27-checkpointInterval: 10,
	dtc_c611b925fa27-featuresCol: features,
	dtc_c611b925fa27-impurity: gini,
	dtc_c611b925fa27-labelCol: target,
	dtc_c611b925fa27-maxBins: 32,
	dtc_c611b925fa27-maxDepth: 5,
	dtc_c611b925fa27-maxMemoryInMB: 256,
	dtc_c611b925fa27-minInfoGain: 0.0,
	dtc_c611b925fa27-minInstancesPerNode: 4,
	dtc_c611b925fa27-predictionCol: prediction,
	dtc_c611b925fa27-probabilityCol: probability,
	dtc_c611b925fa27-rawPredictionCol: rawPrediction,
	dtc_c611b925fa27-seed: 159147643
}
```   

또한 DecisionTreeClassificationModel 모델에서 다양한 정보들을 아래와 같이 확인할 수 있다.   

```scala
println("numFeatures: " + model.numFeatures) // 4 
println("numClasses: " + model.numClasses)   // 3
println("getLabelCol: " + model.getLabelCol) // target
println("numNodes: " + model.numNodes)       // 5
println("depth: " + model.depth)             // 2
println("결정트리 피처 중요도: " + model.featureImportances) // (4,[2],[1.0])
                                                             // sparse 형태이며, 전체 갯수는 4개가 있다는 뜻이며 0값은 모두 제거 하여 표현 
```

위의 결정 트리 피처 중요도는 sparse 형태로 표현하기 때문에 
이를 조금 더 알아보기 쉽게 바꿔보자.   

```scala
import org.apache.spark.ml.linalg.DenseVector

val columns: Array[String] = Array("sepal_length", "sepal_width", "petal_length", "petal_width")


def printFeatureImportance(importances: Array[Double], colums: Array[String]): Unit = {
    val denseVector = new DenseVector(importances) // sparse 방식에서 보기 좋게 dense 방식으로 변경   
                                                   // (0.0 0.0 1.0 0.0)
    colums.zip(denseVector.values)
        .foreach(println(_))
}

printFeatureImportance(model.featureImportances.toArray, columns)
```

Output  

```
(sepal_length,0.0)
(sepal_width,0.0)
(petal_length,1.0)
(petal_width,0.0)
```

- - - 

## 2. Random Forest로 학습 및 예측   

위의 데이터를 이용하여 Random Forest로 학습 및 예측을 진행해보자.   

```scala
import org.apache.spark.ml.classification._

val dt: RandomForestClassifier = new RandomForestClassifier()
    .setFeaturesCol("features")
    .setLabelCol("target")
    .setMaxDepth(5)
    .setNumTrees(100)
val model = dt.fit(testDf)
val predictions: DataFrame = model.transform(testDf)

println(dt.extractParamMap())
printFeatureImportance(model.featureImportances.toArray, columns)
```

Output

```
//...
(sepal_length,0.19112103034161304)
(sepal_width,0.010589687869610136)
(petal_length,0.4156274268530861)
(petal_width,0.3826618549356906)
```



- - -    

Referrence 

<https://spark.apache.org/docs/latest/api/python/reference/api/pyspark.ml.classification.DecisionTreeClassifier.html>   
<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

