---
layout: post
title: "[Machine Learning] 사이킷런의 주요 모듈"
subtitle: "학습 데이터와 테스트 데이터 분리, 교차 검증(Stratified K Fold) 성능 평가, 하이퍼 파라미터 튜닝" 
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

`train_test_split 함수를 이용하여 학습 데이터와 테스트 데이터를 분리하였고, 이를 fit 함수를 이용하여 
학습을 하였다. 이때, 학습 데이터의 feature(X_train)과 학습 데이터의 target(y_train)을 사용하였다.`   
`학습된 모델을 이용하여 predict 함수로 정확도를 예측할 수 있고, 이때, 나머지 테스트 데이터를 이용하였다.`   


```
from sklearn.metrics import accuracy_score
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split  

df = load_iris()

dt_clf = DecisionTreeClassifier()

X_train, X_test, y_train, y_test = train_test_split(df.data, df.target, test_size = 0.2, random_state = 121)

dt_clf.fit(X_train, y_train)   ## 학습  
pred = dt_clf.predict(X_test)  ## 예측   
print('예측 정확도: {0:.4f}'.format(accuracy_score(y_test, pred)))
```

- - - 

## 2. 교차 검증   

머신러닝은 학습 데이터에 따라 성능이 차이가 많이나며, 특히 작은 데이터일 경우 
그 차이가 더욱 심해진다.   
`학습 데이터 세트와 테스트 데이터 세트를 쪼갰을 때 작은 데이터이거나, 
    정답 데이터가 불균형한 경우 모델 학습 후 실제 
    테스트 했을 때 성능이 안나오는 경우가 있을 수 있다.`       

<img width="800" alt="스크린샷 2022-09-12 오후 9 10 39" src="https://user-images.githubusercontent.com/26623547/189649977-e4a3b3ee-ca52-4cce-9298-ad381f9b1b6a.png">   

그렇기 때문에 이를 방지하기 위해 아래와 같이 교차 검증을 통하여
데이터 세트에 대해서 다양한 검증을 진행한다.    

`먼저 K 폴트 교차 검증은 K만큼 교차하여 검증을 진행하는 방식이다.`   
아래 그림은 총 5개의 폴드 세트에 5번의 학습과 검증 평가를 반복 수행한다.   
그 후 5개의 폴드 세트의 각 결과값을 평균을 낸다.   

<img width="950" alt="스크린샷 2022-09-17 오후 7 09 19" src="https://user-images.githubusercontent.com/26623547/190851683-0d39807c-16e6-40e7-a825-a92af8a53878.png">    

`하지만, 보통 분류 모델에서는 일반 k 폴드 방식 보다는 Stratified K 폴드 방식을 많이 이용한다.`   
k 폴드 방식의 문제점은 불균형한 분포도를 가진 레이블(Target) 데이터 집합인 경우에 문제가 발생한다.   

> 불법 신용 거래를 예측하는 모델을 학습한다고 가정해보면, 학습 데이터 중에 불법 신용 거래 건수가 현저히 
적기 때문에 단순하게 k번 나누었을 경우 불균형이 생길 수 있다.      

`따라서, Stratified K 폴드 방식은 
학습데이터와 검증 데이터 세트가 가지는 레이블(Target) 분포도가 유사하도록 검증 데이터를 추출한다.`   

`Stratified K 폴드 방식은 분류 모델에만 적용이 가능하며, 회귀의 경우 값에 대한 분포도가 연속형이기 때문에 
적용이 불가능하다.`        

아래와 같이 코드 결과를 살펴보면, 학습 데이터와 검증 데이터의 분포도가 균일하게 분포되어 
검증하는 것을 확인할 수 있다.   

```
from sklearn.datasets import load_iris
from sklearn.model_selection import train_test_split
from sklearn.model_selection import StratifiedKFold

iris = load_iris()
iris_df = pd.DataFrame(data=iris.data, columns=iris.feature_names)
iris_df['label'] = iris.target

skf = StratifiedKFold(n_splits=3)

n_iter = 0
# StratifiedKFold는 반드시 레이블(Target)이 반드시 들어가야 함
for train_index, test_index in skf.split(iris_df, iris_df['label']):
    n_iter+=1
    label_train = iris_df['label'].iloc[train_index]
    label_test = iris_df['label'].iloc[test_index]
    print('## 교차 검증: {0}'.format(n_iter))
    print('학습 레이블 데이터 분포:\n', label_train.value_counts())
    print('검증 레이블 데이터 분포:\n', label_test.value_counts())
```   

Output

```
## 교차 검증: 1
학습 레이블 데이터 분포:
 2    34
0    33
1    33
Name: label, dtype: int64
검증 레이블 데이터 분포:
 0    17
1    17
2    16
Name: label, dtype: int64
## 교차 검증: 2
학습 레이블 데이터 분포:
 1    34
0    33
2    33
Name: label, dtype: int64
검증 레이블 데이터 분포:
 0    17
2    17
1    16
Name: label, dtype: int64
## 교차 검증: 3
학습 레이블 데이터 분포:
 0    34
1    33
2    33
Name: label, dtype: int64
검증 레이블 데이터 분포:
 1    17
2    17
0    16
Name: label, dtype: int64
```

- - - 

## 3. 교차 검증을 더 간단하게    

