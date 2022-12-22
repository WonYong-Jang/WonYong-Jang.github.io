---
layout: post
title: "[Machine Learning] 분류 알고리즘(Classification) - 앙상블(Ensemble) 기법의 Voting과 Bagging"
subtitle: "Voting, Bagging(bootstrap aggregation) / Random Forest" 
comments: true
categories : ML
date: 2022-09-30
background: '/img/posts/mac.png'
---

## 1. 앙상블(Ensemble)   

앙상블 학습(Ensemble Learning)을 통한 분류는 여러 개의 분류기(Classifier)를 
생성하고 그 예측을 결합함으로써 보다 정확한 최종 예측을 도출하는 기법을 말한다.   

어려운 문제의 결론을 내기 위해 여러 명의 전문가로 위원회를 구성해 
다양한 의견을 수렴하고 결정하듯이 앙상블 학습의 목표는 다양한 
분류기의 예측 결과를 결합함으로써 단일 분류기보다 신뢰성이 높은 
예측값을 얻는 것이다.   

앙상블의 유형은 일반적으로 보팅(Voting), 배깅(Bagging), 부스팅(Boosting)으로 
구분할 수 있으며, 이외에 스태킹(Stacking)등의 기법이 있다.   


`대표적인 배깅은 랜덤 포레스트(Random Forest) 알고리즘이 있으며, 
    부스팅은 에이다 부스팅, 그래디언트 부스팅, XGBoost, LightGBM등이 있다.`   
정형 데이터의 분류나 회귀에서는 GBM 부스팅 계열의 앙상블이 전반적으로 
높은 예측 성능을 나타낸다.   

넓은 의미로는 서로 다른 모델을 결합한 것들을 앙상블로 지칭하기도 한다.   

앙상블의 특징은 아래와 같다.   

- 단일 모델의 약점을 다수의 모델들을 결합하여 보완   

- 뛰어난 성능을 가진 모델들로만 구성하는 것보다 성능이 떨어지더라도 
서로 다른 유형의 모델을 섞는 것이 오히려 전체 성능이 도움이 될 수 있음.   

- 랜덤 포레스트 및 뛰어난 부스팅 알고리즘들은 모두 결정 트리 알고리즘을 
기반하여 알고리즘으로 적용함.     

- 결정 트리의 단점인 과적합(Overfitting)을 수십~수천개의 많은 분류기를 
결합해 보완하고 장점인 직관적인 분류 기준은 강화됨.    

- - - 

## 2. 보팅(Voting)과 배깅(Bagging)   

보팅과 배깅은 여러 개의 분류기가 투표를 통해 최종 예측 결과를 결정하는 방식이다.    

<img width="672" alt="스크린샷 2022-12-18 오후 5 16 14" src="https://user-images.githubusercontent.com/26623547/208288164-2690db79-5e3d-4b62-995e-e5ed3be26a43.png">    
 
`보팅과 배깅의 다른 점은 보팅의 경우 일반적으로 서로 다른 알고리즘을 가진 분류기를 
결합하는 것이고, 배깅의 경우 각각의 분류기가 모두 같은 유형의 알고리즘 기반이지만, 
    데이터 샘플링을 서로 다르게 가져가면서 학습을 수행해 보팅을 수행하는 것이다.`     

### 2-1) 보팅(Voting)   

먼저, 보팅의 경우는 다수의 분류기(classifier) 간 다수결로 최종 결과값을 구하는 Hard Voting과, 
    다수의 분류기들 간의 확률을 평균으로 결정하는 Soft Voting이 있다.   

> 일반적으로 하드 보팅보다는 소프트 보팅이 예측 성능이 상대적으로 우수하여 주로 사용되며, 여러 분류기를 결합하여 사용한다고 
무조건 성능이 좋은 것은 아니다.   

### 2-2) 배깅(Bagging)   

`배깅의 대표적인 알고리즘은 랜덤 포레스트(Random Forest) 이다.`   
랜덤 포레스트는 앙상블 알고리즘 중 비교적 빠른 수행 속도를 가지고 있으며, 
    다양한 영역에서 높은 예측 성능을 보이고 있다.   

<img width="450" alt="스크린샷 2022-12-18 오후 5 34 43" src="https://user-images.githubusercontent.com/26623547/208288808-5654676e-d520-459a-ba01-e6c35e634f21.png">   

랜덤 포레스트는 여러 개의 결정 트리 분류기가 전체 데이터에서 배깅 방식으로 
각자의 데이터를 샘플링해 개별적으로 학습을 수행한 뒤 
최종적으로 모든 분류기가 보팅을 통해 예측 결정을 하게 된다.   

랜덤 포레스트는 개별적인 분류기의 기반 알고리즘은 결정 트리이지만 
개별 트리가 학습하는 데이터 세트는 전체 데이터에서 
일부가 중첩되게 샘플링된 데이터 세트이다.   
`이렇게 여러개의 데이터 세트를 중첩되게 분리하는 것을 
부트스트래핑(bootstrapping) 분할 방식이라고 한다.`      

> 배깅(Bagging)은 bootstrap aggregation의 줄일말이며, 아래 그림처럼 1부터 
10까지의 전체 데이터가 있고 여기서 하나씩 숫자를 뽑아서 서브 세트를 만든다.   

<img width="1000" alt="스크린샷 2022-12-18 오후 5 45 40" src="https://user-images.githubusercontent.com/26623547/208289412-949d2421-6b97-4e26-9d53-365a1c0a2696.png">    

