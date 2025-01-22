---
layout: post
title: "[ELK] 엘라스틱 서치 인덱스 10,000개 이상 검색하기"
subtitle: "max result window, search after, point in time, scroll api, composite aggregation"    
comments: true
categories : ELK
date: 2022-11-29
background: '/img/posts/mac.png'
---

엘라스틱서치는 효율성을 위해 데이터들을 하나의 db가 아닌, `여러 
shard들에 데이터를 분산해서 저장하고 데이터들을 모을 때 
shard들로 부터 데이터를 모아 정렬한 뒤 반환하는 과정을 거치기 때문에 
최대 검색 document 개수를 10,000개로 제한하고 있다.`      

일반적인 RDBMS를 사용했다면 하나의 데이터베이스에 모든 데이터가 
저장되어 있으므로 start와 offset 키워드를 통해 
페이징을 간단하게 구현하면 되었지만 엘라스틱 서치는 데이터를 
여러 shard들에 분산하여 저장하기 때문에 다른 방식으로 구현해야 한다.   

물론 전체 document 개수가 10,000개 이하일 경우 from과 size 키워드를 통해 
간단하게 구현하면 된다.   

> from은 시작 지점을 이야기하고, 
    size는 그 시작 지점으로 부터 몇 개의 데이터를 보여주어야 하는 건지 설정할 때 사용 되는 값이다.   

예를 들어 총 검색 요청과 관련된 shard가 총 5개이고, 검색 결과는 10개만 가져오는 경우를 보자.   
이 중 1페이지를 가져오는 경우 각 shard가 있는 노드에서 문서를 scoring 한 후 정렬하여 
각각 10개의 문서를 리턴한다.   
coordinating node는 반환된 총 50개의 문서를 재정렬한 후 10개의 문서를 리턴한다.  

만약 1000페이지를 가져오는 경우라면(size = 10), 각 샤드의 정렬된 문서에서 
10,001 부터 10,010번째까지의 문서를 리턴해야 한다.   

이 경우에는 각 샤드에서 문서를 scoring 하여 10010개를 조회하고, coordinating node에서는 
모든 조회 결과 문서 50050개를 정렬하여 10개의 문서를 반환하고 50040개의 문서는 버린다.   

<img width="600" alt="스크린샷 2024-12-24 오전 8 31 46" src="https://github.com/user-attachments/assets/16c4dd0e-426d-45eb-91a7-39ecb3dba813" />


`페이지네이션이 깊어질수록 코디네이터 노드에서 정렬해야 할 문서가 기하급수적으로 늘어나게 되면서 
더 많은 CPU, 메모리를 사용하게 된다.`      

document의 숫자가 10,000을 넘어가게 되면, 정상적인 결과가 나오지 않고 
query phase execution exception 에러가 발생하고 다음과 같은 에러 문구를 
출력한다.   


```
Result window is too large,    
from + size must be less than or equal to: [10000] but was [10002].  
See the scroll api for a more efficient way to request large data sets.   
This limit can be set by changing the [index.max_result_window] index level setting.   
```

- - -    

## 1. max result window 사이즈 변경

아래 명령어를 통해, max result window를 수정해 줄 수 있다.   
하지만 기본적으로 10000을 넘게 조회하게 되면 많은 리소스 사용으로 
성능 문제를 야기할 수 있기 때문에 함부로 설정값을 바꿀것이 아니라 
검색을 10000개가 한번에 되지 않도록 검색 조건을 잘 분할해서 
지정하는 것을 권장한다.   

그럼에도 불구하고 설정을 추가해야 한다면 아래와 같이 변경할 수 있다.   

```
PUT your_index_name/_settings
{
  "max_result_window" : 500000
}
```   

또는, 템플릿을 적용하여 인덱스가 생성될 때, 자동으로 매핑할 수 있다.   

> 월 별로 생성되는 인덱스의 경우   

```
PUT _template/member_template
{
    "index_patterns": ["member*"],
    "settings": {
        "max_result_window": 50000,
        "index.mapping.total_fields.limit": 50000,
        "number_of_shards": 5
    }
}
```

`위 설정 값을 무한히 증가시킬 수 없기 때문에 가용한 클러스터 리소스 만큼만 증가시키되, 
    아래와 같이 일정 수 이상의 결과를 제공하지 않는 정책으로 검색 범위를 조절하여 해결할 수도 있다.`      

