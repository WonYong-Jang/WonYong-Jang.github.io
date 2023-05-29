---
layout: post
title: "[Spark ML] Spark ML로 iris 붓꽃 데이터 예측 모델 만들기"
subtitle: "randomSplit, vectorAssembler, pipeline /  crossValidator, trainValidationSplit 교차검증 및 하이퍼 파라미터 튜닝" 
comments: true
categories : Spark
date: 2023-04-01
background: '/img/posts/mac.png'
---

## 1. Spark ML

스파크의 분산처리 능력을 머신러닝에 사용할 수 있다.   
`사이킷런과 같은 머신러닝 라이브러리들과 마찬가지로 학습을 위한 전처리, 모델링, 하이퍼 파라미터 튜닝 등  
    성능을 극대화하기 위한 도구들을 지원한다.`      

그럼 SparkML을 사용했을 때 장점이 무엇일까?   

SparkML은 대량의 데이터를 처리하는데 매우 적합하다. 데이터의 수는 갈수록 
늘어나고 있고 단일 머신에서 데이터를 처리하기에는 분명 한계가 있다.   

따라서, 스파크를 이용하여 전처리 및 모델링까지 작업의 속도를 높일 수 있다.  

> 스파크에는 ml 패키지와 mllib 패키지가 존재한다    
> mllib은 rdd기반이고 현재 아파치 스파크 내에서 
유지보수 모드(새로운 기능 추가 없이 버그만 수정)이기 때문에 dataframe 기반의 ml 패키지를 사용하자.   



- - - 


## 2. Spark ML로 구현하기    

spark ml 패키지를 사용하기 위해 아래 의존성을 추가한다.   

```gradle
implementation group: 'org.apache.spark', name: 'spark-mllib_2.11', version: '2.3.0'
```

아래 코드는 iris 붓꽃 데이터를 이용하여 모델링하고 예측한 결과 코드이다.   
iris 붓꽃 데이터를 dataframe으로 생성했고, 정답 데이터 컬럼을 target으로 
지정 했다.   

`dataframe에서 제공하는 createOrReplaceTempView 메소드를 이용하여 temp view를 생성할 수 있다.   
그러면 아래와 같이 sql 쿼리를 이용하여 데이터를 확인할 수 있다.`      

```
$ df.createOrReplaceTempView("df_view") // temp view 생성 하여 sql로 확인 가능

$ spark.sql("show tables").show()
+--------+---------+-----------+
|database|tableName|isTemporary|
+--------+---------+-----------+
|        |  df_view|       true|
+--------+---------+-----------+

$ spark.sql("select distinct target from df_view").show()  
+------+
|target|
+------+
|     1|
|     2|
|     0|
+------+
```

그 이후에 `randomSplit으로 학습데이터와 테스트 데이터를 분리 했고, 
    vectorAssembler 이용하여, feature들을 하나의 벡터로 묶어 주었다.`   

```
$ val assembler = new VectorAssembler().setInputCols(columns).setOutputCol("features")
$ val trainVectorDf = assembler.transform(trainDf)

+------------+-----------+------------+-----------+------+-----------------+
|sepal_length|sepal_width|petal_length|petal_width|target|         features|
+------------+-----------+------------+-----------+------+-----------------+
|         4.3|        3.0|         1.1|        0.1|     0|[4.3,3.0,1.1,0.1]|
|         4.5|        2.3|         1.3|        0.3|     0|[4.5,2.3,1.3,0.3]|
```

이를 이용하여 최종적으로 모델링 및 예측을 수행하였다.   


