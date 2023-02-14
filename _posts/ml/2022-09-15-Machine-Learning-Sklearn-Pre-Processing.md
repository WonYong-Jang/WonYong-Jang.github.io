---
layout: post
title: "[Machine Learning] 사이킷런의 데이터 전처리"
subtitle: "데이터 전처리(Preprocessing) / 데이터 클린징, 결손값 처리(Null/NaN처리), 데이터 인코딩(레이블, 원 핫 인코딩), 데이터 스케일링, 이상치 제거" 
comments: true
categories : ML
date: 2022-09-15
background: '/img/posts/mac.png'
---

이번 글에서는 사이킷런의 주요 모듈 중에 데이터 전처리 관련된 모듈을 자세히 살펴보자.   

머신러닝에서 데이터 전처리는 굉장히 중요한 과정이며, 머신러닝은 데이터에 굉장히 
의존적이기 때문에 잘못된 데이터를 이용하여 학습하면 
성능도 좋지 못한 결과를 낼 수 밖에 없다.   

> Garbage in, garbage out  

- - - 

## 1. 데이터 인코딩    

`머신러닝 알고리즘은 문자열 데이터 속성을 입력 받지 않으며 모든 데이터는 숫자형으로 표현되어야 
한다.`   
`문자형 카테고리형 속성은 모두 숫자값으로 변환/인코딩 되어야 한다.`    

`인코딩 방식에는 레이블(Label) 인코딩 방식과 원 핫(One Hot) 인코딩 
방식이 있다.`    

먼저 레이블(Label) 인코딩 방식은 아래와 같다.    
문자열로 되어 있는 상품 분류를 레이블 인코딩을 진행하였다.    

<img width="800" alt="스크린샷 2022-09-18 오후 1 05 42" src="https://user-images.githubusercontent.com/26623547/190885391-12adcbe7-fe3f-49c8-a184-39d590397d70.png">   

아래 코드로 보자.   

<img width="800" alt="스크린샷 2022-09-18 오후 1 43 13" src="https://user-images.githubusercontent.com/26623547/190886143-b4523f35-bff5-4192-8588-603af64a9835.png">   
 

```
from sklearn.preprocessing import LabelEncoder

items = ['TV', '냉장고', '전자렌지', '컴퓨터', '선풍기', '선풍기', '믹서', '믹서']

# LabelEncoder를 객체로 생성 후, fit(), transform() 으로 Label 인코딩 수행 
encoder = LabelEncoder() 
encoder.fit(items)
labels = encoder.transform(items)
# labels = encoder.fit_transform(items) # fit, transform 한번에 사용 가능    

print('인코딩 변환값: ', labels)
print('인코딩 클래스: ', encoder.classes_)
print('디코딩 원본 값: ', encoder.inverse_transform([4,5,2,0,1,1,3,3]))

# Output   
인코딩 변환값:  [0 1 4 5 3 3 2 2]
인코딩 클래스:  ['TV' '냉장고' '믹서' '선풍기' '전자렌지' '컴퓨터']
디코딩 원본 값:  ['전자렌지' '컴퓨터' '믹서' 'TV' '냉장고' '냉장고' '선풍기' '선풍기']
```


`해당 방식은 모델에서 주의할 점이 있다.`   
`인코딩한 숫자 값은 크기를 구분하지 않고 인코딩 하였는데, 알고리즘에 따라 
인코딩된 숫자 크기 값을 잘못 해석하는 경우가 발생한다.`    

> TV, 냉장고, 믹서 등을 아무 의미 없이 1, 2, 3으로 인코딩을 진행하였는데 
알고리즘에 따라 3 값이 크기 때문에 비중을 높게 잡는 경우를 예로 들 수 있다.   

이런 방식을 해결 하기 위해서 `원 핫 인코딩`을 사용할 수 있다.   

<img width="1011" alt="스크린샷 2022-09-18 오후 1 13 53" src="https://user-images.githubusercontent.com/26623547/190885434-c51dd6c1-7126-4e8d-8fdd-9d2abf969baf.png">   

아래 코드로 보자.  
`판다스에서 제공하는 get_dummies(DataFrame)을 이용하면, 간편하게 
원 핫 인코딩을 진행할 수 있다.`    

```
import pandas as pd
#from sklearn.preprocessing import OneHotEncoder

df = pd.DataFrame({'item': ['TV', '냉장고', '전자렌지', '컴퓨터', '선풍기', '선풍기', '믹서', '믹서']})

one_df = pd.get_dummies(df)
one_df
```

Output    

<img width="500" alt="스크린샷 2022-09-18 오후 1 48 51" src="https://user-images.githubusercontent.com/26623547/190886361-0456b203-1cd3-4e50-816c-333aa37118f9.png">   

- - -   

## 2. 피처 스케일링  

스케일링이란 데이터 전처리 과정 중 하나이며, feature들 마다 
데이터값의 범위가 다 제각각이기 때문에 범위 차이가 클 경우 데이터를 
갖고 모델을 학습할 때 0으로 수렴하거나 무한으로 발산할 수 있다.    

따라서 스케일링을 통해 모든 피처들의 데이터 분포나 범위를 동일하게 조정해 줄 수 있다.   

<img width="867" alt="스크린샷 2022-09-18 오후 1 56 02" src="https://user-images.githubusercontent.com/26623547/190886467-f3b2391a-dbd8-4c9c-bbf0-81fc0324d9ca.png">    
 
사이킷런은 스케일링을 지원하는 많은 함수들을 제공하며, 대표적인 함수는 아래와 같다.   

- StandardScaler: 평균이 0이고, 분산이 1인 정규 분포 형태로 변환   
- MinMaxScaler: 데이터값을 0과 1사이의 범위 값으로 변환( 음수 값이 있으면 -1에서 1값으로 변환된다)     

`스케일링을 무조건 한다고 성능이 좋아지는 것은 아니지만, 선형 계열(Linear Regression, SVM 등) 알고리즘은 
스케일링에 영향을 받을 수 있기 때문에 해주는 것이 좋다.`   

`단, 트리 계열 알고리즘은 스케일링에 큰 영향을 받지 않는다.`     




- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25199?category=questionDetail&tab=curriculum>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

