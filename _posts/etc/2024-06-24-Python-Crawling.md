---
layout: post
title: "[Python] Python을 이용한 Crawling"
subtitle: "웹 크롤링, 웹 스크래핑"
comments: true
categories : ETC
date: 2024-06-24
background: '/img/posts/mac.png'
---

이번 글에서는 python을 이용하여 크롤링을 하여 데이터 수집을 
진행해보자.   

- - -    

## 1. anaconda를 이용한 python 환경 셋팅     

먼저, python 환경 구성을 위해 anaconda를 설치해보자.   

```
// conda 설치하여 버전확인
$ conda --version


// 설치가 정상적으로 되었다면 커멘드에서 (base) 확인 가능
// 아래 명령어를 이용하여 생성된 환경 list 확인
(base) ➜ conda env list
# conda environments:
#
base                  *  /Users/jang-won-yong/opt/anaconda3
orange3                  /Users/jang-won-yong/opt/anaconda3/envs/orange3


// conda 를 이용하여 새로운 환경 생성 
// python 버전 지정 가능 
$ conda create --name study python=3.11


// 생성 환경 활성화 및 비활성화 
$ conda activate study
$ conda deactivate


// 새로운 환경을 생성 및 활성화하여 ipykernel을 설치해준다.
$ pip install ipykernel
```

이제 base 환경에서 jupyterlab을 설치하여 확인해보자.   

```
// 설치
(base) ➜  ~ pip install jupyterlab

// 주피터 시작 
(base) ➜  ~ jupyter lab .
```   

이제 아래와 같이 주피터 웹을 확인할 수 있다.   

<img width="1011" alt="스크린샷 2024-06-24 오후 11 42 42" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/95fe7117-4fe4-4961-a7df-96554876b88a">


이제 study 이름을 가진 환경을 주피터 웹에서 사용할 수 있도록 연동을 해보자 

```
(study) ➜   python -m ipykernel install --user --name study
```   

그 후 다시 주피터 웹을 확인해보면, 연동한 study 환경을 확인할 수 있다.   

<img width="687" alt="스크린샷 2024-06-24 오후 11 47 53" src="https://github.com/WonYong-Jang/Pharmacy-Recommendation/assets/26623547/3f05dff9-1647-44c1-802f-24bfae3ade7b">  

마지막으로 아래 실습 라이브러리를 requirements.txt 파일로 생성 후 
pip install -r requirements.txt 명령어를 입력하여 설치한다.   

```
bs4==0.0.2
chromadb==0.4.24
financedatabase==2.2.2
langchain==0.1.16
langchain-openai==0.1.3
lark==1.1.9
lxml==5.2.1
matplotlib==3.8.4
numpy==1.26.4
pandas==2.2.2
python-dotenv==1.0.1
pytube==15.0.0
requests==2.31.0
seaborn==0.13.2
selenium==4.19.0
torch==2.2.2
torchaudio==2.2.2
torchvision==0.17.2
transformers==4.40.0
webdriver-manager==4.0.1
youtube-search==2.1.2
youtube-transcript-api==0.6.2
```


- - -

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