```scala
import org.apache.spark.sql.{Column, SparkSession}
import org.apache.spark.sql.functions.{col, count, when}
import org.apache.spark.ml.classification._
import org.apache.spark.ml.Pipeline
import org.apache.spark.ml.evaluation.MulticlassClassificationEvaluator
import org.apache.spark.ml.feature.{StringIndexer, VectorAssembler}
import org.apache.spark.sql.types.{DoubleType, IntegerType, LongType, StringType, StructField, StructType}

object ml {

  def main(args: Array[String]): Unit = {

    val spark = SparkSession.builder()
      .master("local[*]")
      .appName("SparkByExamples.com")
      .config("spark.driver.bindAddress", "127.0.0.1")
      .getOrCreate()

    val schema = StructType(Array(
      StructField("sepal_length", DoubleType, nullable = true),
      StructField("sepal_width", DoubleType, nullable = true),
      StructField("petal_length", DoubleType, nullable = true),
      StructField("petal_width", DoubleType, nullable = true),
      StructField("target", StringType, nullable = true)
    ))

    val df = spark.read
      .schema(schema)
      .csv("/Users/jang-won-yong/dev/ml/iris.data")
      .withColumn("target", when(col("target") === "Iris-setosa", "0")
        .when(col("target") === "Iris-virginica", "1")
        .otherwise("2")
      )
      .withColumn("target", col("target").cast(IntegerType))

    df.createOrReplaceTempView("df_view") // temp view 생성 하여 sql로 확인 가능
    spark.sql("select distinct target from df_view").show()

    df.show(truncate = false) // 데이터 확인

    df.printSchema() // 스키마 확인

    // randomSplit() 을 이용 하여 train 과 test 용 DataFrame 으로 분할
    val randomSplitArray = df.randomSplit(Array(0.8, 0.2), seed = 42)
    val trainDf = randomSplitArray(0) // 0.8
    val testDf = randomSplitArray(1)  // 0.2
    trainDf.cache()
    testDf.cache()

    // VectorAssembler 를 이용하여 모든 feature 컬럼들을 하나의 feature vector 로 변환
    val columns = Array("sepal_length", "sepal_width", "petal_length", "petal_width")
    val assembler = new VectorAssembler()
      .setInputCols(columns)
      .setOutputCol("features")

    val trainVectorDf = assembler.transform(trainDf)
    val testVectorDf = assembler.transform(testDf)

    // ML 알고리즘
    val dt = new DecisionTreeClassifier()
      .setFeaturesCol("features")
      .setLabelCol("target")
      .setMaxDepth(5)

    val model = dt.fit(trainVectorDf)

    // 학습된 모델의 transform 메소드를 이용 하여 예측 수행
    val predictions = model.transform(testVectorDf)


    val evaluator = new MulticlassClassificationEvaluator()
      .setLabelCol("target")
      .setPredictionCol("prediction")
      .setMetricName("accuracy")

    val accuracy = evaluator.evaluate(predictions)

    println("accuracy: " + accuracy)

    spark.close()
  }
}
```


- - -   

## 3. pipeline 이용하기    

`Spark에서 제공하는 pipeline 클래스를 활용하여 데이터 전처리 및 모델링, 하이퍼파라미터 튜닝 과정을 간소화 할 수 있다.`     
`각 단계를 stage로 정의하여 pipeline에 등록 한 뒤에 fit 메소드를 호출하여 연결된 stage 작업을 순차적으로 실행시킨다.`       
`fit() 메소드를 호출하면 pipelineModel이 반환되며, pipelienModel에서 예측을 위한 변환 및 예측 작업을 transform() 메소드로 수행한다.`       

```scala
val stage1 = new VectorAssembler()
  .setInputCols(columns)
  .setOutputCol("features")

// ML 알고리즘
val stage2 = new DecisionTreeClassifier()
  .setFeaturesCol("features")
  .setLabelCol("target")
  .setMaxDepth(5)

// Pipeline 은 여러개의 개별적인 Transformer 의 변환 작업, Estimator의 학습 작업을 일련의 Process로 연결을 통해
// 간단한 API 처리로 구현할 수 있게 만들어 줌
// Pipeline 은 개별 변환 및 학습 작업을 stage로 각각 정의하여 pipeline 에 등록한 뒤 pipeline fit() 메소드를 이용 호출하여
// 연결된 stage 작업을 수행
// 수행 결과로 PipelineModel 이 반환되며, 이 pipelineModel 에서 예측을 위한 변환 및 예측 작업을 transform() 메소드로 수행
val pipeline = new Pipeline()
  .setStages(Array(stage1, stage2)) // stage가 순차적으로 실행

val pipelineModel = pipeline.fit(trainDf)          
val predictions = pipelineModel.transform(testDf)  
```

- - - 

