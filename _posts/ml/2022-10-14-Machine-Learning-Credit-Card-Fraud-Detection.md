---
layout: post
title: "[Machine Learning] 신용카드 사기 예측 실습"
subtitle: "kaggle 분류 예측 실습(불균형 데이터) / SMOTE 오버 샘플링(imblearn), 이상치(Outlier) 데이터 제거, StandardScaler 또는 Log 변환"    
comments: true
categories : ML
date: 2022-10-14
background: '/img/posts/mac.png'
---

## 1. 입력 데이터 확인 및 로딩   

[kaggle](https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud)에서 
creditcard.csv 파일을 다운로드하고 로딩한다.   

```python
import pandas as pd
import numpy as np 
import matplotlib.pyplot as plt
import warnings
warnings.filterwarnings("ignore")
%matplotlib inline

card_df = pd.read_csv('./creditcard.csv')
card_df.head(3)

card_df['Class'].value_counts()
```

Output

```
0    284315  ## 정상 거래 
1       492  ## 사기 거래 
```

위 데이터 라벨 값을 각각 확인해보면, `신용카드 사기건이 492(0.172%)으로 매우 불균형 되어 있는 것을 
확인할 수 있다.`   
이번 글에서는 
이렇게 불균형 되어 있는 데이터 세트를 이용하여 학습할 때 사용할 수 있는 
피처 엔지니어링 방법(Feature Engineering)에 대해서 
살펴보고 학습 및 예측을 진행해보자.   

- - - 

## 2. 데이터 전처리   

위에서 데이터를 확인한 것처럼 심하게 불균형 데이터 세트 이기 때문에, 
    아래와 같이 다양한 Feature Enginerring을 통해 데이터를 전처리를 해보자.   

- 중요 Feature의 데이터 분포도 변경   
    - 정규 분포   
    - Log 변환   
- 이상치(Outlier) 제거   
- SMOTE 오버 샘플링   

먼저, 여러 데이터 전처리를 진행할 것이기 때문에 원본 데이터 프레임은 
유지하고 데이터 가공을 위한 데이터 프레임을 복사하여 반환해보자.   

또한, 불필요한 Time 피처를 제거해보자.   

```python
from sklearn.model_selection import train_test_split

# 인자로 입력받은 DataFrame을 복사 한 뒤 Time 컬럼만 삭제하고 복사된 DataFrame 반환
def get_preprocessed_df(df=None):
    df_copy = df.copy()
    df_copy.drop('Time', axis=1, inplace=True)
    return df_copy
```

이제 위 함수에 여러 데이터 전처리 과정을 추가할 것이며, 
    학습과 데이터 세트를 반환하는 함수를 생성해보자.           

```python
# 사전 데이터 가공 후 학습과 테스트 데이터 세트를 반환하는 함수.
def get_train_test_dataset(df=None):
    # 인자로 입력된 DataFrame의 사전 데이터 가공이 완료된 복사 DataFrame 반환
    df_copy = get_preprocessed_df(df)
    
    # DataFrame의 맨 마지막 컬럼이 레이블, 나머지는 피처들
    X_features = df_copy.iloc[:, :-1]
    y_target = df_copy.iloc[:, -1]
    
    # train_test_split( )으로 학습과 테스트 데이터 분할. stratify=y_target으로 Stratified 기반 분할
    X_train, X_test, y_train, y_test = \
    train_test_split(X_features, y_target, test_size=0.3, random_state=0, stratify=y_target)
    
    # 학습과 테스트 데이터 세트 반환
    return X_train, X_test, y_train, y_test


X_train, X_test, y_train, y_test = get_train_test_dataset(card_df)
```

`매우 불균형 데이터 이기 때문에 학습과 테스트 데이터를 분할 할 때, stratify 옵션을 추가해 줘야 한다.`     
불균형 데이터가 적절하게 분리 되었는지 확인해보자.   

```python
print('학습 데이터 레이블 값 비율')
print(y_train.value_counts()/y_train.shape[0] * 100)
print('테스트 데이터 레이블 값 비율')
print(y_test.value_counts()/y_test.shape[0] * 100)
```

Output

```
학습 데이터 레이블 값 비율
0    99.827451
1     0.172549
Name: Class, dtype: float64
테스트 데이터 레이블 값 비율
0    99.826785
1     0.173215
Name: Class, dtype: float64
```

평가를 위한 함수도 아래와 같이 생성하였다.   

