---
layout: post
title: "[Machine Learning] 텍스트 분석(Text Analysis)의 Classification"
subtitle: "Newsgroup 분류하기 / CountVectorizer, TfidfVectorizer" 
comments: true
categories : ML
date: 2023-05-28
background: '/img/posts/mac.png'
---

이번 글에서는 텍스트 분석에서 분류(Classification)을 실습해보자.   

아래와 같이 여러 뉴스 문서를 그룹 카테고리 별로 분류를 진행하려고 한다.   

<img width="864" alt="스크린샷 2023-05-28 오전 10 48 07" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/9089985d-d8c4-4d4d-b892-429fb8fb18f1">    

- - - 

## 1. 데이터 로딩과 데이터 구성 확인   

아래와 같이 데이터를 가져올 수 있고, subset으로 train, test를 
각각 가져올 수도 있고 all 을 통해 모두 가져올 수도 있다.   

```
from sklearn.datasets import fetch_20newsgroups

news_data = fetch_20newsgroups(subset='all',random_state=156)
```

가져온 데이터에 대해 살펴보자.   

```
type(news_data)

// sklearn.utils.Bunch
```

```
print(news_data.keys())

// dict_keys(['data', 'filenames', 'target_names', 'target', 'DESCR'])
```

아래와 같이 각 key 값에 대해서 데이터를 확인해 볼 수 있으며, target names는 
20개의 뉴스 그룹 이름이다.   

```
news_data.target_names

// Output   
['alt.atheism',
 'comp.graphics',
 'comp.os.ms-windows.misc',
 'comp.sys.ibm.pc.hardware',
 'comp.sys.mac.hardware',
 'comp.windows.x',
 'misc.forsale',
 'rec.autos',
 'rec.motorcycles',
 'rec.sport.baseball',
 'rec.sport.hockey',
 'sci.crypt',
 'sci.electronics',
 'sci.med',
 'sci.space',
 'soc.religion.christian',
 'talk.politics.guns',
 'talk.politics.mideast',
 'talk.politics.misc',
 'talk.religion.misc']
```  

20개의 뉴스 그룹 target의 분포도를 아래와 같이 확인해 봤다.   

```
import pandas as pd

print('target 클래스의 값과 분포도 \n',pd.Series(news_data.target).value_counts().sort_index())   

// Output
target 클래스의 값과 분포도
0     799
1     973
2     985
3     982
4     963
5     988
6     975
7     990
8     996
9     994
10    999
11    991
12    984
13    990
14    987
15    997
16    910
17    940
18    775
19    628
```   

그럼 이제 학습 데이터와 테스트 데이터를 분리해보자.  
뉴스에서 본문 내용으로만 학습 및 테스트를 진행하기 위해 
header, footer 등의 정보는 제외했다.   

```
from sklearn.datasets import fetch_20newsgroups

# subset='train'으로 학습용(Train) 데이터만 추출, remove=('headers', 'footers', 'quotes')로 내용만 추출
train_news= fetch_20newsgroups(subset='train', remove=('headers', 'footers', 'quotes'), random_state=156)
X_train = train_news.data
y_train = train_news.target
print(type(X_train))

# subset='test'으로 테스트(Test) 데이터만 추출, remove=('headers', 'footers', 'quotes')로 내용만 추출
test_news= fetch_20newsgroups(subset='test',remove=('headers', 'footers','quotes'),random_state=156)
X_test = test_news.data
y_test = test_news.target
print('학습 데이터 크기 {0} , 테스트 데이터 크기 {1}'.format(len(train_news.data) , len(test_news.data)))
```

Output  

```
<class 'list'>
학습 데이터 크기 11314 , 테스트 데이터 크기 7532
```

- - - 

## 2. 피처 벡터화 및 모델 학습   

CountVectorizer 와 TfidfVectorizer 각각 진행해보자.   

`피처 벡터화 할 때 주의해야 할 점은 학습 데이터에 대해 
fit() 된 객체를 이용해서 
테스트 데이터를 피처 벡터화를 해야 한다.`   

`즉 학습 데이터를 fit() 호출 후, 테스트 데이터 에서 다시 fit()을 
호출하면 안된다.`      
`이는 이렇게 테스트 데이터에서 fit()을 다시 수행하게 되면 
기존 학습된 모델에서 가지는 feature의 갯수가 달리지기 때문이다.`    

각각 실습을 하면서 자세히 살펴보자.   

### 2-1) CountVectorizer   

CountVectorizer 객체를 생성 후 학습 데이터를 이용하여 fit 된 객체를 
이용하여 학습 및 테스트 각각 transform 메서드를 호출하여 
피처 벡터화를 진행 했다.   

```
from sklearn.feature_extraction.text import CountVectorizer

# Count Vectorization으로 feature extraction 변환 수행.
cnt_vect = CountVectorizer()
cnt_vect.fit(X_train)
X_train_cnt_vect = cnt_vect.transform(X_train)

# 학습 데이터로 fit( )된 CountVectorizer를 이용하여 테스트 데이터를 feature extraction 변환 수행.
X_test_cnt_vect = cnt_vect.transform(X_test)

print('학습 데이터 Text의 CountVectorizer Shape:',X_train_cnt_vect.shape)
print('테스트 데이터 Text의 CountVectorizer Shape:',X_test_cnt_vect.shape)
```

Output


```
학습 데이터 Text의 CountVectorizer Shape: (11314, 101631)
테스트 데이터 Text의 CountVectorizer Shape: (7532, 101631)
```

이때 피처 갯수는 학습 및 테스트 데이터 모두 101631개로 확인했다.   
`만약 학습 데이터를 fit() 한 객체를 이용하여 테스트 데이터를 transform() 하지 
않고, 각각 fit() 메서드를 호출한다면, 피처 개수가 달라지게 될 것이다.`   

