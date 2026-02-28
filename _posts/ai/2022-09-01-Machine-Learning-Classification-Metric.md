---
layout: post
title: "[Machine Learning] 분류(Classification) 모델 지표(metrics)의 의미와 계산법"
subtitle: "Confusion Matrix / TP, FP, TN, FN / accuracy, precision, recall / ROC AUC" 
comments: true
categories : AI
date: 2022-09-01
background: '/img/posts/mac.png'
---

머신러닝을 통하여 모델을 학습하고 나면, 이 모델의 성능이 얼마나 되는지 확인을 
해야 하는데 머신러닝에서는 이를 `지표(metrics)`이라고 한다.  

> 모델은 판단력이라고 부르며, 모델은 만드는 과정을 학습이라고 한다.   
> 좋은 모델은 당연하게 좋은 결정을 할 수 있게 된다.   

`이 metrics은 내가 학습시킨 모델의 종류에 따라서 살펴봐야 하는 
지표의 종류도 달라지게 된다.`   

즉, 내가 학습시킨 모델이 regression(회귀), classification(분류) 에 따라서 
살펴봐야 할 metrics이 달라지며, 이 글에서는 분류 모델일 경우 살펴봐야 할 
지표에 대해서 살펴보자.   

`분류 모델의 metrics은 대표적으로 accuracy, precision, recall 로 표현할 수 있으며, 
    이를 자세히 살펴보자.`          

- - - 


## 1. TP, FP, TN, FN    

분류 모델 성능 지표를 살펴보기 전에 정답을 맞히거나 틀리는 경우의 수를 
먼저 봐야 한다.    
True Positive, False Positive, True Negative, False Negative 를 살펴보자.     

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

`Confusion Matrix(오차 행렬)은 이진 분류의 예측 오류가 얼마인지와
더불어 어떠한 유형의 예측 오류가 발생하고 있는지를 함께 나타내는 지표이다.`

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

Precision은 FP를 낮춰야 성능이 향상되며, FP가 낮다라는 표현을 세포의 비 정상 여부를 판별하는 
모델로 예를 들어보자.   

> 실제로는 정상인데, 비정상이라고 잘못 예측 하지말라는 의미이다.     
> 즉, 괜히 찔러보지 말고 확실한 것만 맞추라는 의미이다!       

`Recall은 원래 데이터가 true인 것 중에서 모델이 true로 
맞춘 개수가 얼마나 되는지를 확인 하는 지표이다.`   

Recall은 FN을 낮춰야 성능이 향상되며, 동일하게 예를 들어보자.   

> 실제로 비 정상인데 정상이라고 잘못 예측하지 말라는 의미이다.    
> 즉, 틀리든 말든 상관 없는데 비 정상인 것은 절때 놓치지 말라는 의미이다!   

precision과 recall은 비슷해 보이지만 전혀 다른 지표이다.      

참고로 F1 Score는 Precision과 Recall의 중간 값을 확인해 보는 지표이다.   

> F1 Score는 precision과 recall이 어느 한쪽으로 치우치지 않는 수치를 나타낼 때 상대적으로 높은 값을 가진다.    

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

> False Positive가 가 낮을 수록 좋은 모델이다.       

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

> False Negative가 낮을 수록 좋은 모델이다.    

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

- -- 

## 4. ROC 곡선과 AUC   

<img width="500" alt="스크린샷 2023-03-18 오후 10 38 32" src="https://user-images.githubusercontent.com/26623547/226109634-d36b9b5d-eb71-4c7b-8308-8349de306e6d.png">    

`ROC(Receiver Operating Characteristic) curve는 다양한 threshold에 대한 이진분류기의 
성능을 한번에 표시한 것이다.`   

`이 커브 곡선으로부터 최적의 threshold를 찾을 수도 있다.`   

> threshold에 대한 개념은 아래 글에서 자세히 다룬다.    
> 위 그림처럼 좌상단 1에 가까울 수록 좋은 수치이다.   

