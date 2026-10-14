---
layout: post
title: "[AI] Agent (LangGraph, LangChain)"
subtitle: "OpenAPI API / StageGraph(State, Node, Edge)" 
comments: true
categories : AI
date: 2026-02-27
background: '/img/posts/mac.png'
---

LangGraph는 자연어 처리와 AI 응용 프로그램 개발을 위한 강력한 프레임워크로, 복잡한 언어 모델과의 
상호작용을 효율적이고 구조화된 방식으로 구현할 수 있도록 돕는다.   
다양한 데이터 소스와 언어 모델을 통합하여 지능형 응답 생성, 정보 검색, 텍스트 분석 등의 고도화된 
시스템을 구축할 수 있다.   

- - - 


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

Referrence 

<https://wikidocs.net/261585>  
<https://platform.openai.com/>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

