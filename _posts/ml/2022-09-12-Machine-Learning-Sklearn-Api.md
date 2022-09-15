---
layout: post
title: "[Machine Learning] 사이킷런의 주요 모듈"
subtitle: "학습 데이터와 테스트 데이터 분리, 교차 검증(Stratified K Fold) 성능 평가, 하이퍼 파라미터 튜닝, 데이터 인코딩 및 스케일링" 
comments: true
categories : ML
date: 2022-09-12
background: '/img/posts/mac.png'
---

사이킷런은 파이썬 기반의 다른 머신러닝 패키지도 사이킷런 스타일의 API를 지향할 정도로 
쉽고 가장 파이썬 스러운 API를 제공한다.   
또한, 머신러닝을 위한 매우 다양한 알고리즘과 개발을 위한 편리한 프레임워크와 
API를 제공한다.   
오랜 기간 실전 환경에서 검증되었으며, 매우 많은 환경에서 사용되는 성숙한 
라이브러리이다.   

이 글에서는 사이킷런에서 머신러닝에 필요한 주요 기능들을 제공하는데, 
    이를 자세히 살펴보자.   

- - - 

## 1. 학습 데이터와 테스트 데이터 분리  

`사이킷런에서 sklearn_model_selection의 train_test_split()함수를 이용하여 
쉽게 학습 데이터와 테스트 데이터를 분리할 수 있다.`   

주요 파라미터는 아래와 같다.   

- test_size: 전체 데이터에서 테스트 데이터 세트 크기를 얼마로 샘플링할 것인가를 결정한다. 
디폴트는 0.25이다.   

- train_size: 전체 데이터에서 학습용 데이터 세트 크기를 얼마로 샘플링할 것인가를 결정한다. 
test size parameter를 통상적으로 사용하기 때문에 해당 파라미터는 잘 사용되지 않는다.   

- shuffle: 데이터를 분리하기 전에 데이터를 미리 섞을지를 결정한다. 디폴트는 true이며, 
    데이터를 분산시켜 좀 더 효율적인 학습 및 테스트 데이터 세트를 만드는데 사용된다.   

- random_state: 호출할 때마다 동일한 학습/테스트용 데이터 세트를 생성하기 위해 주어지는 
난수 값이다. train_test_split()는 호출 시 무작위로 데이터를 분리하므로 random_state를 
지정하지 않으면 수행할 때마다 다른 학습/테스트 용 데이터를 생성한다.   

아래 예제를 살펴보자.   

```
from sklearn.metrics import accuracy_score
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split  

df = load_iris()

dt_clf = DecisionTreeClassifier()

X_train, X_test, y_train, y_test = train_test_split(df.data, df.target, test_size = 0.2, random_state = 121)

dt_clf.fit(X_train, y_train)
pred = dt_clf.predict(X_test)
print('예측 정확도: {0:.4f}'.format(accuracy_score(y_test, pred)))
```

- - - 

## 2. 교차 검증   

머신러닝은 학습 데이터에 따라 성능이 차이가 많이나며, 특히 작은 데이터일 경우 
그 차이가 더욱 심해진다.   
그렇기 때문에 학습할 때,

<img width="800" alt="스크린샷 2022-09-12 오후 9 10 39" src="https://user-images.githubusercontent.com/26623547/189649977-e4a3b3ee-ca52-4cce-9298-ad381f9b1b6a.png">   



- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25195?tab=curriculum>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