<img width="730" alt="스크린샷 2024-12-24 오전 9 18 16" src="https://github.com/user-attachments/assets/2c95976b-6aaa-466c-b88f-005963bbd61d" />

- - - 

## 2. Scroll api 사용 

RDBMS의 cursor 방식과 동일하게 작동하는 scroll api는 모든 검색 결과를 메모리에 
컨텍스트로 유지하고 다음 조회 요청 시, 이전 조회 결과를 이어서 조회할 수 있다.   

아래와 같이 scroll 파라미터를 통해 컨텍스트를 유지하는 기간을 전달한다. 조회 결과와 
함께 다음 조회에 전달해야 할 scroll id를 반환한다.  

```
GET /index/_search?scroll=1m
{
  "size": 10,
  "query": {
    "match": {
      "message": "foo"
    }
  }
}
```

```
{
  "_scroll_id" : "FGluY2x1ZGVfY29udGV4dF91dWlkDXF1ZXJ5QW5kRmV0Y2gBFlZjTHFyckUwUnpHS1ZqZnJhOVliZ3cAAAAAAAELxxZTUXpBNklNaVFFT0kwS3BHdDNQTHR3",
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : [...]
}
```

기존에는 10,000개 이상의 document들에 대해 페이징을 적용할 때 scroll api를
사용하는 것이 권장되었지만 7 버전이 되면서 상황이 바뀌었다.

scroll api 단점은 아래와 같다.   

- 컨텍스트 조회 시점 이후에 발생한 변경 사항이 반영되지 않는 스냅샷에서 조회하기 때문에, 
    사용자의 실시간 조회에는 적합하지 않는다.   
- from 값을 사용할 수 없기 때문에, UI에서 더보기 버튼이나 스크롤 방식이 아닌 페이지 번호 조회인 
경우에는 사용할 수 없다.   
- 컨텍스트의 유지 기간을 짧게 설정하는 경우, 사용자의 사용성이 하락할 수 있다. 반대로 유지 기간을 길게 
설정하는 경우, 사용자의 사용성은 증대될 수있지만, 더 이상 조회를 하지 않는 경우에도 컨텍스트가 불필요하게 
유지될 수 있다.   
- 백그라운드 세그먼트 병합 프로세스 과정에서는 더 이상 사용되지 않는 세그먼트가 컨텍스트에서 
사용되고 있는지 추적한다. 만약 사용되고 있는 경우, 해당 세그먼트는 삭제 대상에서 제외된다. 수정 및 삭제가 
잦은 인덱스를 대상으로 유지되고 있는 컨텍스트가 많을 수록 많은 메모리에를 사용하게 되고, 
    제거되지 않는 세그먼트들로 인해 더 많은 디스크 공간과 파일 핸들링이 필요하게 된다.   

<img width="600" alt="스크린샷 2024-12-24 오전 8 49 09" src="https://github.com/user-attachments/assets/d26a0224-11a5-4558-a2e9-098d79c1a37e" />   


> Scroll api는 컨텍스트 비용이 많이 들기에 실시간 사용자 요청에는 Search After가 권장된다.   

