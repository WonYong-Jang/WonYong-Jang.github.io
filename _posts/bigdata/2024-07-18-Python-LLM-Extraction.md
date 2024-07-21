---
layout: post
title: "[Python] LLM 을 이용하여 데이터 수집 및 요약 추출"
subtitle: "LangChain과 OpenAI API 사용 / ChatOpenAI / StrOutputParser / ChatPromptTemplate / WebBaseLoader"
comments: true
categories : BigData
date: 2024-07-18
background: '/img/posts/mac.png'
---

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
조금 증가 시키는게 도움이 될 수 있다.   

`그 다음은 Prompt Template 을 사용하여 질문을 할 때 고정된 메시지 외에 
변경된 부분만 전달 해주는 템플릿을 생성하여 사용할 수 있다.`      

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

[링크](https://wonyong-jang.github.io/bigdata/2024/06/24/Python-BeautifulSoup-Selenium.html) 에서 
BeautifulSoup 또는 Selenium을 이용하여 데이터 수집을 했었고, 
              LangChain을 이용하면 더 간단한 코드로 데이터 수집이 가능해 진다.   

이전에 생성해두었던 csv 파일을 로드하여 각 본문 내용을 추가로 
수집해보자.   


```python
# 뉴스 링크 데이터 가져오기
import pandas as pd
df_news = pd.read_csv('news.csv')
df_news.head()
```

```python
import bs4
import time
from langchain_community.document_loaders import WebBaseLoader

# url에 해당하는 class=article_view 영역의 컨텐츠 수집
def get_news_content(url):
    loader = WebBaseLoader(
        web_paths=[url],  # 수집할 url 
        bs_kwargs=dict(
            parse_only=bs4.SoupStrainer(
                class_=["article_view"]  # class=article_view의 영역 수집 
            )
        ),
    )
    docs = loader.load()
    time.sleep(1) # 서버 부하를 위해 delay
    return docs[0].page_content.strip() 
```

```python
# content 컬럼 추가
df_news['content'] = df_news['link'].apply(get_news_content)
df_news.head()
```

위 코드는 url을 입력받아서, `LangChaing 에서 제공하는 WebBaseLoader를 
이용하여 컨텐츠를 수집`해오는 코드이다.   
여기서 기존 데이터 프레임에 content 라는 컬럼을 추가하여 apply 함수로 
작성한 함수를 적용해주었다.   

`판다스에서 제공하는 apply 함수는 foreach와 같이 순차적으로 
처리하는 것이 아닌 내부적으로 병렬처리하기 때문에 
성능상 이점이 있다.`    


<img width="1200" alt="스크린샷 2024-07-21 오후 5 27 25" src="https://github.com/user-attachments/assets/da52c0f3-e3e0-4afd-aa2a-a08237240e2c">   

### 3-1) Extraction 추출    

위에서 수집한 본문 내용 중에 이름 또는 이메일에 대한 
정보를 추출하기 위한 방법 중 정규식을 사용할 수 있다.   

기존에는 개발자가 직접 작성한 정규식에서 예외 케이스가 발생한 경우 
이를 직접 수정해가면서 보완해 나갔다.   

예외케이스가 많을 경우 코드가 복잡해지기 때문에 
지속적으로 유지보수가 필요했다.   

이를 LLM을 활용하여 필요한 데이터를 추출해보자.   


```python
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI
from langchain_core.output_parsers import StrOutputParser

# prompt
prompt_template = """다음 뉴스 본문에서 기자 이름, 이메일 주소를 추출합니다.

<뉴스 본문>
{text}
</뉴스 본문>

기자 이름:
이메일 주소:
"""

prompt = PromptTemplate.from_template(prompt_template)

# LLM
llm = ChatOpenAI(temperature=0, model="gpt-3.5-turbo-0125", api_key=OPENAI_API_KEY)

# output parser
output_parser = StrOutputParser()

# chain
llm_chain = prompt | llm | output_parser

response = llm_chain.invoke({"text": text})

response
```

위 결과값을 확인해보면, 별도의 정규식을 적용해주지 않고도 LLM의 언어능력을 활용하여 
답변을 얻어 낼 수 있다.   

> 이를 Zero shot learning 이라고 한다.    

추가적으로 논문에 대해서 핵심 정보를 요약하거나 핵심 키워드를 추출할 수도 있다.   

```python
# prompt
prompt_template = """다음 뉴스 본문을 3가지 요점으로 요약합니다. 각 요점은 1줄로 작성합니다.   

<뉴스 본문>
{text}
</뉴스 본문>

요점 1:
요점 2:
요점 3:
"""
```

```python
# prompt
prompt_template = """다음 뉴스 본문에서 3가지 키워드를 추출합니다. 각 키워드는 쉼표(,)로 구분합니다.

<뉴스 본문>
{text}
</뉴스 본문>

키워드: 
"""
```   

`LangChain에는 create extraction chain 을 활용하여 요약 및 추출 작업을 할 수 있도록 제공해준다.`    

```python
from langchain.chains import create_extraction_chain
from langchain_openai import ChatOpenAI

# 스키마 정의
schema = {
    "properties": {
        "뉴스_제목": {"type": "string"},
        "뉴스_카테고리": {"type": "string"},
        "뉴스_요약": {"type": "string"},
        "뉴스_키워드": {"type": "string"},
        "기자_이름": {"type": "string"},
        "기자_이메일": {"type": "string"},
    },
    "required": ["뉴스_제목", "뉴스_카테고리", "뉴스_요약", "뉴스_키워드", "기자_이름", "기자_이메일"],
}

# LLM 생성
llm = ChatOpenAI(temperature=0, model_name="gpt-3.5-turbo-0125", api_key=OPENAI_API_KEY)

# Chain 생성
chain = create_extraction_chain(schema=schema, llm=llm)

# Chain 실행
response = chain.invoke(text)

# 결과 확인
response
```

Output

```
{'input': ...
 'text': [{'뉴스_제목': '네이버페이 해외여행보험 비교·추천 서비스',
   '뉴스_카테고리': '보험',
   '뉴스_요약': '해외여행보험 시장 성장, 네이버페이와 카카오페이의 서비스 소개',
   '뉴스_키워드': '해외여행보험, 네이버페이, 카카오페이손해보험',
   '기자_이름': '최인수',
   '기자_이메일': 'apple@cbs.co.kr'}]}
```

위 결과를 확인해보면 언어 모델이 위 스키마를 이해하고 그에 맞는 내용을 추출해서 전달해준다.   

> 현재 4.0 이상의 모델 버전을 사용할 경우 더 좋은 성능을 낼 수 있게 된다.   

마지막으로 스키마는 동일하게 전달해주면서 promt를 추가해줄 수도 있다.  

```python
# prompt 추가
from langchain_core.prompts import ChatPromptTemplate

prompt_template = """Extract and save the relevant entities mentioned \
in the following passage together with their properties.

Only extract the properties mentioned in the 'information_extraction' function.

If a property is not present and is not required in the function parameters, do not include it in the output.

For keywords, extract at most 3 keywords.
For categories, use the following categories: '정치', '경제', '사회', '문화', '세계', '과학', '기술', '스포츠', '엔터', '건강'.

Passage:
{input}
""" 

prompt = ChatPromptTemplate.from_template(prompt_template)

# default prompt가 아닌 custom prompt 로 추가 
chain = create_extraction_chain(schema=schema, llm=llm, prompt=prompt)

# Chain 실행
response = chain.invoke(text)

# 결과 확인
response
```

Output

```
'text': [{'뉴스_제목': '네이버페이 해외여행보험 비교·추천 서비스',
   '뉴스_카테고리': '경제',
   '뉴스_요약': '해외여행보험 시장이 성장하고 있으며, 네이버페이와 카카오페이가 해외여행보험 서비스를 제공하고 있다.',
   '뉴스_키워드': '해외여행보험, 네이버페이, 카카오페이'}]}
```

`default prompt 를 동일하게 사용하되 custom하게 키워드를 최대 3개까지만 한정해주는 부분과 
        카테고리를 한정해 주는 부분을 추가했다.`       


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







