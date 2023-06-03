---
layout: post
title: "[Machine Learning] 베이지안 최적화(Bayesian Optimization)"
subtitle: "GridSearchCV 하이퍼 파라미터 튜닝 문제점 / HyperOpt 패키지"    
comments: true
categories : ML
date: 2022-10-10
background: '/img/posts/mac.png'
---

## 1. GridSearchCV 하이퍼 파라미터 튜닝 문제   

[이전글](https://wonyong-jang.github.io/ml/2022/09/12/Machine-Learning-Sklearn-Data-Set.html) 에서 
살펴봤던 GridSearchCV 를 이용한 하이퍼 파라미터 튜닝을 진행할 때 
문제점에 대해 먼저 살펴보자.   

`XGBoost 또는 LightGBM 와 같은 Gradient Boosting 기반 알고리즘을 
튜닝할 때 GridSearchCV를 이용한다면 튜닝해야 할 하이퍼 파라미터 개수가 
많고 범위가 넓어서 튜닝에 너무 오랜 시간 소요 되는 문제가 있다.`   

따라서 위의 문제를 해결하기 위해 베이지안 최적화를 살펴보자.   

- - - 

## 2. 베이지안 최적화   

`베이지안 최적화는 미지의 함수가 반환하는 값의 최소 또는 최대값을 만드는 
최적해를 짧은 반복을 통해 찾아 내는 최적화 방식이다.`   

`베이지안 최적화에는 Surrogate model(대체 모델)과 Acquisition function(획득 함수)로 
구성되며 대체 모델은 획득 함수로 부터 최적 입력 값을 추천 받은 뒤 이를 
기반으로 최적 함수 모델을 개선해 나간다.`    

`Acquisition function은 surrogate model이 목적 함수(우리가 찾고자 하는 최적 함수)에 대하여 
실제 데이터를 기반으로 다음 번 조사할 x 값을 확률적으로 계산하여 추천해주는 함수이다`       

> 여기서 목적함수는 black box function 이라고도 한다.   

<img width="754" alt="스크린샷 2023-06-02 오전 11 21 36" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/bf3cd647-1566-4e05-8f1a-14171c4e4d36">   

- - - 

## 3. HyperOpt    

베이지안 최적화를 구현하기 위한 주요 패키지는 HyperOpt, Bayesian optimization, Optuna 등이 있다.   
이 글에서는 HyperOpt를 설치해보고 실습해 볼 예정이다.   

> HyperOpt 는 TPE(Tree-structured Parzen Estimator) 알고리즘을 사용한다.  

아래와 같이 설치해보자.   

```
$ pip install hyperopt   
```

```python
import hyperopt

print(hyperopt.__version__)
```

주요 구성 요소는 아래와 같으며 실습을 진행하면서 자세히 살펴보자.     

<img width="1000" alt="스크린샷 2023-06-02 오전 11 43 17" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/0389e916-807c-4274-b565-668077b6f3cb">   

- - - 

## 4. HyperOpt 실습    

위에서 설치한 `HyperOpt를 import 하고 hp 모듈을 이용하여 입력 값 범위를 지정해준다.`      

```python
from hyperopt import hp

# -10 ~ 10까지 1간격을 가지는 입력 변수 x 집합값과 -15 ~ 15까지 1간격을 가지는 입력 변수  y 집합값 설정.
search_space = {'x': hp.quniform('x', -10, 10, 1),  'y': hp.quniform('y', -15, 15, 1) }
```

`search space를 dictionary 형태로 생성을 하고 이를 아래와 같이 목적함수에 전달`한다.      

```python
from hyperopt import STATUS_OK

# 목적 함수를 생성. 입력 변수값과 입력 변수 검색 범위를 가지는 딕셔너리를 인자로 받고, 특정 값을 반환
def objective_func(search_space):
    x = search_space['x']
    y = search_space['y']
    retval = x**2 - 20*y
    
    # retval 만 리턴해도 되고 아래 주석처럼 리턴해도 된다.   
    return retval # return {'loss': retval, 'status':STATUS_OK}
```

> 참고로 위의 목적 함수에서 리턴하는 식은 이해를 돕기 위한 예이며, 
    실제 사용 방법은 아래에서 다루려고 한다.    


그 후 `목적함수의 최소값을 찾는 함수로 fmin`을 사용한다.   

```python
from hyperopt import fmin, tpe, Trials
import numpy as np

# 입력 결괏값을 저장한 Trials 객체값 생성.
trial_val = Trials()

# 목적 함수의 최솟값을 반환하는 최적 입력 변숫값을 5번의 입력값 시도(max_evals=5)로 찾아냄.
best_01 = fmin(fn=objective_func, space=search_space, algo=tpe.suggest, max_evals=5
               , trials=trial_val, rstate=np.random.default_rng(seed=0)
              )
print('best:', best_01)
```

Output

```
100%|██████████████████████| 5/5 [00:00<00:00, 695.80trial/s, best loss: -224.0]
best: {'x': -4.0, 'y': 12.0}
```

> 일반적으로 베이지안 최적화는 가우시안 최적화를 많이 사용하지만, HyperOpt는 TPE 알고리즘을 사용한다.     
> 따라서, algo=tpe.suggest 는 고정 값으로 넣어주면 된다.   

`위의 결과값은 x 가 -4.0, y 가 12.0 일 때 목적함수가 최소가 된다 라는 뜻이다.`   

`max_evals를 5를 주었기 때문에 5번 시도를 했고 결과값에도 5/5 를 확인할 수 있다.`    

`trial_val은 5번 수행할 때마다 입력 변수 값과 그 때의 결과값을 해당 객체에 저장을 해준다.`   

> rstate 는 정수형 고정값으로 넣어 주기 위한 방법이며, 넣어주지 않으면 수행시 마다 결과가 달라진다.   
> 일반적으로, rstate를 제외하는게 성능이 좋게 나오니 참고하자.   

`trial_val에 어떤 값들이 들어있는지 확인하기 위해 
아래와 같이 출력`해보자.         

```python
# fmin( )에 인자로 들어가는 Trials 객체의 result 속성에 파이썬 리스트로 목적 함수 반환값들이 저장됨
# 리스트 내부의 개별 원소는 {'loss':함수 반환값, 'status':반환 상태값} 와 같은 딕셔너리임. 
print(trial_val.results)

# Trials 객체의 vals 속성에 {'입력변수명':개별 수행 시마다 입력된 값 리스트} 형태로 저장됨.
print(trial_val.vals)
```

Output   

```
[{'loss': -64.0, 'status': 'ok'}, {'loss': -184.0, 'status': 'ok'}, {'loss': 56.0, 'status': 'ok'}, {'loss': -224.0, 'status': 'ok'}, {'loss': 61.0, 'status': 'ok'}] 

{'x': [-6.0, -4.0, 4.0, -4.0, 9.0], 'y': [5.0, 10.0, -2.0, 12.0, 1.0]}
```

위와 같이 결과값과 입력값을 각각 확인할 수 있다.  
이를 보기 좋게 데이터 프레임으로 변경하면 아래와 같이 변경할 수 있다.   

```python
import pandas as pd 

# results에서 loss 키값에 해당하는 밸류들을 추출하여 list로 생성. 
losses = [loss_dict['loss'] for loss_dict in trial_val.results]

# DataFrame으로 생성. 
result_df = pd.DataFrame({'x': trial_val.vals['x'],
                         'y': trial_val.vals['y'],
                          'losses': losses
                         }
                        )
result_df
```

Output

<img width="200" alt="스크린샷 2023-06-02 오후 3 51 23" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/240d61f8-142e-4ba6-b649-3670cc978e47">  

- - - 

## 5. HyperOpt 이용한 XGBoost 하이퍼 파라미터 튜닝   

[이전글](https://wonyong-jang.github.io/ml/2022/10/03/Machine-Learning-Classification-Boosting-XGBoost.html)에서 
진행 했던 실습으로 하이퍼 파라미터 튜닝을 진행해보자.    

`데이터 로딩 후 search space를 아래와 같이 설정해보자.`       

```python
from hyperopt import hp

# max_depth는 5에서 20까지 1간격으로, min_child_weight는 1에서 2까지 1간격으로
# colsample_bytree는 0.5에서 1사이, learning_rate는 0.01에서 0.2사이 정규 분포된 값으로 검색. 
xgb_search_space = {'max_depth': hp.quniform('max_depth', 5, 20, 1),
                    'min_child_weight': hp.quniform('min_child_weight', 1, 2, 1),
                    'learning_rate': hp.uniform('learning_rate', 0.01, 0.2),
                    'colsample_bytree': hp.uniform('colsample_bytree', 0.5, 1)
               }
```

`아래와 같이 목적 함수를 생성할 때 주의해야 할 점은 정수형 하이퍼 파라미터는 명시적으로 
정수형 변환을 해줘야 한다.`   

`명시적으로 변환해야 하는 이유는 search space는 5.0, 6.0 과 같이 실수형으로 들어오기 때문이다.`       


```python
from sklearn.model_selection import cross_val_score
from xgboost import XGBClassifier
from hyperopt import STATUS_OK

# fmin()에서 입력된 search_space값으로 입력된 모든 값은 실수형임. 
# XGBClassifier의 정수형 하이퍼 파라미터는 정수형 변환을 해줘야 함. 
# 정확도는 높은 수록 더 좋은 수치임. -1* 정확도를 곱해서 큰 정확도 값일 수록 최소가 되도록 변환
def objective_func(search_space):
    # 수행 시간 절약을 위해 n_estimators는 100으로 축소
    xgb_clf = XGBClassifier(n_estimators=100, max_depth=int(search_space['max_depth']),
                            min_child_weight=int(search_space['min_child_weight']),
                            learning_rate=search_space['learning_rate'],
                            colsample_bytree=search_space['colsample_bytree'], 
                            eval_metric='logloss')
    
    accuracy = cross_val_score(xgb_clf, X_train, y_train, scoring='accuracy', cv=3)
        
    # accuracy는 cv=3 개수만큼의 정확도 결과를 가지므로 이를 평균해서 반환하되 -1을 곱해줌. 
    return {'loss':-1 * np.mean(accuracy), 'status': STATUS_OK}
```   

`위에서 하나 더 주의사항은 분류 모델을 생성할 때는 결과값에 -1 을 반드시 곱해줘야 한다.`   

fmin은 가장 최소인 값을 찾아주는 것인데, 분류의 성능지표(정확도, 정밀도, 재현율)는  
값이 높을 수록 성능이 좋다.   

`따라서 결과값에 -1 을 곱해야 가장 성능이 높은 하이퍼 파라미터를 찾을 수 있다.`    

> 회귀 모델의 경우는 값이 적을 수록 성능이 좋기 때문에 -1 을 곱해주지 않아도 된다.   

`또한, 더 정확하게 하이퍼 파라미터를 찾기 위해 
교차검증(cross val score)을 이용했고, np.mean을 통해 각 정확도의 평균을 구했다.`    

마지막으로 fmin을 통해 목적함수의 최소값을 찾아보자.   

```python   
from hyperopt import fmin, tpe, Trials

trial_val = Trials()
best = fmin(fn=objective_func,
            space=xgb_search_space,
            algo=tpe.suggest,
            max_evals=50, # 최대 반복 횟수를 지정합니다.
            trials=trial_val)
print('best:', best)
```

Output   

```
100%|████████| 50/50 [00:10<00:00,  4.63trial/s, best loss: -0.9692401533635412]
best: {'colsample_bytree': 0.5441923601199812, 'learning_rate': 0.19748784423391916, 'max_depth': 6.0, 'min_child_weight': 2.0}
```

위 결과를 확인해보면, `best loss 는 가장 높은 accuracy 임을 확인`할 수 있고, 
    이때의 하이퍼 파라미터 값들을 각각 출력해주고 있다.   

위 하이퍼 파라미터를 이용하여, early stopping을 같이 적용해보자.   

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
```

최적 하이퍼 파라미터의 소수점을 5자리까지만 전달했고, early stopping을 이용해서 
학습 및 예측을 진행했다.   

```python
xgb_wrapper = XGBClassifier(n_estimators=400, learning_rate=round(best['learning_rate'], 5), 
                            max_depth=int(best['max_depth']), min_child_weight=int(best['min_child_weight']),
                            colsample_bytree=round(best['colsample_bytree'], 5)
                           )

evals = [(X_tr, y_tr), (X_val, y_val)]
xgb_wrapper.fit(X_tr, y_tr, early_stopping_rounds=50, eval_metric='logloss', 
                eval_set=evals, verbose=True)

preds = xgb_wrapper.predict(X_test)
pred_proba = xgb_wrapper.predict_proba(X_test)[:, 1]

get_clf_eval(y_test, preds, pred_proba)
```

Output

```
오차 행렬
[[35  2]
 [ 2 75]]
정확도: 0.9649, 정밀도: 0.9740, 재현율: 0.9740, F1: 0.9740, AUC:0.9944
```

최종적으로 아래와 같이 입력값과 결과값을 데이터 프레임으로 보기 좋게 변환한 코드이다.   

```python
losses = [loss_dict['loss'] for loss_dict in trial_val.results]
result_df = pd.DataFrame({'max_depth': trial_val.vals['max_depth'],
                          'min_child_weight': trial_val.vals['min_child_weight'],
                          'colsample_bytree': trial_val.vals['colsample_bytree'],
                          'learning_rate': trial_val.vals['learning_rate'],
                          'losses': losses
                         }
                        )
result_df
```

<img width="500" alt="스크린샷 2023-06-02 오후 5 18 05" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7f4d936a-359d-4657-be79-771e2df2c9d7">


- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