ROC curve를 이해하기 위해 아래 특성에 대해 살펴보자.   

<img width="859" alt="스크린샷 2023-03-18 오후 10 57 05" src="https://user-images.githubusercontent.com/26623547/226110556-52ca51b6-b4c2-4564-9d66-59e5e77bdaff.png">     

True Positive와 False Positive 내용은 위에서 자세히 살펴봤고, 
     이를 그림으로 살펴보면 아래와 같다.   

<img width="852" alt="스크린샷 2023-03-18 오후 11 02 37" src="https://user-images.githubusercontent.com/26623547/226110779-71dbd53b-122b-4241-a0aa-66e250bbb444.png">     




사이킷런에서는 아래와 같이 함수로 제공한다.   

<img width="830" alt="스크린샷 2022-09-24 오후 4 27 32" src="https://user-images.githubusercontent.com/26623547/192085881-27153df7-a3bf-4011-bfb6-4d595f922227.png">   

- - -

## 5. 성능지표 사이킷런으로 구현    

사이킷런을 이용하여 오차행렬, 정확도, 정밀도, 재현율, F1 socre을 각각 구해보자.    


```
from sklearn.metrics import confusion_matrix, accuracy_score
from sklearn.metrics import precision_score, recall_score    
from sklearn.metrics import f1_score, roc_auc_score   

# 예측 결과인 pred와 실제 결과값인 y_test의 Confusion Metrix 출력
print(confusion_matrix(y_test, pred)) 

## Output

array([[109,   9],     # TN  FP
       [ 14,  47]])    # FN  TP
```

```
print("정밀도: ", precision_score(y_test, pred))
print("재현율: ", recall_score(y_test, pred))

## Output   

정밀도:  0.8392857142857143
재현율:  0.7704918032786885
```

위 코드를 함수화 하여 한번에 계산 될 수 있도록 리펙토링 해보자.   

```
def get_clf_eval(y_test, pred=None, pred_proba=None):
    confusion = confusion_matrix(y_test, pred)
    accuracy = accuracy_score(y_test, pred)
    precision = precision_score(y_test, pred)
    recall = recall_score(y_test, pred)
    f1 = f1_score(y_test, pred)
    roc_auc = roc_auc_score(y_test, pred_proba)   
    print('오차 행렬')
    print(confusion)
    print('정확도: {0: .4f}, 정밀도: {1: .4f}, 재현율: {2: .4f}, F1: {3: .4f}, AUC: {4: .4f}'.format(accuracy, precision, recall, f1, roc_auc))
```

Output   

```
오차 행렬
[[109   9]
 [ 14  47]]
정확도:  0.8715, 정밀도:  0.8393, 재현율:  0.7705, F1:  0.8034, AUC:  0.8937   
```

- - - 

## 6. 분류모델 성능지표 정리

위에서 살펴본 분류모델 성능 지표를 정리해보자.    

`Accuracy(정확도)는 전체 예측 건수에서 정답을 맞힌 건수이다.`       
`여기서 정답을 맞힐 때 답이 Positivie든 Negative든 상관없이 맞히기만 하면 된다.`       

Accuracy의 단점을 예시를 통해 살펴보자.   

예를 들어 내일 서울에 시간당 1m 이상의 눈이 내릴지 여부를 예측한다고 해보자.   
그땐 머신러닝이 필요 없을 수 있다.   
왜냐하면 그냥 무조건 Negative를 예측하면 이 모델은 99.9% 정도의 accuracy를 
나타낼 것이다.      
그 정도로 눈 내리는 날은 거의 없기 때문에 정답을 True Negative로만 잔뜩 
맞히는 셈이다. (True Positive는 하나도 발견하지 못한다.)    

이런 상황을 정확도 역설(Accuracy Paradox)라고 부른다.   

`그래서 이렇게 실제 데이터에 Negative 비율이 너무 높아서 희박한 가능성으로 
발생할 상황에 대해 제대로 된 분류를 해주는지 평가해줄 지표는 바로 recall(재현율)이다.`      

