---
layout: post
title: "[ELK] Elastic Search 5 텍스트 분석"
subtitle: "Inverted Index, Text Analysis, Analyzer"    
comments: true
categories : ELK
date: 2021-02-09
background: '/img/posts/mac.png'
---

앞 장에서 엘라스틱 서치의 다양한 검색 방법에 대해 살펴 봤다. 풀 텍스트 검색을 
하기 위해서는 데이터를 검색에 맞게 가공하는 작업을 필요로 하는데 
엘라스틱 서치는 데이터를 저장하는 과정에서 이 작업을 처리한다.    
이번 장에서는 엘라스틱 서치가 검색을 위해 텍스트 데이터를 어떻게 처리하고 
데이터를 색인 할 때 엘라스틱에서 어떤 과정이 이루어지는지에 대해 살펴보자.   

- - - 

## 1. Inverted Index   

데이터 시스템에 다음과 같은 문서들을 저장한다고 가정 해 보자.    

<img width="775" alt="스크린샷 2021-03-22 오후 6 14 21" src="https://user-images.githubusercontent.com/26623547/111966815-b40c4880-8b3a-11eb-8a29-e34403abf389.png">    

일반적으로 오라클이나 MySQL 같은 관계형 DB에서는 위 내용을 보이는 대로 테이블 
구조로 저장을 한다. 만약에 위 테이블에서 Text에 **fox**가 포함된 행들을 가져온다고 하면 
다음과 같이 Text 열을 한 줄씩 찾아 내려가면서 fox가 있으면 가져오고 없으면 넘어가는 
식으로 데이터를 가져 올 것이다.    

<img width="751" alt="스크린샷 2021-03-22 오후 6 13 49" src="https://user-images.githubusercontent.com/26623547/111967099-fafa3e00-8b3a-11eb-9c49-a7a6c5e01995.png">   

전통적인 RDBMS 에서는 위와 같이 like 검색을 사용하기 때문에 데이터가 늘어날수록 
검색해야 할 대상이 늘어나 시간도 오래 걸리고, row 안의 내용을 모두 읽어야 하기 때문에 
기본적으로 속도가 느리다.   
`엘라스틱 서치는 데이터를 저장할 때 다음과 같이 역 인덱스(inverted index)라는 구조를 만들어 저장한다.`   


<img width="775" alt="스크린샷 2021-03-22 오후 6 14 06" src="https://user-images.githubusercontent.com/26623547/111967335-44e32400-8b3b-11eb-8852-3c6b81f59308.png">

`이 역 인덱스는 책의 맨 뒤에 있는 주요 키워드에 대한 내용이 몇 페이지에 있는지 
볼 수 있는 찾아보기 페이지에 비유할 수 있다.`    

엘라스틱 서치에서는 추출된 각 키워드를 텀(Term)이라고 부른다. 이렇게 역 인덱스가 
있으면 fox를 포함하고 있는 document들의 id를 바로 얻어 올 수 있다.   

<img width="775" alt="스크린샷 2021-03-22 오후 6 14 14" src="https://user-images.githubusercontent.com/26623547/111996441-5f2df980-8b5d-11eb-9d8f-2760095fdb4a.png">   

`엘라스틱 서치는 데이터가 늘어나도 찾아가야 할 행이 늘어나는 것이 아니라 역 인덱스가 가르키는 id의 배열값이 
추가되는 것 뿐이기 때문에 큰 속도의 저하 없이 빠른 속도로 검색이 가능하다.`    
`이런 Inverted Index를 데이터가 저장되는 과정에서 만들기 때문에 엘라스틱 서치는 데이터를 입력할 때 
저장이 아닌 색인을 한다고 표현한다.`   

- - - 

## 2. Text Analysis    

엘라스틱 서치에 저장되는 document는 모든 문자열(text) 필드 별로 역 인덱스를 생성한다. 검색에 사용하는 경우에는 
앞에서 설명한 역 인덱스의 예제는 실제로는 보통 아래와 같이 저장된다.   

<img width="762" alt="스크린샷 2021-03-22 오후 10 29 42" src="https://user-images.githubusercontent.com/26623547/112002686-825ba780-8b63-11eb-95f6-1220016c25e0.png">   

`엘라스틱 서치는 문자열 필드가 저장될 때 데이터에서 검색어 토큰을 저장하기 위해 
여러 단계의 처리 과정을 거친다. 이 전체 과정을 Text Analysis 라고 하고 
이 과정을 처리하는 기능을 Analyzer라고 한다.`     

