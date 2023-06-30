---
layout: post
title: "[Machine Learning] 텍스트 분석(Text Analysis)의 Feature Vectorization"
subtitle: "텍스트 분석의 이해와 피처 벡터화 유형(BOW, Word2Vec), 희소행렬" 
comments: true
categories : ML
date: 2023-05-26
background: '/img/posts/mac.png'
---

## 1. 텍스트 분석의 이해   

자연어(natural language)란 우리가 일상 생활에서 사용하는 언어를 말하며, 
    자연어 처리(natural language processing)란 이러한 자연어의 
    의미를 분석하여 컴퓨터가 처리할 수 있도록 하는 일을 말한다.    

> 자연어 처리는 음성 인식, 내용 요약, 번역, 사용자의 감성 분석, 텍스트 분류 작업(스팸 메일 분류, 
        뉴스 기사 카테고리 분류), 질의 응답 시스템, 챗봇과 같은 곳에서 사용되는 분야이다.   

자연어 처리(NLP)와 유사한 의미로 많이 사용되는 용어인 텍스트 마이닝(text mining)은 
텍스트 분석(text analysis)이라고도 하며, 텍스트에서 
고품질 정보를 얻는 과정을 말한다.   

텍스트 분석은 머신러닝, 언어 이해, 통계 등을 활용해 모델을 수립하고 
정보를 추출해 비즈니스 인텔리전스나 예측 분석 등의 분석 작업을 주로 
수행한다.   

텍스트 분석 머신러닝 수행 프로세스는 아래와 같다.   

<img width="811" alt="스크린샷 2023-05-26 오후 10 04 30" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/68acc6cc-35af-4e52-833e-bf86cacef819">    


- - - 

## 2. 파이썬 기반의 NLP, 텍스트 분석 패키지   

텍스트 분석을 하기 위해서는 텍스트에 대해서 많은 전처리 과정이 
필요하며, 이에 따라서 제공하는 대표적인 패키지는 아래와 같다.   

#### 2-1) NLTK(National Language Toolkit for Python)   

파이썬의 가장 대표적인 NLP 패키지 이다.     
방대한 데이터 세트와 서브 모듈을 가지고 있으며 NLP의 거의 모든 
영역을 커버하고 있다.   
많은 NLP 패키지가 NLTK의 영향을 받아 작성되고 있다. 수행 속도 측면에서 
아쉬운 부분이 있어서 실제 대량의 데이터 기반에서는 제대로 활용되지 
못하고 있다.   

anaconda 패키지에 디폴트로 설치가 안되어 있다면, 아래와 같이 
추가하면 된다.   

```
$ conda install -c anaconda nltk   
```

#### 2-2) Genisim   

토픽 모델링 분야에서 가장 두각을 나타내는 패키지이다. 오래전 부터 토픽 모델링을 
쉽게 구현할 수 있는 기능을 제공해왔으며, Word2Vec 구현 등의 다양한 신기능도 
제공한다.   

> SpaCy와 함께 가장 많이 사용되는 NLP 패키지이다.   

#### 2-3) SpaCy

뛰어난 수행 성능으로 최근 가장 주목을 받은 NLP 패키지이다.   
많은 NLP 어플리케이션에서 SpaCy를 사용하는 사례가 늘고 있다.     

- - - 

## 3. 텍스트의 피처 벡터화 유형   

`피처 벡터화의 대표적인 유형은 BOW(Bag of Words)와 Word Embedding(Word2Vec)이 있다.`      

<img width="1000" alt="스크린샷 2023-05-27 오전 11 32 36" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/49b92ed1-c21f-405a-82d5-e31dea745d76">   

`BOW는 100개의 문서가 있다고 가정할 때, 100개의 문서에서 모든 단어를 
추출하여 피처로 만든다.`  

`Word2Vec은 100개의 문서가 있다고 가정할 때, 100개의 문서에서 모든 단어를 
추출하여 N차원 공간에 벡터로 표현한다.`      

