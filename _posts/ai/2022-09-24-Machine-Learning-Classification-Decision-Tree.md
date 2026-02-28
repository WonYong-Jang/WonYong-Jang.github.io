---
layout: post
title: "[Machine Learning] 분류 알고리즘(Classification) - 결정 트리"
subtitle: "결정트리(Decision Tree), 결정트리의 하이퍼 파라미터, 피처 중요도의 이해" 
comments: true
categories : AI
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

- - -    

## 2. 결정 트리     

결정트리는 아래와 같이 루트 노드에서 부터 규칙을 가지고 분할을 해서 
더 이상 분할이 안될 때 까지 분할해 나간다.   

<img width="852" alt="스크린샷 2022-09-24 오후 4 55 50" src="https://user-images.githubusercontent.com/26623547/192087203-a8b45753-c3f3-4f6d-83ca-92f3c055e29c.png">  

결정 트리 계열의 알고리즘으로 학습한 모델이 어떤 트리의 모양을 
가지는지 확인하기 위해 Graphviz를 이용하여 확인 하며, 아래 예시 살펴보자.   

<img width="1300" alt="스크린샷 2022-12-16 오후 10 15 25" src="https://user-images.githubusercontent.com/26623547/208106623-c5f71210-cb01-4bf0-9f9b-e0b4289c349a.png">    

아래는 결정 트리에서 사용되는 주요 하이퍼 파라미터이다.   

- max_depth: 트리의 최대 깊이를 규정하며 디폴트는 None 이다. None으로 설정하면 완벽하게 클래스 결정 값이 될 때까지 깊이를 
계속 키우며 분할하거나 노드가 가지는 데이터 개수가 min_samples_split보다 작아질 때까지 계속 깊이를 증가시킨다.  
깊이가 깊어지면 min_samples_split 설정대로 최대 분할하여 과적합이 발생할 수 있으므로 적절한 값으로 제어가 필요하다.           

<img width="1500" alt="스크린샷 2022-12-16 오후 10 40 08" src="https://user-images.githubusercontent.com/26623547/208110761-911d7ae3-9d05-4d91-b7e1-f4676fbcb79c.png">    
 

- max_features: 최적의 분할을 위해 모델 학습에 적용시킬 최대 피처 개수이며, None은 전체 피처를 모두 사용한다는 의미이다.        

- min_samples_split: 노드를 분할하기 위한 최소한 샘플 데이터 수로 과적합을 제어하는데 사용한다. 디폴트는 2이며 위의 Graphviz 예시에서 samples가 
나타내는 값이며, 작게 설정할 수록 분할되는 노드가 많아져서 과적합 가능성이 증가한다.   

<img width="1200" alt="스크린샷 2022-12-16 오후 10 42 13" src="https://user-images.githubusercontent.com/26623547/208111207-705981d1-b527-49de-8ba6-bf2d3a23a743.png">   

- min_samples_leaf: 분할이 될 경우 왼쪽과 오른쪽의 브랜치 노드에서 가져야 할 최소한의 샘플 데이터 수이다. 큰 값으로 설정할 수록 왼쪽과 오른쪽의 브랜치 노드에서 
가져야할 최소한의 샘플 데이터 수 조건을 만족시키기 어려우므로 노드 분할을 상대적으로 덜 수행한다.   

<img width="1500" alt="스크린샷 2022-12-16 오후 10 43 05" src="https://user-images.githubusercontent.com/26623547/208111494-c5322c9a-864e-4a77-8af9-63050622c0d1.png">   

- max_leaf_nodes: 말단 노드(leaf)의 최대 개수이다.      


- - - 

## 3. 피처 중요도의 이해   

```
from sklearn.tree import DecisionTreeClassifier
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

# DecisionTree Classifier 생성
dt_clf = DecisionTreeClassifier(random_state=156)

# 붓꽃 데이터를 로딩하고, 학습과 테스트 데이터 셋으로 분리
iris_data = load_iris()
X_train , X_test , y_train , y_test = train_test_split(iris_data.data, iris_data.target,
                                                       test_size=0.2,  random_state=11)

# DecisionTreeClassifer 학습. 
dt_clf.fit(X_train , y_train)  

# 피처의 중요도 확인
dt_clf.feature_importances_
```

아래는 iris 학습데이터를 이용하여 만든 모델에서 `특정 피처가 다른 피처 대비해서 
상대적으로 얼마나 중요도를 갖는지 확인이 가능하다.`    

```
# Output   
array([0.02500521, 0. , 0.55490281, 0.42009198])
```

여기서 주의해야 할 점은 피처의 중요도를 계산하는 로직은 분할을 많이 진행하는데 해당 피처들이 
잘 사용이 되었느냐를 기반으로 중요도를 매긴다.   
`즉, 분할을 자주했다고 해서 중요한 피처가 아닐 수 있다는 점을 주의해야 한다.`     

> 하지만, 직관적으로 피처들의 중요도에 대해서 간단하게 확인할 수 있는 방법이다.   

아래와 같이 각 feature name과 feature importance를 묶고, 이를 seaborn으로 시각화 한 예시이다.   

<img width="752" alt="스크린샷 2022-12-16 오후 11 19 12" src="https://user-images.githubusercontent.com/26623547/208118250-4a81ffd3-029d-4d00-8a7f-a8ac325cf700.png">    



- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