`recall(재현율)은 실제로 정답이 True인 것들 중에서 모델이 True로 예측한 비율이다.`    

그래서 위에서 예로 들었던 시간당 1m 이상의 눈이 내릴지 예측하는 과제에 
적절할 것이다. 그러면 실제로 그렇게 눈이 내린 날짜 중에 몇 개나 맞히는지 
확인할 수 있다.    
만약 여기서 언제나 False로 예측하는 모델이라면 accuracy가 99%를 넘기겠지만, 
    True Positive를 찾을 수 없으니 recall이 0이 된다.   

그러나 안타깝게도 recall 또한 완벽한 통계 지표가 아니다.    
시간당 1m 이상의 눈이 내릴지 분류하는 모델이 언제나 True만 답하는 
분류기가 있다고 해보자.   
그러면 accuracy는 낮지만 눈이 많이 온 날에 대해서 만큼은 정확하게 
맞힐 수 있기 때문에 recall은 1이 된다.    
이 역시 말이 안되는 지표이다.   

`이럴 때 해당 알고리즘에 결함이 있음을 잘 나타내는 지표는 바로 precision(정밀도)이다.`       

모델이 눈이 많이 내릴 것이라고 예측한 날 중에 실제로 눈이 많이 내린 날의 비율을 구하는 것이다.   
즉, 언제나 True라고 답하는 모델이 있다면 recall은 1로 나오겠지만, precision은 0에 
가까울 것이다.   

분류하려는 업무의 특성상 정밀도 또는 재현율이 특별히 강조되어야 할 경우 
`분류의 결정 임계값(Threshold)`을 조정해 정밀도 또는 재현율의 수치를 
높일 수 있다.    

여기서 `Threshold`란 분류 모델이 true, false를 예측을 하는데 이를 확률로 예측을 하며,  
이를 구분하는 기준이 되는 구분 값이다.   

> default threshold값은 0.5이며  0.6이면 true, 0.4이면 false로 예측하게 된다.    

<img width="800" alt="스크린샷 2022-09-19 오후 5 33 19" src="https://user-images.githubusercontent.com/26623547/190979089-44ec8a87-0b3d-4977-8d72-738feec891a2.png">    

> Threshold가 낮아질 수록 재현율이 증가 하는 이유는 FN 값이 적어지기 때문이다.   
> Positive로 예측이 많아졌으니, Negative로 예측하는 횟수가 적어진다.   
> 반대로, FP는 증가하게 되므로, 정밀도는 감소한다.   

따라서, Threshold를 통해 정밀도, 재현율을 조정할 수 있지만 
정밀도와 재현율은 상호 보완적인 평가 지표이기 때문에 
어느 한쪽을 강제로 높이면 다른 하나의 수치는 떨어지기 쉽다.   
이를 `정밀도/재현율의 트레이드 오프(Trade-off)`라고 부른다.    

<img width="500" alt="스크린샷 2022-09-19 오후 5 24 14" src="https://user-images.githubusercontent.com/26623547/190978425-c0d70bf5-3c23-439b-9bc5-f144f31c851f.png">  

> x 축은 threshold 값이다.    

`정리를 해보면 모델의 성능이 좋다는 뜻은 오류가 적다는 뜻이고 
학습시킨 모델을 어떤 서비스에 
어떻게 적용하냐에 따라서 집중해야하는 지표를 확인하고 검증하여야 한다.`    



- - -
Referrence 

<https://www.inflearn.com/course/%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C/unit/25205?category=questionDetail&tab=curriculum>    
<https://www.youtube.com/watch?v=VbJHlCDOteU>     
<https://www.youtube.com/watch?v=GIzIk1C-_yE>     
<https://www.youtube.com/watch?v=Kb7LMWLZK0M>   
<https://hleecaster.com/ml-accuracy-recall-precision-f1/>   
<https://angeloyeo.github.io/2020/08/05/ROC.html>      


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