```python
from sklearn.metrics import confusion_matrix, accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

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

Estimator 객체와 학습 및 테스트 데이터를 받아 성능 측정하는 함수도 아래와 같이 생성해두자.   

```python
# 인자로 사이킷런의 Estimator객체와, 학습/테스트 데이터 세트를 입력 받아서 학습/예측/평가 수행.
def get_model_train_eval(model, ftr_train=None, ftr_test=None, tgt_train=None, tgt_test=None):
    model.fit(ftr_train, tgt_train)
    pred = model.predict(ftr_test)
    pred_proba = model.predict_proba(ftr_test)[:, 1]
    get_clf_eval(tgt_test, pred, pred_proba)
    
```


### 2-1) Log 변환 또는 정규 분포 변환      

신용카드 사기 검출 데이터에서 Amount 라는 피처가 있고, 대부분 
금액은 모델 성능에 중요한 피처로 사용된다.   

또한, 금액은 skew 되기 쉬운 피처이기도 하다.   

```python
import seaborn as sns

plt.figure(figsize=(8, 4))
plt.xticks(range(0, 30000, 1000), rotation=60)
sns.histplot(card_df['Amount'], bins=100, kde=True)
plt.show()
```

`부동산 가격, 소득 등도 동일하게 금액은 위 그림 처럼 skew 되기 쉽기 때문에
정규 분포 형태로 변환해 주는 것이 좋다.`   

> 머신러닝을 이루는 기반 알고리즘이 데이터가 정규 분포 형태를 가지고 있다고 가정하고 
만들어지 경우들이 있기 때문에 데이터를 정규 분포 형태로 해주는 게 좋다.   
> 대표적으로 선형 계열 알고리즘인 Logistic Regression이 있다.   

<img width="600" alt="스크린샷 2023-06-06 오후 8 46 18" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/f1f8e656-982b-4deb-a252-f0075e0857a0">   

변환 하는 방법은 StandardScaler와 Log 변환을 사용하는 방법이 있다.     

> 대체적으로, Log 변환이 조금 더 좋은 성능 향상이 있다.   

먼저, `StandardScaler`를 사용해보자.   

```python
from sklearn.preprocessing import StandardScaler
# 사이킷런의 StandardScaler를 이용하여 정규분포 형태로 Amount 피처값 변환하는 로직으로 수정. 
def get_preprocessed_df(df=None):
    df_copy = df.copy()
    scaler = StandardScaler()
    amount_n = scaler.fit_transform(df_copy['Amount'].values.reshape(-1, 1)) # 데이터 프레임을 values를 통해 ndarray로 변환 후 2차원이 필요하기 때문에 reshape   
    # 변환된 Amount를 Amount_Scaled로 피처명 변경후 DataFrame맨 앞 컬럼으로 입력   
    df_copy.insert(0, 'Amount_Scaled', amount_n)
    # 기존 Time, Amount 피처 삭제
    df_copy.drop(['Time','Amount'], axis=1, inplace=True)
    return df_copy
```

다음으로는 `Log 변환`에 대해 살펴보고 구현해보자.   

<img width="1000" alt="스크린샷 2023-06-06 오후 12 38 52" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/c4d706a2-6914-4ed8-8cfa-793e7a05981b">   

`위 그림과 같이 skew 된 데이터 분포를 log 변환을 통해 정규 분포에 가깝게 변환해 준다.`     

```python
def get_preprocessed_df(df=None):
    df_copy = df.copy()
    # 넘파이의 log1p( )를 이용하여 Amount를 로그 변환 
    amount_n = np.log1p(df_copy['Amount'])
    df_copy.insert(0, 'Amount_Scaled', amount_n)
    df_copy.drop(['Time','Amount'], axis=1, inplace=True)
    return df_copy
```

이제 얼마나 정규 분포로 스케일링이 되었는지 확인해보자.     

```python
import seaborn as sns

