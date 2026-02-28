---
layout: post
title: "[Machine Learning] Python 한글 형태소 분석기 - 코엔엘파이(KoNLPy)"
subtitle: "Python package for Korean natural language processingi / 네이버 영화리뷰 감성 분석" 
comments: true
categories : AI
date: 2023-07-07
background: '/img/posts/mac.png'
---

이번 글에서는 파이썬에서 제공하는 한글 형태소 분석기 KoNLPy 에 대해 살펴보자.   

- - - 

## 1. 한글 형태소 분석    

한글은 과학적인 언어이지만, 컴퓨터가 이해하기에는 아래와 같은 어려움들이 있다.   

- 띄워 쓰기   
- 다양한 조사   
- 주어 / 목적어가 생략되어도 의미 전달 가능    
- 의성어 / 의태어, 높임말 등   

```
아버지가 방에 들어가신다.
아버지 가방에 들어가신다.
```

특히 위와 같이 띄워쓰기가 잘못된 경우 의미가 전달 되는 경우가 있다.  
컴퓨터는 이를 농담이 아니라 실제로 받아 들여서 처리한다.   

`여기서 형태소의 사전적인 의미는 단어로서 의미를 가지는 최소 단위로 
정의할 수 있다.`   

`형태소 분석(Morphological analysis)이란 말뭉치를 이러한 형태소 어근 단위로 
쪼개고 각 형태소에 품사 태깅(POS tagging)을 부착하는 작업을 
일반적으로 지칭한다.`   

- - -

## 2. 형태소 분석 실습    

먼저, KoNLPy를 사용하기 위해 아래와 같이 설치하자.   

```
pip install konlpy
```

KoNLPy는 Kkma, Komoran, Hannanum, Okt(Twitter 형태소 분석기의 이름이 Okt로 
        변경됨), Mecab 형태소 분석기를 파이썬에서 사용할 수 있게 해준다.   

```python
from konlpy.tag import * 
hannanum = Hannanum()
kkma = Kkma()
komoran = Komoran()
mecab = Mecab()
okt = Okt()
```

이 클래스들은 다음과 같은 메서드들을 공통적으로 제공한다.   

- nouns: 명사 추출    
- morphs: 형태소 추출    
- pos: 품사 추출   

여기서는 Okt를 사용하여 간단한 문장에 품사를 태깅을 실행해 보면서, 
    품사 태깅에 대해 알아보자.   

`이때, 품사를 태깅한다는 의미는 텍스트가 주어졌을 때 이를 형태소 단위로 
나누고, 나눠진 형태소를 해당하는 품사와 함께 리스트로 만드는 것이다.`   

```python
text = "아버지가 방에 들어가신다."
okt = Okt()
okt.pos(text)
```

Output

```
[('아버지', 'Noun'),
 ('가', 'Josa'),
 ('방', 'Noun'),
 ('에', 'Josa'),
 ('들어가신다', 'Verb'),
 ('.', 'Punctuation')]
```

위 결과를 보면 토큰 별로 명사, 조사, 동사, 구두점 등이 각각 분류 된 것을 확인할 수 있다.   

부착되는 `품사 태그의 기호와 의미는 tagset 속성`으로 확인할 수 있다.   

```python
okt.tagset
```

Output

```
{'Adjective': '형용사',
 'Adverb': '부사',
 'Alpha': '알파벳',
 'Conjunction': '접속사',
 'Determiner': '관형사',
 'Eomi': '어미',
 'Exclamation': '감탄사',
 'Foreign': '외국어, 한자 및 기타기호',
 'Hashtag': '트위터 해쉬태그',
 'Josa': '조사',
 'KoreanParticle': '(ex: ㅋㅋ)',
 'Noun': '명사',
 'Number': '숫자',
 'PreEomi': '선어말어미',
 'Punctuation': '구두점',
 'ScreenName': '트위터 아이디',
 'Suffix': '접미사',
 'Unknown': '미등록어',
 'Verb': '동사'}
```   


