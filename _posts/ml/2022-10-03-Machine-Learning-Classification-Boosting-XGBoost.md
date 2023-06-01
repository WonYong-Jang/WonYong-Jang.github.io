---
layout: post
title: "[Machine Learning] 분류 알고리즘 - 앙상블(Ensemble) 기법의 부스팅(Boosting) / XGBoost"
subtitle: "XGBoost(eXtra Gradient Boost) / Early Stopping(조기 중단 기능)" 
comments: true
categories : ML
date: 2022-10-03
background: '/img/posts/mac.png'
---

## 1. 부스팅(Boosting)   

`부스팅 알고리즘은 여러 개의 약한 학습기(weak learner)를 순차적으로 
학습, 예측하면서 잘못 예측한 데이터나 학습 트리에 가중치 부여를 통해 
오류를 개선해 나가면서 학습하는 방식이다.`      

부스팅의 대표적인 구현은 AdaBoost(Adaptive boosting)와 XGBoost, LightGBM 등이 있다.     

> 사이킷에서 1.X 버전 기준으로 GBM(Gradient Boosting Machine)은 학습 속도가 현저하게 저하되는 
문제가 있기 때문에 이 글에서는 다루지 않는다.   

이번 글에서는 XGBoost에 대해서 살펴보자.   

- - - 

## 2. XGBoost 설치   

```
// 아나콘다로 설치 
$ conda install -c anaconda py-xgboost   

// pip로 설치 
$ pip install xgboost   
```

```
import xgboost   

print(xgboost._version_) # 버전 확인  
```

- - - 

## 3. XGBoost 란    

XGBoost는 부스팅 계열 알고리즘 중 하나이며, 아래와 같은 장점을 가지고 있다.   

<img width="700" alt="스크린샷 2023-05-29 오전 10 15 20" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7052e508-995c-4472-b309-2d80f6406e85">   

또한, XGBoost는 파이썬 Wrapper와 사이킷런 Wrapper 를 제공한다.     

<img width="800" alt="스크린샷 2023-05-29 오전 10 21 04" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/d67d0d28-593c-4ed1-b7eb-218599ef5728">     

<img width="800" alt="스크린샷 2023-05-29 오전 10 22 04" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7f1f7a69-975b-4833-b787-caabfb87ceb0">    


- - -   

## 4. XGBoost 조기 중단 기능   

`XGBoost는 특정 반복 횟수 만큼 더 이상 비용함수가 감소하지 않으면 지정된 
반복횟수를 다 완료하지 않고 수행을 종료`할 수 있다.( Early Stopping )    

<img width="279" alt="스크린샷 2023-05-29 오전 10 46 02" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/8aff57d4-4ce8-4db9-bf4e-cb4a07278eec">   

`이로 인해 학습을 위한 시간을 단축시킬 수 있고, 특히 최적화 튜닝 단계에서 적절하게 사용 가능`하다.    

`너무 반복 횟수를 단축할 경우 예측 성능 최적화가 안된 상태에서 학습이 종료 될 수 있으므로 
유의할 필요가 있다.`       

조기 중단 설정을 위한 주요 파라미터는 아래와 같다.   

- early_stopping_rounds: 더 이상 비용 평가 지표가 감소하지 않는 최대 반복횟수   
- eval_metric: 반복 수행 시 사용하는 비용 평가 지표   
- eval_set: 평가를 수행하는 별도의 검증 데이터 세트이며 일반적으로 검증 데이터 세트에서 반복적으로 비용 감소 성능 평가   

> 예를들면 
early stopping rounds를 10으로 설정한 경우 10번 반복 모두 비용 함수가 감소하지 않으면 중단 시킨다.   

- - - 

## 5. XGBoost 실습   

위스콘신 유방암 데이터 세트를 이용하여 실습을 해보자.   

아래와 같이 데이터 세트를 로딩하자.   

```
import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
# xgboost 패키지 로딩하기
import xgboost as xgb
from xgboost import plot_importance

import warnings
warnings.filterwarnings('ignore')

dataset = load_breast_cancer()
features= dataset.data
labels = dataset.target

cancer_df = pd.DataFrame(data=features, columns=dataset.feature_names)
cancer_df['target']= labels
cancer_df.head(3)
```

```
print(dataset.target_names)
print(cancer_df['target'].value_counts())
```

Output   

```
['malignant' 'benign']
1    357
0    212
Name: target, dtype: int64
```

위 데이터를 확인해보면, `타겟 0 값이 악성이며, 1 값이 음성`으로 
각각 갯수를 확인했다.     

이제 데이터를 `학습 데이터, 검증 데이터, 테스트 데이터`로 각각 분리하여 보자.   
아래는 먼저, 학습 데이터와 테스트 데이터로 분리했고, 그 후 다시 
학습 데이터에서 10%는 검증용 데이터 세트로 분리했다.   

```
# cancer_df에서 feature용 DataFrame과 Label용 Series 객체 추출
# 맨 마지막 칼럼이 Label이므로 Feature용 DataFrame은 cancer_df의 첫번째 칼럼에서 맨 마지막 두번째 컬럼까지를 :-1 슬라이싱으로 추출.
X_features = cancer_df.iloc[:, :-1]
y_label = cancer_df.iloc[:, -1]

# 전체 데이터 중 80%는 학습용 데이터, 20%는 테스트용 데이터 추출
X_train, X_test, y_train, y_test=train_test_split(X_features, y_label, test_size=0.2, random_state=156 )

# 위에서 만든 X_train, y_train을 다시 쪼개서 90%는 학습과 10%는 검증용 데이터로 분리 
X_tr, X_val, y_tr, y_val= train_test_split(X_train, y_train, test_size=0.1, random_state=156 )

print(X_train.shape , X_test.shape)
print(X_tr.shape, X_val.shape)
```

Output

```
(455, 30) (114, 30)
(409, 30) (46, 30)
```

즉, 위의 455 개(학습 데이터)와 114 개(테스트 데이터)로 나누고 
455개를 다시 나누어서 최종적으로 409 개(학습데이터)로 사용할 것이고 
46개는 검증용 데이터로 사용하려고 한다.     

이제 먼저 `파이썬 Wrapper`를 이용하여 구현 하는 방법을 살펴보자.      

```
# 만약 구버전 XGBoost에서 DataFrame으로 DMatrix 생성이 안될 경우 X_train.values로 넘파이 변환. 
# 학습, 검증, 테스트용 DMatrix를 생성. 
dtr = xgb.DMatrix(data=X_tr, label=y_tr)        # 학습 
dval = xgb.DMatrix(data=X_val, label=y_val)     # 검증
dtest = xgb.DMatrix(data=X_test , label=y_test) # 테스트    
```

위와 

```
params = { 'max_depth':3,
           'eta': 0.05,
           'objective':'binary:logistic',
           'eval_metric':'logloss'
        }
num_rounds = 400
```

```
# 학습 데이터 셋은 'train' 또는 평가 데이터 셋은 'eval' 로 명기합니다. 
eval_list = [(dtr,'train'),(dval,'eval')] # 또는 eval_list = [(dval,'eval')] 만 명기해도 무방. 

# 하이퍼 파라미터와 early stopping 파라미터를 train( ) 함수의 파라미터로 전달
xgb_model = xgb.train(params = params , dtrain=dtr , num_boost_round=num_rounds , \
                      early_stopping_rounds=50, evals=eval_list )
```

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