`즉, 반드시 학습 데이터와 테스트 데이터의 피처 갯수는 동일해야 하며 
그러기 위해서는 학습데이터를 이용하여 fit() 한 객체를 이용하여 테스트 데이터를 
transform() 해야 한다.`   

> 다시말하면, fit() 메서드를 두번 호출하면 안된다.     
> 학습 된 것만 가지고 예측을 해야 하기 때문이다.   

```
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score
import warnings
warnings.filterwarnings('ignore')

# LogisticRegression을 이용하여 학습/예측/평가 수행. 
# LogisticRegression의 solver를 기본값인 lbfgs이 아닌 liblinear로 설정해야 학습이 오래 걸리지 않음. 
lr_clf = LogisticRegression(solver='liblinear')

lr_clf.fit(X_train_cnt_vect , y_train)
pred = lr_clf.predict(X_test_cnt_vect)

print('CountVectorized Logistic Regression 의 예측 정확도는 {0:.3f}'.format(accuracy_score(y_test,pred)))
```

### 2-2) TfidfVectorizer   

위와 동일하게 TfidfVectorizer를 이용하여 실습하면 아래와 같다.   

```
from sklearn.feature_extraction.text import TfidfVectorizer

# TF-IDF Vectorization 적용하여 학습 데이터셋과 테스트 데이터 셋 변환. 
tfidf_vect = TfidfVectorizer()
tfidf_vect.fit(X_train)
X_train_tfidf_vect = tfidf_vect.transform(X_train)
X_test_tfidf_vect = tfidf_vect.transform(X_test)

# LogisticRegression을 이용하여 학습/예측/평가 수행. 
lr_clf = LogisticRegression(solver='liblinear')
lr_clf.fit(X_train_tfidf_vect , y_train)
pred = lr_clf.predict(X_test_tfidf_vect)
print('TF-IDF Logistic Regression 의 예측 정확도는 {0:.3f}'.format(accuracy_score(y_test ,pred)))
```

- - -    

## 3. stop words 필터링 및 ngram 추가   

아래와 같이 stop words를 추가했고, ngram을 (1, 2) 로 변경한 예이다.   

```
# stop words 필터링을 추가하고 ngram을 기본(1,1)에서 (1,2)로 변경하여 Feature Vectorization 적용.
tfidf_vect = TfidfVectorizer(stop_words='english', ngram_range=(1,2), max_df=300)
tfidf_vect.fit(X_train)
X_train_tfidf_vect = tfidf_vect.transform(X_train)
X_test_tfidf_vect = tfidf_vect.transform(X_test)

lr_clf = LogisticRegression(solver='liblinear')
lr_clf.fit(X_train_tfidf_vect , y_train)
pred = lr_clf.predict(X_test_tfidf_vect)
print('TF-IDF Vectorized Logistic Regression 의 예측 정확도는 {0:.3f}'.format(accuracy_score(y_test ,pred)))
```

- - -

## 4. GridSearchCV 및 파이프라인   


```
from sklearn.pipeline import Pipeline

# TfidfVectorizer 객체를 tfidf_vect 객체명으로, LogisticRegression객체를 lr_clf 객체명으로 생성하는 Pipeline생성
pipeline = Pipeline([
    ('tfidf_vect', TfidfVectorizer(stop_words='english', ngram_range=(1,2), max_df=300)),
    ('lr_clf', LogisticRegression(solver='liblinear', C=10))
])

# 별도의 TfidfVectorizer객체의 fit_transform( )과 LogisticRegression의 fit(), predict( )가 필요 없음. 
# pipeline의 fit( ) 과 predict( ) 만으로 한꺼번에 Feature Vectorization과 ML 학습/예측이 가능. 
pipeline.fit(X_train, y_train)
pred = pipeline.predict(X_test)
print('Pipeline을 통한 Logistic Regression 의 예측 정확도는 {0:.3f}'.format(accuracy_score(y_test ,pred)))
```

GridSearchCV에서 verbose는 iteration시 마다 수행 결과 메시지를 출력한다.   

- verbose=0(default) : 메시지 출력 안함   
- verbose=1 : 간단한 메시지 출력   
- verbose=2 : 하이퍼 파리미터별 메시지 출력   


```
from sklearn.pipeline import Pipeline

pipeline = Pipeline([
    ('tfidf_vect', TfidfVectorizer(stop_words='english')),
    ('lr_clf', LogisticRegression(solver='liblinear'))
])

# Pipeline에 기술된 각각의 객체 변수에 언더바(_)2개를 연달아 붙여 GridSearchCV에 사용될
# 파라미터/하이퍼 파라미터 이름과 값을 설정. .
params = { 'tfidf_vect__ngram_range': [(1,1), (1,2), (1,3)],
           'tfidf_vect__max_df': [100, 300, 700],
           'lr_clf__C': [1,5,10]
}

# GridSearchCV의 생성자에 Estimator가 아닌 Pipeline 객체 입력
grid_cv_pipe = GridSearchCV(pipeline, param_grid=params, cv=3 , scoring='accuracy',verbose=1)
grid_cv_pipe.fit(X_train , y_train)
print(grid_cv_pipe.best_params_ , grid_cv_pipe.best_score_)

pred = grid_cv_pipe.predict(X_test)
print('Pipeline을 통한 Logistic Regression 의 예측 정확도는 {0:.3f}'.format(accuracy_score(y_test ,pred)))


```

- - -    

Referrence 

<https://www.nltk.org/>    
<https://www.inflearn.com/course/lecture?courseSlug=%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C&unitId=25263&tab=curriculum>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