이 글에서는 Bag of Words에 대해서 자세히 살펴보자.   

- - - 

## 4. Bag of Words(BOW)   

<img width="850" alt="스크린샷 2023-05-27 오전 11 44 43" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/37ccaefd-9e61-4bec-95bd-dbb6a340922b">    

<img width="850" alt="스크린샷 2023-05-27 오전 11 48 55" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/7c045424-277a-4c38-917e-21c36e764d3d">   

> 위의 그림에서는 문장으로 표현했지만, 업무에 따라 하나의 문서로 표현하여 학습한다.   

`BOW의 장점은 쉽고 빠른 구축이 가능하며, 문서의 특징을 잘 나타내어 전통적으로 
여러 분야에서 활용도가 높다.`   

> Word Embedding이 최근 보편화되고 강세이지만, 여전히 BOW는 활용도가 높다.   

`단점으로는 BOW는 문맥의미(Semantic Conext) 반영에 문제가 있으므로 
번역이나 자동 질의 응답 등에는 사용할 수 없다.`   

또한, `희소 행렬 문제`가 있는데 이는 뒤에서 자세히 다뤄보자.    

BOW 피처 벡터화 유형에는 두가지로 나눠볼 수 있는데 아래와 같다.   

### 4-1) 단순 카운트 기반의 벡터화    

단어 피처에 값을 부여할 때 각 문서에서 해당 단어가 나타나는 횟수, 즉 Count를 
부여하는 경우를 카운트 벡터화라고 한다.   
`카운트 벡터화에서는 카운트 값이 높을 수록 중요한 단어로 인식된다.`      

사이킷런 CountVectorizer 에 대해서 살펴보자.   

> 참고로, 사이킷런에서 카운트 벡터화와 TF-IDF 사용방법은 거의 유사하며, 
    파라미터로 카운터 벡터화를 사용할 것인지 TF-IDF를 사용할 것인지만 다르다.   

<img width="900" alt="스크린샷 2023-05-27 오후 12 13 54" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/6b944275-92ac-47fc-8689-2c9e3fd9cef7">     

- min_df: 오타 또는 희귀 단어 등을 제거 하는 효과가 있다.   

- max_df: 너무 자주 등장하지만 큰 의미가 없는 불용어 제거하는 효과가 있다.   

- max_features: 기본값은 None이며, 빈도수가 가장 높은 순으로 지정한 개수만큼 단어 사전을 만들어서 벡터라이저가 학습할 어휘의 양을 제한한다.     

<img width="900" alt="스크린샷 2023-05-27 오후 12 18 45" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/1187d199-d929-4ddb-9a1a-dbe12a9f0e4a">  

아래 코드로 확인해보자.   

```python
text_sample_01 = 'The Matrix is everywhere its all around us, here even in this room. \
                  You can see it out your window or on your television. \
                  You feel it when you go to work, or go to church or pay your taxes.'
text_sample_02 = 'You take the blue pill and the story ends.  You wake in your bed and you believe whatever you want to believe\
                  You take the red pill and you stay in Wonderland and I show you how deep the rabbit-hole goes.'
text=[]
text.append(text_sample_01); text.append(text_sample_02)
print(text,"\n", len(text))
```

위에서 문서 1과 2를 배열로 합친 후에 아래와 같이 CountVectorizer객체를 
생성했다.  
그 후 `fit()과 transform()을 통해 feature vectorization을 수행했다.`    

```python
from sklearn.feature_extraction.text import CountVectorizer

# Count Vectorization으로 feature extraction 변환 수행. 
cnt_vect = CountVectorizer()
cnt_vect.fit(text) # 문서에 있는 모든 토큰의 단어 사전을 학습   

# 문서를 단어와 문서 행렬로 변환.
# transform() 이후에는 행렬로 변환되어 숫자 형태로 변경   
ftr_vect = cnt_vect.transform(text) 
```

Output


