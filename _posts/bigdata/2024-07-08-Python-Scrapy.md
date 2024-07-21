---
layout: post
title: "[Python] Python을 이용한 Crawling (Scrapy)"
subtitle: "Crawling, Scraping / 사이트의 크롤링 정책"
comments: true
categories : BigData
date: 2024-07-08
background: '/img/posts/mac.png'
---

이번 글에서는 Scrpay를 사용하여 특정 페이지를 Scraping 해보자.    

- - - 

## 1. Scrapy 란?  

`scrapy는 웹사이트에서 필요한 데이터를 추출하는 오픈소스 프레임워크로 가볍고, 
    빠르며 확장성이 좋다.`   
`파이썬 기반으로 spider라고 하는 코드를 작성하여 크롤링을 실행한다.`        

asynchronous networking libary 인 [Twisted](https://twisted.org/)를 기반으로 하기 때문에 
매우 우수한 성능을 발휘하며 셀레니움과 마찬가지로 XPath, CSS 표현식으로 HTML 소스에서 
데이터 추출이 가능하다.  

> 한편, 셀레니움과 다르게 webdriver를 사용하지 않는다.     

scrapy는 지정된 url만 조회하기 때문에 scrapy가 셀레니움보다 가볍고 빠른 크롤링을 실행할 수 있다.     


- - -    

## 2. Scrapy 프로젝트 생성    

이제 scrapy를 설치하고 프로젝트를 생성해보자.    

```
### 설치
$ pip install scrapy

$ scrapy version

### scrapy 프로젝트 생성    
$ scrapy startproject <project name>
```

기본적인 scrapy 프로젝트 구조는 아래와 같다.   

```
$ tree myScrapy
myScrapy
├── scrapy.cfg
└── myScrapy
    ├── __init__.py
    ├── items.py
    ├── middlewares.py
    ├── pipelines.py
    ├── settings.py
    └── spiders
        └── __init__.py
```

- scrapy.cfg: 프로젝트 파일구조 설정   
- items.py: 크롤링한 결과가 저장될 형태 정의   
- pipelines.py: 크롤링한 데이터를 items에 맞게 가공하거나, 가공된 데이터를 어떻게 처리할 것인지를 정의   
- settings.py: 프로젝트 설정 파일   
- spiders: 실제 크롤링시 동작할 파일    

`프로젝트 내 items는 데이터를 담는 VO 역할을 하며, spyders 안에 작성하는 소스 코드는 
실제 웹페이지 파일로부터 html을 가져와서 처리하는 코드를 담당한다.`   


또한, `pipeline은 spyders에서 읽어온 item들을 파일, db 등으로 저장하는 작업을 담당한다.`      

> 또는 유효성 체크, 필터 작업을 하거나 아이템을 가공하는 등의 후처리 작업을 할 수 있다.          

마지막으로 settings.py 파일에서 파이프라인 설정을 어떻게 할 것인지, csv 파일 저장 등을 
설정할 수 있다.    


- - - 

## 3. Scrapy 실행 

scrapy를 실행하기 위해 spiders 폴더내에 새로운 파일을 생성한다.   

`그 후 반드시 class 내에 scrapy.Spider를 상속해야 하며, name 부분이 
실행할 때 사용할 spider 이름이 된다.`       
 
```python
import scrapy

class ExampleSpider(scrapy.Spider):
    name = 'mySpider'   ### spider 이름     
    start_urls = [
        "https://quotes.toscrape.com/page/1/"
    ]

    ### 파서 정의 
    def parse(self, response):
        print(f'Response! : {response.body}')
```

`스타트 url 지정은 위와 같이 start_urls을 지정하여 배열 형태로 넣는 방법과 
start_requests 을 이용하여 로그인을 하는 방법을 추가하는 등 더 자세한 로직을 
추가할 수 있다.`   

`또한 위 코드의 경우 scrapy crawl mySpider 명령어를 이용하여 실행한 
결과를 확인할 수 있다.`       

```
### spiders 폴더 위치에서   
$ scrapy runspider example.py
### 또는 
$ scrapy crawl <spider name>
```

또한, scrapy shell 을 통해서 가지고 오려고 하는 주소에서 
테스트도 가능하다.   

```
$ scrapy shell <url>
```


- - -    


## 4. CSV 로 저장    

프로젝트 폴더에 있는 settings.py에 아래와 같이 추가한다.    

```
FEED_FORMAT = "csv"
FEED_URI = "result.csv"
```   

- - - 

## 5. 사이트 크롤링 정책    

robots.txt 를 통해서 각 사이트마다 로봇이 접근하는 것을 
방지하기 위한 규약을 확인할 수 있다.   

> ex) https://www.google.com/robots.txt

##### 모두 허용하는 경우    

```
User-agent: *
Allow: /
```

##### 모두 차단하는 경우   

```
User-agent: *
Disallow: /   
```

##### 다양한 조합   

```
User-agent: googlebot # googlebot 로봇만 적용   
Crawl-delay: 1        # 크롤링 할 때 1초 정도 delay를 권장   
Disallow: /private/   # 이 디렉토리 접근 차단   

User-agent: googlebot-news  # 로봇만 적용   
Disallow: /                 # 모든 디렉토리를 접근 차단   

User-agent: *           # 모든 로봇 적용 
Disallow: /something/   # 이 디렉토리를 접근 차단 
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