다음으로는 `nouns 명령어로 명사만 추출`해보자.   

```python
text = "아버지가 방에 들어가신다."
okt = Okt()
okt.nouns(text)
```

Output   

```
['아버지', '방']
```

`명사 뿐 아니라 모든 품사의 형태소를 확인하려면 morphs 라는 명령을 사용한다.`   

```python
text = "아버지가 방에 들어가신다."
okt = Okt()
okt.morphs(text)
```

Output

```
['아버지', '가', '방', '에', '들어가신다', '.']
```

이제 아래와 같이 텍스트를 받아 품사를 태깅한 뒤 조사, 어미, 구두점이 
있는지를 확인하고 그 외에 토큰을 리스트에 넣어 주는 함수를 만들어 보자.   

`형태소 분석기로 조사, 어미, 구두점을 제거해 주면 같은 단어이지만 다른 단어로 
토큰화하는 것을 방지해 희소 행렬을 줄일 수 있다.`   

```python
def okt_clean(text):
    clean_text = []
    for word in okt.pos(text, stem=True):
        if word[1] not in ['Josa', 'Eomi', 'Punctuation', 'Verb']:
            clean_text.append(word[0])
            
    return " ".join(clean_text)
```

`또한, stem=True를 통한 어간 추출도 형태소 전처리와 마찬가지로 희소 행렬을 줄여 준다.`   
이때, `어간이란 활용어에서 변하지 않는 부분을 말한다(사전적 의미)`       
따라서, 어간 추출은 어형이 변형된 단어에서 접사 등을 제거하고 그 단어의 어간을 분리하는 것이다.   
예를 들어 "합니다", "하는", "할", "하고", "한다" 를 어간 추출하면 원형인 "하다" 가 된다.   

> 이렇게 어간을 분리하면 같은 의미지만 변형해서 사용된 단어를 같은 단어로 인식하기 때문에 
희소 행렬을 조금 줄일 수 있다.   


```python
text = "아버지가 방에 들어가신다. 또 들어간다. 들어가다. 들어갈"
okt = Okt()
okt.morphs(text, stem=True)
```

Output

```
['아버지', '가', '방', '에', '들어가다', '.', '또', '들어가다', '.', '들어가다', '.', '들어가다']
```

위 결과값에서 원형인 들어가다로 모두 변경된 것을 확인할 수 있다.  

- - - 

## 3. 네이버 영화리뷰 감성 분석 실습    


### 3-1) 데이터 로드   


