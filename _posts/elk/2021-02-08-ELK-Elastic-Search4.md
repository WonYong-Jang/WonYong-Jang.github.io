---
layout: post
title: "[ELK] Elastic Search 4"
subtitle: "Search API / Bulk API / Query DSL"    
comments: true
categories : ELK
date: 2021-02-08
background: '/img/posts/mac.png'
---

이번 글에서는 Search API 그리고 Query DSL에 대해 다뤄보자.   

- - -    

## 1. 검색하기 전 샘플 데이터 셋팅   

검색을 하려면 대량의 데이터가 필요하다. ES 공식 문서에 
이를 제공해주는데, [링크](https://raw.githubusercontent.com/elastic/elasticsearch/master/docs/src/test/resources/accounts.json) 를 복사해서 
json 파일을 만들고 아래 명령어를 실행해서 bulk API를 호출해보자.   

bulk API는 [링크](https://esbook.kimjmin.net/04-data/4.3-_bulk)에서 더 자세하게 확인 할 수 있다.   

```
vi test.json   
curl -XPOST 'localhost:9200/bank/account/_bulk?pretty' -H 'Content-Type: application/json' --data-binary '@test.json'   
curl -XGET 'localhost:9200/_cat/indices?v' // 데이터 확인 
```

bank index에 1000개의 데이터가 추가되었으면 성공적으로 bulk 가 되었다.   

- - - 

## 2. search API   

search API는 이전 글에서 모든 document를 검색할 때 사용했다.   

```
curl -XGET 'localhost:9200/_all/_search?pretty'
```

search 키워드는 검색 작업을 하겠다는 것이고, 어떻게 검색을 할 것인지에 
대한 조건(쿼리)들을 명시를 해줘야 원하는 정보를 얻을 수 있다.   

조건 전달 방법은 2가지가 있다.    

- URL에 파라미터를 넘기는 방법( URI Search )   
- json 파일에 쿼리를 작성하여 POST 방식으로 넘기는 방법( Query DSL )    

이 중에 후자의 방법을 더 많이 사용한다. 이유는 URL이 깔끔해지고, 더 
상세한 표현이 가능할 뿐더러 재사용이 가능하기 때문이다.   

먼저 URL을 호출하는 방법부터 간단하게 살펴보자.   

- - - 

## 3. URI Search    

URI Search 방식은 모든 검색 옵션을 노출하지 않지만, 빠른 curl 테스트에 
유용한 방법이다.   

아래의 API 호출은 bank 인덱스에 색인되어 있는 데이터들 중에 
age가 39살인 document만 조회하는 예제이다.    

```
curl -XGET 'localhost:9200/bank/account/_search?q=age:39&pretty'
```

파라미터 q는 쿼리 스트링으로 [Query String Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html) 로 변환된다.   

그 밖에,   

- 정렬 옵션 sort   
- offset과 유사한 from : 기본값 0   
- document를 몇 개를 반환할 것인지에 대한 size : 기본 값 10 개   

등 다양한 파라미터를 전달할 수 있다. 더 많은 파라미터 정보는 [링크](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html#_parameters_3)를 참고하자.     

다음은 위의 검색 결과를 분석해보자.   

## 4. Response 분석   

Search API를 요청하니 응답을 json으로 주고 있다.     

<img width="600" alt="스크린샷 2021-03-20 오후 7 45 26" src="https://user-images.githubusercontent.com/26623547/111867129-6b775280-89b5-11eb-9f05-33c061b461a0.png">    

response의 각 의미는 다음과 같다.   

```
- took : 검색하는데 걸린 시간( 단위 : ms )   
- timed_out : 검색시 시간 초과 여부    
- _shards : 검색한 shard 수 및 검색에 성공 또는 실패한 shard의 수   
- hits : 검색 결과    
    - total : 검색 조건과 일치하는 문서의 총 개수  
    - max_score : 검색 조건과 결과 일치 수준의 최댓값    
    - hits : 검색 결과에 해당하는 실제 데이터 ( 기본 값으로 10개가 설정되며, size를 통해 조절 가능 )   
        - _score : 해당 document가 지정된 검색 쿼리와 얼마나 일치하는지를 상대적으로 나타내는 숫자 값이며, 높을 수록 관련성이 높음    
    - sort : 결과 정렬 방식을 말하며, 기본 정렬 순서는 _score를 기준으로 내림차순(desc)이고, 다른 항목은 기본적으로 오름차순(asc)으로 정렬함(_score 기준일 경우 
            노출되지 않음)   
```

- - - 

## 5. Query DSL    

이제 본격적으로 `json 포맷으로 쿼리를 만들어서 검색을 하는 Query DSL(Domain Specific Language)`에 대해 알아보자.     

Query DSL에 대해 알아보기에 앞서 Query Context와 Filter Context에 대한 개념이 필요하다.( [참고](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-filter-context.html) )   
`앞으로 소개 할 query 절은 Query Context 또는 Filter Context에서 
사용되는지 여부에 따라 다르게 동작한다.`    

- Query Context   
    - Query Context에서 사용되는 query 절은 '해당 document가 query 절과 얼마나 
    잘 일치하는가?' 라는 질문에 해당하는데, `document가 얼마나 잘 일치하는지를 _score(관련성 점수, relevance score)로 표현한다.`     

- Filter Context   
    - Filter Context에서 사용되는 query 절은 '해당 document가 query절과 일치하는가?' 라는 질문에 해당하는데, 그 `대답은 
    true 또는 false이며 점수(score)는 계산하지 않는다.`   


쿼리(Query)와 필터(Filter)의 자세한 내용은 [참고 링크](https://m.blog.naver.com/tmondev/220292262363) 를 참고하자.   

- - - 

## 6. Query DSL 예제    

ElasticSearch의 API 중 자주 사용하는 API에 대해 살펴보자.   

아래의 예제들을 실행하기 위해서는 query.json 파일을 만들어서 
각 예제마다 수정을 하고, 명령어는 모두 아래와 같이 실행하면 된다.    

```
curl -XGET 'localhost:9200/bank/account/_search?pretty' -H 'Content-Type: application/json' -d @query.json   
```

#### 6-1) match_all / match_none

`match_all 쿼리는 지정된 index의 모든 document를 검색하는 방법이다.`   
즉, 특별한 검색어 없이 모든 document를 가져오고 싶을 때 사용한다. SQL로 
치면 WHERE 절이 없는 SELECT문과 같다.    

이와 유사하게 match_none이 있는데, 모든 document를 가져오고 싶지 않을 때 
사용한다.   

```
# vi query.json

{  
   "query":{  
      "match_all":{}
   }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-match-all-query.html) 를 참고하자.      


#### 6-2) match ( Full text Queries )   

`match 쿼리는 기본 필드 검색 쿼리로써, 텍스트/숫자/날짜를 허용한다.`   
아래는 address에 mill이라는 용어가 있는 모든 document를 조회하는 예제이다.   

```
{  
   "query":{  
      "match":{  
         "address":"mill"
      }
   }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-match-query.html) 를 참고하자.   


#### 6-3) bool ( Filter Context )    

`bool 쿼리는 bool(true/false) 로직을 사용하는 쿼리이며, 그 종류는 다음과 같다.`   

- must : bool must 절에 지정된 모든 쿼리가 일치하는 document를 조회    
- should : bool should 절에 지정된 모든 쿼리 중 하나라도 일치하는 document를 조회   
- must_not : bool must_not 절에 지정된 모든 쿼리가 모두 일치하지 않는 document를 조회   
- filter : must와 같이 filter 절에 지정된 모든 쿼리가 일치하는 document를 조회하지만, Filter context에서 실행되기 때문에 score를 무시한다.    

bool 쿼리 내에 위의 각 절들을 조합해서 사용할 수 있다.   

아래는 나이가 40세이지만, ID 지역에 살고 있지 않은 document를 조회하는 예제이다.   

```
{
  "query": {
    "bool": {
      "must": [
        { "match": { "age": "40" } }
      ],
      "must_not": [
        { "match": { "state": "ID" } }
      ]
    }
  }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-bool-query.html) 를 참고하자.   


#### 6-4) filter   

`filter 쿼리는 document가 검색 쿼리와 일치하는지 나타내는 _score 값을 계산하지 
않도록 쿼리 실행을 최적화 한다.`    



#### 6-5) range    

`range 쿼리는 범위를 지정하여 범위에 해당하는 값을 갖는 document를 조회한다.`    
`Filter Context이며, 정수, 날짜를 비교할 수 있다.`   

range 쿼리에서 범위를 지정하는 파라미터는 다음과 같다.   

- gte : 크거나 같다.   
- gt : 크다.    
- lte : 작거나 같다.   
- lt : 작다.   
- boost : 쿼리의 boost 값을 셋팅한다. (기본값 1.0)   
    - boost란 검색에 가중치를 부여하는 것으로, [링크](https://stackoverflow.com/questions/21570963/boosting-in-elasticsearch)를 참고하자.   

아래는 잔액이 20000 ~ 30000인 범위에 속하는 document를 조회하는 예제이다.   

```
{
  "query": {
    "bool": {
      "must": { "match_all": {} },
      "filter": {
        "range": {
          "balance": {
            "gte": 20000,
            "lte": 30000
          }
        }
      }
    }
  }
}
```


[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-range-query.html) 를 참고하자.    


#### 6-6) term ( Term Level Queries )

`term 쿼리는 역색인에 명시된 토큰 중 정확한 키워드가 포함된 document를 조회한다.`     

term 쿼리를 사용할 때 document가 조회되지 않는 이슈가 있을 수 있다.   
`string 필드는 text타입( 이메일 본문과 같은 전문(full text)) 또는 keyword 타입(전화번호, 우편번호 등..)을 갖는다.`   
`text타입은 ES 분석기를 통해 역색인이 되는 반면, keyword 타입은 역색인이 되지 않는 
특징이 있다.`   

예를 들어, 'Quick Foxes'라는 문자열이 있을 때, text 타입은 [quick, foxes]으로 역색인이 된다.

이런 상황에서 term 쿼리로 'quick' 문자열을 검색했다면 해당 document를 찾을 수 있지만, 
    'quick foxes' full text를 검색했을 경우에는 document를 찾을 수 없다.    

`따라서 term 쿼리는 정확한 키워드를 찾기 때문에 전문 검색(full text search)에는 어울리지 않는다.`   
full text search를 하고자 할때에는 match쿼리를 사용하는 것이 좋다.   

term 쿼리 사용법은 아래와 같다. 

```
"query": {
    "term": {
      "address": "bristol"
    }
}
```

`term 쿼리 사용시 주의사항은 역색인에 명시된 문자열을 찾으므로 Bristol 문자열에 대해선 찾을 수 없다. ES에서 
분석기를 거쳐 역색인 될 때 lowercase 처리를 하기 때문이다.`   

#### 6-7) terms   

`terms 쿼리는 배열에 나열된 키워드 중 하나와 일치하는 document를 조회한다.`   

아래는 address 필드에 street, place, avenue 키워드가 하나라도 존재하는 
document를 조회하는 예제이다.   

```
{
  "query": {
    "terms": {
      "address": ["street", "place", "avenue"]
    }
  }
}
```

최소 몇 개의 검색어가 포함되기를 원하다면 [링크](https://stackoverflow.com/questions/40837678/terms-query-does-not-support-minimum-match-in-elasticsearch-2-3-3)를 참고하자.   


#### 6-8) regexp     

regexp 쿼리는 정규 표현식 term 쿼리를 사용할 수 있다.    
`regexp 쿼리는 Term Level 쿼리인데, 이는 정확한 검색을 한다는 의미이다.`       

아래는 address 필드에서 끝 문자열이 street인 document를 조회하는 예제이다.   

```
{
    "query": {
        "regexp":{
            "address": ".*street"
        }
    }
}
```

```
정규식 .*을 분석해보면 다음과 같다.   
- . : 모든 문자열   
- * : 0개 이상의 자리수   

즉, "0개 이상의 자리수를 갖는 모든 문자열 + street" 인 문자여를 찾는 쿼리가 된다.
```

그 밖의 ES 정규식 문법에 대해서는 [링크](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-regexp-query.html#regexp-syntax)를 참고하자.   


- - - 

## 7. 검색 결과 가공하기    

위에서 Query DSL을 통해 조회된 document들에 대해서 결과를 가공하는 방법에 대해 살펴보자.    

- - - 

#### 7-1) from / size    

from과 size 필드는 pagination 개념과 관련이 있다.    
`예를 들어, 게시판 페이징을 할 때 쪽수는 from이 되고, size는 한 번에 나타날 게시글의 수가 된다.`    
즉, SQL로 따지면 from은 offset, sizes는 limit이 될 수 있다.    

> from은 default 0이고, size는 default 10이다.   

아래는 3개의 document만 반환하도록 조회하는 에제이다.    

```
{
   "from" : 0,
   "size" : 3,
   "query":{
      "match_all":{}
   }
}
```

`from 과 size는 index setting인 index.max_result_window에 설정된 값을 
초과할 수 없다.`    
해당 설정은 기본값이 10,000이며 즉, 최대 10,000개의 document를 
호출할 수 있고 그 이상을 호출 하려면 [scroll API](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/search-request-scroll.html)를 사용해야 한다.    

- - - 

#### 7-2) sort 

sort 쿼리로 특정 필드마다 하나 이상의 정렬을 추가 할 수 있다.    

`sort 쿼리를 사용하지 않을 경우, 기본 정렬은 _score 내림차순(desc)이며, 
    다른 항목으로 정렬할 경우 오름차순(asc)으로 기본 설정된다.`    


아래는 age 필드에 대해 내림차순으로 정렬한 후, balance 필드에 대해 
내림차순으로 정렬하고 score를 내림차순으로 정렬하는 예제이다.   

```
{
   "sort" : [
        { "age" : "desc" },
        { "balance" : "desc" },
        "_score"
    ],
   "query":{
      "match_all":{}
   }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/search-request-sort.html)를 참고하자.   

- - - 

#### 7-3) source filtering    

source 필드를 통해 검색된 데이터에서 특징 필드들만 반환하도록 할 수 있다.   
SQL에서 SELECT 쿼리를 날릴 때 특정 컬럼들을 명시하는 것과 유사하다.   

아래는 검색된 document들에 대해 모든 필드들을 응답받지 않는 예제이다.   

```
{
   "_source": false,
   "query":{
      "match_all":{}
   }
}
```

위의 경우는 document의 총 개수만 알고 싶을 경우, source를 노출시키지 않음으로써 
성능을 높일 수 있다.    

아래는 검색된 document들에 대해 firstname, lastname 필드만 응답받는 예제이다.   

```
{
   "_source": ["firstname","lastname"],
   "query":{
      "match_all":{}
   }
}
```

그 밖에 와일드 카드를 사용하거나 includes/excludes를 사용하여 필드를 
포함 제외시킬 수있다.   
자세한 내용은 [공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/search-request-source-filtering.html)를 
참고하자.   


- - - 

#### 7-4) aggregations    

aggregations는 집계를 의미하며 aggs 필드를 통해 document 개수를 통계낼 수 있다.   
SQL에서 GROUP BY와 유사하다.   
ES는 검색 엔젠인 만큼 다양한 통계 방식을 제공하는데, 이 글에서 모두 다룰 수 
없으므로 [공식 문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/search-aggregations.html) 를 참고하자.   


아래는 address에 street 문자열이 포함된 document들의 balance 필드 값들을 평균 내는 에제이다.   

```
  "query": {
    "term": {
      "address" : "street" 
    }
  },
  "aggs": {
    "aggs_test": {
      "avg": {
        "field": "balance"
      }
    }
  }
```

Output   

```
  "aggregations" : {
    "aggs_test" : {
      "value" : 24810.61038961039
    }
  }
```

- aggs_tes    
    - response 데이터에 명시될 통계 결과 필드명을 의미하며, 원하는대로 작성하면 된다.   
- avg   
    - 집계 타입을 의미하며 sum, cardinality등 여러가지가 있다.   
- field   
    - 어떤 필드에 대해 통계를 낼 것인지 명시하며, 위 예제에서는 balance 필드에 대한 집계를 했다.    






- - - 

**Reference**    

<https://bakyeono.net/post/2016-08-20-elasticsearch-querydsl-basic.html>   
<https://victorydntmd.tistory.com/313?category=742451>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

