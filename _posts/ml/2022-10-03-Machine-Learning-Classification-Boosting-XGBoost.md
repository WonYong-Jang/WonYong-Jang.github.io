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

> 사이킷에서 1.X 버전 기준으로 GBM(Gradient Boosting Machine)은 학습 속도가 현저하게 저하되는 
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

```
import xgboost   

print(xgboost._version_) # 버전 확인  
```

- - - 

## 3. XGBoost 란    

XGBoost는 부스팅 계열 알고리즘 중 하나이며, 아래와 같은 장점을 가지고 있다.   

<img width="700" alt="스크린샷 2023-05-29 오전 10 15 20" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7052e508-995c-4472-b309-2d80f6406e85">   

XGBoost는 파이썬 Wrapper와 사이킷런 Wrapper 를 제공한다.   

<img width="800" alt="스크린샷 2023-05-29 오전 10 21 04" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/d67d0d28-593c-4ed1-b7eb-218599ef5728">    

<img width="800" alt="스크린샷 2023-05-29 오전 10 22 04" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/7f1f7a69-975b-4833-b787-caabfb87ceb0">   


- - -   

## 4. XGBoost 조기 중단 기능   

`XGBoost는 특정 반복 횟수 만큼 더 이상 비용함수가 감소하지 않으면 지정된 
반복횟수를 다 완료하지 않고 수행을 종료`할 수 있다.( Early Stopping )    

<img width="279" alt="스크린샷 2023-05-29 오전 10 46 02" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/8aff57d4-4ce8-4db9-bf4e-cb4a07278eec">   

`이로 인해 학습을 위한 시간을 단축시킬 수 있고, 특히 최적화 튜닝 단계에서 적절하게 사용 가능`하다.    

`너무 반복 횟수를 단축할 경우 예측 성능 최적화가 안된 상태에서 학습이 종료 될 수 있으므로 
유의할 필요가 있다.`       

조기 중단 설정을 위한 주요 파라미터는 아래와 같다.   

- early_stopping_rounds: 더 이상 비용 평가 지표가 감소하지 않는 최대 반복횟수   
- eval_metric: 반복 수행 시 사용하는 비용 평가 지표   
- eval_set: 평가를 수행하는 별도의 검증 데이터 세트이며 일반적으로 검증 데이터 세트에서 반복적으로 비용 감소 성능 평가   

> 예를들면 
early stopping rounds를 10으로 설정한 경우 10번 반복 모두 비용 함수가 감소하지 않으면 중단 시킨다.   

- - - 

## 5. XGBoost 실습   






- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25200>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

