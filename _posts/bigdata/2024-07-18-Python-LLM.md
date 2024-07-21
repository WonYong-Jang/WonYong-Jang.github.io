---
layout: post
title: "[Python] LLM 을 이용하여 데이터 분석"
subtitle: "LangChain과 OpenAI API 사용 / ChatOpenAI / StrOutputParser / ChatPromptTemplate"
comments: true
categories : BigData
date: 2024-07-18
background: '/img/posts/mac.png'
---


- - - 

## 1. Open AI API 인증키 발급 및 환경 변수 로드   

[https://openai.com/blog/openai-api](https://openai.com/blog/openai-api) 에 접속 및 로그인 후 
[api keys](https://platform.openai.com/api-keys) -> create secret key 버튼을 클릭하여 인증키를 생성한다.   

> 최초 가입자에게 5달러 상당의 크레딧을 제공하므로, 실습을 
진행할 수 있다.     

발급받은 인증키를 환경변수로 등록해주기 위해서 .env 파일을 생성 후 
아래와 같이 등록해주자.   

```
OPENAI_API_KEY=xx
```

이제 환경변수로 등록한 인증키를 import 하여 api를 사용해보자.   

```python
import os
from dotenv import load_dotenv

load_dotenv()

OPENAI_API_KEY=os.environ["OPENAI_API_KEY"]
```

- - -   

## 2. ChatOpenAI 모델 실행  

ChatOpenAI 는 아래와 같이 실행할 수 있으며 각 모델의 비용은 
[https://openai.com/api/pricing/](https://openai.com/api/pricing/)에서 
확인 가능하다.   

```python
# OpenAI GPT-3.5
from langchain_openai import ChatOpenAI

# model
llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125", api_key=OPENAI_API_KEY)

# chain 실행
response = llm.invoke("지구 자전 주기는?")
```

Output

```
AIMessage(content='지구의 자전 주기는 약 24시간입니다. 이는 하루 동안 지구가 자전하는 시간을 의미하며, 이로 인해 낮과 밤이 생기게 됩니다. 지구는 자전하는 동안 자전축 주위를 돌면서 자전속도가 일정하게 유지되고 있습니다.', response_metadata={'token_usage': {'completion_tokens': 96, 'prompt_tokens': 15, 'total_tokens': 111}, 'model_name': 'gpt-3.5-turbo-0125', 'system_fingerprint': None, 'finish_reason': 'stop', 'logprobs': None}, id='run-a66a0b81-a2f0-40a5-a329-748ccff52f24-0')
## 위의 token 사용량에 따라서 성능 및 비용이 달라지게 된다.   
```

`temperature 는 0 ~ 2 사이의 값을 지정할 수 있다.`   
`0 으로 지정하게 되면 비교적 일관된 답변을 얻을 수 있으며, 
    값이 커질 수록 답변이 창의적이고 다양하게 얻을 수 있다.`   

> 글을 작성하거나 요약하는 등의 작업을 할 때는 temperature 값을 
조금 증가하는게 도움이 될 수 있다.   

`그 다음은 Prompt Template 을 사용하여 질문을 할 때 고정된 메시지 외에 
변경된 부분만 전달 해주는 템플릿을 생성하여 사용할 수 있다.   `  

```python
## Prompt Template 사용   
from langchain_core.prompts import ChatPromptTemplate
## 모델에서 응답한 response에서 답변 부분만 추출   
from langchain_core.output_parsers import StrOutputParser

prompt = ChatPromptTemplate.from_template("Answer the question. <Question>: {input}")
output_parser = StrOutputParser()

# chain 연결(LCEL 문법)
# promt 실행 후 llm 순차적으로 실행 
# 마지막으로 output_parser가 실행되어 출력중에 답변 내용만 추출  
chain = prompt | llm | output_parser

response = chain.invoke({"input": "지구 자전 주기는?"})

response
```

- - - 

## 3. LangChain 도구로 뉴스 데이터 수집     


```python
# 뉴스 링크 데이터 가져오기
import pandas as pd
df_news = pd.read_csv('news.csv')
df_news.head()
```

```python
import bs4
from langchain_community.document_loaders
```



- - -

<https://docs.scrapy.org/en/latest/intro/tutorial.html>    
<https://www.incodom.kr/%ED%8C%8C%EC%9D%B4%EC%8D%AC/%EB%9D%BC%EC%9D%B4%EB%B8%8C%EB%9F%AC%EB%A6%AC/Scrapy#h_a103e753e7b14159b61f918a62b1a4c5>   
<https://l0o02.github.io/2018/06/19/python-scrapy-1/>   
<https://python-world.tistory.com/entry/Simple-Scrapy>   
<https://jybaek.tistory.com/927>    
<https://velog.io/@chaeri93/Scrapy-Scrapy%EB%A1%9C-%EB%AC%B4%EC%8B%A0%EC%82%AC-%ED%81%AC%EB%A1%A4%EB%A7%81%ED%95%B4%EC%98%A4%EA%B8%B0>    


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







