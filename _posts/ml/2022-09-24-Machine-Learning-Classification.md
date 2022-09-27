---
layout: post
title: "[Machine Learning] 분류 알고리즘(Classification)"
subtitle: "결정트리(Decision Tree), 앙상블(Ensemble)" 
comments: true
categories : ML
date: 2022-09-24
background: '/img/posts/mac.png'
---

## 1. 분류 알고리즘   

`분류(Classification)은 학습 데이터로 주어진 데이터의 피처와 레이블값(결정 값, 클래스 값)을 
머신러닝 알고리즘으로 학습해 모델을 생성하고, 이렇게 생성된 모델에 
새로운 데이터 값이 주어졌을 때 미지의 레이블 값을 예측하는 것이다.`   

대표적인 분류 알고리즘은 아래와 같다.   

- 베이즈(Bayes) 통계와 생성 모델에 기반한 나이즈 베이즈(Naive Bayes)   
- 독립변수와 종속변수의 선형 관계성에 기반한 로지스틱 회귀(Logistic Regression)   
- 데이터 균일도에 따른 규칙 기반의 결정 트리(Decision Tree)   
- 개별 클래스 간의 최대 분류 마진을 효과적으로 찾아주는 서포트 벡터 머신(Support Vector Machine)    
- 근접 거리를 기준으로 하는 최소 근접(Nearest Neighbor) 알고리즘   
- 심층 연결 기반의 신경망(Neural Network)   
- 서로 다른(또는 같은) 머신러닝 알고리즘을 결합한 앙상블(Ensemble)    

이 글에서는 결정 트리와 앙상블에 대해서 자세히 살펴볼 예정이다.   

- - - 

## 2. 결정 트리와 앙상블   

결정 트리는 매우 쉽고 유연하게 적용될 수 있는 알고리즘이다. 또한 
`데이터의 스케일링이나 정규화 등의 사전 가공의 영향이 매우 적다.`   
하지만, 예측 성능을 향상시키기 위해 복잡한 규칙 구조를 가져야 하며, 
    이로 인한 [과적합(overfitting)](https://wonyong-jang.github.io/ml/2022/09/04/Machine-Learning-Overfitting.html)이 발생해 
    반대로 예측 성능이 저하될 수도 있다는 단점이 있다.     

하지만, 이러한 단점이 앙상블 기법에서는 오히려 장점으로 작용한다.   
`앙상블은 매우 많은 여러개의 약한 학습기(weak learner 즉, 예측 성능이 
        상대적으로 떨어지는 학습 알고리즘)를 결합해 확률적 보안과 
오류가 발생한 부분에 대한 가중치를 계속 업데이트하면서 예측 성능을 
향상시키는데, 결정 트리가 좋은 약한 학습기가 되기 때문이다.`   

#### 2-1) 결정 트리   

결정트리는 아래와 같이 루트 노드에서 부터 규칙을 가지고 분할을 해서 
더 이상 분할이 안될 때 까지 분할해 나간다.   

<img width="852" alt="스크린샷 2022-09-24 오후 4 55 50" src="https://user-images.githubusercontent.com/26623547/192087203-a8b45753-c3f3-4f6d-83ca-92f3c055e29c.png">   

#### 2-2) 앙상블   

`앙상블 학습(Ensemble Learning)을 통한 분류는 여러개의 분류기(Classifier)를 
생성하고 그 예측을 결합함으로써 보다 정확한 최종 예측을 
도출하는 기법을 말한다.`   

어려운 문제의 결론을 내기 위해 여러 명의 전문가로 위원회를 구성해 다양한 
의견을 수렴하고 결정하듯이 앙상블 학습의 목표는 다양한 
분류기의 예측 결과를 결합함으로써 단일 분류기보다 신뢰성 높은 
에측값을 얻는 것이다.   

앙상블의 유형은 일반적으로 보팅(Voting), 배깅(Bagging), 부스팅(Boosting)으로 
구분할 수 있으며 이외에 스태킹(Stacking)등의 기법이 있다.   

`대표적인 배깅은 랜덤 포레스트(Random Forest)알고리즘이 있으며, 
    부스팅은 에이다 부스팅, 그래디언트 부스팅, XGBoost, LightGBM등이 
    있다.`   

> 정형 데이터의 분류나 회귀에서는 GBM 부스팅 계열의 앙상블이 전반적으로 
높은 예측 성능을 나타낸다.   

> 넓은 의미로는 서로 다른 모델을 결합한 것들을 앙상블로 지칭하기도 한다.   


- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

