---
layout: post
title: "[Machine Learning] 분류(Classification) 모델 지표(metrics)의 의미와 계산법"
subtitle: "Confusion Matrix / True Positive, False Positive, True Negative, False Negative / accuracy, precision, recall" 
comments: true
categories : ML
date: 2022-09-01
background: '/img/posts/spring.png'
---

머신러닝을 통하여 모델을 학습하고 나면, 이 모델이 얼마나 성능이 얼마나 되는지 확인을 
해야 하는데 머신러닝에서는 이를 `metric`이라고 한다.   

`이 metric은 내가 학습시킨 모델의 종류에 따라서 살펴봐야 하는 
지표의 종류도 달라지게 된다.`   

즉, 내가 학습시킨 모델이 regression(회귀), classification(분류) 에 따라서 
살펴봐야 할 metric이 달라지며, 이 글에서는 분류 모델일 경우 살펴봐야 할 
지표에 대해서 살펴보자.   

`분류 모델의 metric은 대표적으로 accuracy, precision, recall 로 표현할 수 있으며, 
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

위의 내용들은 자칫 잘못 이해할수 있기 때문에 정확하게 이해하는 것이 
중요하며, 이를 통해서 metric을 실제로 계산해보자.   

- - - 

## 2. Metric 계산   

이제 위의 내용을 토대로 아래와 같이 Confusion Matrix를 그려보자.  
모델이 예측한 값과 실제 평가 데이터를 기준으로 TP, FP, TN, FN를 
작성하면 아래와 같다.   

<img width="1200" alt="스크린샷 2022-09-02 오전 1 28 34" src="https://user-images.githubusercontent.com/26623547/187965454-d92b133c-cc49-4cca-8a1b-0b7c74cbdd3d.png">   

`그럼 여기서 계산한 Confusion Matrix을 이용하여 Accuracy, Precision, Recall, F1 Score 등의 metric을 
계산해보자.`   

<img width="1200" alt="스크린샷 2022-09-02 오전 1 41 44" src="https://user-images.githubusercontent.com/26623547/187967767-117ee15c-e127-4f9d-a152-8a1d773a6896.png">      

`먼저 Accuracy는 전체 데이터의 갯수 중에서 모델이 맞춘게(TP, TN) 얼마나 
되느냐를 의미한다.`    

`Precision은 모델이 true라고 예측한 것 중에 진짜 true로 
맞춘게 얼마나 되는지를 확인 하는 지표이다.`   

`Recall은 원래 데이터가 true인 것 중에서 모델이 true로 
맞춘 개수가 얼마나 되는지를 확인 하는 지표이다.`   

precision과 recall은 비슷해 보이지만 전혀 다른 지표이다.      

참고로 F1 Score는 Precision과 Recall의 중간 값을 확인해 보는 지표이다.   

그럼 여기서 여러 metric을 살펴봤는데, Recall 지표값은 0.95 이지만 Precision은 0.4의 
성능을 가진다면 이 모델은 좋은 모델이 될 수 있을까?   

`이는 어떤 서비스에 어떻게 사용하냐에 따라서 어떤 지표를 중점적으로 봐야 하는지 
정할 수 있다.`   



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

