---
layout: post
title: "[Machine Learning] 분류(Classification) 모델 지표(metrics)의 의미와 계산법"
subtitle: "Confusion Matrix / True Positive, False Positive, True Negative, False Negative / accuracy, precision, recall" 
comments: true
categories : ML
date: 2022-09-01
background: '/img/posts/spring.png'
---

머신러닝을 통하여 모델을 학습하고 나면, 이 모델의 성능이 얼마나 되는지 확인을 
해야 하는데 머신러닝에서는 이를 `지표(metrics)`이라고 한다.   

`이 metrics은 내가 학습시킨 모델의 종류에 따라서 살펴봐야 하는 
지표의 종류도 달라지게 된다.`   

즉, 내가 학습시킨 모델이 regression(회귀), classification(분류) 에 따라서 
살펴봐야 할 metrics이 달라지며, 이 글에서는 분류 모델일 경우 살펴봐야 할 
지표에 대해서 살펴보자.   

`분류 모델의 metrics은 대표적으로 accuracy, precision, recall 로 표현할 수 있으며, 
    이를 자세히 살펴보자.`          

- - - 


## 1. TP, FP, TN, FN    

먼저 True Positive, False Positive, True Negative, False Negative 를 살펴보자.     

- 앞의 True 또는 False는 모델이 예측한게 맞았는지 틀렸는지를 의미한다.   
- 뒤의 Positive 또는 Negative는 모델이 예측한 값이 true 인지 false인지를 의미한다.    

<img width="1000" alt="스크린샷 2022-09-02 오전 12 58 54" src="https://user-images.githubusercontent.com/26623547/187959953-102c393c-b966-4858-b65d-f04de3eec939.png">    

`True Positive는 뒤에 Positive가 의미하는 것은 모델이 예측한 값이 true인 경우이며, 
     앞의 True 값이 있기 때문에 모델이 맞췄고, 그 값은 true라는 의미이다.`              
즉, 모델이 True로 예측했고 진짜 데이터도 True인 케이스이다.   

`False Positive의 Positive는 모델이 예측한게 True라는 것이며, 하지만 앞에 
False가 있기 때문에 실제 데이터는 False로 예측이 틀렸음을 의미한다.`   

`False Negative의 Negative는 모델이 예측한 값이 false를 의미하며, 앞에 있는 
False 값은 모델이 예측한게 틀렸음을 의미하기 때문에 실제 데이터 값은 true이다.`   

`True Negative는 모델이 false라고 예측했고, 앞에 True가 있기 때문에 맞추었다는 의미이다.`     

위의 내용들은 자칫 잘못 이해할 수 있기 때문에 정확하게 이해하는 것이 
중요하며, 이를 통해서 metrics을 실제로 계산해보자.   

- - - 

## 2. Metrics 계산   

이제 위의 내용을 토대로 아래와 같이 Confusion Matrix를 그려보자.  
모델이 예측한 값과 실제 평가 데이터를 기준으로 TP, FP, TN, FN를 
작성하면 아래와 같다.   

<img width="1200" alt="스크린샷 2022-09-02 오전 1 28 34" src="https://user-images.githubusercontent.com/26623547/187965454-d92b133c-cc49-4cca-8a1b-0b7c74cbdd3d.png">   

`그럼 여기서 계산한 Confusion Matrix을 이용하여 Accuracy, Precision, Recall, F1 Score 등의 metrics을 
계산해보자.`   

<img width="1200" alt="스크린샷 2022-09-02 오전 1 41 44" src="https://user-images.githubusercontent.com/26623547/187967767-117ee15c-e127-4f9d-a152-8a1d773a6896.png">      

`먼저 Accuracy는 전체 데이터의 갯수 중에서 모델이 맞춘게(TP, TN) 얼마나 
되느냐를 의미한다.`    

> TP + TN이 의미하는 것은 모델이 true 또는 false로 예측한게 얼마나 맞았는지를 의미한다.   

`Precision은 모델이 true라고 예측한 것 중에 진짜 true로 
맞춘게 얼마나 되는지를 확인 하는 지표이다.`   

`Recall은 원래 데이터가 true인 것 중에서 모델이 true로 
맞춘 개수가 얼마나 되는지를 확인 하는 지표이다.`   

precision과 recall은 비슷해 보이지만 전혀 다른 지표이다.      

참고로 F1 Score는 Precision과 Recall의 중간 값을 확인해 보는 지표이다.   

그럼 여기서 여러 metrics을 살펴봤는데, Recall 지표값은 0.95 이지만 Precision은 0.4의 
성능을 가진다면 이 모델은 좋은 모델이 될 수 있을까?   

`이는 어떤 서비스에 어떻게 사용하냐에 따라서 어떤 지표를 중점적으로 봐야 하는지 
정할 수 있다.`   

아래 예를 통해서 살펴보자.   

- - - 

## 3. Precision과 Recall    

#### 3-1) 스팸 메일을 분류하는 모델일 경우    

메일이 스팸 메일인지 분류하는 모델을 학습했다고 가정해보고, 스팸 메일일 경우 true 일반 메일일 경우 
false라고 한다면 precision이 높은 모델이 좋은 모델일까 recall이 높은 모델이 좋은 모델일까?    

