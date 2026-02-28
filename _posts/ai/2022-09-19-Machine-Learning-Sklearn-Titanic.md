---
layout: post
title: "[Machine Learning] 사이킷런으로 수행하는 생존자 예측 실습"
subtitle: "데이터 분석 및 전처리 / 교차검증 / 하이퍼 파라미터 최적화 / seaborn을 이용한 시각화" 
comments: true
categories : AI
date: 2022-09-19
background: '/img/posts/mac.png'
---

이번 글에서는 사이킷런을 이용하여 타이타닉 생존자 예측을 해보자.   
데이터는 [kaggle](https://www.kaggle.com/c/titanic/data)을 참고하였다.   

- - - 

## 1. 데이터 로드 및 분석   

kaggle에서 타이타닉 train 데이터를 로드하고, 데이터를 분석해보자.   

```
import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder

import matplotlib.pyplot as plt
import seaborn as sns
%matplotlib inline

pd.set_option('display.max_rows', 100)
pd.set_option('display.max_colwidth', 100)
pd.set_option('display.max_columns',100)

titanic_df = pd.read_csv('titanic_train.csv')
titanic_df
```

<img width="900" alt="스크린샷 2022-09-19 오후 12 59 07" src="https://user-images.githubusercontent.com/26623547/190947678-5c08b998-2bb3-46af-91e3-39984e4fcc5a.png">    

우리가 예측해야할 Target은 survived 생존 여부이며, 각 feature 들은 위와 같다.   
각 feature들의 정보를 살펴보자.   

```
print(titanic_df.info()) # 데이터 프레임의 모든 기본 정보를 확인   
```

<img width="400" alt="스크린샷 2022-09-19 오후 1 03 24" src="https://user-images.githubusercontent.com/26623547/190948107-2e1ce753-1fac-4149-80c5-313f9220841a.png">   


```
titanic_df.describe() # 기초 통계 정보 확인   
```

<img width="600" alt="스크린샷 2022-09-19 오후 1 04 44" src="https://user-images.githubusercontent.com/26623547/190948231-2b13334e-d239-42e7-90f4-e65812dd7b0e.png">   


- - - 

## 2. 데이터 전처리    

위에서 살펴본 feature들의 데이터 전처리를 해보자.   
널 값 처리 및 라벨 인코딩과 불필요한 피처를 제거하고, 이를 보기 좋게 함수화 해보자.   

```
# Null 값 처리
def fillna(df):
    df['Age'].fillna(df['Age'].mean(), inplace=True)
    df['Cabin'].fillna('N', inplace=True)
    df['Embarked'].fillna('N', inplace=True)
    print('데이터 세트 Null 값 개수: ', df.isnull().sum().sum())

    return df

# 머신러닝 알고리즘에 불필요한 피처 제거
def drop_features(df):
    df.drop(['PassengerId', 'Name', 'Ticket'], axis=1, inplace=True)
    return df

# 레이블 인코딩 수행
def format_features(df):
    df['Cabin'] = df['Cabin'].str[:1]
    features = ['Cabin', 'Sex', 'Embarked']
    for feature in features:
        le = LabelEncoder()
        le = le.fit(df[feature])
        df[feature] = le.transform(df[feature])
    return df

# 앞에서 설정한 Data Preprocessing 함수 호출
def transform_feature(df):
    df = fillna(df)
    df = drop_features(df)
    df = format_features(df)
    return df
```



- - - 

## 3. 주요 컬럼 EDA   

Cabin feature 컬럼 분포를 보게 되면, 너무 많은 선실 정보를 가지고 있게 된다.   
따라서, 선실정보 첫 글자만 추출하여 너무 세분화된 데이터를 가공해보자.    

```
titanic_df['Cabin'].value_counts()

## Output  
N              687
C23 C25 C27      4
G6               4
B96 B98          4
C22 C26          3
              ... 
E34              1
C7               1
C54              1
E36              1
C148             1
Name: Cabin, Length: 148, dtype: int64
```

```
titanic_df['Cabin'] = titanic_df['Cabin'].str[:1]
titanic_df['Cabin'].value_counts()

## Output  
N    687
C     59
B     47
D     33
E     32
A     15
F     13
G      4
T      1
Name: Cabin, dtype: int64  
```

이번에는 `성별과 생존 간의 관계`를 살펴보자.    

`seaborn을 이용하여 barplot을 아래와 같이 그려보자.`    

```
sns.barplot(x='Sex', y='Survived', data=titanic_df)
```

<img width="415" alt="스크린샷 2022-09-19 오후 1 49 26" src="https://user-images.githubusercontent.com/26623547/190951618-b4971313-c090-41a1-9fb3-1cf6fc28b348.png">      

이를 조금 더 세분화 해보면 x 축을 선박 등급, y를 생존여부로 놓고 각 선박 등급일 때 
성별도 같이 보면 아래와 같다.   

```
sns.barplot(x='Pclass', y='Survived', hue='Sex', data=titanic_df)   
```

<img width="416" alt="스크린샷 2022-09-19 오후 1 55 17" src="https://user-images.githubusercontent.com/26623547/190952012-208f4ff2-f892-4688-b673-efe71347910c.png">   

`또한, 나이에 따라서도 생존률이 어떻게 되는지 확인해보려고 하는데 
나이는 연속형 값이여서 이를 카테고리화 해보자.`   


```
# 입력 age에 따라 구분값을 반환하는 함수 설정. DataFrame의 apply lambda식에 사용
def get_category(age):
    cat = ''
    if age <= -1: cat = 'Unknown'
    elif age <=5: cat = 'Baby'
    elif age <=12: cat = 'Child'
    elif age <=18: cat = 'Teenager'
    elif age <=25: cat = 'Student'
    elif age <=35: cat = 'Young Adult'
    elif age <=60: cat = 'Adult'
    else: cat = 'Elderly'
    
    return cat
```

```
group_names = ['Unknown', 'Baby', 'Child', 'Teenager', 'Student', 'Young Adult', 'Adult', 'Elderly']

titanic_df['Age_cat'] = titanic_df['Age'].apply(lambda x: get_category(x))

# 막대그래프 크기 figure를 더 크게 설정 
plt.figure(figsize=(10,6))
sns.barplot(x='Age_cat', y='Survived', hue='Sex', data=titanic_df, order=group_names)
```

<img width="636" alt="스크린샷 2022-09-19 오후 2 17 19" src="https://user-images.githubusercontent.com/26623547/190953718-3431e902-e735-4ed0-9193-5f5ed527202f.png">    

- - -

## 4. 데이터 학습 및 예측   

학습 데이터와 테스트 데이터를 분리하고 각 알고리즘 별로 학습해보자.   


```
y_titanic_df = titanic_df['Survived']
X_titanic_df = titanic_df.drop('Survived', axis=1, inplace=False)

X_titatic_df = transform_feature(X_titanic_df)

X_train, X_test, y_train, y_test=train_test_split(X_titanic_df, y_titanic_df, test_size=0.2, random_state=11)
```

```
# 결정트리, RandomForest, 로지스틱 회귀를 위한 사이킷런 클래스 생성
dt_clf = DecisionTreeClassifier(random_state=11)
rf_clf = RandomForestClassifier(random_state=11)
lr_clf = LogisticRegression(solver='liblinear')
```

```
# DecisionTreeClassifier 학습/예측/평가
dt_clf.fit(X_train, y_train)
dt_pred = dt_clf.predict(X_test)
print('DecisionTreeClassifier 정확도: {0: .4f}'.format(accuracy_score(y_test, dt_pred)))

# RandomForestClassifier 학습/예측/평가
rf_clf.fit(X_train, y_train)
rf_pred = rf_clf.predict(X_test)
print('RandomForestClassifier 정확도: {0: .4f}'.format(accuracy_score(y_test, rf_pred)))

# LogisticRegression 학습/예측/평가
lr_clf.fit(X_train, y_train)
lr_pred = lr_clf.predict(X_test)
print('LogisticRegression 정확도: {0: .4f}'.format(accuracy_score(y_test, lr_pred)))
```

Output   

```
DecisionTreeClassifier 정확도:  0.7877
RandomForestClassifier 정확도:  0.8547
LogisticRegression 정확도:  0.8659
```

- - - 

## 5. 교차 검증 및 하이퍼 파라미터 최적화       

cv= 5의 교차검증을 먼저 해보자.   

```
from sklearn.model_selection import cross_val_score

scores = cross_val_score(dt_clf, X_titanic_df, y_titanic_df, cv=5)
for iter_count, accuracy in enumerate(scores):
    print("교차검증 {0} 정확도: {1: .4f}".format(iter_count, accuracy))
    
print("평균 정확도: {0: .4f}".format(np.mean(scores)))
```

Output

```
교차검증 0 정확도:  0.7430
교차검증 1 정확도:  0.7753
교차검증 2 정확도:  0.7921
교차검증 3 정확도:  0.7865
교차검증 4 정확도:  0.8427
평균 정확도:  0.7879
```

GridSearchCV를 이용하여 하이퍼 파라미터를 최적화 해보자.   

```
from sklearn.model_selection import GridSearchCV

parameters = {'max_depth':[2,3,5,10],
             'min_samples_split':[2,3,5], 'min_samples_leaf':[1,5,8]}

grid_dclf = GridSearchCV(dt_clf, param_grid=parameters, scoring='accuracy', cv=6)
grid_dclf.fit(X_train, y_train)

print('GridSearchCV 최적 하이퍼 파라미터: ', grid_dclf.best_params_)
print('GridSearchCV 최고 정확도: {0: .4f}'.format(grid_dclf.best_score_))
best_dclf = grid_dclf.best_estimator_

# GridSearchCV의 최적 하이퍼 파라미터로 학습된 Estimator로 예측 및 평가 수행
result = best_dclf.predict(X_test)
accuracy = accuracy_score(y_test, result)
print('테스트 세트에서의 DecisionTreeClassifier 최고 정확도: {0: .4f}'.format(accuracy))
```

Output   

```
GridSearchCV 최적 하이퍼 파라미터:  {'max_depth': 3, 'min_samples_leaf': 5, 'min_samples_split': 2}
GridSearchCV 최고 정확도:  0.8019
테스트 세트에서의 DecisionTreeClassifier 최고 정확도:  0.8715
```

하이퍼파라미터 최적화를 통해서 정확도가 향상된 것을 확인할 수 있다.   

- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

