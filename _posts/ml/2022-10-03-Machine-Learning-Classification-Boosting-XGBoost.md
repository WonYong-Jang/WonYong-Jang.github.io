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

> 사이킷런에서 1.X 버전 기준으로 GBM(Gradient Boosting Machine)은 학습 속도가 현저하게 저하되는 
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

```python   
import xgboost   

print(xgboost._version_) # 버전 확인  
```

- - - 

## 3. XGBoost 란    

XGBoost는 부스팅 계열 알고리즘 중 하나이며, 아래와 같은 장점을 가지고 있다.   

<img width="850" alt="스크린샷 2023-06-01 오전 10 59 49" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/32f67260-7af2-473a-a41f-639cb1f36aea">   

또한, XGBoost는 파이썬 Wrapper와 사이킷런 Wrapper 를 제공한다.     

<img width="850" alt="스크린샷 2023-06-01 오전 11 00 00" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/bf30a14e-7f2d-4a2d-839b-70adaa0da4c0">    

파이썬 Wrapper와 사이킷런 Wrapper를 비교해 보면 아래와 같다.   

<img width="850" alt="스크린샷 2023-06-01 오전 11 00 14" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/080b2962-27d4-47e4-9d19-b18f82020506">


- - -   

## 4. XGBoost 조기 중단 기능   

`XGBoost는 특정 반복 횟수 만큼 더 이상 비용함수가 감소하지 않으면 지정된 
반복횟수를 다 완료하지 않고 수행을 종료`할 수 있다.( Early Stopping )    

<img width="279" alt="스크린샷 2023-05-29 오전 10 46 02" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/8aff57d4-4ce8-4db9-bf4e-cb4a07278eec">   

`이로 인해 학습을 위한 시간을 단축시킬 수 있고, 특히 최적화 튜닝 단계에서 적절하게 사용 가능`하다.    

> 대체적으로 early stopping을 사용하게 되면 성능이 올라가지만, 데이터가 적은 경우는 
떨어질 수 있다.   

`반복 횟수를 너무 짧게 하는 경우 예측 성능 최적화가 안된 상태에서 학습이 종료 될 수 있으므로 
유의할 필요가 있다.`       

또한, 조기 중단 설정은 학습 데이터가 아닌 검증 데이터로 해야 한다.   

> 아래 실습 예제를 보면, 학습 데이터는 계속 loss 값이 줄어들어 
오버피팅이 발생하지만 검증 데이터는 어느 순간 loss 값이 줄지 않는 
부분을 확인할 수 있다.   
> 해당 지점이 best model 될 것이다.   

조기 중단 설정을 위한 주요 파라미터는 아래와 같다.   

- early_stopping_rounds: 더 이상 비용 평가 지표가 감소하지 않는 최대 반복횟수   
- eval_metric: 반복 수행 시 사용하는 비용 평가 지표   
- eval_set: 평가를 수행하는 별도의 검증 데이터 세트이며 일반적으로 검증 데이터 세트에서 반복적으로 비용 감소 성능 평가   

> 예를들면 
early stopping rounds를 10으로 설정한 경우 10번 반복 모두 비용 함수가 감소하지 않으면 중단 시킨다.   

- - - 

## 5. XGBoost 파이썬 래퍼와 사이킷런 래퍼 하이퍼 파라미터 비교    

위에서 언급한 것처럼 XGBoost는 파이썬 Wrapper와 사이킷런 Wrapper 둘 다 
제공하기 때문에 이를 명확하게 구분하는 것이 중요하다.   

<img width="1300" alt="스크린샷 2023-06-01 오전 10 57 30" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/a9df617d-201e-4916-ba68-da8158e68560">   

<img width="1300" alt="스크린샷 2023-06-01 오전 10 57 06" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/0933755b-f50b-4866-847d-13c64c4f9353">   

`XGBoost는 Regularization(규제)를 제공하며, 이는 오차를 줄이기 위해서 
계속 학습에만 몰두하다 보면 오히려 오버피팅이 발생할 가능성이 있다.`   

