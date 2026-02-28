---
layout: post
title: "[Machine Learning] 산탄데르 은행 고객 만족 예측"
subtitle: "kaggle 분류 예측 실습 / k-fold 방식으로 early stopping 적용"    
comments: true
categories : AI
date: 2022-10-13
background: '/img/posts/mac.png'
---

## 1. 입력 데이터 확인 및 로딩   

[kaggle](https://www.kaggle.com/competitions/santander-customer-satisfaction/data?select=train.csv)에서 
train.csv 파일을 다운로드하고 로딩한다.   

```python
import numpy as np 
import pandas as pd 
import matplotlib.pyplot as plt
import matplotlib
import warnings
warnings.filterwarnings('ignore')

cust_df = pd.read_csv("./train_santander.csv")
print('dataset shape:', cust_df.shape)
cust_df.head(3)

print(cust_df['TARGET'].value_counts())
```

Output

```
0    73012
1     3008
```

데이터를 확인해보면, TARGET 값 0이 만족한 고객이고, 1이 불만족한 고객이다.    

이제 학습 전 데이터 전처리를 진행해보자.   

- - - 

## 2. 데이터 전처리   

또한, describe 메서드를 통해 데이터를 확인했을 때 var3 피처의 값이 null 인 경우,  
    -999999 값으로 넣어 준 것으로 보인다.   
이를 다른 값으로 replace 해보자.   

```python
cust_df.describe( )
```

<img width="938" alt="스크린샷 2023-06-03 오전 11 11 18" src="https://github.com/WonYong-Jang/algorithm/assets/26623547/a223a300-57ca-411a-95fd-d6fbc0107cf6">    

```python
cust_df['var3'].value_counts()
```

Outout

```
2         74165
8           138
-999999      116
9           110

// ...
``` 

> 위에서 2 값이 가장 많기 때문에 2로 replace 하고 피처 세트와 레이블 세트를 
분리해보자.   

```python
# var3 피처 값 대체 및 ID 피처 드롭
cust_df['var3'].replace(-999999, 2, inplace=True)
cust_df.drop('ID', axis=1, inplace=True)

# 피처 세트와 레이블 세트분리. 레이블 컬럼은 DataFrame의 맨 마지막에 위치해 컬럼 위치 -1로 분리
X_features = cust_df.iloc[:, :-1]
y_labels = cust_df.iloc[:, -1]
print('피처 데이터 shape:{0}'.format(X_features.shape))
```

다음은 학습 데이터 세트와 테스트 데이터 세트를 분리하자.     

```python
from sklearn.model_selection import train_test_split

X_train, X_test, y_train, y_test = train_test_split(X_features, y_labels,
                                                    test_size=0.2, random_state=0)
train_cnt = y_train.count()
test_cnt = y_test.count()
print('학습 세트 Shape:{0}, 테스트 세트 Shape:{1}'.format(X_train.shape , X_test.shape))
```

Output   

```
학습 세트 Shape:(60816, 369), 테스트 세트 Shape:(15204, 369)
```

다음은 학습 데이터에서 다시 검증 데이터 세트로 분리해보자.   

```python
# X_train, y_train을 다시 학습과 검증 데이터 세트로 분리. 
X_tr, X_val, y_tr, y_val = train_test_split(X_train, y_train,
                                                    test_size=0.3, random_state=0)
```


이제 XGBoost와 LightGBM으로 각각 학습 및 예측을 해보자.   

- - -   

## 3. XGBoost    

먼저 [베이지안 최적화](https://wonyong-jang.github.io/ml/2022/10/10/Machine-Learning-Bayesian-Optimization.html)를 위해 
아래와 같이 준비하자.   

```python
from hyperopt import hp

# max_depth는 5에서 15까지 1간격으로, min_child_weight는 1에서 6까지 1간격으로
# colsample_bytree는 0.5에서 0.95사이, learning_rate는 0.01에서 0.2사이 정규 분포된 값으로 검색. 

xgb_search_space = {'max_depth': hp.quniform('max_depth', 5, 15, 1), 
                    'min_child_weight': hp.quniform('min_child_weight', 1, 6, 1),
                    'colsample_bytree': hp.uniform('colsample_bytree', 0.5, 0.95),
                    'learning_rate': hp.uniform('learning_rate', 0.01, 0.2)
}
```

이번에는 `목적 함수를 설정 할 때,  K-Fold 방식으로 early stopping 방식을 
적용해 보려고 한다.`    


```python
from sklearn.model_selection import KFold
from sklearn.metrics import roc_auc_score

# 목적 함수 설정. 
# 추후 fmin()에서 입력된 search_space값으로 XGBClassifier 교차 검증 학습 후 -1* roc_auc 평균 값을 반환.  
# 학습 속도를 위해 n_estimators를 100으로 감소하여 설정    
def objective_func(search_space):
    xgb_clf = XGBClassifier(n_estimators=100, max_depth=int(search_space['max_depth'])
                           , min_child_weight=int(search_space['min_child_weight'])
                            , colsample_bytree=search_space['colsample_bytree']
                            , learning_rate=search_space['learning_rate']
                           )
    
    # 3개 k-fold 방식으로 평가된 roc_auc 지표를 담는 list
    roc_auc_list= []
    
    # 3개 k-fold방식 적용 
    kf = KFold(n_splits=3)
    # X_train을 다시 학습과 검증용 데이터로 분리
    for tr_index, val_index in kf.split(X_train):
        # kf.split(X_train)으로 추출된 학습과 검증 index값으로 학습과 검증 데이터 세트 분리 
        X_tr, y_tr = X_train.iloc[tr_index], y_train.iloc[tr_index]
        X_val, y_val = X_train.iloc[val_index], y_train.iloc[val_index]
        # early stopping은 30회로 설정하고 추출된 학습과 검증 데이터로 XGBClassifier 학습 수행.
        xgb_clf.fit(X_tr, y_tr, early_stopping_rounds=30, eval_metric='auc'
                   , eval_set=[(X_tr, y_tr), (X_val, y_val)])
    
        # 1로 예측한 확률값 추출후 roc auc 계산하고 평균 roc auc 계산을 위해 list에 결과값 담음. 
        score = roc_auc_score(y_val, xgb_clf.predict_proba(X_val)[:, 1])
        roc_auc_list.append(score)
    
    # 3개 k-fold로 계산된 roc_auc값의 평균값을 반환하되, 
    # HyperOpt는 목적함수의 최소값을 위한 입력값을 찾으므로 -1을 곱한 뒤 반환. 
    return -1 * np.mean(roc_auc_list)
```

아래에서 최대 반복 횟수를 50으로 지정했고, 한번 수행 될 때마다 
위처럼 k-fold 검증을 통해 3번이 수행되어 평균 roc auc 값을 반환하게 된다.   


```python
from hyperopt import fmin, tpe, Trials

trials = Trials()

# fmin()함수를 호출. max_evals지정된 횟수만큼 반복 후 목적함수의 최소값을 가지는 최적 입력값 추출.
best = fmin(fn=objective_func,
            space=xgb_search_space,
            algo=tpe.suggest,
            max_evals=50, # 최대 반복 횟수를 지정합니다.
            trials=trials, rstate=np.random.default_rng(seed=30))

print('best:', best)
```


`베이지안 최적화를 통해 최적의 하이퍼 파라미터를 
구했고, 이제 n_estimators를 500으로 증가 시키고 학습하여 
성능을 측정해보자.`     

`이제 테스트 데이터를 이용하여 실제 성능 측정을 할 차례이다.`      

```python
# n_estimators를 500증가 후 최적으로 찾은 하이퍼 파라미터를 기반으로 학습과 예측 수행.
xgb_clf = XGBClassifier(n_estimators=500, learning_rate=round(best['learning_rate'], 5),
                        max_depth=int(best['max_depth']), min_child_weight=int(best['min_child_weight']), 
                        colsample_bytree=round(best['colsample_bytree'], 5)   
                       )

# evaluation metric을 auc로, early stopping은 100 으로 설정하고 학습 수행. 
xgb_clf.fit(X_tr, y_tr, early_stopping_rounds=100, 
            eval_metric="auc",eval_set=[(X_tr, y_tr), (X_val, y_val)])

xgb_roc_score = roc_auc_score(y_test, xgb_clf.predict_proba(X_test)[:,1])
print('ROC AUC: {0:.4f}'.format(xgb_roc_score))
```

이제 피처 중요도를 상위 20개만 그려보자.   

```python
from xgboost import plot_importance
import matplotlib.pyplot as plt
%matplotlib inline

fig, ax = plt.subplots(1,1,figsize=(10,8))
plot_importance(xgb_clf, ax=ax , max_num_features=20,height=0.4)
```

<img width="743" alt="스크린샷 2023-06-04 오후 3 04 39" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/d17d4e27-34b9-4fc1-9eaa-0a028a2a7c7d">   


- - - 

## 4. LightGBM   

이번에는 LightGBM을 이용하여 구현해보자.    
하이퍼 파라미터 튜닝 전에 아래와 같이 먼저 실행해서 ROC AUC 값을 확인해보고, 
    튜닝 후 얼마나 개선되었는지 확인 해보자.   

```python
from lightgbm import LGBMClassifier
from sklearn.metrics import roc_auc_score

lgbm_clf = LGBMClassifier(n_estimators=500)

eval_set=[(X_tr, y_tr), (X_val, y_val)]
lgbm_clf.fit(X_tr, y_tr, early_stopping_rounds=100, eval_metric="auc", eval_set=eval_set)

lgbm_roc_score = roc_auc_score(y_test, lgbm_clf.predict_proba(X_test)[:,1])
print('ROC AUC: {0:.4f}'.format(lgbm_roc_score))
```

Output

```
// ...

[141]	training's auc: 0.948038	training's binary_logloss: 0.0923201	valid_1's auc: 0.829218	valid_1's binary_logloss: 0.137468
[142]	training's auc: 0.948302	training's binary_logloss: 0.0921179	valid_1's auc: 0.829267	valid_1's binary_logloss: 0.137482
ROC AUC: 0.8384
```

XGBoost와 동일하게 베이지안 최적화를 위해 아래와 같이 준비해보자.   

```python
lgbm_search_space = {'num_leaves': hp.quniform('num_leaves', 32, 64, 1),
                     'max_depth': hp.quniform('max_depth', 100, 160, 1),
                     'min_child_samples': hp.quniform('min_child_samples', 60, 100, 1),
                     'subsample': hp.uniform('subsample', 0.7, 1),
                     'learning_rate': hp.uniform('learning_rate', 0.01, 0.2)
                    }
```

```python
def objective_func(search_space):
    lgbm_clf =  LGBMClassifier(n_estimators=100, num_leaves=int(search_space['num_leaves']),
                               max_depth=int(search_space['max_depth']),
                               min_child_samples=int(search_space['min_child_samples']), 
                               subsample=search_space['subsample'],
                               learning_rate=search_space['learning_rate'])
    # 3개 k-fold 방식으로 평가된 roc_auc 지표를 담는 list
    roc_auc_list = []
    
    # 3개 k-fold방식 적용 
    kf = KFold(n_splits=3)
    # X_train을 다시 학습과 검증용 데이터로 분리
    for tr_index, val_index in kf.split(X_train):
        # kf.split(X_train)으로 추출된 학습과 검증 index값으로 학습과 검증 데이터 세트 분리 
        X_tr, y_tr = X_train.iloc[tr_index], y_train.iloc[tr_index]
        X_val, y_val = X_train.iloc[val_index], y_train.iloc[val_index]

        # early stopping은 30회로 설정하고 추출된 학습과 검증 데이터로 XGBClassifier 학습 수행. 
        lgbm_clf.fit(X_tr, y_tr, early_stopping_rounds=30, eval_metric="auc",
           eval_set=[(X_tr, y_tr), (X_val, y_val)])

        # 1로 예측한 확률값 추출후 roc auc 계산하고 평균 roc auc 계산을 위해 list에 결과값 담음.
        score = roc_auc_score(y_val, lgbm_clf.predict_proba(X_val)[:, 1]) 
        roc_auc_list.append(score)
    
    # 3개 k-fold로 계산된 roc_auc값의 평균값을 반환하되, 
    # HyperOpt는 목적함수의 최소값을 위한 입력값을 찾으므로 -1을 곱한 뒤 반환.
    return -1*np.mean(roc_auc_list)
```

```python
from hyperopt import fmin, tpe, Trials

trials = Trials()

# fmin()함수를 호출. max_evals지정된 횟수만큼 반복 후 목적함수의 최소값을 가지는 최적 입력값 추출. 
best = fmin(fn=objective_func, space=lgbm_search_space, algo=tpe.suggest,
            max_evals=50, # 최대 반복 횟수를 지정합니다.
            trials=trials, rstate=np.random.default_rng(seed=30))

print('best:', best)
```

Output   

```
100%|████████| 50/50 [05:01<00:00,  6.04s/trial, best loss: -0.8357657786434084]
best: {'learning_rate': 0.08592271133758617, 'max_depth': 121.0, 'min_child_samples': 69.0, 'num_leaves': 41.0, 'subsample': 0.9148958093027029}
```

베이지안 최적화를 통해 얻은 하이퍼 파라미터를 이용하여 
아래와 같이 최종 학습 및 성능 측정을 해보자.   

```python
lgbm_clf =  LGBMClassifier(n_estimators=500, num_leaves=int(best['num_leaves']),
                           max_depth=int(best['max_depth']),
                           min_child_samples=int(best['min_child_samples']), 
                           subsample=round(best['subsample'], 5),
                           learning_rate=round(best['learning_rate'], 5)
                          )

# evaluation metric을 auc로, early stopping은 100 으로 설정하고 학습 수행. 
lgbm_clf.fit(X_tr, y_tr, early_stopping_rounds=100, 
            eval_metric="auc",eval_set=[(X_tr, y_tr), (X_val, y_val)])

lgbm_roc_score = roc_auc_score(y_test, lgbm_clf.predict_proba(X_test)[:,1])
print('ROC AUC: {0:.4f}'.format(lgbm_roc_score))
```

Output

```
ROC AUC: 0.8446
```

최종적으로 위와 같이 성능이 개선된 것을 확인할 수 있다.

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

