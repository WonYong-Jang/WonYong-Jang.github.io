---
layout: post
title: "[Spark ML] LightGBM 알고리즘 Spark로 구현하기"
subtitle: "주요 하이퍼 파라미터 / 조기 중단 기능(Early Stopping)" 
comments: true
categories : Spark
date: 2023-04-08
background: '/img/posts/mac.png'
---

## 1. 의존성 추가   

LightGBM알고리즘을 사용하기 위해 의존성을 추가해 주어야 한다.   

```groovy
// https://mavenlibs.com/maven/dependency/com.microsoft.azure/synapseml_2.12
implementation group: 'com.microsoft.azure', name: 'synapseml_2.12', version: '0.11.0'
```

위와 같이 [microsoft](https://github.com/microsoft/SynapseML)에서 Spark에서 구동될 수 있는 LightGBM 모듈을 제공한다.      



- - -   

## 2. 주요 파라미터    

- numIterations: 약한 학습기의 개수(반복 수행 회수)   

- learningRate: 학습률이며 0에서 1 사이의 값을 지정하며 
부스팅 스텝을 반복적으로 수행할 때 업데이트 되는 학습률 값     

- maxDepth: 결정 트리의 최대 깊이   

- numLeaves: 최대 리프노드 갯수   

- earlyStoppingRound: 학습 조기 종료를 위한 early stopping interval 값   

- baggingFraction: 트리가 커져서 과적합되는 것을 제어하기 위해 데이터를 
샘플링하는 비율을 지정한다. (사이킷런에서는 sub_sample) 0.5로 지정하면 
전체 데이터의 절반을 트리를 생성하는데 사용한다.  

- featureFraction: 트리 생성에 필요한 피처(컬럼)을 임의로 샘플링 하는데 사용된다. 
매우 많은 피처가 있는 경우 과적합을 조정하는데 사용된다. 예를 들어 컬럼이 300개가 
있고, 0.7로 지정하여 각 트리 별 랜덤하게 210개의 피처만 사용하여 구성할 수 있다.   

- minDataInLeaf: 리프 노드가 될 수 있는 최소 데이터 건수(Sample 수)   

- lambdaL2: L2 규제(Regularization) 적용 값이며 기본값은 1이다. 값이 클 수록 규제 값이 커짐   
- lambdaL1: L1 규제(Regularization) 적용 값이며 기본값은 0이다. 값이 클 수록 규제 값이 커짐    


`LightGBM은 numLeaves와 maxDepth가 커지기 쉽지만 그럼에도 
정확도가 높은 트리 계열 알고리즘 중 하나이다.`   

`하지만 이들값이 너무 커지면 오버피팅으로 성능이 저하 될 확률이 높아지기 때문에 
이들 값을 적정하게 조정할 필요가 있다.`   

- - - 


## 3. 조기 중단 기능(Early Stopping)   

`XGBoost 또는 LightGBM은 특정 반복 횟수 만큼 더 이상 비용함수가 감소하지 
않으면 지정된 반복횟수를 다 완료하지 않고 수행을 종료할 수 있다.`   

> 반복 횟수를 거듭할 수록 성능 향상이 안되는 경우 학습 시간만 늘어나고 
과적합이 발생하기 때문에 조기 중단 기능을 사용하면 효율적일 수 있다.   

`이로 인해 학습을 위한 시간을 단축시킬 수 있으며 특히 최적화 튜닝 단계에서 
적절하게 사용이 가능하다.`    

`단, 너무 반복 횟수를 단축할 경우 예측 성능 최적화가 안된 상태에서 
학습이 종료될 수 있으므로 유의할 필요가 있다.`   

조기 중단 설정을 위한 주요 파라미터는 아래와 같다.   

- earlyStoppingRounds: 더 이상 비용 평가 지표가 감소하지 않는 최대 반복횟수   
- metric: 반복 수행시 사용하는 비용 평가 지표  
- validationIndicatorCol: 평가를 수행하는 별도의 검증 데이터 세트 여부를 
학습 DataFrame에서 컬럼으로 가짐.     


`마지막으로 early stopping을 사용 시 검증 데이터 세트는 너무 크게 잡지 않도록 주의해야 한다.`       
분산 서버에서 검증을 하기 위해서는 검증 데이터를 개별 분산 서버에서 
모두 가지고 있기 때문에 메모리 부족이 발생할 수 있다.   

- - - 

## 4. LightGBM 구현   

Spark에서 LightGBM은 아래와 같이 구현할 수 있다.   

```scala
import com.microsoft.azure.synapse.ml.lightgbm.LightGBMClassifier

val classifier = new LightGBMClassifier()
      .setFeaturesCol("features")
      .setLabelCol("label")
      .setNumLeaves(100)
      .setMaxDepth(10)
      .setNumIterations(100)

val classifier = new LightGBMClassifier()
      .setFeaturesCol("features")
      .setLabelCol("label")
      .setNumLeaves(100)
      .setMaxDepth(10)
      .setNumIterations(100)

val model = classifier.fit(trainDf)
val prediction = model.transform(testDf)
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