Regularization은 너무 오차를 줄이는 데에만 몰두하지 않도록 제어 해주는 하이퍼 파라미터이다.   


- - - 

## 6. XGBoost 실습   

위스콘신 유방암 데이터 세트를 이용하여 실습을 해보자.   

아래와 같이 데이터 세트를 로딩하자.   

```python
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

```python
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

```python   
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

### 6-1) 파이썬 Wrapper 구현   

```python   
# 만약 구버전 XGBoost에서 DataFrame으로 DMatrix 생성이 안될 경우 X_train.values로 넘파이 변환. 
# 학습, 검증, 테스트용 DMatrix를 생성. 
dtr = xgb.DMatrix(data=X_tr, label=y_tr)        # 학습 
dval = xgb.DMatrix(data=X_val, label=y_val)     # 검증
dtest = xgb.DMatrix(data=X_test , label=y_test) # 테스트    
```

위와 같이 파이썬 Wrapper를 이용하여 구현하기 위해서는 DMatrix를 생성해야 한다.   

```python   
params = { 'max_depth':3,
           'eta': 0.05,        
           'objective':'binary:logistic',
           'eval_metric':'logloss'
        }
num_rounds = 400    # 몇번 반복해서 학습 할 건지
```

위에서 하이퍼 파라미터를 정의 해놓고 아래처럼, 파라미터로 전달한다.   
eta의 경우 learning rate(학습률)을 뜻하며, objective는 결정 함수(목적 함수)를 이진 분류로 
지정했다.   
eval metirc은 loss값에 log를 취하라고 지정했다.   


```python   
# 학습 데이터 셋은 'train' 또는 평가 데이터 셋은 'eval' 로 명기합니다. 
eval_list = [(dtr,'train'),(dval,'eval')] # 또는 eval_list = [(dval,'eval')] 만 명기해도 무방(dtrain 파라미터로 이미 전달 했기 때문에)   

# 하이퍼 파라미터와 early stopping 파라미터를 train( ) 함수의 파라미터로 전달
xgb_model = xgb.train(params = params , dtrain=dtr , num_boost_round=num_rounds , \
                      early_stopping_rounds=50, evals=eval_list )
```

위는 주어진 하이퍼 파라미터와 early stopping 파라미터를 train() 함수의 
파라미터로 전달하고 학습한다.   
`num_boost_round(n_estimators)를 400으로 주었기 때문에 400번 iteration을 
기대했지만 아래와 같이 176번에서 종료되었다.`   
`이는 early_stopping_rounds를 50으로 주었기 때문이며, 조기 중단 기능은 50번 
반복하는 동안 loss 값이 줄지 않는다면 중단 시킨다.`   

> loss 값은 낮을 수록 좋다.   

`아래 126번째 부터 보면 iteration이 증가될 수록 eval-logloss가 줄지 않는 것을 
확인할 수 있다.`       

> 하지만 train-logloss 값은 계속해서 줄어들어 오버피팅이 될 수 있기 때문에 
early stopping은 검증 데이터로 진행해야 한다.   

```
[0]	train-logloss:0.65016	eval-logloss:0.66183
[1]	train-logloss:0.61131	eval-logloss:0.63609
[2]	train-logloss:0.57563	eval-logloss:0.61144
[3]	train-logloss:0.54310	eval-logloss:0.59204
[4]	train-logloss:0.51323	eval-logloss:0.57329
[5]	train-logloss:0.48447	eval-logloss:0.55037
[6]	train-logloss:0.45796	eval-logloss:0.52929
[7]	train-logloss:0.43436	eval-logloss:0.51534
[8]	train-logloss:0.41150	eval-logloss:0.49718
[9]	train-logloss:0.39027	eval-logloss:0.48154
[10]	train-logloss:0.37128	eval-logloss:0.46990

// ...