데이터를 [링크](https://github.com/e9t/nsmc)에서 ratings train와 test 파일을 
각각 다운받고 로드해보자.   

```python
from konlpy.tag import Twitter
from konlpy.tag import Okt
from konlpy.tag import Kkma

import pandas as pd
import warnings
warnings.filterwarnings('ignore')

# 컬럼 분리 문자 \t
train_df = pd.read_csv('ratings_train.txt', sep='\t')
train_df.head(10)
```

<img width="600" alt="스크린샷 2023-07-07 오후 9 31 45" src="https://github.com/WonYong-Jang/Development-Process/assets/26623547/886fd4ef-0695-4137-a091-778c69407d3d">    

### 3-2) 데이터 전처리     

로드한 데이터를 살펴보자.    

> label이 1값은 좋은 평이고, 0값은 나쁜 평이다.   

```python
train_df['label'].value_counts( )
```

Output

```
0    75173
1    74827
Name: label, dtype: int64
```

아래 명령어로 보면 null 값이 존재하는 것을 확인할 수 있다.   

```python
train_df.info()
```

아래와 같이 null 값을 공백으로 변경하였고, `re 를 import 하여 정규식`을 사용했다.   
`정규식을 사용하여 불필요한 숫자 값을 공백으로 변경`했다.   

> \d 는 숫자를 의미하며, +는 1개 이상 이라는 의미를 가지는 정규 표현식이다.   

```python
import re 

train_df = train_df.fillna(' ')
# 정규 표현식을 이용하여 숫자를 공백으로 변경(정규 표현식으로 \d 는 숫자를 의미함.) 
train_df['document'] = train_df['document'].apply( lambda x : re.sub(r"\d+", " ", x) )

# 테스트 데이터 셋을 로딩하고 동일하게 Null 및 숫자를 공백으로 변환. 
test_df = pd.read_csv('ratings_test.txt', sep='\t') # 한글 encoding시 encoding='cp949' 적용.
test_df = test_df.fillna(' ')
test_df['document'] = test_df['document'].apply( lambda x : re.sub(r"\d+", " ", x) )

# id 컬럼 삭제 수행. 
train_df.drop('id', axis=1, inplace=True) 
test_df.drop('id', axis=1, inplace=True)
```

Okt를 이용하여 형태소 분석을 진행해보자.   

```python
from konlpy.tag import Okt

okt = Okt()
def tw_tokenizer(text):
    # 입력 인자로 들어온 text 를 형태소 단어로 토큰화 하여 list 객체 반환
    tokens_ko = okt.morphs(text)
    return tokens_ko
```

아래와 같이 tfidVectorizer를 이용하여 [피처 벡터화](http://localhost:4000/ml/2023/05/26/Machine-Learning-Text-Analysis.html)를 
진행해보자.      

```python
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import GridSearchCV

# Okt 객체의 morphs( ) 객체를 이용한 tokenizer를 사용. ngram_range는 (1,2) 
tfidf_vect = TfidfVectorizer(tokenizer=tw_tokenizer, ngram_range=(1,2), min_df=3, max_df=0.9)
tfidf_vect.fit(train_df['document'])
tfidf_matrix_train = tfidf_vect.transform(train_df['document'])
```

### 3-3) 학습 및 예측   

최종적으로 LogisticRegression를 이용하여 학습 및 예측해보자.   

```python
# Logistic Regression 을 이용하여 감성 분석 Classification 수행.
lg_clf = LogisticRegression(random_state=0, solver='liblinear')

# Parameter C 최적화를 위해 GridSearchCV 를 이용.
params = { 'C': [1 ,3.5, 4.5, 5.5, 10 ] }
grid_cv = GridSearchCV(lg_clf , param_grid=params , cv=3 ,scoring='accuracy', verbose=1 )
grid_cv.fit(tfidf_matrix_train , train_df['label'] )
print(grid_cv.best_params_ , round(grid_cv.best_score_,4))
```

`주의해야할 부분은 반드시 학습에서 사용했던 tfidfVectorizer를 사용해야 하며, 이때 다시 fit 하면 안된다.`   
`학습데이터에서 fit 해서 벡터화 했던 부분을 테스트 데이터에서 다시 fit해서 생성해버리기 때문이다.`   


```python
from sklearn.metrics import accuracy_score

# 학습 데이터를 적용한 TfidfVectorizer를 이용하여 테스트 데이터를 TF-IDF 값으로 Feature 변환함. 
tfidf_matrix_test = tfidf_vect.transform(test_df['document']) # fit_transform 메서드를 사용하지 말자.   

# classifier 는 GridSearchCV에서 최적 파라미터로 학습된 classifier를 그대로 이용
best_estimator = grid_cv.best_estimator_
preds = best_estimator.predict(tfidf_matrix_test)

print('Logistic Regression 정확도: ',accuracy_score(test_df['label'],preds))
```


- - - 

Referrence 

<https://www.nltk.org/>    
<https://www.inflearn.com/course/lecture?courseSlug=%ED%8C%8C%EC%9D%B4%EC%8D%AC-%EB%A8%B8%EC%8B%A0%EB%9F%AC%EB%8B%9D-%EC%99%84%EB%B2%BD%EA%B0%80%EC%9D%B4%EB%93%9C&unitId=25263&tab=curriculum>   
<https://wikidocs.net/92961>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

