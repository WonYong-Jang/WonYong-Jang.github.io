---
layout: post
title: "[Python] Kafka & Spark 활용한 Realtime Datalake 구성하기"  
subtitle: "NAT 인스턴스를 이용한 "   
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

## 2. 카프카 클러스터 구성하기

카프카 클러스터를 구성은 NAT 인스턴스 기반으로 진행할 예정이며, 
먼저 NAT에 대해서 살펴보자.   

### 2-1) NAT(Network Address Translation) 란? 

- `내부망에 연결된 장비의 IP를 1개 또는 소수의 외부 IP로 변환하는 기술`    
- `부족한 IPv4 공인 1개를 받은 후 사설 IP 수십개와 매핑 가능하며 외부에서 먼저 접근할 수 없으므로 보안적으로도 우수하여 기업내에서도 자주 사용되는 기술` 

> IPv4 가 고갈된다고 한지가 20년이 넘었지만 아직도 잘사용하고 있는 이유가 NAT 기술 때문이다.   

<img src="/img/posts/data-engineering/스크린샷 2025-07-26 오전 11.41.39.png" width ="700" height="700">

집에서 공유기 사용할 때도 NAT 를 사용하게 되며 컴퓨터, 노트북, 핸드폰 등이 연결이 되어 모두 사설 IP로 할당이 되어 있다.     
`사설 IP로 할당이 되고 외부 인터넷 등을 연결할 때 NAT 가 공인 IP 로 변경해주게 된다.`  
`그리고 컨텐츠 등을 들고 다시 돌아올때는 이를 사설 IP로 바꿔주게 된다.`    
`따라서 NAT가 있음으로써 사설 IP가 외부에 접근하여 돌아오게는 가능하지만, 반대로 외부에서 직접 접근이 불가능하게 하여 보안을 향상 시킬 수 있다.`   

### 2-2) AWS NAT 인스턴스 기반 카프카 클러스터  

private subnet 에서 인터넷 연결을 하기 위해 AWS NAT Gateway 서비스가 존재한다.   
하지만 NAT Gateway 는 상대적으로 고비용, 고가용성 서비스이기 때문에 실습을 위해 EC2를 이용한 NAT Instance를 구성해 볼 예정이다.  

> NAT 역할을 하는 EC2를 구성하며, NAT Gateway와 동일한 역할을 한다.   

<img src="/img/posts/data-engineering/스크린샷 2025-07-26 오전 11.36.04.png">

위 구성도를 보면 인터넷 접속이 가능한 public subnet 이 있으며, EC2 기반 NAT 인스턴스로 구성했다.  

각 private subnet은 인터넷을 통해 직접 접근이 불가능하며, 
public subnet을 통해서만 접근이 가능하도록 구성했다.       
또한, private subnet에 있는 kafka 등이 인터넷 접속이 필요할 때도 동일하게 public subnet을 통해서만 접근이 가능하다.   

- - -

<https://www.inflearn.com/course/kafka-spark-realtime-datalake/dashboard>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}