위에서 진행한 교차 검증은 for문을 통해 직접 계산을 해주었는데, 
    이를 함수로 한번에 진행 가능한 방법이 있다.      

> 당연하게 cross_val_score 방식은 Stratified K Fold 방식이다.   

<img width="800" alt="스크린샷 2022-09-17 오후 7 54 59" src="https://user-images.githubusercontent.com/26623547/190853176-c82824aa-e8ee-4b3b-b87a-f6343491e152.png">   

```
import numpy as np
import pandas as pd

from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import cross_val_score   

# df = pd.read_csv('titanic_train.csv')

iris = load_iris()

dt_clf = DecisionTreeClassifier(random_state=156)

data=iris.data
label=iris.target

# 성능 지표는 정확도(accuracy), 교차 검증 세트는 3개
scores = cross_val_score(dt_clf, data, label, scoring='accuracy', cv = 3)
print('교차 검증 정확도: ', np.round(scores, 4))
print('평균 검증 정확도: ', np.round(np.mean(scores), 4))

// Output   
교차 검증 정확도:  [0.98 0.94 0.98]
평균 검증 정확도:  0.9667
```


- - - 

## 4. 교차 검증과 최적 하이퍼 파라미터 튜닝을 한번에   

이번에는 `교차 검증과 최적의 하이퍼 파라미터 튜닝을 한번에 할 수 있는 
GridSearchCV 함수`에 대해서 살펴보자.    

> 당연하게 GridSearchCV 방식은 Stratified K Fold 방식이다.     

<img width="800" alt="스크린샷 2022-09-17 오후 8 04 21" src="https://user-images.githubusercontent.com/26623547/190853501-9e22ebd0-61dc-4f1a-8ed0-be7fae0f6032.png">      

아래 코드로 이해해 보자.   

```
import numpy as np
import pandas as pd

from sklearn.metrics import accuracy_score
from sklearn.datasets import load_iris
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import GridSearchCV ,train_test_split   


iris = load_iris()

X_train, X_test, y_train, y_test = train_test_split(iris.data, iris.target, test_size=0.2, random_state=121)

dtree = DecisionTreeClassifier(random_state=156)

# 파라미터들을 반드시 dictionary 형태로 설정
# DecisionTreeClassifier 에 사용하는 하이퍼 파라미터
parameters = {'max_depth': [1,2,3], 'min_samples_split': [2,3]}

# param_grid의 하이퍼 파라미터들을 cv=3 번의 교차 검증을 진행 6(파라미터) * 3(교차검증) = 18번
# refit True가 default이며, True이면 가장 좋은 파라미터 설정으로 재 학습 시킴
# return_train_score는 warning이 발생하여 True로 설정
grid_dtree = GridSearchCV(dtree, param_grid=parameters, cv=3, refit=True, return_train_score=True)

# train 데이터로 param_grid의 하이퍼 파라미터들을 순차적으로 학습/평가
# cv=3 의 교차 검증을 위해 세트를 쪼갠다.
grid_dtree.fit(X_train, y_train)

# GridSearchCV 결과는 cv_results_ 라는 딕셔너리로 저장됨. 이를 DataFrame으로 변환
# param은 6개의 파라미터 조합이며, 각 split 했을 때 가장 score가 좋은 rank_test_score와
# 평균을 낸 mean_test_score 점수를 확인 할 수 있다.
scores_df = pd.DataFrame(grid_dtree.cv_results_)
scores_df[['params','mean_test_score', 'rank_test_score', 'split0_test_score',
           'split1_test_score', 'split2_test_score']]

```

아래와 같이 최적의 하이퍼 파라미터는 4행 또는 5행인 것을 확인할 수 있다.   

<img width="796" alt="스크린샷 2022-09-17 오후 9 59 09" src="https://user-images.githubusercontent.com/26623547/190858087-ca100b6d-2e62-4444-a33b-711394870e6f.png">   

이제 최종적으로 predict를 통해 정확도를 확인해보자.   

```
print('GridSearchCV 최적 파라미터: ', grid_dtree.best_params_)
print('GridSearchCV 최고 정확도: {0: .4f}'.format(grid_dtree.best_score_))

# refit=True로 설정된 GridSearchCV 객체가 fit()을 수행할 시 학습이 완료된 Estimator를 내포하고 있으므로 predict를 통해 예측도 가능
pred = grid_dtree.predict(X_test)
print('테스트 데이터 세트 정확도: {0: .4f}'.format(accuracy_score(y_test, pred)))   

# Output   

GridSearchCV 최적 파라미터:  {'max_depth': 3, 'min_samples_split': 2}
GridSearchCV 최고 정확도:  0.9750
테스트 데이터 세트 정확도:  0.9667
```

GridSearchCV는 refit으로 이미 학습된 estimator를 내포하고 있으므로 아래와 같이 predict도 가능하다.   

```
# GridSearchCV의 refit으로 이미 학습이 된 estimator 반환 
estimator = grid_dtree.best_estimator_

# GridSearchCV의 best_estimator_ 는 이미 최적 하이퍼파라미터로 학습이 됨 
pred = estimator.predict(X_test)
print('테스트 데이터 세트 정확도: {0: .4f}'.format(accuracy_score(y_test, pred)))

# Output   

테스트 데이터 세트 정확도:  0.9667
```   

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25195?tab=curriculum>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