[113]	train-logloss:0.02322	eval-logloss:0.25848
[114]	train-logloss:0.02290	eval-logloss:0.25833
[115]	train-logloss:0.02260	eval-logloss:0.25820
[116]	train-logloss:0.02229	eval-logloss:0.25905
[117]	train-logloss:0.02204	eval-logloss:0.25878
[118]	train-logloss:0.02176	eval-logloss:0.25728
[119]	train-logloss:0.02149	eval-logloss:0.25722
[120]	train-logloss:0.02119	eval-logloss:0.25764
[121]	train-logloss:0.02095	eval-logloss:0.25761
[122]	train-logloss:0.02067	eval-logloss:0.25832
[123]	train-logloss:0.02045	eval-logloss:0.25808
[124]	train-logloss:0.02023	eval-logloss:0.25855
[125]	train-logloss:0.01998	eval-logloss:0.25714
[126]	train-logloss:0.01973	eval-logloss:0.25587
[127]	train-logloss:0.01946	eval-logloss:0.25640
[128]	train-logloss:0.01927	eval-logloss:0.25685
[129]	train-logloss:0.01908	eval-logloss:0.25665
[130]	train-logloss:0.01886	eval-logloss:0.25712
[131]	train-logloss:0.01863	eval-logloss:0.25609
[132]	train-logloss:0.01839	eval-logloss:0.25649
[133]	train-logloss:0.01816	eval-logloss:0.25789
[134]	train-logloss:0.01802	eval-logloss:0.25811
[135]	train-logloss:0.01785	eval-logloss:0.25794
[136]	train-logloss:0.01763	eval-logloss:0.25876
[137]	train-logloss:0.01748	eval-logloss:0.25884
[138]	train-logloss:0.01732	eval-logloss:0.25867
[139]	train-logloss:0.01719	eval-logloss:0.25876
[140]	train-logloss:0.01696	eval-logloss:0.25987
[141]	train-logloss:0.01681	eval-logloss:0.25960
[142]	train-logloss:0.01669	eval-logloss:0.25982
[143]	train-logloss:0.01656	eval-logloss:0.25992
[144]	train-logloss:0.01638	eval-logloss:0.26035
[145]	train-logloss:0.01623	eval-logloss:0.26055
[146]	train-logloss:0.01606	eval-logloss:0.26092
[147]	train-logloss:0.01589	eval-logloss:0.26137
[148]	train-logloss:0.01572	eval-logloss:0.25999
[149]	train-logloss:0.01557	eval-logloss:0.26028
[150]	train-logloss:0.01546	eval-logloss:0.26048
[151]	train-logloss:0.01531	eval-logloss:0.26142
[152]	train-logloss:0.01515	eval-logloss:0.26188
[153]	train-logloss:0.01501	eval-logloss:0.26227
[154]	train-logloss:0.01486	eval-logloss:0.26287
[155]	train-logloss:0.01476	eval-logloss:0.26299
[156]	train-logloss:0.01461	eval-logloss:0.26346
[157]	train-logloss:0.01448	eval-logloss:0.26379
[158]	train-logloss:0.01434	eval-logloss:0.26306
[159]	train-logloss:0.01424	eval-logloss:0.26237
[160]	train-logloss:0.01410	eval-logloss:0.26251
[161]	train-logloss:0.01401	eval-logloss:0.26265
[162]	train-logloss:0.01392	eval-logloss:0.26264
[163]	train-logloss:0.01380	eval-logloss:0.26250
[164]	train-logloss:0.01372	eval-logloss:0.26264
[165]	train-logloss:0.01359	eval-logloss:0.26255
[166]	train-logloss:0.01350	eval-logloss:0.26188
[167]	train-logloss:0.01342	eval-logloss:0.26203
[168]	train-logloss:0.01331	eval-logloss:0.26190
[169]	train-logloss:0.01319	eval-logloss:0.26184
[170]	train-logloss:0.01312	eval-logloss:0.26133
[171]	train-logloss:0.01304	eval-logloss:0.26148
[172]	train-logloss:0.01297	eval-logloss:0.26157
[173]	train-logloss:0.01285	eval-logloss:0.26253
[174]	train-logloss:0.01278	eval-logloss:0.26229
[175]	train-logloss:0.01267	eval-logloss:0.26086
[176]	train-logloss:0.01258	eval-logloss:0.26103
```

이제 학습된 모델을 이용하여 predict()를 통해 예측 확률값을 반환하고 
예측 값으로 변환해보자.   

파이선 Wrapper의 predict는 확률 값이 나오기 때문에 아래와 같이 
0.5(threshold)기준으로 분류를 직접 해주어야 한다.   

```python   
pred_probs = xgb_model.predict(dtest)
print('predict( ) 수행 결과값을 10개만 표시, 예측 확률 값으로 표시됨')
print(np.round(pred_probs[:10],3))

