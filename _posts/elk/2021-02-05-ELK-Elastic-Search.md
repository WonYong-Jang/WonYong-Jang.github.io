---
layout: post
title: "[ELK] Elastic Search "
subtitle: ""    
comments: true
categories : ELK
date: 2021-02-05
background: '/img/posts/mac.png'
---

## Elastic Search 이란?   

엘라스틱서치는 확장성이 매우 좋은 오픈소스 검색엔진이다. 많은 양의 데이터를 
보관하고 실시간으로 분석할 수 있게 해준다.   

엘라스틱서치는 JSON 문서 파일과 함께 동작한다. JSON 문서 파일의 내부적 구조를 
이용하여, 데이터를 파싱한다. 파싱을 통해 필요한 정보에 대한 거의 실시간 검색(Near 
        real time)을 지원한다.   

**빅데이터**를 다룰 때 매우 유용하다.   

`정리해보면 엘라스틱서치는 실시간, 분산형, 분석엔진이다. 오픈 소스이며, 자바로 개발되었고 
테이블과 스키마 대신 문서 구조로 된 데이터를 사용한다.`       

엘라스틱서치와 관련된 장점 중 눈에 띄는 것은 속도와 확장성이다. 엘라스틱 서치는 
쿼리가 매우 빠르게 수행될 수 있도록 구현되었다. 그리고 확장성에 대해서는, 
    엘라스틱 서치는 여러분의 노트북에서 돌 수도있고, 페타바이트의 데이터를 
    가진 몇백개의 서버 내부에서 돌 수도 있다.   

## 설치 

아래 설치 내용은 macOS 기준이다.   

```
$ brew install elasticsearch    

$ brew install kibana     
```

## 구성 요소   

Elastic Search와 Kibana를 사용하기 전에 여러가지 구성 요소에 대해 알아보자.   

<img width="591" alt="스크린샷 2021-02-05 오후 10 40 31" src="https://user-images.githubusercontent.com/26623547/107040976-45319500-6803-11eb-84f8-2e51af4082b0.png">   

##### 1. Cluster  

클러스터는 전체 데이터를 저장하고 모든 노드를 포괄하는 가장 큰 단위이며, 연합된 인덱싱과 
모든 노드를 검색할 수 있는 기능을 제공한다.    

클러스터는 유일한 이름(unique name)으로 판별(identified)된다. (기본값은 elasticsearch)

##### 2. Node     

노드는 클러스터의 일부로 단일서버이다. 노드는 데이터를 보관하고 클러스터 인덱싱과 검색 능력에 
관여한다.   

##### 3. Index   

인덱스는 비슷한 특성을 가진 도큐먼트(Document)의 집합이다. 그리고 이름으로 구분된다.   
이 이름은 인덱싱, 검색, 업데이트, 삭제를 수행하는 동안에 인덱스를 참조하기 위해 사용된다. 


##### 4. Document   

도큐먼트는 인덱싱될 수 있는 정보의 기본 단위이다.

##### 5. Shards     

엘라스틱서치는 인덱스를 샤드라 불리는 여러개의 조각으로 다시 나눌 수 있는 
기능을 제공한다.

##### 6. Replicas   

레플리카는 인덱스의 샤드에 대한 한개 이상의 복사본이다. 노드가 깨졌을 때를 
대비하여 높은 가용성을 제공한다. 






- - - 

**Reference**    

<https://medium.com/@victorsmelopoa/an-introduction-to-elasticsearch-with-kibana-78071db3704>   
<https://velog.io/@jakeseo_me/%EB%B2%88%EC%97%AD-%EC%97%98%EB%9D%BC%EC%8A%A4%ED%8B%B1%EC%84%9C%EC%B9%98%EC%99%80-%ED%82%A4%EB%B0%94%EB%82%98-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EC%86%8C%EA%B0%9C%EC%84%9C>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

