---
layout: post
title: "[Machine Learning] 사이킷런 모델 저장 및 로드"
subtitle: "pickle, joblib"    
comments: true
categories : ML
date: 2022-10-18
background: '/img/posts/mac.png'
---

이번 글에서는 학습시킨 머신러닝 모델을 파일로 저장 및 다시 파일에서 모델을 불러와 
사용하는 방법을 살펴보자.   

사이킷런은 자체적으로 모델을 저장하고 불러오는 기능을 지원하지 않으므로 pickle 또는 joblib 모듈을 
사용해야 한다.   
`pickle 모듈을 이용해 저장하려면 먼저 파일을 바이너리 모드로 열고 저장해야 하기 때문에 
번거로운 부분이 있다.`      
`joblib 모듈을 이용하면 dump 함수와 load 함수만으로 모델을 바로 저장하고 불러올 수 있기 때문에 
joblib 모듈을 사용할 것이다.`      


- - - 

## 1. 학습한 모델 저장하기   

먼저 모델을 학습시켜 보자.   

```python
import lightgbm
from lightgbm import LGBMClassifier
import numpy as np
import pandas as pd
import warnings
warnings.filterwarnings('ignore')

from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split   
from sklearn import datasets

# 붓꽃 품종 데이터 세트 불러오기
iris_data = datasets.load_iris()
X_train , X_test , y_train , y_test = train_test_split(iris_data.data, iris_data.target,
                                                       test_size=0.2,  random_state=11)

model = LGBMClassifier(n_estimators=100, learning_rate=0.05)

model.fit(X_train , y_train)
```   

학습한 모델을 joblib 모듈을 이용해서 pickle 파일로 저장해보자.  

```python
import joblib

joblib.dump(model, './model.pkl')
```

- - - 

## 2. 모델 로드 및 예측하기   

다음으로 저장한 모델을 로드 후 사용해보자.   

```python
# 모델 로드 
loaded_model = joblib.load('./model.pkl')

# 예측   
result = loaded_model.predict(X_test)

# list = np.array([[6.8, 3.1 , 5.5, 2.1]])
# result = loaded_model.predict(list)    

# 성능 측정    
accuracy = accuracy_score(y_test, result)
```


- - -
Referrence 


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