We no longer recommend using the scroll API for deep pagination. 
If you need to preserve the index state while paging through more than 
10,000 hits, use the [search after](https://www.elastic.co/guide/en/elasticsearch/reference/current/paginate-search-results.html#search-after) 
parameter with a point in time (PIT).    

- - - 

## 3. search after 필드 사용하기    

`Search After는 많은 쿼리를 병렬로 스크롤하는 솔루션으로, 이전 페이지의 결과를 
사용하여 다음 페이지를 조회한다.`    

`문서의 고유한 값이 있는 필드를 순위 결정자로 사용해야 한다.` 그렇지 않으면 
정렬 순서가 정의되지 않아 결과가 누락되거나 중복될 수 있다.   

> 조회 결과를 고유한 키를 기준으로 정렬하고, 전달한 키 값 이후의 결과들만 조회할 수 있다.   

`메모리에 컨텍스트를 유지하는 방식이 아닌 매번 인덱스를 대상으로 새로 조회하기 때문에, 
    실시간 변경이 반영된 결과를 이어서 조회할 수 있다.`   

ES Search에서 정렬을 하고 조회를 하게 되면, hit 값에 sortValues를 반환하게 
되는데, 이 값을 이용하여 가장 마지막으로 조회한 문서의 다음 값을 다시 
찾게 된다.   

이 때 중요한 점은, PIT(Point In Time) 값을 함께 설정해주어 동일한 시점에 
검색을 한 것과 같은 효과를 내주어야 한다는 것이다.  

##### PIT (Point in Time) 란?     

Elasticsarch 7.10 버전부터 사용이 가능하며, 인덱스의 
특정 시점의 데이터 상태를 캡처하여 복원할 수 있는 기능이다.   

`Search After 요청 사이에 인덱스 변경사항이 일어나면 결과 데이터가 
일관되지 않을 수 있어 데이터 일관성을 맞추기 위해 사용한다.`   


> 주의: collapse나 aggregation은 search after를 지원하지 않는다.  

<img width="613" alt="스크린샷 2024-12-24 오전 8 49 19" src="https://github.com/user-attachments/assets/2b0ffe05-9ea2-46ae-bad5-c4353d3490ce" />



```
GET index/_search
{
  "size": 10,
  "query": {
    "match": {
      "message": "foo"
    }
  },
  "sort": [
    {"title": "asc"}
  ]
}
```

조회 결과로 반환되는 sort 값은 다음 조회 시, 조회 기준이 되기 때문에 
고유하지 않은 경우 조회 결과가 손실될 수있다.  

`참고로, 정렬 기준이 필요 없는 경우 _doc 기준으로 정렬하는 경우 샤드 간 
정렬이 필요 없기 때문에 성능이 가장 뛰어나다.`   

```
{
  "took" : 1,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : [
    ...,
    {
    	"_index" : "index",
        "_type" : "doc",
        "_id" : "uyNoH2cBvWxWFgHQ86L9",
        "_score" : null,
        "_source" : {
    	  "message" : "foo",
    	  "title" : "bar"
        },
        "sort" : [
          "bar"
        ]
    }
  ]
}
```

`다음 조회시에 search_after 필드를 통해 이전 조회 결과에서 반환한 조회 기준이 되는 값을 전달한다.`   

`search_after api를 사용하여 페이지네이션이 깊어질수록 발생하는 성능 문제를 해결할 수 있지만 
경우에 따라 사용하기 어려울 수 있다.`   

- 정렬 기준 값이 고유하지 않은 경우, 결과가 손실되어 조회 결과가 정확하지 않을 수 있다.  
- from 값을 사용할 수 없기 때문에, UI 에서 더보기 버튼이나 스크롤 방식이 아닌 페이지 번호 조회인 경우는 
사용할 수 없다.     


- - - 

## 4. Composite Aggregation   

`집계의 경우도 동일하게 결과값 10000개 이상을 검색할 때 제한이 발생한다.`   

따라서 이를 해결하기 위해 composite 집계를 이용할 수 있다.  

```
GET test-index/_search
{
  "size": 0,
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "contents": "가나"
          }
        }
      ]
    }
  },
  "aggs": {
    "custom-composite-aggs": {
      "composite": {
        "sources": [
          {
            "contents": {
              "terms": {
                "field": "contents.keyword"
              }
            }
          }
        ]
      }
    }
  }
}
```

Output

```
"aggregations" : {
    "custom-composite-aggs" : {
      "after_key" : {
        "contents-aggs" : "가나마"
      },
      "buckets" : [
        {
          "key" : {
            "contents-aggs" : "가나 다라마사"
          },
          "doc_count" : 1
        },
// ... 
```

`집계 결과를 보면 after key를 포함하고 있고, 해당 키값을 넣어서 쿼리를 하게 되면 해당 키 다음 부터 조회가 가능`하다.   
이런 방법으로 전체를 조회하거나 원하는 페이지를 조회할 수 있다.   



- - - 

**Reference**   

<https://heesutory.tistory.com/29>   
<https://jaimemin.tistory.com/1543>   
<https://wedul.site/518>   
<https://velog.io/@nmrhtn7898/elasticsearch-%EA%B9%8A%EC%9D%80deep-%ED%8E%98%EC%9D%B4%EC%A7%80%EB%84%A4%EC%9D%B4%EC%85%98>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

