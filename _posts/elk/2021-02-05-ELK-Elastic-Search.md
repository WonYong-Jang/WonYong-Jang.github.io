---
layout: post
title: "[ELK] Elastic Search 시작하기"
subtitle: "Elastic Search와 Kibana 개념과 구조 및 용어 정리, 아키텍처 / 엘라스틱 서치, 키바나 설치"    
comments: true
categories : ELK
date: 2021-02-05
background: '/img/posts/mac.png'
---

# 1. Elastic Search 이란?   

`엘라스틱서치는 확장성이 매우 좋은 오픈소스 검색엔진이다.`   
많은 양의 데이터를 보관하고 실시간으로 분석할 수 있게 해준다.   

`엘라스틱서치는 JSON 문서 파일과 함께 동작한다. JSON 문서 파일의 내부적 구조를 
이용하여, 데이터를 파싱한다. 파싱을 통해 필요한 정보에 대한 거의 실시간 검색(Near 
        real time)을 지원한다.`      

**빅데이터**를 다룰 때 매우 유용하다.   

`데이터를 저장할 때 검색에 유리하도록 데이터를 역색인(Inverted index)구조로 저장하기 
때문에 데이터 검색에 한해서는 기존에 RDB 보다 성능이 뛰어나다.`          

> 색인(Indexing)은 데이터가 검색될 수 있는 구조로 변경하기 위해 
원본 문서를 검색어 토큰들으로 변환하여 저장하는 일련의 과정이다.     

> 역색인(Inverted Index)은 검색을 빠르게 수행하기 위해 필드에서 추출된 단어(token)을 기준으로 
각 단어가 포함된 문서 목록을 저장하는 구조이다.   

현재 대규모 시스템들은 대부분 마이크로 서비스 아키텍처(MSA)를 
기본으로 설계된다. 이러한 구조에 빠질 수 없는 것이 REST API와 같은 표준 
인터페이스이다. 엘라스틱 서치는 Rest API를 기본으로 지원하여 모든 
데이터 조회, 입력, 삭제를 http 프로토콜을 통해 `Rest API`로 처리한다.   

또한, 엘라스틱 서치의 데이터들은 인덱스라는 논리적인 집합 단위로 구성되며 
서로 다른 저장소에 분산되어 저장된다. 서로 다른 인덱스들을 별도의 
커넥션 없이 하나의 질의로 묶어서 검색하고, 검색 결과들을 하나의 출력으로 
도출 할 수 있는데, 이러한 특징을 `멀티테넌시(multitenancy)`라고 한다.    

> 참고로 관계형 DB에서는 다른 데이터베이스의 데이터를 검색하려면 별도의 커넥션을 생성해야 한다.   

`정리해보면 엘라스틱서치는 실시간, 분산형, 분석엔진이다. 오픈 소스이며, 자바로 개발되었고 
테이블과 스키마 대신 문서 구조로 된 데이터를 사용한다.`       

엘라스틱서치와 관련된 장점 중 눈에 띄는 것은 속도와 확장성이다. 엘라스틱 서치는 
쿼리가 매우 빠르게 수행될 수 있도록 구현되었다. 그리고 확장성에 대해서는, 
    엘라스틱 서치는 여러분의 노트북에서 돌 수도있고, 페타바이트의 데이터를 
    가진 몇백개의 서버 내부에서 돌 수도 있다.   

<img width="900" alt="스크린샷 2021-03-19 오후 4 21 36" src="https://user-images.githubusercontent.com/26623547/111744947-51634480-88cf-11eb-8f2f-175d266fdf13.png">   

Elasticsearch는 검색을 위해 단독으로 사용되기도 하며, ELK(Elasticsearch, Logstash, Kibana) 스택으로 사용되기도 한다.   

- Logstash   
    - 다양한 소스(DB, csv, Json 파일 등)의 로그 또는 트랜잭션 데이터를 수집, 집계 파싱하여 Elasticsearch로 전달  

- Elasticsearch   
    - Logstash로부터 받은 데이터를 검색 및 집계를 하여 필요한 관심 있는 정보를 획득   

