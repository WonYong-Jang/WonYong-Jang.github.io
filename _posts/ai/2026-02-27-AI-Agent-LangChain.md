---
layout: post
title: "[AI] Agent (LangChain)"
subtitle: Vector Database
comments: true
categories: AI
date: 2026-02-27
background: /img/posts/mac.png
---

## 1. Retrieval Augmented Generation(RAG) 란?

RAG 는 LLM 어플리케이션 개발에서 중요한 개념이며, LLM(Large Language Model) 등장 전 NLP(Natural Language Processing) 에서 부터 사용되었다.     

> 우리 말로하면 검색-증강 생성
##### Retrieval   

`데이터를 가져오는 것`이며, 구체적으로는 컴퓨터 시스템에 저장된 자료를 취득하는 것 이라는 뜻도 있다.   

> 예를 들면 벡터 스토어에 저장된 데이터를 가져온다.

이것은 언어 모델이 가지고 있지 않은 정보를 가지고 오는 것이며, 언어 모델이 최종 아웃풋을 만드는데 필요한 정보를 제공하는 것이다.   
언어 모델이 답변 생성은 능숙하지만, 답변 생성을 위한 모든 정보를 가지고 있지 않기 때문이다.   

> 보안이 걸려있는 사내자료는 LLM 이 학습을 할수 없기 때문에 정보를 따로 제공해줘야 한다.   
> 또는 특정 모델 버전(e.g. GPT4는 23년 10월까지 정보를 가지고 있음) 은 최신 정보가 없기 때문에 웹 크롤링을 하여서 답변하는 것을 확인해볼 수 있다.  

##### Augmented

AR/VR에 사용되는 것과 같은 단어이며, `Retrieval된 데이터를 LLM에게 주면서, "마치 이 정보를 아는 것처럼" 이라는 의미`이다.    

> 포켓몬고 게임에서 포켓몬이 실제로 없지만 AR 기술을 활용하여 실제 있는 것처럼 진행하는 것과 같은 원리   

##### Generation   

`답변을 생성하는 것`을 의미하며, RAG는 "내가 가져온 데이터를 제공할테니, 이 정보를 아는 것처럼 답변을 생성해라" 라는 의미가 된다.   


그럼 이제 개발자로서 우리가 해야할 고민은 아래와 같다.   
`답변을 생성하는 것 자체는 LLM의 역할이지만, 데이터를 잘 가져와서 LLM에게 잘 전달하는 것 까지는 개발자의 역할이 된다.`    

> 즉, Retrieval Augmented 까지는 개발자의 역할이다.   

여기서 LangChain 은 데이터를 잘 전달해주는데에 있어서 이점이 많기 때문에 
이번글에서는 LangChain에 대해서 자세히 살펴보자. 


- - - 

## 2. Vector Database 

RAG 를 구성할 때 핵심이 되는 Vector Database 에 대해서 살펴보자.   
RAG를 이용하여 답변을 생성할 때 필요한 데이터를 가져오는데, 이 필요한 데이터는 사용자가 원하는 정보일 것이고 사용자의 질문과 관련있는 데이터일 것이다.     

그럼 사용자의 질문과 관련이 있다는 것을 어떻게 판단할까?    
여기서 `관련성 파악을 위해서 vector를 활용`한다.    

`단어 또는 문장의 유사도를 파악해서 관련성을 측정하며, Embedding 모델을 활용하여 vector를 생성하게 된다.`   

> 문장에서 비슷한 단어가 자주 붙어 있는 것을 학습하게 된다.
> 예를 들면 "왕은 왕자의 아버지다" 와 "여왕은 왕자의 어머니다" 두 문장에서 "왕자의" 라는 단어 앞에 등장하는 "왕"과 "여왕"은 유사할 가능성이 높다.

[Embedding Projector](https://projector.tensorflow.org/) 에서 특정 단어를 검색해보면 유사한 단어들을 함께 확인해볼 수 있다.   

`즉, Vector Database 란 Embedding 모델을 활용해 생성된 vector를 저장하는 것이다.`   
`여기서, 단순히 vector만 저장하면 안되고, metadata(문서의 이름, 페이지 번호 등)도 같이 저장하게 된다.`   

> LLM이 답변을 잘못 생성했을 경우를 대비해서 어떤 문서에서 가져왔는지 출처를 보여주는게 중요하다.   

Vector Database의 대표적인 예로 인메모리 데이터 베이스인 Chroma, 기본적으로 클라우드 서비스를 제공하는 Pinecone 등이 있다.   


## 3. LangChain

`LangChain은 LLM을 활용한 어플리케이션 개발에 특화된 오픈소스 프레임워크이다.`   
GPT 같은 모델을 단순 호출하는 것이 아니라, 프롬프트, 메모리, 툴, 체인, 에이전트 등을 조합해 복잡한 AI Workflow를 만들 수 있게 해준다 

LangChain을 그럼 왜 사용해야 할까?

`LLM을 직접 사용하면 단순한 질문 답변만 가능하지만, LangChain을 사용하면 복잡한 워크플로우를 구성할 수 있다.`   
. 
## 4.  LLM Evaluation 의 중요성

`LLM Evaluation 은 서비스를 안정적으로 운영하기 위해서 반드시 필요하며, 이는 사용자가 정확한 정보를 받을 수 있는지를 보는 것이다.`    

`LangSmith 는 LangChain 에서 만든 툴이며, 답변이 얼마나 도움이 되었는지, 실제 레퍼런스와 비교했을 때 어느정도 정확한지 등을 확인할 수 있다.`    




- - - 

Referrence 

<https://wikidocs.net/261585>  
<https://platform.openai.com/>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

