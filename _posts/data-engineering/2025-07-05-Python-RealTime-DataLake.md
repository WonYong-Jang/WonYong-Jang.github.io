---
layout: post
title: "[Python] Kafka & Spark 활용한 Realtime Datalake 구성하기"  
subtitle: ""   
comments: true
categories : Data-Engineering   
date: 2025-07-05
background: '/img/posts/mac.png'
---

- - - 


## 1. 개발 환경 설정   

먼저 파이썬 인터프리터 버전 [3.10.11](https://www.python.org/downloads/release/python-31011) 를 설치해보자.   

설치 완료 후/usr/local/bin 디렉토리에 python3.10 관련 파일이 생성됨을 확인할 수 있다.   
그 후 파이썬 가상 환경을 생성해보자.  

```shell
$ cd ~/dev
$ mkdir datalake
$ cd datalake

# kafka_venv 이름의 디렉토리가 생성되면서 가상환경 생성
$ /usr/local/bin/python3.10 -m venv kafka_venv

$ cd kafka_venv

# kafka_venv 가상환경으로 진입
$ source bin/activate
$ python -V  

# 파이썬 가상환경을 빠져나올 때는 현재 위치한 경로에 상관없이 deactivate
$ deactivate   
```





- - -

<https://www.inflearn.com/course/kafka-spark-realtime-datalake/dashboard>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