- Kibana   
    - Elasticsearch의 빠른 검색을 통해 데이터를 시각화 및 모니터링   

- - -


# 2. ElasticSearch와 관계형 DB 비교   

흔히 사용하고 있는 관계형 DB는 Elasticsearch에서 각각 다음과 같이 대응하여 이해할 수 있다. 
이것은 이해를 위한 것이지 완전히 동일한 개념은 아니므로 주의하자.    

<img width="686" alt="스크린샷 2021-03-19 오후 4 37 27" src="https://user-images.githubusercontent.com/26623547/111746565-90929500-88d1-11eb-8dd0-340d8956e6a5.png">    



# 3. Elasticsearch 아키텍처 / 용어 정리   

<img width="609" alt="스크린샷 2021-03-19 오후 4 42 18" src="https://user-images.githubusercontent.com/26623547/111746985-19113580-88d2-11eb-8d7c-3f6d2f0697b6.png">   


### 1) Cluster  

`클러스터는 전체 데이터를 저장하고 모든 노드를 포괄하는 가장 큰 단위이며, 연합된 인덱싱과 
모든 노드를 검색할 수 있는 기능을 제공한다.`   

최소 하나 이상의 노드로 이루어진 노드들의 집합을 의미하며, 서로 다른 클러스터는 
데이터의 접근, 교환을 할 수 없는 독립적인 시스템으로 유지된다.    

여러 대의 서버가 하나의 클러스터를 구성할 수 있고, 한 서버에 여러 개의 클러스터가 
존재할 수도 있다.    

클러스터는 유일한 이름(unique name)으로 판별(identified)된다. (기본값은 elasticsearch)   

> cluster.name ( elasticsearch.yml )


### 2) Node     

노드는 클러스터의 일부로 단일서버이다. 노드는 데이터를 보관하고 클러스터 인덱싱과 검색 능력에 
관여한다. 

> cofig/elasticsearch.yml 환경 설정 파일에서 node.name 변수를 사용해 고정된 이름을 지정할 수도 있다.   


### 3) Index   

`다큐먼트를 모아놓은 집합 또는 색인된 데이터가 저장되는 저장소이다.`   

인덱스라는 단어가 여러 뜻으로 사용되기 때문에 데이터 저장 단위인 인덱스는 
**인디시즈(indices)**라고 표현하기도 한다.   

`인덱스는 일래스틱서치에서 단일 타입의 도큐먼트를 저장하고 관리하는 컨테이너이다.     
즉, 인덱스는 타입을 포함한 논리적인 컨테이너이다. 엘라스틱서처 인덱스 개념은 RDB의 데이터베이스 스키마와 
거의 유사하다.`      

`비유하면, 엘라스틱서치에서 타입은 테이블, 도큐먼트는 테이블 레코드와 같다.`    

하지만 이러한 비유는 단지 이해를 돕기 위한 예시이며 RDB는 거의 항상 다중 테이블을 포함하지만, 
    엘라스틱 서치는 인덱스에 단일 타입만 가질 수 있다. ( 버전 6.x 기준 )     

`엘라스틱서치 버전 6.0 이후로 하나의 인덱스는 하나의 타입만 가질수 있게 변경 되었다.`    

> 하지만, 6.0 버전 이전에 만든 다중 타입을 가진 인덱스가 있는 경우에는 그대로 사용할수 있지만,  6.0 버전 부터는 신규 생성할때 다중 타입 생성이 
불가능하다.     
> 또한, 버전 7.0 이후 부터는 타입이라는 개념이 사라졌다.   

