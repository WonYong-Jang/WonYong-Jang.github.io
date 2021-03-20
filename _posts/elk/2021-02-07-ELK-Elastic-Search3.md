---
layout: post
title: "[ELK] Elastic Search 3"
subtitle: "기본 API (index, document CRUD) / Search API"    
comments: true
categories : ELK
date: 2021-02-07
background: '/img/posts/mac.png'
---


[ES 기본 개념](https://wonyong-jang.github.io/elk/2021/02/05/ELK-Elastic-Search.html)에서 엘라스틱 서치 기본 개념과 아키텍터에 대해 알아 봤다.   
또한, [클러스터](https://wonyong-jang.github.io/elk/2021/02/07/ELK-Elastic-Cluster2.html) 에 대해서도 자세하게 알아보았다.   

`Cluster는 node들의 집합이고 노드는 shard로 구성되며, 데이터는 shard로 분산되어 저장한다.`        

`Index는 1개 이상의 primary shard에 매핑되고, 0개 이상의 replica shard를 가질 수 있는 논리적 이름 공간`을 
말하며, RDBMS의 database와 비슷한 개념이다.      

Type은 RDBMS에서 database안에 table과 비슷한 개념이며,    
Document는 RDBMS에서 row와 비슷한 개념이다. 즉, 실제로 검색 할 데이터를 의미한다.    

`Restful API를 통해 index에 document를 추가할 수 있는데, 이를 문서를 색인화 한다고 말한다.`       
문서를 색인화(indexing)하기 위해서는 index가 어떤 type인지, 그리고 id를 지정해줘야 한다.   
여기서 id는 RDBMS에서 table의 pk와 같다.     

이제부터 Index, Type, Document에 대한 CRUD API를 자세히 살펴보자.    

- - - 

## 1. 클러스터에 존재하는 모든 index 조회   

```
curl -XGET 'localhost:9200/_cat/indices?v'
```

클러스터에 존재하는 모든 index를 조회 할 수 있으며, 처음엔 아무 데이터가 없다.   


## 2.index 추가 

```
curl -XPUT 'localhost:9200/customer?pretty'
```

<img width="344" alt="스크린샷 2021-03-19 오후 6 26 18" src="https://user-images.githubusercontent.com/26623547/111759474-faff0180-88e0-11eb-830c-f7c31e75b64a.png">   

`acknowledged:true 이면, 작업이 성공되었다는 뜻이다.`    
index 조회를 다시 해보면 지금 생성한 index를 확인 할 수 있다.     
yellow status인 이유는 [이전글](https://wonyong-jang.github.io/elk/2021/02/07/ELK-Elastic-Cluster2.html)을 참고하자.   


## 3. document 추가   

다음으로 index에 document를 추가해보자. 문서를 색인화 하려면 어떤 type인지, 
    몇 번 _id에 색인화할 것인지 명시해 줘야 한다.    

```
-d 옵션은 --data의 축약이며 Form을 POST 하는 HTTP나 JSON으로 데이터를 주고 받는 
REST 기반의 웹서비스 디버깅시 유용한 옵션이다.   

curl은 POST 시 데이터를 text로 취급하므로 binary 데이터는 깨질 수 있다. 
제대로 전송하려면 --data-binary 옵션을 추가해야 한다.
```

> -d 옵션에 @파일 경로를 작성하여 파일을 데이터로 넘길 수 있다. 아래 2번째 예제에서는 data.json을 직접 작성하여 API를 호출하였다.   

```
curl -XPOST 'localhost:9200/customer/info/1?pretty' -H 'Content-Type: application/json' -d '{"name":"mike"}'

curl -XPOST 'localhost:9200/customer/info/1?pretty' -H 'Content-Type: application/json' -d @data.json   
```

<img width="798" alt="스크린샷 2021-03-20 오후 12 41 22" src="https://user-images.githubusercontent.com/26623547/111858122-cbe89e80-8979-11eb-8cbd-7205665fdc31.png">   

`여기서 customer index와 info type은 생성을 한적이 없는데, index와 type을 자동으로 
생성하면서 색인화가 되었다는 점에 주목할 필요가 있다.`    

또한 위에서는 id값을 1로 지정하였는데, document를 추가할 때 id값을 명시하지 않으면 
임의의 문자열을 id로 할당한다.   

## 4. document 조회    

다음으로 지금까지 추가한 document들을 조회해보자. ES는 검색 엔진으로 다양한 검색 방법을 제공한다.   
다음 글에서 검색에 대해 자세히 알아보도록 하고, 지금은 간단한 API 실습을 해보자.   

```
curl -XGET 'localhost:9200/customer/_search?pretty'
```

URL에 있는 _search 는 query DSL를 위해 사용하는 API이며, 원래는 뒤에 query를 명시해줘야 
하지만 다음 글에서 자세히 다루도록 하겠다.   

다음은 모든 index에서 모든 document를 검색해보자.   

```
curl -XGET 'localhost:9200/_all/_search?pretty'
```

다음은 id를 이용해서 document를 검색하는 방법이다.

```
curl -XGET 'localhost:9200/customer/info/1?pretty'
```

<img width="396" alt="스크린샷 2021-03-20 오후 1 05 33" src="https://user-images.githubusercontent.com/26623547/111858516-115a9b00-897d-11eb-8ce5-1d48408f88af.png">   

`응답 결과의 source 프로퍼티에는 실제 데이터가 있다.`   

다음은 document의 응답 결과를 줄일 수 있는 방법이다. 
[참고 링크](https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#common-options-response-filtering) 를 참고해보자.   
SQL에서 SELECT 문에 특정 컬럼들을 명시하는 방법과 같은 개념이다.   

> 예를 들어, 실제 데이터인 _source만 보고 싶을 때 query String에 filter_path=_source를 추가한다.   

```
curl -XGET 'localhost:9200/animal/dog/1?pretty&filter_path=_source'
curl -XGET 'localhost:9200/animal/dog/1?pretty&filter_path=_source.weight' // 실제 데이터 중에서 weight 컬럼만 보고 싶은 경우  
```

<img width="562" alt="스크린샷 2021-03-20 오후 1 13 56" src="https://user-images.githubusercontent.com/26623547/111858699-34397f00-897e-11eb-9ef1-4547b07e37ec.png">   


## 5. document 수정   

수정 작업은 추가 작업이랑 유사하다.   
customer index에서 id가 1인 document를 수정해 보도록 하자.    
아래를 보면 document안의 name 을 변경하는 명령어이다.   

```
curl -XPUT 'localhost:9200/customer/info/1?pretty' -H 'Content-Type: application/json' -d '{"name":"kaven"}'   
```

<img width="832" alt="스크린샷 2021-03-20 오후 4 29 10" src="https://user-images.githubusercontent.com/26623547/111862615-a9ff1400-8999-11eb-804e-0f2b5903779e.png">    

document가 수정되어 version정보가 바뀐것을 확인 할 수 있다.   


## 6. index, document 삭제   

특정 id의 document를 삭제하는 방법이다.    

```
curl -XDELETE 'localhost:9200/customer/info/1?pretty'
```

다음은 index를 삭제하는 방법이다.    

```
curl -XDELETE 'localhost:9200/customer?pretty'
```


이상으로 index, document를 중심으로 데이터를 조작하는 CRUD 실습을 해봤다.   
다음 장에서 조금 더 응용 된 방식으로 document를 검색하는 API에 대해 알아보자.   

- - - 

**Reference**    

<https://victorydntmd.tistory.com/312?category=742451>   
<https://www.elastic.co/guide/en/elasticsearch/reference/current/common-options.html#common-options-response-filtering>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