엘라스틱 서치의 Analyzer는 0~3개의 Character Filter와 1개의 Tokenizer, 그리고 
0~n개의 Token Filter 로 이루어 진다.   

<img width="777" alt="스크린샷 2021-03-22 오후 11 08 18" src="https://user-images.githubusercontent.com/26623547/112002755-930c1d80-8b63-11eb-9e3c-6347bdeb0dde.png">   
 
`텍스트 데이터가 입력되면 가장 먼저 필요에 따라 전체 문장에서 특정 문자를 
대치하거나 제거하는데 이 과정을 담당하는 캐릭터 필터(Characer Filter)이다.`    

다음으로는 `문장에 속한 단어들을 텀 단위로 하나씩 분리 해 내는 처리 과정을 
거치게 되는데 이 과정을 담당하는 기능이 Tokenizer 이다.`         
토크나이저는 반드시 1개만 적용이 가능하다.    
아래는 whitespace 토크나이저를 이용해서 공백을 기준으로 텀 들을 
분리 한 결과이다.    

<img width="761" alt="스크린샷 2021-03-22 오후 11 12 55" src="https://user-images.githubusercontent.com/26623547/112003438-407f3100-8b64-11eb-9654-96a776a66979.png">   

`다음으로 분리된 Term 들을 하나씩 가공하는 과정을 거치는데 이 과정을 
담당하는 기능이 Token Filter이다. 토큰 필터는 0개 부터 여러 개를 
적용 할 수 있다.`        

여기서는 먼저 lowercase 토큰 필터를 이용해서 대문자를 모두 소문자로 바꿔준다. 
이렇게 하면 대소문자 구별 없이 검색이 가능하게 된다. 대소문자가 
일치하게 되어 같은 Term이 된 토큰들은 모두 하나로 병합이 된다.   

<img width="762" alt="스크린샷 2021-03-22 오후 11 17 18" src="https://user-images.githubusercontent.com/26623547/112004146-e16dec00-8b64-11eb-977e-d19850fb4073.png">   

이제 역 인덱스는 아래와 같이 변경된다.   

<img width="765" alt="스크린샷 2021-03-22 오후 11 17 42" src="https://user-images.githubusercontent.com/26623547/112004156-e337af80-8b64-11eb-9972-e1657fb97c6c.png">   

텀 중에는 검색어로서의 가치가 없는 단어들이 있는데 이런 단어를 불용어(stopword) 라고 한다. 
보통 a, an, are, at, be, but, by, do, for, i, no, the, to... 등의 단어들은 
불용어로 간주되어 검색어 토큰에서 제외된다.   
`stop 토큰 필터를 적용하면 우리가 만드는 역 인덱스에서 the가 제거된다.`   

<img width="773" alt="스크린샷 2021-03-22 오후 11 22 37" src="https://user-images.githubusercontent.com/26623547/112005436-175fa000-8b66-11eb-8b22-3d754f711876.png">    

이제 형태소 분석 과정을 거쳐서 문법상 변형된 단어를 일반적으로 검색에 쓰이는 
기본 형태로 변환하여 검색이 가능하게 한다.    

> 영어에서는 형태소 분석을 위해 snowball 토큰 필터를 주로 사용하는데 이 
필터는 ~s, ~ing 등을 제거한다.   
> happy, lazy 와 같은 단어들은 happiness,laziness와 같은 형태로도 사용되기 때문에 ~y 를 ~i로 변경 한다.    

snowball 토큰 필터를 적용하고 나면 jumps와 jumping은 모두 jump로 변경되고, 동일하게 jump 로 되었기 때문에 
하나의 Term으로 병합된다.   

<img width="777" alt="스크린샷 2021-03-22 오후 11 29 32" src="https://user-images.githubusercontent.com/26623547/112006314-f51a5200-8b66-11eb-9ad5-e0e9ecddc2a9.png">   

또한, 필요에 따라서는 동의어를 추가 해 주기도 한다.    
`synonym 토큰 필터를 사용하여 AWS 와 Amazon을 동의어로 설정하는 등 실제로도 사용되는 
사례가 많다.`




- - - 

**Reference**    

<https://esbook.kimjmin.net/06-text-analysis/6.1-indexing-data>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