## 4. CrossValidator 교차검증 및 하이퍼 파라미터 튜닝    

Spark ML은 직접적으로 K Fold 기반으로 데이터를 선택하게 만드는 
[사이킷런의 KFold 클래스](https://wonyong-jang.github.io/ml/2022/09/12/Machine-Learning-Sklearn-Data-Set.html)나 
교차 검증 성능 결과만 반환해주는 
cross val scroe는 지원하지 않는다.      

하지만, Spark ML은 사이킷런의 GridSearchCV와 유사한 기능을 제공하는 
CrossValidator이 있다.    

`SparkML의 CrossValidator는 교차검증과 동시에 하이퍼 파라미터 튜닝 까지 진행해 준다.`       

> Spark ML CrossValidator는 Stratified K fold 방식이 아닌 K fold 방식을 사용한다.   

먼저 `ParamGridBuilder 클래스를 이용하여 하이퍼 파라미터 튜닝을 위한 
그리드 서치(Grid Search)용 Param Grid를 생성`한다.   

`CrossValidator 객체 생성시 Estimator 객체, 그리드 서치용 Param Grid, 성능 평가용 Evaluator 객체, Fold 수를 인자로 
입력한다.`       

이를 pipeline에 결합하여 작성해보면 아래와 같다.   

```scala
// CrossValidator 에서 하이퍼 파라미터 튜닝을 위한 Grid Search 용 ParamGrid 생성
val paramGridMap = new ParamGridBuilder()
  .addGrid(dt.maxDepth, Array(5, 6, 7, 8, 9, 10)) // DecisionTreeClassifier 의 maxDepth
  .addGrid(dt.minInstancesPerNode, Array(3, 6)) // min samples split(노드 분할 시 최소 sample 건수)
  .build()

val evaluator = new MulticlassClassificationEvaluator()
  .setLabelCol("target")
  .setPredictionCol("prediction")
  .setMetricName("accuracy")

val stage2 = new CrossValidator()
  .setEstimator(dt)
  .setEstimatorParamMaps(paramGridMap)
  .setEvaluator(evaluator)
  .setNumFolds(3)

val pipeline = new Pipeline()
  .setStages(Array(stage1, stage2))

val pipelineModel = pipeline.fit(trainDf)
val predictions = pipelineModel.transform(testDf)

val accuracy = evaluator.evaluate(predictions)

println("accuracy: " + accuracy)
```

최적의 결과는 model의 bestModel로 확인 가능하다.   

```scala
val cvModel = pipelineModel.stages(1).asInstanceOf[CrossValidatorModel]

printCVResult(cvModel)

def printCVResult(cvModel: CrossValidatorModel): Unit = {
    cvModel.getEstimatorParamMaps
      .zip(cvModel.avgMetrics)
      .sortBy(_._2)
      .foreach(println(_))}
```

- - - 

## 5. TrainValidationSplit 로 하이퍼 파라미터 튜닝    

`CrossValidator는 k fold 방식의 교차검증을 진행하는 반면, TrainValidationSplit은 
교차검증을 진행하지 않고 하이퍼 파라미터 튜닝만 진행한다.`   

사용방법은 CrossValidator에서 사용한 파라미터와 동일하며, 학습 및 검증 비율을 
파라미터로 넣어주면 된다.   

```scala
import org.apache.spark.ml.tuning.{CrossValidator, CrossValidatorModel, ParamGridBuilder, TrainValidationSplit}

val trainValidationSplit = new TrainValidationSplit()
      .setEstimator(dt)
      .setEstimatorParamMaps(paramGridMap)
      .setEvaluator(evaluator)
      .setTrainRatio(0.75) // 학습 0.75, 검증 0.25
      .setSeed(0)
```

`마지막으로 결과확인은 CrossValidator에서는 cvModel.avgMetrics로 확인 가능했으며, 
    TrainValidationSplit은 tvsModel.validationMetrics 로 확인 가능하다.`   


- - -
Referrence 

<https://www.nvidia.com/ko-kr/ai-data-science/spark-ebook/predictive-analytics-spark-machine-learning/>
<https://hub.packtpub.com/classifying-flowers-in-iris-dataset-using-scala-tutorial/>   
<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

