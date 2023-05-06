---
layout: post
title: "[Machine Learning] 분류 알고리즘(Classification) - 앙상블(Ensemble) 기법의 부스팅(Boosting)"
subtitle: "그래디언트 부스팅, XGBoost" 
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

> 사이킷에서 1.X 버전 기준으로 Gradient Boosting Machine은 학습 속도가 현저하게 저하되는 
문제가 있기 때문에 이 글에서는 다루지 않는다.   


- - - 

### 2. XGBoost 설치   

```
// 아나콘다로 설치 
$ conda install -c anaconda py-xgboost   

// pip로 설치 
$ pip install xgboost   
```

```
import xgboost   

print(xgboost._version_) # 버전 확인  
```





- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

