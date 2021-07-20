---
layout: post
title: "[ELK] 집계 - Aggregations"
subtitle: "Metrics, Bucket Aggregations( Range, Histogram, Terms )"    
comments: true
categories : ELK
date: 2021-07-20
background: '/img/posts/mac.png'
---

Elasticsearch 는 검색엔진으로 개발되었지만 지금은 로그분석을 비롯해 
다양한 목적의 데이터 시스템으로 사용되고 있다.    
Elasticsearch가 이렇게 다양한 용도로 활용이 될 수 있는 이유는 
데이터를 단순히 검색만 하는 것이 아니라 여러가지 연산을 할 수 있는 
Aggregation 기능이 있기 때문이다. Kibana 에서는 바 차트, 파이 차트 등으로 
데이터를 시각화 할 수 있는데 여기서 사용하는 것이 이 기능이다.    

Aggregation의 사용방법은 search API 에서 query 문과 같은 수준에 지정자 
aggregations 또는 aggs 를 명시하고 그 아래 임의의 aggregation 이름을 
입력한 뒤 사용할 aggregation 종류와 옵션들을 명시한다.   

`Aggregation 에는 크게 Metrics 그리고 Bucket 두 종류가 있다.`   
Aggregations 구문이나 옵션에 metrics 이거나 bucket 이라고 따로 명시를 
하지는 않는다. `Aggregation 종류들 중 숫자 또는 날짜 필드의 값을 가지고 
계산을 하는 aggregation 들은 metrics aggregation 이라고 분류하고, 
    범위나 keyword 값 등을 가지고 도큐먼트들을 그룹화 하는 aggregation 들을 
    bucket aggregation 이라고 분류 한다.`      

Metrics 와 Bucket Aggregations 들을 설명하기 위해 
아래 데이터를 my_stations 인덱스에 인덱싱해보자.     

```
PUT my_stations/_bulk
{"index": {"_id": "1", "_type":"doc"}}
{"date": "2019-06-01", "line": "1호선", "station": "종각", "passangers": 2314}
{"index": {"_id": "2", "_type":"doc"}}
{"date": "2019-06-01", "line": "2호선", "station": "강남", "passangers": 5412}
{"index": {"_id": "3", "_type":"doc"}}
{"date": "2019-07-10", "line": "2호선", "station": "강남", "passangers": 6221}
{"index": {"_id": "4", "_type":"doc"}}
{"date": "2019-07-15", "line": "2호선", "station": "강남", "passangers": 6478}
{"index": {"_id": "5", "_type":"doc"}}
{"date": "2019-08-07", "line": "2호선", "station": "강남", "passangers": 5821}
{"index": {"_id": "6", "_type":"doc"}}
{"date": "2019-08-18", "line": "2호선", "station": "강남", "passangers": 5724}
{"index": {"_id": "7", "_type":"doc"}}
{"date": "2019-09-02", "line": "2호선", "station": "신촌", "passangers": 3912}
{"index": {"_id": "8", "_type":"doc"}}
{"date": "2019-09-11", "line": "3호선", "station": "양재", "passangers": 4121}
{"index": {"_id": "9", "_type":"doc"}}
{"date": "2019-09-20", "line": "3호선", "station": "홍제", "passangers": 1021}
{"index": {"_id": "10", "_type":"doc"}}
{"date": "2019-10-01", "line": "3호선", "station": "불광", "passangers": 971}
```

- - - 

## 1. Metrics Aggregations   

#### 1-1) min, max, sum, avg   

가장 흔하게 사용되는 metrics aggregations은 min, max, sum, avg aggregation이다.   
순서대로 명시한 필드의 최소, 최대, 합, 평균 값을 가져오는 aggregation 이다.    
다음은 sum aggregation을 이용해서 my_stations에 있는 전체 데이터의 
passangers 필드값의 합계를 가져오는 예제이다.   

> min, max, avg 들도 사용 방법은 동일하다.   

`aggregations만 사용하는 경우에는 아래와 같이 "size":0 을 지정하면 "hint":[]에
불필요한 도큐먼트 내용이 나타나지 않아 보기에도 편하고
도큐먼트를 fetch 해오는 과정을 생략할 수 있어 쿼리 성능도 좋아진다.`

```
GET my_stations/_search
{
  "size":0,
  "aggs" : {
    "all-passanger" : {
      "sum" : {
        "field": "passangers"
      }
    }
  }
}
```

Output   

```
{
  "took" : 4,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 10,
    "max_score" : 0.0,
    "hits" : [ ]
  },
  "aggregations" : {
    "all-passanger" : {
      "value" : 41995.0
    }
  }
}
```

aggregation해 오는 도큐먼트들은 같이 입력된 query 문의 영향을 받는다.   
다음은 my_stations에서 "station" :"강남" 인 도큐먼트들의 합계를 가져오는 
예제이다.   

```
GET my_stations/_search
{
  "query": {
    "match": {
      "station": "강남"
    }
  }, 
  "size":0,
  "aggs" : {
    "all-passanger" : {
      "sum" : {
        "field": "passangers"
      }
    }
  }
}
```

#### 1-2) stats    

min, max, sum, avg 값을 모두 가져와야 한다면 다음과 같이 stats aggregation을 
사용하면 위 4개의 값 모두와 count 값을 한번에 가져온다.   

```
GET my_stations/_search
{
  "query": {
    "match": {
      "station": "강남"
    }
  }, 
  "size":0,
  "aggs" : {
    "passangers_stats" : {
      "stats": {
        "field": "passangers"
      }
    }
  }
}
```

Output   

```
...
"aggregations" : {
    "passangers_stats" : {
      "count" : 5,
      "min" : 5412.0,
      "max" : 6478.0,
      "avg" : 5931.2,
      "sum" : 29656.0
    }
  }
```

- - - 

## 2. Bucket Aggregations   

Bucket aggregation 은 주어진 조건으로 분류된 버킷 들을 만들고, 
       각 버킷에 소속되는 도큐먼트들을 모아 그룹으로 
       구분하는 것이다. 각 버킷 별로 포함되는 도큐먼트의 개수는 doc_count 값에 
       기본적으로 표시가 되며 각 버킷 안에 metrics aggregation을 
       이용해서 다른 계산들도 가능하다.    

주로 사용되는 bucket aggregation 들은 Range, Histogram, Terms 등이 있다.   

#### 2-1) range   

range는 숫자 필드 값으로 범위를 지정하고 각 범위에 해당하는 버킷을 
만드는 aggregation이다. field 옵션에 해당 필드의 이름을 
지정하고 ranges 옵션에 배열로 from, to 값을 가진 오브젝트 값을 
나열해서 범위를 지정한다.   



- - - 

**Reference**   

<https://esbook.kimjmin.net/08-aggregations>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