이해를 돕기 위해서 극단적인 예를 들어보자.   

<img width="1200" alt="스크린샷 2022-09-02 오후 5 40 48" src="https://user-images.githubusercontent.com/26623547/188100632-9b1e6353-65c8-47cb-ac8f-1aeef1937bae.png">   

이런 경우 각 지표를 계산해 보면, 아래와 같고 Recall이 높고 Precision이 낮은 경우이다.      

<img width="1200" alt="스크린샷 2022-09-02 오후 5 45 28" src="https://user-images.githubusercontent.com/26623547/188101567-736f254c-51e8-433b-99ca-20622a76aa44.png">   

결과적으로 일반 메일함은 5개가 남아 있을 것이고, 스팸 메일함은 5개가 
분류되어 들어갈 것이다.   

`여기서 True Positive 2개는 정확하게 스팸으로 분류되어 맞추었지만, 
    False Positie는 3개로 스팸이라고 예측했지만 실제로는 일반 메일이기 
    때문에 예측에 실패했다.`   
`사용자 입장에서 살펴보면 보통 메일을 사용할 때 스팸메일은 확인하지 
않기 때문에 중요한 일반메일이 스팸으로 분류되어 들어갈 수 있다.`   

사용자 입장에서는 일반 메일함만 확인하는게 일반적이며, 반대의 경우를 살펴보자.   
반대는 Recall이 낮고 Precision이 높은 경우이다.   

<img width="1200" alt="스크린샷 2022-09-02 오후 5 58 05" src="https://user-images.githubusercontent.com/26623547/188103852-ee3dc990-f72b-441f-ba49-4c7cd8b7624e.png">    

위처럼 되면 스팸 메일함에는 스팸 메일 2개만 분류되며, 일반 메일함에는 
3개의 스팸 메일함이 들어가 있다.   
`생각해보면 recall이 높은 케이스보다 precision이 높은 케이스가 사용자 입장에서는 
사용하기 편하다.`   
`왜냐하면 사용자는 일반 메일함만 확인하면 되며, 예측에 실패하여 남아있는 
스팸메일은 삭제하거나 안보면 그만이다. 하지만, 일반 메일이 잘못 예측하여 스팸 메일함으로 
분류되면 사용자는 일반 메일함과 스팸 메일함을 모두 살펴봐야 하기 때문이다.`   


#### 3-2) 세포의 비 정상/정상 여부를 판단하는 모델일 경우   

세포가 비정상 일 경우 true 정상일 경우 false로 구분하는 모델일 경우도 살펴보자.   

<img width="1200" alt="스크린샷 2022-09-02 오후 6 07 31" src="https://user-images.githubusercontent.com/26623547/188105584-e1986a3b-faae-4e25-9697-5cacb8bf04dd.png">   

`해당 모델은 질병의 유무를 판단하는 모델로써, 질병이 있는 사람을 
놓치지 않고 판별하는게 중요하다.`   
질병이 있는 사람을 아니라고 판단해서 집에 보내는 것이 더 치명적이며, 
    오히려 질병이 있다 라고 판단해서 예측이 실패했지만, 다음번에 재검사를 하여 
    판단하는 것이 좋은 모델일 것이다.   

`즉, 이 케이스는 recall이 precision보다 높은 모델이 좋은 모델이 될 것이다.`
`왜냐하면 True Positive 2명을 실제 질병이 있다고 잘 예측했고, False Positive로 3명이 
질병이 있다고 해서 예측에 실패했지만 False Negative가 0명이기 때문이다.`   

반대의 케이스도 아래에서 살펴보자.   

<img width="1200" alt="스크린샷 2022-09-02 오후 6 17 22" src="https://user-images.githubusercontent.com/26623547/188107387-7b455194-a1f6-48c8-a096-96515a763bd2.png">   

precision이 높은 케이스이며, recall이 낮기 때문에 False Negative가 발생하여서 
모델이 질병이 없다고 판단했는데, 실제로는 질병이 있어서 추후 병이 더 커질 수 있는 위험한 
상황이 발생할 것이다.   


정리해보면, 분류 모델의 지표는 accuracy, precision, recall이 주요 지표로 사용되며, 
    각 지표마다 절대적으로 높아야 하는 기준은 없다.  
`일반적으로 accuracy를 많이 보긴하지만, 
    어떤 서비스에 어떻게 활용할지에 따라서 주요 지표가 달라지게 되므로 이를 잘 생각해서 모델을 학습하자.`      

> 만일 Accuracy가 100% 라면?   
> Accuracy가 100%인 경우, Precision과 Recall 모두 100%인 (이론상으로) 이상적인 모델이 된다.   
> 하지만, Accuracy가 100%인 모델은 overfiting(과대적합)이 매우 의심되니 데이터와 모델을 다시 한번 살펴봐야 한다.   


- - -
Referrence 

<https://www.youtube.com/watch?v=VbJHlCDOteU>     
<https://www.youtube.com/watch?v=GIzIk1C-_yE>     
<https://www.youtube.com/watch?v=Kb7LMWLZK0M>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