[참고링크](http://kimjmin.net/2019/04/2019-04-elastic-stack-7-release/) 를 통해서 버전별로 변경사항을 확인해보자.   

<img width="400" alt="스크린샷 2021-02-07 오후 2 17 37" src="https://user-images.githubusercontent.com/26623547/107137381-42dc5180-694f-11eb-880c-f41d8644ea4f.png">   

엘라스틱서치를 분산환경으로 구성했을 때, 
인덱스는 기본적으로 샤드(shard)라는 단위로 분리되고 각 노드에 분산되어 
저장이 된다.   
이러한 특성은 분산처리의 장점을 이용할 수 있게 해준다. 

인덱스를 생성할 때 별도의 설정을 하지 않으면 
기본 설정은 7.0 버전부터는 디폴트로 1개의 샤드로 인덱스가 구성된다.   
6.x 이하 버전에서는 5개의 프라이머리 샤드로 구성되며 디폴트로 1개의 레플리카(replica) 샤드를 
생성한다.      

> 처음 생성된 샤드를 primary shard라고 부르며, 노드가 1개만 있는 경우 
primary shard만 존재하고 replica는 생성되지 않는다.    
> 엘라스틱 서치는 아무리 작은 클러스터라도 데이터 가용성과 무결성을 위해 최소 
3개의 노드로 구성 할 것을 권장하고 있다.     

### 4) Type   

`타입은 RDB에 테이블과 비슷한 개념이며, 논리적으로 
인덱스 내에 같은 도큐먼트 종류를 그룹화하고 구성하는데 유용하다.`   

### 5) Document   

도큐먼트는 인덱싱될 수 있는 정보의 기본 단위이다.    
인덱스, 타입, 도큐먼트의 관계를 보여주는 위의 그림에서 살펴봤듯이 도큐먼트는 인덱스와 타입 안에 포함된다.    

도큐먼트는 다중 필드를 포함 하며, 도큐먼트는 사용자가 정의한 필드 외에도 다음과 같은 값이 내부적으로 메타 필드를 갖고 있다.   

- id: 데이터베이스 테이블의 기본키처럼 타입 내 도큐먼트의 고유 식별자다. 자동 생성되거나 사용자가 정의할 수도 있다.   

- type: 도큐먼트 타입을 포함한다.   

- index: 도큐먼트의 인덱스 이름을 포함한다.   

### 6) Shards     

엘라스틱서치는 인덱스를 샤드라 불리는 여러개의 조각으로 다시 나눌 수 있는 
기능을 제공한다.   

`보통 샤딩(sharding)이란 데이터를 분산해서 저장하는 방법을 의미한다.   
즉, Elasticsearch에서 스케일 아웃을 위해 index를 여러 shard로 쪼갠 것이다.   
기본적으로 1개가 존재하며, 검색 성능 향상을 위해 클러스터의 샤드 갯수를 
조정하는 튜닝을 하기도 한다.`         

> Elasticsearch 7.x 버전 이상은 기본적으로 primary shard 1개로 설정되며, 
    6.x 이하 버전은 기본적으로 primary shard는 5개로 설정했었다.   

일반적으로 하나의 primary shard가 처리할 수 있는 데이터 크기는 30GB ~ 50GB 정도가 
적당하다고 알려져 있다.   

따라서 50GB 넘은 shard가 존재한다면 shard의 갯수를 증설하여 요청을 분산해 주는 것이 좋다.   

`shard를 늘리면 검색 쿼리가 병렬로 처리되기 때문에 읽기 성능이 향상된다.`  
`또한 쓰기 작업이 많은 경우에는 shard가 늘어나면 데이터를 여러 shard에 분산하여 쓰기 성능이 개선된다.`   

쿼리 또한 다수의 join, group by 가 포함된 쿼리를 많이 처리하는 경우 shard의 갯수를 늘리면 
각 shard에서 병렬 처리로 성능을 개선할 수 있다.   

하지만, shard 수를 늘리면 더 많은 노드가 필요하며, cpu 및 메모리 사용량이 증가하게 되기 때문에 
리소스를 모니터링 하면서 증설해야 한다.   


### 7) Replicas   

레플리카는 인덱스의 샤드에 대한 한개 이상의 복사본이다. 노드가 깨졌을 때를 
대비하여 높은 가용성을 제공한다. 

`같은 shards와 replicas는 동일한 데이터를 담고 있으며 반드시 서로 다른 노드에 저장이 된다.`      
아래 그림과 같이 노드 3이 시스템 다운이나 네트워크 단절 등으로 사라지면 
이 클러스터는 노드 3에 있던 0번과 4번 샤드들을 유실하게 된다. 하지만 
아직 다른 노드들에 0번과 4번 샤드가 남아 있으므로 여전히 전체 데이터는 
유실 없이 사용이 가능하다.   

<img width="780" alt="스크린샷 2021-03-22 오후 3 15 48" src="https://user-images.githubusercontent.com/26623547/111948158-1278fd00-8b22-11eb-9105-642d92e1f6a1.png">     


<img width="763" alt="스크린샷 2021-03-22 오후 3 26 52" src="https://user-images.githubusercontent.com/26623547/111949006-4b65a180-8b23-11eb-9da2-09a611932014.png">     

처음에 클러스터는 먼저 유실된 노드가 복구 되기를 기다린다. 하지만, 타임 아웃이 
지나 더 유실된 노드가 복구되지 않는다고 판단이 되면 엘라스틱 서치는 
복제본이 사라져 1개만 남은 0번, 4번 샤드들의 복제를 시작한다.     

> number_of_shards=3 으로 primary shard를 3개로 설정하고, number_of_replicas=2로 설정했을 때 
전체 replica shard는 6개가 된다.  

`replicas shard는 위와 같이 장애 복구를 위해 사용되기도 하지만 읽기 성능을 향상시키기 위해 사용되기도 한다.`      
replicas shard는 읽기 전용으로 사용되기 때문에, 여러 쿼리가 동시에 실행될 때는 primary shard 뿐만 아니라 
replicas shard도 사용되어 병렬로 쿼리를 처리하기 때문에 전체적으로 읽기 성능이 향상된다.   

### 8) Mapping   

매핑은 문서와 데이터를 가지고 있는 필드가 어떻게 저장되고 색인될지에 대한 프로세스이다. 

### 요약   

`위의 내용을 요약하면, 하나 이상의 노드가 모여 클러스터를 형성한다. 클러스터는 
다중 인덱스를 생성할 수 있는 물리 계층의 서비스를 제공한다. 인덱스는 타입을 
포함하고 수백 또는 수십억 개의 도규먼트를 포함할수 있다. 또한 인덱스의 데이터는 
개별 조각으로 분리되어 여러 샤드로 나뉜다. 샤드는 클러스터 노드 전반에 걸쳐 
분산되고, 주 샤드의 복제본을 통해 고가용성과 장애 조치를 지원한다.`     

- - - 

# 4. 엘라스틱 서치 클러스터 구성   

엘라스틱 서치의 노드들은 클라이언트와의 통신을 위한 http 포트(9200~9299), 
    노드 간의 데이터 교환을 위한 tcp 포트(9300~9399)의 총 2개의 네트워크 통신을 
    열어두고 있다.   

일반적으로 1개의 물리 서버마다 하나의 노드를 실행하는 것을 권장하고 있다. 3개의 다른 
물리 서버에서 각각 1개씩의 노드를 실행하면 클러스터는 아래와 같이 구성된다.   

<img width="650" alt="스크린샷 2021-02-14 오후 9 45 18" src="https://user-images.githubusercontent.com/26623547/107877192-3e470880-6f0e-11eb-980b-84ef45827741.png">   

하나의 물리적인 서버 안에서 여러 개의 노드를 실행하는 것도 가능하다. 이 경우에는 
각 노드들은 차례대로 9200, 9201 ... 순으로 포트를 사용하게 된다. 클라이언트는 9200, 9201 등의 
포트를 통해 원하는 노드와 통신을 할 수 있다. 만약 서버1 에서 두 개의 노드를 실행하고, 또 다른 서버에서 
한개의 노드를 실행시키면 클러스터는 다음과 같이 구성된다.   

<img width="650" alt="스크린샷 2021-02-14 오후 9 45 26" src="https://user-images.githubusercontent.com/26623547/107877207-4d2dbb00-6f0e-11eb-8554-e065a0b753f4.png">   

서버1에는 두개의 노드가 있기 때문에 서버 1의 두번째 노드는 실행되는 http, tcp 포트가 각각 
9201, 9301로 실행이 된다.   

`물리적인 구성과 상관 없이 여러 노드가 하나의 클러스터로 묶이기 위해서는 
클러스터명 cluster.name 설정이 묶여질 노드들 모두 동일 해야 한다.`   
같은 서버나 네트워크망 내부에 있다 하더라도 cluster.name이 동일하지 않으면 
논리적으로 서로 다른 클러스터로 실행이 되고, 각각 별개의 시스템으로 인식된다.   


- - -

# 5. 엘라스틱 서치, 키바나 시작하기

먼저 아래와 같이 엘라스틱 서치와 키바나를 설치해보자.   

### 설치

설치는 도커를 이용하여 실습을 진행해보자.   

```
version: '3'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.17.24
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - esdata:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:7.17.24
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200

volumes:
  esdata:
    driver: local
```


엘라스틱 서치와 키바나를 설치했다면 Restful API로 document를 추가하는 간단한 예제를 
해보자.   

#### 1) document 생성   

예제를 curl 요청을 통해서 API를 조회하고 있는데, 
    curl에 대한 자세한 내용은 [링크](https://www.lesstif.com/software-architect/curl-http-get-post-rest-api-14745703.html)를 참고하자.    

```
curl -XPOST 'localhost:9200/animal/dog/3?pretty' -d '{"weight":"55"}' -H 'Content-Type:application/json'
```

위와 같이 curl 요청을 통해서 animal 인덱스에, dog 타입으로 id가 3인 document에 저장된다.   


<img width="750" alt="스크린샷 2021-03-19 오후 5 26 53" src="https://user-images.githubusercontent.com/26623547/111751904-61335680-88d8-11eb-88db-978f59fa25ea.png">     

- -d 옵션    
    -    --data의 축약이며, 추가할 데이터를 명시   

- -H 옵션 
    - 헤더를 명시한다. 예제에서는 json으로 전달하기 위해서 application/json으로 작성    

- ?pretty   
    - 결과를 보기 좋게 보여주도록 요청   


#### 2) document 조회   

위에서 저장했던 document를 조회하는 API 이다.   

```
curl -XGET 'localhost:9200/animal/dog/3?pretty'
```

<img width="394" alt="스크린샷 2021-03-19 오후 5 33 50" src="https://user-images.githubusercontent.com/26623547/111752662-54fbc900-88d9-11eb-8e2e-34b2ea4b8894.png">   



#### 3) kibana를 통해 조회 

아래와 같이 kibana를 접속하여 devTools에서 쿼리를 작성해 확인할 수도 있다.   


<img width="943" alt="스크린샷 2021-03-19 오후 5 38 58" src="https://user-images.githubusercontent.com/26623547/111753288-0995ea80-88da-11eb-8303-f749d2c5408e.png">   





- - - 

**Reference**    

<https://esbook.kimjmin.net/01-overview/1.1-elastic-stack/1.1.1-elasticsearch>   
<http://kimjmin.net/2019/04/2019-04-elastic-stack-7-release/>    
<https://abc-sanghoon.tistory.com/entry/%EC%97%98%EB%9D%BC%EC%8A%A4%ED%8B%B1%EC%84%9C%EC%B9%98-%EC%8B%A4%EB%AC%B4%EA%B0%80%EC%9D%B4%EB%93%9C1%EA%B0%95-2%EA%B0%95>    
<https://medium.com/@victorsmelopoa/an-introduction-to-elasticsearch-with-kibana-78071db3704>   
<https://velog.io/@jakeseo_me/%EB%B2%88%EC%97%AD-%EC%97%98%EB%9D%BC%EC%8A%A4%ED%8B%B1%EC%84%9C%EC%B9%98%EC%99%80-%ED%82%A4%EB%B0%94%EB%82%98-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EC%86%8C%EA%B0%9C%EC%84%9C>   
<https://victorydntmd.tistory.com/308?category=742451>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