`원본 데이터 건수가 10개인 학습 데이터 세트에 랜덤 포레스트를 3개의 결정 트리 기반으로 
학습하려고 n_estimators=3으로 하이퍼 파라미터를 부여하면 다음과 같이 
데이터 서브세트가 만들어진다.`   

#### 2-2-1) Random Forest   

`사이킷런은 랜덤 포레스트 분류를 위해 RandomForestClassifier 클래스`를 제공한다.   

- n_estimators: `랜덤 포레스트에서 결정 트리의 개수를 지정한다. 디폴트는 100개이며, 
    많이 설정할 수록 좋은 성능을 기대할 수 있지만 계속 증가시킨다고 성능이 무조건 향상되는 것은 
    아니다. 또한, 늘릴수록 학습 수행 시간이 오래 걸리는 것도 감안해야 한다.`      

- max_features: `결정 트리에 사용된 피처의 갯수이다. 하지만, RandomForestClassifier의 
기본 max_features는 None이 아니라 auto이다.(즉 sqrt와 같다)` 따라서 랜덤 포레스트의 트리를 
분할하는 피처를 참조할 때 전체 피처가 아니라 sqrt(전체 피처 개수)만큼 참조한다. (전체 피처가 16개라면 분할을 위해 4개를 참조하며 
        각 결정 트리마다 다른 샘플의 4개 피처를 사용한다는 의미)     

- max_depth나 min_samples_leaf와 같이 결정 트리에서 과적합을 개선하기 위해 
사용되는 파라미터가 랜덤 포레스트에도 똑같이 적용될 수 있다.   


사이킷런에서 제공하는 RandomForestClassifier를 이용하여 직접 구현해보자.   

```
from sklearn.ensemble import RandomForestClassifier
from sklearn.datasets import load_iris
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

df = load_iris()

X_train, X_test, y_train, y_test = train_test_split(df.data, df.target, test_size = 0.2, random_state = 121)

# 랜덤포레스트 학습 및 별도의 테스트 셋으로 예측 성능 평가 
rf_clf = RandomForestClassifier(n_estimators=100, random_state=0, max_depth=8)
rf_clf.fit(X_train, y_train)
pred = rf_clf.predict(X_test)

accuracy = accuracy_score(y_test, pred)
print('랜덤 포레스트 정확도: {0: .4f}'. format(accuracy))
```

`GridSearchCV를 이용하여 하이퍼파라미터를 최적화 해보자.`       

```
from sklearn.model_selection import GridSearchCV

params = {
    'max_depth': [2, 4, 6, 8, 16, 24],
    'min_samples_leaf': [1, 3, 6, 8 ,12, 14],
    'min_samples_split': [2,4, 8,10, 16]
    
}

# RandomForestClassifier 객체 생성 후 GridSearchCV 수행 
# n_jobs의 default는 None이며, -1로 설정하게 되면 pc의 모든 cpu를 모두 사용하여 병렬로 처리
# shift + tab 단축키로 파라미터 확인 가능
rf_clf = RandomForestClassifier(n_estimators=100, random_state=0, n_jobs=-1)
grid_cv = GridSearchCV(rf_clf, param_grid=params, cv=2, n_jobs=-1)
grid_cv.fit(X_train, y_train)

print('최적 하이퍼 파라미터:\n', grid_cv.best_params_)
print('최고 예측 정확도: {0: .4f}'. format(grid_cv.best_score_))
```

Output

```
최적 하이퍼 파라미터:
 {'max_depth': 4, 'min_samples_leaf': 1, 'min_samples_split': 10}
최고 예측 정확도:  0.9667
```

아래와 같이 각 하이퍼 파라미터의 score와 자세한 내용을 확인 할 수 있다.   

```
pd.set_option('display.max_rows', 100)
pd.set_option('display.max_colwidth', 100)
pd.set_option('display.max_columns',100)

scores_df = pd.DataFrame(grid_cv.cv_results_).sort_values(by = ['rank_test_score'], ascending=True)[:20]
scores_df
```

최종적으로 최적화된 하이퍼 파라미터를 이용하여 랜덤포레스트 모델을 학습 후 예측값을 확인한다.   


```
rf_clf1 = RandomForestClassifier(n_estimators=100, min_samples_leaf=1, max_depth=4, min_samples_split=10, random_state=0)

rf_clf1.fit(X_train, y_train)
pred = rf_clf1.predict(X_test)

accuracy = accuracy_score(y_test, pred)
print('랜덤 포레스트 정확도: {0: .4f}'. format(accuracy))
```

`학습된 모델의 각 피처별 중요도를 확인해보고 시각화를 해보자.`      

```
feature_importance_values = rf_clf_result.feature_importances_
feature_importance_values = pd.Series(feature_importance_values, index=df.feature_names)
feature_importance_values
```

Output

```
sepal length (cm)    0.082101
sepal width (cm)     0.013294
petal length (cm)    0.451294
petal width (cm)     0.453310
```

아래 코드는 피처별 중요도를 x 축으로 두고, y 축은 feature의 이름들로 
구성하였다.   

```
import matplotlib.pyplot as plt
import seaborn as sns
%matplotlib inline

plt.figure(figsize = (8,6))
plt.title('Feature importances')
sns.barplot(x=feature_importance_values, y = df.feature_names)
```


<img width="602" alt="스크린샷 2022-12-22 오후 10 10 19" src="https://user-images.githubusercontent.com/26623547/209141566-04d41fcb-0ca2-4643-831c-5ecfae4fa7c4.png">   





- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

