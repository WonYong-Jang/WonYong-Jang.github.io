---
layout: post
title: "[Machine Learning] 분류 알고리즘 - 앙상블(Ensemble) 기법의 부스팅(Boosting) / LightGBM"
subtitle: "LightGBM을 이용하여 위스콘신 유방암 예측 실습"    
comments: true
categories : ML
date: 2022-10-04
background: '/img/posts/mac.png'
---

## 1. LightGBM 소개   

LightGBM은 Gradient Boosting 의 Tree 기반 알고리즘이다.   
`다른 알고리즘은 Tree가 수평적으로 확장(level-wise)이지만 
LightGBM은 leaf-wise이다.`   

<img width="516" alt="스크린샷 2023-06-01 오후 1 09 27" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/2f4d44f1-8d74-4b0c-a10d-788deb295436">   

`LightGBM의 가장 큰 장점은 학습 속도가 빠르며, 더 적은 메모리를 차지한다.`   
또한, `XGBoost와 비교하여 대체적으로 더 좋은 성능을 낸다.`       

다만 LightGBM은 작은 데이터 세트에서 사용하는 것은 추천되지 않으며, 
    작은 데이터에는 과적합(overfitting)되기 쉽다.  


- - -   

## 2. LightGBM 설치   

```
$ brew install lightgbm

// 또는 아나콘다 설치
$ conda install lightgbm

// 또는 pip로 설치 
$ pip install lightgbm
```

```python   
import xgboost   

print(xgboost._version_) # 버전 확인  
```

- - - 

## 3. LightGBM 하이퍼 파라미터   

<img width="1000" alt="스크린샷 2023-06-01 오후 12 46 14" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/6e8d6fde-e77c-4942-ae7b-8296bddb0a89">   

<img width="1000" alt="스크린샷 2023-06-01 오후 12 47 34" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/bc578e90-9f8c-48a0-b24b-d934b21b3748">

`균형 트리의 경우 max_depth 을 중심으로 튜닝을 했지만, LightGBM의 경우 num_leaves가 가장 중요한 
하이퍼 파라미터 중 하나이다.`   

- - - 

## 4. LightGBM 실습   

[XGBoost](https://wonyong-jang.github.io/ml/2022/10/03/Machine-Learning-Classification-Boosting-XGBoost.html)에서 
실습했던 위스콘신 유방암 예측 실습을 LightGBM으로 진행해보자.   

> LightGBM은 XGBoost와 동일하게 파이썬 Wrapper와 사이킷런 Wrapper를 제공하며 
이 글에서는 사이킷런 Wrapper를 이용해서 실습해보자.      

```python   
# LightGBM의 파이썬 패키지인 lightgbm에서 LGBMClassifier 임포트
from lightgbm import LGBMClassifier

import pandas as pd
import numpy as np
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

dataset = load_breast_cancer()

cancer_df = pd.DataFrame(data=dataset.data, columns=dataset.feature_names)
cancer_df['target']= dataset.target

cancer_df.head()
```



```python  
X_features = cancer_df.iloc[:, :-1]
y_label = cancer_df.iloc[:, -1]

# 전체 데이터 중 80%는 학습용 데이터, 20%는 테스트용 데이터 추출
X_train, X_test, y_train, y_test=train_test_split(X_features, y_label,
                                         test_size=0.2, random_state=156 )

# 위에서 만든 X_train, y_train을 다시 쪼개서 90%는 학습과 10%는 검증용 데이터로 분리  
X_tr, X_val, y_tr, y_val= train_test_split(X_train, y_train,
                                         test_size=0.1, random_state=156 )

# 앞서 XGBoost와 동일하게 n_estimators는 400 설정. 
lgbm_wrapper = LGBMClassifier(n_estimators=400, learning_rate=0.05)

# LightGBM도 XGBoost와 동일하게 조기 중단 수행 가능. 
evals = [(X_tr, y_tr), (X_val, y_val)]
lgbm_wrapper.fit(X_tr, y_tr, early_stopping_rounds=50, eval_metric="logloss", 
                 eval_set=evals, verbose=True)
preds = lgbm_wrapper.predict(X_test)
pred_proba = lgbm_wrapper.predict_proba(X_test)[:, 1]
```

```python   
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.metrics import precision_score, recall_score
from sklearn.metrics import f1_score, roc_auc_score

def get_clf_eval(y_test, pred=None, pred_proba=None):
    confusion = confusion_matrix( y_test, pred)
    accuracy = accuracy_score(y_test , pred)
    precision = precision_score(y_test , pred)
    recall = recall_score(y_test , pred)
    f1 = f1_score(y_test,pred)
    # ROC-AUC 추가 
    roc_auc = roc_auc_score(y_test, pred_proba)
    print('오차 행렬')
    print(confusion)
    # ROC-AUC print 추가
    print('정확도: {0:.4f}, 정밀도: {1:.4f}, 재현율: {2:.4f},\
    F1: {3:.4f}, AUC:{4:.4f}'.format(accuracy, precision, recall, f1, roc_auc))

get_clf_eval(y_test, preds, pred_proba)
```

Output

```
오차 행렬
[[34  3]
 [ 2 75]]
정확도: 0.9561, 정밀도: 0.9615, 재현율: 0.9740,    F1: 0.9677, AUC:0.9877
```

> 대체적으로 LightGBM의 성능이 XGBoost 보다 좋지만, 학습 데이터 건수가 작을 경우는 XGBoost가 
좋을 수 있다.   

마지막으로 동일하게 Feature Importance를 확인해보자.   

```python   
# plot_importance( )를 이용하여 feature 중요도 시각화
from lightgbm import plot_importance
import matplotlib.pyplot as plt
%matplotlib inline

fig, ax = plt.subplots(figsize=(10, 12))
plot_importance(lgbm_wrapper, ax=ax)
plt.show()
```

<img width="737" alt="스크린샷 2023-06-01 오후 12 58 42" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/2127f572-c30b-41bd-8a5d-ff1d1c9ac67b">   


- - -
Referrence 

<https://nurilee.com/2020/04/03/lightgbm-definition-parameter-tuning/>   
<https://velog.io/@drsky1/m1-mac%EC%97%90%EC%84%9C-%EC%A3%BC%ED%94%BC%ED%84%B0%EB%85%B8%ED%8A%B8%EB%B6%81%EC%97%90%EC%84%9C-lightgbm-%EC%84%A4%EC%B9%98-%EC%95%88-%EB%90%A0-%EB%95%8C>   
<https://lightgbm.readthedocs.io/en/latest/Installation-Guide.html#macos>   
<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