```
<class 'scipy.sparse.csr.csr_matrix'> (2, 51)
  (0, 0)	1
  (0, 2)	1
  (0, 6)	1
  (0, 7)	1
  (0, 10)	1
  (0, 11)	1
  (0, 12)	1
  (0, 13)	2
  //...
```

`결과는 희소행렬로 보여주며, (0, 0)는 각 단어의 위치를 나타내며, 
    오른쪽 숫자는 count를 나타낸다.`   

> 행은 각 문서 또는 문장의 인덱스를 나타내며, 열은 단어의 인덱스를 뜻한다.   


`vocabulary를 통해 단어 사전을 볼 수 있다.`    

```python
print(cnt_vect.vocabulary_)
```

Outout

```
{'the': 38, 'matrix': 22, 'is': 19, 'everywhere': 11, 'its': 21, 'all': 0, 'around': 2, 'us': 41, 'here': 15, 'even': 10, 'in': 18, 'this': 39, 'room': 30, 'you': 49, 'can': 6, 'see': 31, 'it': 20, 'out': 25, 'your': 50, 'window': 46, 'or': 24, 'on': 23, 'television': 37, 'feel': 12, 'when': 45, 'go': 13, 'to': 40, 'work': 48, 'church': 7, 'pay': 26, 'taxes': 36, 'take': 35, 'blue': 5, 'pill': 27, 'and': 1, 'story': 34, 'ends': 9, 'wake': 42, 'bed': 3, 'believe': 4, 'whatever': 44, 'want': 43, 'red': 29, 'stay': 33, 'wonderland': 47, 'show': 32, 'how': 17, 'deep': 8, 'rabbit': 28, 'hole': 16, 'goes': 14}
```

위 결과는 각 단어의 인덱스이며, around 단어의 같은 경우 2 인덱스를 가르킨다.   
즉, 0 ~ N 문서에서 인덱스 2를 각각 찾아보면 around가 문서마다 
몇번 count 되었는지 확인할 수 있다.   

> (0,2), (1,2), (2,2) ...
> 참고로 count가 0인 경우는 노출하지 않는다.   

또한, 아래와 같이 각 단어 사전을 확인 할 수도 있다.   

```python
print(cnt_vect.get_feature_names_out())
```

Output   

```
['all' 'and' 'around' 'bed' 'believe' 'blue' 'can' 'church' 'deep' 'ends'
 'even' 'everywhere' 'feel' 'go' 'goes' 'here' 'hole' 'how' 'in' 'is' 'it'
 'its' 'matrix' 'on' 'or' 'out' 'pay' 'pill' 'rabbit' 'red' 'room' 'see'
 'show' 'stay' 'story' 'take' 'taxes' 'television' 'the' 'this' 'to' 'us'
 'wake' 'want' 'whatever' 'when' 'window' 'wonderland' 'work' 'you' 'your']
```

위 결과를 판다스로 보기 좋게 표로 나타내보자.   
아래는 각 문서마다 단어의 빈도수를 나타낸다.   

```python
result = pd.DataFrame(ftr_vect.toarray(), columns=cnt_vect.get_feature_names_out())
result
```

> 희소 행렬에 toarray() 메서드를 사용하면, 넘파이 배열로 변환해준다.  

<img width="600" alt="스크린샷 2023-06-30 오후 10 52 40" src="https://github.com/WonYong-Jang/algorithm/assets/26623547/acff7d7f-1a76-4fe6-a89e-bf001be9dbae">   

전체 문서별 빈도수도 확인해보자.   

```python
result.sum()
```

Output

```
all            1
and            4
around         1
bed            1
believe        2
blue           1
can            1
church         1
deep           1
ends           1
even           1
everywhere     1
# ...
```


이번에는 파라미터를 추가해서 실습해보자.     
`max features 옵션을 5개로 주어서 가장 많은 빈도수를 가지는 5개만 추출하도록 했다.`   
`하지만 stop words 옵션을 제외하면 의미없는 "the, you, and" 와 같은 
단어가 추출되므로 필수로 넣어주어야 한다.`   


