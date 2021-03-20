---
layout: post
title: "[ELK] Elastic Search 2"
subtitle: "Cluster 구성 이해하기, status(yellow, green, red), health check "    
comments: true
categories : ELK
date: 2021-02-07
background: '/img/posts/mac.png'
---


[이전 글](https://wonyong-jang.github.io/elk/2021/02/05/ELK-Elastic-Search.html)에서 엘라스틱 서치 기본 개념과 아키텍터에 대해 알아 봤다.   

이번장에서는 엘라스틱 서치의 가장 큰 시스템 단위인 클러스터에 대해서 
자세히 알아보자.   

- - - 

## 1. Cluster heath 체크 - 클러스터 정보   

`Cluster란 ES에서 가장 큰 시스템 단위를 말하며, node들의 집합이다.`   
클러스터는 아키텍처를 구축하는데 중요한 부분이라 생각되어 
클러스터 구성에 대한 그림을 그릴 수 있을 정도로 간단하게만 
짚고 넘어가 보자.    

ES를 설치하고 나면 Cluster와 node는 1개씩 존재하는데, 그 정보들은 
아래의 명령어를 통해 확인 할 수 있다.   

```
curl -XGET 'localhost:9200/_cluster/health?pretty'
```

<img width="408" alt="스크린샷 2021-03-20 오후 4 54 46" src="https://user-images.githubusercontent.com/26623547/111863130-fef05980-899c-11eb-9189-4b23699cf951.png">    

또한, [catAPI](https://www.elastic.co/guide/en/elasticsearch/reference/current/cat-health.html) 를 사용해서도 확인이 가능하다.   

<img width="615" alt="스크린샷 2021-03-20 오후 5 42 54" src="https://user-images.githubusercontent.com/26623547/111864357-b8eac400-89a3-11eb-9154-013902b04a3a.png">     

> cat API는 뒤에 ?form=json이라는 파라미터를 붙여서 JSON 형태의 포맷으로 출력을 
받을 수도 있다.   

- - - 

## 2. Cluster status    

ES를 설치하고 클러스터 상태를 보니, yellow 상태이다.    
`yellow 상태는 모든 데이터의 읽기/쓰기가 가능한 상태이지만 일부 replica shard가 
아직 배정되지 않은 상태를 말한다.`

`즉, 정상 작동중이지만 replica shard가 없기 때문에 검색 성능에 영향이 있을 수 있다.`   

현재 설치된 ES에서 클러스터의 상태가 yellow인 이유를 알아보도록 하자.   
먼저 아래 명령어로 index와 shard의 정보들을 조회한다.    

```
curl -XGET 'localhost:9200/_cat/indices?v'   // 인덱스 조회   

curl -XGET 'localhost:9200/_cat/shards?v'    // shard 조회   
```

`아래를 보면 index에 primary 당 replica가 1개 존재하는데, replica가 전부 
unassigned 인 것을 확인 할 수 있다.`    

replica는 primary와 같은 노드상에 있을 수 없다.   
`즉, 현재는 하나의 노드가 실행 중이므로 replica를 배정할 수 없게 된다.`   
`나중에 다른 노드가 클러스터에 포함되면 replica를 배정할 수 있고, 배정되면 
green status로 바뀐다.`   

![image](https://user-images.githubusercontent.com/26623547/111863749-b9ce2680-89a0-11eb-950f-670834795520.png)

![image](https://user-images.githubusercontent.com/26623547/111863676-5e039d80-89a0-11eb-9dc4-f0cd2a7cf76d.png)     


### status의 종류    

ES는 아래 3가지 값으로 status를 표현하고 있다. 각각 의미하는 바는 아래와 같다.   

- green : 모든 샤드가 정상적으로 동작하고 있는 상태, 모든 인덱스에 쓰기/읽기가 
정상적으로 동작한다.   

- yellow : 일부 혹은 모든 인덱스의 replicas 샤드가 정상적으로 동작하고 있지 
않은 상태, 모든 인덱스에 쓰기/읽기가 정상적으로 동작하지만, 일부 인덱스의 경우 
replicas가 없어서 primary 샤드에 문제가 생기면 데이터 유실이 발생할 가능성이 있다.   

- red : 일부 혹은 모든 인덱스의 primary와 replicas 샤드가 정상적으로 동작하고 있지 않은 상태, 
    일부 혹은 모든 인덱스에 쓰기/읽기가 정상적으로 동작하지 않으며, 데이터 유실이 발생할 가능성이 있다.   

위에서 언급한 것처럼 green과 yellow 상태는 모든 인덱스의 쓰기/읽기에는 이상이 없는 상태이다.   

> 클러스터의 성능에는 영향이 있겠지만, 기능적인 문제는 없다.   
> 즉, replica shard가 없기 때문에 검색 성능에 영향이 있을 수 있다.   

하지만, red 상태가 되면 클러스터 장애라고 볼 수 있다. 그럼 장애의 영향과 범위를 
어떻게 알 수 있을 까?    
red 상태에 대해서 조금 더 살펴보자.   

### red의 영향 확인하기   

클러스터가 red가 되었다고 당황하지 말고 우선 장애의 현황을 정확하게 파악하는 
것이 중요하다. 어떤 인덱스들이 영향을 받고 있고, 어느 정도의 로그 유실이 
예상되는지에 대해서 확인할 필요가 있다.    

`먼저 어떤 인덱스들이 영향을 받고 있는지 확인해 보자. 이 때는 cat API 중 
indices API를 활용해보자.`   

```
curl -s localhost:9200/_cat/indices?v
```

<img width="712" alt="스크린샷 2021-03-20 오후 6 12 10" src="https://user-images.githubusercontent.com/26623547/111865059-1719a600-89a8-11eb-89d4-8ad612c74ba3.png">   

위에서 보는 것처럼 클러스터의 상태가 red라고 해서 모든 인덱스의 상태가 red는 
아니다. 클러스터 상태는 red이지만 test_2 인덱스는 yellow 상태 이기 때문에 
`문서의 쓰기/읽기의 기능적인 문제에는 전혀 영향이 없다.`   

하지만 test인덱스는 red이기 때문에 문서의 쓰기/읽기에 문제가 있을 수 있다. 
그럼 어떤 샤드들이 문제가 있을까?    
이번에도 catAPI를 사용해서 살펴보자.   

<img width="718" alt="스크린샷 2021-03-20 오후 6 12 19" src="https://user-images.githubusercontent.com/26623547/111865061-1b45c380-89a8-11eb-9d83-020770481725.png">    

위 사진을 보면 test인덱스의 샤드들 중에서도 1번과 3번 샤드들이 unassigned 상태이다. 
이 두 개의 primary shard가 어떤 노드에도 배치되지 않아서 클러스터의 상태가 red가 된 것이다.   
그렇다면 이 상태에서 문서의 쓰기/읽기는 어떻게 될까?   

`5개의 primary shard들 중에서 3개는 동작하기 때문에 60% 정도의 쓰기 
작업은 성공할 것이며, 읽기 시에도 장애 발생 전에 들어있던 데이터들의 60% 정도만 
조회가 된다.`    

즉, 기능적으로 완전히 멈춘 상태는 아니고 샤드의 unassigned 상태에 따라서 일부는 
동작할 수 있다.    

`그래서 이 클러스터의 경우는 test 인덱스에 대해서 40%의 문서 유실이 발생할 수 있는 
장애 상태라고 말할 수 있다.`   

이렇게 cat API를 통해서 현재의 상태를 정확하게 확인하면 현재 클러스터가 겪고 있는 
문제의 범위를 정확하게 정의할 수 있다. 만약 primary shard를 잃어버린, red 상태의 
인덱스가 오늘자 로그를 수집하고 있는 인덱스가 아니고 어제자 로그를 가지고 있는 
인덱스라고 한다면, 해당 노드만 정상적으로 복구할 경우 로그 유실은 없다고 
생각할 수 있다.   

- - -

## 정리   

이번 글을 통해서 ElasticSearch의 status가 어떤 의미인지 특히 red 상태가 되었을 때 어떻게 
장애의 범위를 확인할 수 있는지에 대해서 다뤄봤다. 클러스터가 red 상태가 된다면 먼저 
`_cat/indices API 를 통해서 red 상태에 빠진 인덱스들을 확인하고, _cat/shards API를 통해서 
해당 인덱스들에서 어떤 primary shard들이 unassigned 상태인지를 확인해야 한다.`    
그렇게 해서 먼저 클러스터가 겪고 있는 장애 현황을 정확하게 확인해야 한다. 
ES에는 이 외에도 cat API를 통해 빠르게 주요 정보들을 확인할 수 있는 
많은 방법을 제공해주고 있다.   
다음 장부터는 다양한 Search API에 대해 알아보자.   

- - - 

**Reference**    

<https://victorydntmd.tistory.com/311?category=742451>    
<https://brunch.co.kr/@alden/43>    
<https://www.elastic.co/guide/en/elasticsearch/reference/current/cat-health.html>   
{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