plt.figure(figsize=(8, 4))
sns.histplot(X_train['Amount_Scaled'], bins=50, kde=True)
plt.show()
```

결과를 확인해보면, skew 되어 있는 부분이 사라졌고 정규 분포 형태를
    나타내는 것을 확인할 수 있다.   

<img width="500" alt="스크린샷 2023-06-06 오후 9 16 30" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/52b988be-80ba-4276-8513-076dbb42db69">


### 2-2) IQR(Inter Quantile Range)를 이용한 이상치 제거  

IQR 방식으로 이상치(Outlier)를 탐지하고 제거해보자.      

> IQR은 4분위로 범위를 나눈다.   

`최소값과 최대값을 아래와 같이 지정해 놓고 해당 범위가 
넘어 가는 값을 이상치로 보고 제거한다.`        

> 예를 들면, 회사 내에 연봉을 나열하고 통계를 내는데 빌게이츠가 있다면 평균 연봉이 너무 많이 상승할 것이다.   
> 따라서, 이런 부분을 이상치로 보고 제거한다.   

<img width="1028" alt="스크린샷 2023-06-06 오후 10 00 26" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/971a333d-42c8-402e-b62a-96ba5b5bd8e3">   

이를 코드로 구현해보면 아래와 같다.   

피처들의 상관 관계를 확인해서, 결정 레이블인 class 값과 
가장 상관도가 높은 피처인 v14 에서만 적용해보자.   

`이상치 제거 할 때 주의해야 할 점은 이상치 제거는 최소로 진행해야 한다.`    


`또한, 이상치 제거는 학습 데이터에만 적용하는 것이 좋으며 테스트 데이터에는 이상치를 삭제하지 않는 것이 좋다.`   

> 실제 예측에서는 이상치가 포함된 데이터가 사용 될 수도 있기 때문이다.   


```python
import numpy as np

def get_outlier(df=None, column=None, weight=1.5):
    # fraud에 해당하는 column 데이터만 추출, 1/4 분위와 3/4 분위 지점을 np.percentile로 구함. 
    fraud = df[df['Class']==1][column]
    quantile_25 = np.percentile(fraud.values, 25)
    quantile_75 = np.percentile(fraud.values, 75)
    # IQR을 구하고, IQR에 1.5를 곱하여 최대값과 최소값 지점 구함. 
    iqr = quantile_75 - quantile_25
    iqr_weight = iqr * weight
    lowest_val = quantile_25 - iqr_weight    # 최소 
    highest_val = quantile_75 + iqr_weight   # 최대   
    # 최대값 보다 크거나, 최소값 보다 작은 값을 아웃라이어로 설정하고 DataFrame index 반환. 
    outlier_index = fraud[(fraud < lowest_val) | (fraud > highest_val)].index
    return outlier_index
```

`np.percentile을 이용하여 IQR을 구하는데, 이해를 돕기 위해 아래를 살펴보자.`      

> V14 컬럼에서 최소 값 부터 최대 값까지 나열이 되어 있고 분위 지점을 찾을 수 있다.   

```python
# -19.2143254902614 으로 동일한 값이 출력된다.
np.min(card_df['V14'].values) 
np.percentile(card_df['V14'].values, 0)


# 10.5267660517847 으로 동일한 값이 출력된다.  
np.max(card_df['V14'].values) 
np.percentile(card_df['V14'].values, 100)

즉, 각각 25%, 75% 지점의 값이 출력이 된다.   
np.percentile(card_df['V14'].values, 25)
np.percentile(card_df['V14'].values, 75)
```

```python

```

### 2-3) Undersampling과 Oversampling   

사기 검출 데이터는 사기 건수가 매우 적으므로 아래와 같이 오버 샘플링(Oversampling)을 통해 학습 데이터를 확보할 예정이다.  


<img width="1000" alt="스크린샷 2023-06-06 오후 12 44 31" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/080e4afd-1d27-4f65-8c73-417665b7fb86">    

`오버 샘플링 중 아래 그림과 같이 SMOTE(Synthetic Minority Over Sampling Technique)`을 사용할 것이다.   

<img width="1000" alt="스크린샷 2023-06-06 오후 12 47 28" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7b6e0b74-e220-4433-8125-e5a90081c3c0">   

- - -   

## 3. 학습 및 예측   

[LightGBM](https://wonyong-jang.github.io/ml/2022/10/04/Machine-Learning-Classification-Boosting-LightGBM.html)을 통해 
학습을 진행할 것이며, `LightGBM 2.1.0 이상 버전에서 boost_from_average 옵션이 True가 Default로 변경되었기 
때문에 주의해야 한다.`   

`boost_from_average가 True일 경우 레이블 값이 극도로 불균형 분포를 이루는 경우 
재현률 및 roc auc 성능이 매우 저하된다.`   

`따라서, 레이블 값이 극도로 불균형할 경우 boost_from_average를 False로 설정하는 것이 유리하다.`   

> 레이블 값이 균일한 경우 True가 일반적으로 더 좋은 성능을 낸다.   

```python
from lightgbm import LGBMClassifier

lgbm_clf = LGBMClassifier(n_estimators=1000, num_leaves=64, n_jobs=-1, boost_from_average=False)
get_model_train_eval(lgbm_clf, ftr_train=X_train, ftr_test=X_test, tgt_train=y_train, tgt_test=y_test)
```


- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