# 예측 확률이 0.5 보다 크면 1 , 그렇지 않으면 0 으로 예측값 결정하여 List 객체인 preds에 저장 
preds = [ 1 if x > 0.5 else 0 for x in pred_probs ]
print('예측값 10개만 표시:',preds[:10])
```

Output

```
predict( ) 수행 결과값을 10개만 표시, 예측 확률 값으로 표시됨
[0.845 0.008 0.68  0.081 0.975 0.999 0.998 0.998 0.996 0.001]
예측값 10개만 표시: [1, 0, 1, 0, 1, 1, 1, 1, 1, 0]
```   

`정확도, 정밀도, 재현율` 등을 함수화 하여 확인해보자.   

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


get_clf_eval(y_test , preds, pred_probs)
```

Output

```
오차 행렬
[[34  3]
 [ 2 75]]
정확도: 0.9561, 정밀도: 0.9615, 재현율: 0.9740,    F1: 0.9677, AUC:0.9937
```

마지막으로 Feature Importance를 시각화 해보자.   

```python   
from xgboost import plot_importance

import matplotlib.pyplot as plt
%matplotlib inline

fig, ax = plt.subplots(figsize=(10, 12))
plot_importance(xgb_model, ax=ax)
```

<img width="730" alt="스크린샷 2023-06-01 오전 11 38 05" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/bff78731-cec8-44b4-817b-eb8062544057">    

### 6-2) 사이킷런 Wrapper 구현   

파이썬 Wrapper와의 차이점은 Dmatrix 를 사용할 필요가 없고, 
    아래와 같이 XGBClassifier를 이용하여 학습 및 예측한다.    

```python    
# 사이킷런 래퍼 XGBoost 클래스인 XGBClassifier 임포트
from xgboost import XGBClassifier

# Warning 메시지를 없애기 위해 eval_metric 값을 XGBClassifier 생성 인자로 입력. 미 입력해도 수행에 문제 없음.   
xgb_wrapper = XGBClassifier(n_estimators=400, learning_rate=0.05, max_depth=3, eval_metric='logloss')
xgb_wrapper.fit(X_train, y_train, verbose=True)
w_preds = xgb_wrapper.predict(X_test)
w_pred_proba = xgb_wrapper.predict_proba(X_test)[:, 1]  

get_clf_eval(y_test , w_preds, w_pred_proba)
```

early stopping을 50으로 설정하고 재 학습 및 예측을 해보자.   

```python   
from xgboost import XGBClassifier

xgb_wrapper = XGBClassifier(n_estimators=400, learning_rate=0.05, max_depth=3)
evals = [(X_tr, y_tr), (X_val, y_val)]
xgb_wrapper.fit(X_tr, y_tr, early_stopping_rounds=50, eval_metric="logloss", 
                eval_set=evals, verbose=True)

ws50_preds = xgb_wrapper.predict(X_test)
ws50_pred_proba = xgb_wrapper.predict_proba(X_test)[:, 1]

get_clf_eval(y_test , ws50_preds, ws50_pred_proba)
```

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