```python
cnt_vect = CountVectorizer(max_features=5, stop_words='english')
cnt_vect.fit(text)
ftr_vect = cnt_vect.transform(text)
print(type(ftr_vect), ftr_vect.shape)
print(cnt_vect.vocabulary_)
```

Output

```
<class 'scipy.sparse.csr.csr_matrix'> (2, 5)
{'window': 4, 'pill': 1, 'wake': 2, 'believe': 0, 'want': 3}
```   



### 4-2) TF-IDF 벡터화   

카운트만 부여할 경우 그 문서의 특징을 나타내기보다는 언어의 특성상 문장에서 
자주 사용될 수 밖에 없는 단어까지 높은 값을 부여하게 된다.     

> 상담 문의 글에서 보통 글을 쓸때, "안녕하세요?" 라는 글로 주로 
시작한다면 "안녕" 이라는 중요하지 않는 단어의 횟수가 가장 높을 수 있다.   

이러한 문제를 보완하기 위해 `TF-IDF(Term Frequency Inverse Document Frequency) 
    벡터화를 사용한다.`    

`TF-IDF는 개별 문서에서 자주 나타나는 단어에 높은 가중치를 주되, 모든 문서에서 
전반적으로 자주 나타나는 단어에 대해서는 패널티를 주는 방식으로 
값을 부여한다.`        

즉 특정 단어가 다른 문서에는 나타나지 않고 특정 문서에서만 자주 사용된다면 
해당 단어는 해당 문서를 잘 특징 짓는 중요한 단어일 가능성이 높다.   

반대로 특정 단어가 매우 많은 여러 문서에서 빈번히 나타난다면 해당 단어는 
개별 문서를 특징짓는 정보로서의 의미를 상실한다.   

- - - 

## 5. 희소 행렬   

<img width="850" alt="스크린샷 2023-05-27 오후 12 46 39" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/8f8a8d4a-10ed-4eb8-bf67-cea9a2fe07e1">    

수천 수만개의 문서가 있다면, 모든 단어를 다 나열해야 하기 때문에 
굉장히 많은 단어가 나올 것이고 이에 따라 
너무 많은 0값이 할당이 된다.   
따라서 `연산 시간 및 메모리 문제가 발생하기 때문에 희소 행렬을 아래와 같은 형태로 
변환하여 주로 사용`한다.   

### 5-1) COO 형식   

`Coordinate(좌표) 방식을 의미하며 0이 아닌 데이터만 별도의 배열(Array)에 
저장하고 그 데이터를 가르키는 행과 열의 위치를 별도의 배열로 저장하는 방식이다.`       

<img width="800" alt="스크린샷 2023-05-27 오후 12 56 36" src="https://github.com/WonYong-Jang/Spring-Jquery-Project/assets/26623547/6c4cb6d7-8c5c-479d-bc43-d12a78de9a8d">   

> 위에서 행에서 0, 0, 1, 1, 1, 1, 2, 2 등 중복값이 많기 때문에 CSR 형식이 많이 사용된다.   


### 5-2) CSR 형식 

`COO 형식이 위치 배열값을 중복적으로 가지는 문제를 해결한 방식이며 
일반적으로 CSR 형식이 COO 보다 많이 사용된다.`        

<img width="800" alt="스크린샷 2023-05-27 오후 1 10 38" src="https://github.com/WonYong-Jang/ToyProject/assets/26623547/5642ce5f-4ff9-461a-bf21-f7423208236a">    


`파이썬에서는 희소 행렬을 COO, CSR 형식으로 변환하기 위해서 Scipy의 coo_matrix(), csr_matrix() 함수를 
이용한다.`   





- - -    

Referrence 

<https://www.nltk.org/>    
<https://www.inflearn.com/course/lecture?courseSlug=%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C&unitId=25263&tab=curriculum>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

