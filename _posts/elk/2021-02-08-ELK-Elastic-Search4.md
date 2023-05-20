---
layout: post
title: "[ELK] Elastic Search 여러 조건으로 검색하기"
subtitle: "Search API / Bulk API / Query DSL(query, filter)"    
comments: true
categories : ELK
date: 2021-02-08
background: '/img/posts/mac.png'
---

이번 글에서는 Search API 그리고 Query DSL에 대해 다뤄보자.   

- - -    

## 1. 검색하기 전 샘플 데이터 셋팅   

검색을 하려면 대량의 데이터가 필요하다. 공식 문서에 
이를 제공해주는데, [링크](https://www.elastic.co/guide/kr/kibana/current/tutorial-load-dataset.html) 에 
접속하여 json파일을 다운 받고 json 파일을 bulk API로 색인해보자.   

bulk API는 [링크](https://esbook.kimjmin.net/04-data/4.3-_bulk)에서 더 자세하게 확인 할 수 있다.     

```
vi test.json   
curl -XPOST 'localhost:9200/bank/account/_bulk?pretty' -H 'Content-Type: application/json' --data-binary '@test.json'   
curl -XGET 'localhost:9200/_cat/indices?v' // 데이터 확인 
```


- - - 

## 2. search API   

search API는 아래와 같이 모든 document를 검색할 수 있다.   

```
curl -XGET 'localhost:9200/_all/_search?pretty'
```

> all 지정자를 사용하면 클러스터에 있는 모든 인덱스를 대상으로 검색이 
가능하지만, 불필요한 작업 부하를 초래하므로, all 지정자 대신 index를 지정하여 
조회하자.    

search 키워드는 검색 작업을 하겠다는 것이고, 어떻게 검색을 할 것인지에 
대한 조건(쿼리)들을 명시를 해줘야 원하는 정보를 얻을 수 있다.   

Elasticsearch는 여러 개의 인덱스를 한꺼번에 묶어서 검색할 수 있는 
멀티테넌시(Multitenancy)를 지원한다.   

```
# 쉼표로 나열해서 여러 인덱스 검색   
GET logs-2018-01,2018-02,2018-03/_search

# 와일드 카드 * 를 이용해서 여러 인덱스 검색   
GET logs-2018-*/_search    
```

search api 조건 전달 방법은 2가지가 있다.    

- URL에 파라미터를 넘기는 방법( URI Search )   
- json 파일에 쿼리를 작성하여 POST 방식으로 넘기는 방법( Query DSL )    

이 중에 후자의 방법을 더 많이 사용한다. 이유는 URL이 깔끔해지고, 더 
상세한 표현이 가능할 뿐더러 재사용이 가능하기 때문이다.   

먼저 URL을 호출하는 방법부터 간단하게 살펴보자.   

### 2-1) URI Search    

URI Search 방식은 모든 검색 옵션을 노출하지 않지만, 빠른 curl 테스트에 
유용한 방법이다.   

아래의 API 호출은 bank 인덱스에 색인되어 있는 데이터들 중에 
age가 39살인 document만 조회하는 예제이다.    

```
curl -XGET 'localhost:9200/bank/account/_search?q=age:39&pretty'
```

파라미터 q는 쿼리 스트링으로 [Query String Query](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-query-string-query.html) 로 변환된다.      

이외에 다양한 파라미터를 전달할 수 있다. 더 많은 파라미터 정보는 [링크](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-uri-request.html#_parameters_3)를 참고하자.    

다음은 search api 응답 결과를 분석해보자.   

### 2-2) Search API Response 분석     

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


### 2-3) Query DSL    

이제 본격적으로 `json 포맷으로 쿼리를 만들어서 검색을 하는 Query DSL(Domain Specific Language)`에 대해 알아보자.     

Query DSL에 대해 알아보기에 앞서 Query Context와 Filter Context에 대한 개념이 필요하다. ( [참고](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-filter-context.html) )   
`앞으로 소개 할 query 절은 Query Context 또는 Filter Context에서 
사용되는지 여부에 따라 다르게 동작한다.`   

<img width="529" alt="스크린샷 2023-05-06 오후 11 16 18" src="https://user-images.githubusercontent.com/26623547/236629562-c67a91c7-9c3f-40b4-82de-65c4c746522d.png">    


#### 2-3-1) Filter Context

Filter Context에서 사용되는 query 절은 '해당 document가 query절과 일치하는가?' 라는 
질문에 해당하는데, 그 `대답은 true 또는 false이며 점수(score)는 계산하지 않는다.`    

또한, Filter Context는 [캐싱(caching)](https://www.elastic.co/kr/blog/elasticsearch-caching-deep-dive-boosting-query-speed-one-cache-at-a-time)을 
사용할 수 있으며, Query Context는 캐싱을 사용할 수 없다.   

캐싱된 결과는 아래와 같이 확인 가능하다.   

```
// Shard Request Cache
// size = 0 인 request 결과만 cache (aggregation, suggestions 등)
// https://www.elastic.co/guide/en/elasticsearch/reference/current/shard-request-cache.html
GET /_nodes/stats/indices/request_cache?human


// Node Query Cache
// https://www.elastic.co/guide/en/elasticsearch/reference/current/query-cache.html   
// Filter Context를 사용했을 경우에만 동작   
GET /_nodes/stats/indices/query_cache?human
```


쿼리(Query)와 필터(Filter)의 자세한 내용은 [참고 링크](https://m.blog.naver.com/tmondev/220292262363) 를 참고하자.    

#### 2-3-2) Query Context     

Query Context에서 사용되는 query 절은 '해당 document가 query 절과 얼마나 
잘 일치하는가?' 라는 질문에 해당하는데, 
    `document가 얼마나 잘 일치하는지를 _score(관련성 점수, relevance score)로 표현한다.`     

RDBMS 같은 시스템에서는 쿼리 조건에 부합하는 지만 판단하여 결과를 가져올 뿐 
각 결과들이 얼마나 정확한지에 대한 판단은 보통 불가능하다.    
`ES 와 같은 풀 텍스트 검색엔진은 검색 결과와 입력된 검색 조건과 
얼마나 일치하는 지를 
계산하는 알고리즘을 가지고 있어 이 정확도(relevancy)`를 기반으로 사용자가 
가장 원하는 결과를 먼저 보여줄 수 있다.     

> 구글 또는 네이버 같은 웹 검색 엔진들도 검색을 하면 찾은 결과들 중에 
어떤 것이 사용자가 입력한 검색어와 가장 연관성이 있는지를 계산하여 정확도가 
가장 높은 결과들 부터 보여준다.   

`엘라스틱서치의 검색 결과에는 스코어 점수가 표시가 된다. 이 점수는 
검색된 결과가 얼마나 검색 조건과 일치하는지를 나타내며 점수가 높은 순으로 
결과를 보여준다.`    

이 점수를 계산하기 위해 BM25라는 알고리즘을 사용하고 여기서 BM은 Best Matching을 뜻한다.   
이 알고리즘은 TF, IDF 그리고 Field Length 총 3가지 요소가 사용된다.    

- TF(Term Frequency)    
    - 구글에서 '쥬라기 공원'이라는 검색어로 검색을 한다고 가정해보자. 해당 단어가 5번 들어 있는 웹 페이지 보다는 
    10번 들어있는 웹 페이지가 내가 보고 싶어 하는 정보가 있는 페이지일 확률이 높다는 것이다. 즉, document 내에 검색된 
    term이 더 많을 수록 점수가 높아지는 것을 Term Frequency라고 한다.   

- IDF(Inverse Document Frequency)    
    - 구글에서 '쥬라기 공원' 이라는 검색어로 검색을 했을 때 '쥬라기'가 포함된 결과는 
    10개, '공원'이 포함된 결과는 100개 라고 가정한다면 흔한 단어인 '공원' 보다는 희소한 단어인 
    '쥬라기'가 검색에 더 중요한 term일 가능성이 높다.     
- Field Length    
    - 'lazy'를 포함하고 있는 2개 document 들이 나타나지만, 'The quick brown fox jumps over the lazy dog' 보다 
    'Lazy jumping dog'가 점수가 더 높게 나타난다.     

이제 여러가지 Query DSL 방식의 Search API를 사용한 예제를 살펴보자.    

- - - 

## 3. Query Context 검색    

ElasticSearch의 API 중 자주 사용하는 API에 대해 살펴보자.   

### 3-1) match_all / match_none

`match_all 쿼리는 지정된 index의 모든 document를 검색하는 방법이다.`   
즉, 특별한 검색어 없이 모든 document를 가져오고 싶을 때 사용한다. SQL로 
치면 WHERE 절이 없는 SELECT문과 같다.    

이와 유사하게 match_none이 있는데, 모든 document를 가져오고 싶지 않을 때 
사용한다.   

```
GET my_index/_search
{  
   "query":{  
      "match_all":{}
   }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-match-all-query.html) 를 참고하자.      


### 3-2) match, match_phase     

`match 쿼리는 풀 텍스트 검색에 사용되는 가장 일반적인 
쿼리이며, 텍스트/숫자/날짜를 허용한다.`   
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

`match 검색에 여러 개의 검색어를 집어넣게 되면 디폴트로 OR 조건으로 검색이 되어 
입력된 검색어 별로 하나라도 포함된 모든 문서를 모두 검색한다.`    

아래와 같이 검색어로 'mill street'을 주었을 때 'mill'과 'street' 단어 
하나라도 포함한 document를 모두 포함한다.   

```
"match":{
    "address":"mill street"
}
```

`검색어가 여럿일 때 검색 조건을 OR가 아닌 AND로 바꾸려면 operator 옵션을 
사용할 수 있다.`    

아래와 같은 형식으로 'mill street' 모두 있는 document만 검색한다.   

```
"query": {
    "match": {
      "address": {
        "query" :"mill street",
        "operator": "and"
      }
    }
  }
```

또한, match 쿼리에서 'mill street'라는 구문을 공백을 포함해서 순서까지 정확히 
일치하는 내용을 검색하려면 어떻게 해야 할까?    

`바로 match_phrase 쿼리를 사용하면 된다.`
`match_phrase 쿼리는 입력된 검색어를 순서까지 고려하여 검색을 수행한다.`    

```
"query": {
  "match_phrase": {
    "address": "mill street"
  }
}
```

`match_phrase 쿼리는 slop 이라는 옵션을 이용하여 slop에 지정된 값 만큼 
단어 사이에 다른 검색어가 끼어드는 것을 허용할 수 있다.`       
slop을 1로 하고 검색을 하면 아래와 같이 쿼리를 만들 수 있다.   

```
  "query": {
    "match_phrase": {
      "address": {
        "query": "288 street",
        "slop": 1
      }
     }
  }
```

slop의 크기를 1로 했기 때문에 '288' 과 'street' 사이에 있는 '288 mill street' document도 
같이 검색이 된다.   

> 이처럼 match_phrase 쿼리와 slop을 이용하면 정확도를 조절 해 가며 원하는 
검색 결과의 범위를 넓힐 수 있다. slop을 너무 크게 하면 검색 범위가 넓어져 관련이 없는 
결과가 나타날 확률도 높아지기 때문에 1이상은 사용하지 않는 것을 권장한다.    




[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-match-query.html) 를 참고하자.   

- - - 

## 4. Filter Context 검색   

검색에서 여러 쿼리를 조합하기 위해서는 상위에 bool 쿼리를 사용하고 그 안에 다른 
쿼리들을 넣는 식으로 사용이 가능하다.    

`bool 쿼리는 다음과 같이 4개의 인자를 가지고 있으며, 
     filter의 경우만 score 계산을 하지 않는 Filter Context에 해당 된다.`        

### 4-1) bool 

- must : bool must 절에 지정된 모든 쿼리가 일치하는 document를 조회    
- should : bool should 절에 지정된 모든 쿼리 중 하나라도 일치하는 document를 조회   
- must_not : bool must_not 절에 지정된 모든 쿼리가 모두 일치하지 않는 document를 조회   
- filter : 쿼리가 참인 document를 검색하지만 `score를 계산하지 않는다. must 보다 검색 속도가 빠르고 캐싱이 가능`하다.      

> 풀 텍스트 검색은 스코어 점수 기반으로 relevancy가 높은 결과부터 가져온다. 이와 
상반되는 특성을 Exact Value 라고 하는데, 값이 정확히 일치 하는지의 여부 만을 따지는 검색이다.   
> Exact Value에는 term, terms, range와 같은 쿼리들이 이 부분에 속하며, 스코어를 계산하지 않기 때문에 보통 
bool 쿼리의 filter 내부에서 사용된다.   

bool 쿼리 내에 위의 각 절들을 조합해서 사용할 수 있다.  

사용방법은 아래와 같다.    

```
GET my_index/_search
{
  "query": {
    "bool": {
      "must": [
        { <쿼리> }, …
      ],
      "must_not": [
        { <쿼리> }, …
      ],
      "should": [
        { <쿼리> }, …
      ],
      "filter": [
        { <쿼리> }, …
      ]
    }
  }
}
```

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

`bool 쿼리의 should 는 검색 점수(score)를 조정하기 위해 사용할 수 있다.`    
아래 예제를 보면, address가 'street'을 포함하는 도큐먼트를 검색하는데 
그 결과들 중 'mill' 이 포함된 결과에 가중치를 줘서 상위로 올리고 싶으면 
should 안에 찾는 검색을 추가 하면된다.

```
  "query": {
    "bool": {
      "must": [
        {"match": {
          "address": "street"
        }}
      ],
      "should": [
        {"match": {
          "address": "mill"
        }}
      ]
    }
  }
```

`should는 match_phrase와 함께 유용하게 사용할 수 있다.`    
쇼핑몰 상품 검색 같은 사례에서는 보통 검색어로 입력된 단어가 
하나라도 포함된 결과들은 모두 가져오도록 되어 있다. 이 때 검색 결과 중에서 
입력한 검색어 전체 문장이 정확히 일치하는 결과를 맨 상위에 위치시키면서 
다른 결과들을 누락시키지 않게하여 사용자가 정확하게 
원하는 수준 높은 품질의 결과를 제공할 수 있다.   

> 예를 들어, '스키 장갑' 같은 단어로 검색했을 때 스키 용품들과 각종 장갑들을 모두 가져오면서 
그 중 스키 장갑을 가장 상위에 표시할 수 있다. 여기서 slop : 1 을 이용하면 '스키 보드 장갑', 
    '스키 벙어리 장갑' 같이 스키와 장갑 사이에 다른 값이 들어간 결과에도 가중치를 부여할 수 있다.   

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-bool-query.html) 를 참고하자.   


### 4-2) filter   

`filter 쿼리는 document가 검색 쿼리와 일치하는지 나타내는 _score 값을 계산하지 
않도록 쿼리 실행을 최적화 한다.`    

bool 쿼리의 filter 안에 하위 쿼리를 사용하면 스코어에 영향을 주지 않는다.   

`filter 안에 넣은 검색 조건들은 스코어를 계산하지 않지만 캐싱이 되기 때문에 
쿼리가 더 가볍고 빠르게 실행된다.`    

`문자열 데이터는 keyword 형식으로 저장하여 정확한 검색이 가능하다.`    
`아래와 같이 문자열과 공백, 대소문자까지 정확히 일치하는 데이터만을 결과로 리턴한다.`   

```
"query": {
    "bool": {
      "filter": {"term":{
        "address.keyword":"891 Elton Street"
      }}
    }
  }
```

keyword 타입으로 저장된 필드는 스코어를 계산하지 않고 정확값의 일치 여부만을 
따지기 때문에 스코어가 score : 0.0 으로 나오게 된다. 스코어를 계산하지 
않기 때문에 keyword 값을 검색할 때는 filter 구문 안에 넣도록 한다.   

> filter 안에 넣은 검색 조건들은 스코어를 계산하지 않지만 캐싱이 되기 때문에 
쿼리가 더 가볍고 빠르게 실행된다. keyword 뒤에 설명할 range 쿼리와 같이 
스코어 계산이 필요하지 않은 쿼리들은 모두 filter 안에 넣어서 실행하는 것이 좋다.   

또한, 아래와 같이 filter 쿼리 내에 여러 조건을 추가하고 싶다면, 
    아래와 같이 작성할 수 있다.     

```
GET summary/_search
{
  "query": {
    "bool": {
      "filter": [
        { "term" : {"name": "kaven" }},
        { "terms" : {"category": ["a", "b"] }},
        { "range": { "createdAt": {"gte": "2023-05-01", "lte": "2023-05-04"}}}
      ]
    }
  }
}
```   

> 위 쿼리는 name은 kaven이며, category는 나열된 배열 중 일치하는 것을 
검색하며, createdAt 날짜 사이에 있는 document를 검색한다.   

> filter 쿼리 내에 term, terms, range 는 relevance score를 계산하지 
않기 때문에 캐싱이 된다.   



### 4-3) range    

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

`날짜도 숫자와 마찬가지로 range 쿼리 사용이 가능하다.   
elasticsearch는 ISO8601 형식을 사용`하며, 2023-01-01 또는 
2023-01-01T10:15:30 과 같이 사용 가능하다.   

```
{
  "query": {
    "bool": {
      "must": { "match_all": {} },
      "filter": {
        "range": {
          "date": {
            "gt": "2023-01-01"
          }
        }
      }
    }
  }
}
```

[공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/6.7/query-dsl-range-query.html) 를 참고하자.    


### 4-4) term ( Term Level Queries )    

`term 쿼리는 역색인에 명시된 토큰 중 정확한 키워드가 포함된 document를 조회한다.`     

term 쿼리를 사용할 때 document가 조회되지 않는 이슈가 있을 수 있다.   
`string 필드는 text타입( 이메일 본문과 같은 전문(full text)) 또는 keyword 타입(전화번호, 우편번호 등..)을 갖는다.`   
`text타입은 analyzer를 통해 역색인이 되는 반면, keyword 타입은 
들어온 값 그대로 역색인이 되는 특징이 있다.`       

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

### 4-5) terms   

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


### 4-6) regexp     

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
호출할 수 있고 그 이상을 호출 하려면 [링크](https://wonyong-jang.github.io/elk/2022/11/29/ELK-Elastic-Search-Max-Result-Window.html)를 참고하자.       


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

**Reference**    

<https://esbook.kimjmin.net/05-search/5.1-query-dsl>    
<https://bakyeono.net/post/2016-08-20-elasticsearch-querydsl-basic.html>   
<https://victorydntmd.tistory.com/313?category=742451>    
<https://m.blog.naver.com/tmondev/220292262363>    
<https://jjeong.tistory.com/1392>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

