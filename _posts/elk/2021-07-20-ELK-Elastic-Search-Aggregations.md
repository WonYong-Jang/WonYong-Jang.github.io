---
layout: post
title: "[ELK] 집계 - Aggregations"
subtitle: "Metrics, Bucket Aggregations( Range, Histogram, Terms ), sub aggregations, pipeline aggregations"    
comments: true
categories : ELK
date: 2021-07-20
background: '/img/posts/mac.png'
---

Elasticsearch 는 검색엔진으로 개발되었지만 지금은 로그분석을 비롯해 
다양한 목적의 데이터 시스템으로 사용되고 있다.    
Elasticsearch가 이렇게 다양한 용도로 활용이 될 수 있는 이유는 
데이터를 단순히 검색만 하는 것이 아니라 여러가지 연산을 할 수 있는 
Aggregation 기능이 있기 때문이다.    
Kibana 에서는 바 차트, 파이 차트 등으로 
데이터를 시각화 할 수 있는데 여기서 사용하는 것이 이 기능이다.      

Aggregation의 사용방법은 search API 에서 query 문과 같은 수준에 지정자 
aggregations 또는 aggs 를 명시하고 그 아래 임의의 aggregation 이름을 
입력한 뒤 사용할 aggregation 종류와 옵션들을 명시한다.   

`Aggregation 에는 크게 Metrics 그리고 Bucket 두 종류가 있다.`   
Aggregations 구문이나 옵션에 metrics 이거나 bucket 이라고 따로 명시를 
하지는 않는다.    
`Aggregation 종류들 중 숫자 또는 날짜 필드의 값을 가지고 
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

### 1-1) min, max, sum, avg

가장 흔하게 사용되는 metrics aggregations은 min, max, sum, avg aggregation이다.   
순서대로 명시한 필드의 최소, 최대, 합, 평균 값을 가져오는 aggregation 이다.    
다음은 sum aggregation을 이용해서 my_stations에 있는 전체 데이터의 
passangers 필드값의 합계를 가져오는 예제이다.   

> min, max, avg 들도 사용 방법은 동일하다.      

그 외에도 다양한 연산을 제공하고 있고 [공식문서](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-valuecount-aggregation.html)를 
참고하자.   

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

### 1-2) stats    

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

### 1-3) cardinality   

`필드의 값이 모두 몇 종류인지 분포값을 알려면 cardinality aggregation을 
사용해서 구할 수 있다.`   
`Cardinality는 일반적으로 text 필드에서는 사용할 수 없으며 숫자 필드나 
keyword, ip 필드 등에 사용이 가능하다.`   
사용자 접속 로그에서 IP 주소 필드를 가지고 실제로 접속한 사용자가 
몇명인지 파악하는 등의 용도로 주로 사용된다.   

아래는 my_stations 인덱스에서 line 필드의 값이 몇 종류인지를 계산하는 예제이다.   

```
GET my_stations/_search
{
  "size":0,
  "aggs" : {
    "uniq_lines" : {
      "cardinality": {
        "field": "line.keyword"
      }
    }
  }
}
```

Output   

```
...
"aggregations" : {
    "uniq_lines" : {
      "value" : 3
    }
  }
```   

위 쿼리 결과처럼 실제로 line 필드에는 1호선, 2호선, 3호선 총 3 종류의 값들이 
있다.      



- - - 

## 2. Bucket Aggregations   

`Bucket aggregation 은 주어진 조건으로 분류된 버킷 들을 만들고, 
       각 버킷에 소속되는 도큐먼트들을 모아 그룹으로 
       구분하는 것이다.`   
       `각 버킷 별로 포함되는 도큐먼트의 개수는 doc_count 값에 
       기본적으로 표시가 되며 각 버킷 안에 metrics aggregation을 
       이용해서 다른 계산들도 가능하다.`        

주로 사용되는 bucket aggregation 들은 Range, Histogram, Terms 등이 있다.   

### 2-1) range   

range는 숫자 필드 값으로 범위를 지정하고 각 범위에 해당하는 버킷을 
만드는 aggregation이다. field 옵션에 해당 필드의 이름을 
지정하고 ranges 옵션에 배열로 from, to 값을 가진 오브젝트 값을 
나열해서 범위를 지정한다.   
다음은 passangers 값이 각각 1000 미만, 1000 ~ 4000 이상인 버킷들을 
생성하는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "passangers_range": {
      "range": {
        "field": "passangers",
        "ranges": [
          {
            "to": 1000
          },
          {
            "from": 1000,
            "to": 4000
          },
          {
            "from": 4000
          }
        ]
      }
    }
  }
}
```

Output   

```
...
"aggregations" : {
    "passangers_range" : {
      "buckets" : [
        {
          "key" : "*-1000.0",
          "to" : 1000.0,
          "doc_count" : 1
        },
        {
          "key" : "1000.0-4000.0",
          "from" : 1000.0,
          "to" : 4000.0,
          "doc_count" : 3
        },
        {
          "key" : "4000.0-*",
          "from" : 4000.0,
          "doc_count" : 6
        }
      ]
    }
  }
```   

각각의 버킷을 구분하는 key 값은 "from-to" 형태로 생성된다. 위 
쿼리 결과에서 각 버킷에 속한 도큐먼트 개수가 1, 3, 6개인 것을 알 수 있다.   


`aggs에 설정한 from은 이상, 즉 버킷에 포함이고 to는 미만으로 버킷에 
포함하지 않는다. 예를 들어 필드 값이 200인 도큐먼트는 "key": "100-200" 버킷에는 
포함되지 않고 "key":"200-300" 버킷에는 포함된다.`   

### 2-2) histogram   

histogram 도 range와 마찬가지로 숫자 필드의 범위를 나누는 aggs 이다.   
앞에서 본 range는 from 과 to 를 이용해서 각 버킷의 범위를 
지정했다. `histogram은 from, to 대신 interval 옵션을 이용해서 주어진 
간격 크기대로 버킷을 구한다.`   
다음은 passangers 필드에 간격이 2000인 버킷들을 생성하는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "passangers_his": {
      "histogram": {
        "field": "passangers",
        "interval": 2000
      }
    }
  }
}
```   

Output    

```
...
"aggregations" : {
    "passangers_his" : {
      "buckets" : [
        {
          "key" : 0.0,
          "doc_count" : 2
        },
        {
          "key" : 2000.0,
          "doc_count" : 2
        },
        {
          "key" : 4000.0,
          "doc_count" : 4
        },
        {
          "key" : 6000.0,
          "doc_count" : 2
        }
      ]
    }
  }
```

각각의 버킷을 구분하는 key 에는 값의 최소값이 표시된다. 위 예제에서 
0, 2000, 4000, 6000 인 버킷들이 생성되었고 각 버킷들에 포함되는 
도큐먼트 개수가 표시된 것을 볼 수 있다.   
key 값은 range와 마찬가지로 key 로 지정된 값이 
버킷에 이상(포함) / 미만(포함하지 않음)으로 지정된다.   

### 2-3) date_range, date_histogram   

range와 histogram aggs 처럼 숫자 외에도 날짜 필드를 이용해서 
범위별로 버킷의 생성이 가능하다. `이 때 사용되는 
date_range, date_histogram aggs 들은 특히 시계열 데이터에서 
날짜별로 값을 표시할 때 매우 유용하다.`     
date_range는 ranges 옵션에 {"from": "2019-06-01", "to": "2016-07-01"}와 
같이 입력 가능하며, date_histogram은 interval 옵션에 day, month, week 와 
같은 값들을 이용해서 날짜 간격을 지정할 수 있다.   
다음은 date_histogram으로 date 필드의 1개월 간격으로 구분하는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "date_his": {
      "date_histogram": {
        "field": "date",
        "interval": "month"
      }
    }
  }
}
```   

Output   

```
...
"aggregations" : {
    "date_his" : {
      "buckets" : [
        {
          "key_as_string" : "2019-06-01T00:00:00.000Z",
          "key" : 1559347200000,
          "doc_count" : 2
        },
        {
          "key_as_string" : "2019-07-01T00:00:00.000Z",
          "key" : 1561939200000,
          "doc_count" : 2
        },
        {
          "key_as_string" : "2019-08-01T00:00:00.000Z",
          "key" : 1564617600000,
          "doc_count" : 2
        },
        {
          "key_as_string" : "2019-09-01T00:00:00.000Z",
          "key" : 1567296000000,
          "doc_count" : 3
        },
        {
          "key_as_string" : "2019-10-01T00:00:00.000Z",
          "key" : 1569888000000,
          "doc_count" : 1
        }
      ]
    }
  }
```   

date_histogram의 결과에서는 버킷별로 key에 시작 날짜가 epoch_millis 값으로 
표시된다. 그리고 key_as_string 에 ISO8601 형태로도 함께 표시된다.   



### 2-4) terms   

terms aggregation은 keyword 필드의 문자열 별로 버켓을 나누어 집계가 
가능하다. keyword 필드 값으로만 사용이 가능하며, 
    분석된 text 필드는 일반적으로는 사용이 불가능하지만 
    fielddata 옵션을 true를 추가하면 가능하다.  

자세한 내용은 
[링크](https://wonyong-jang.github.io/elk/2021/07/06/ELK-Elastic-Search-Text-Keyword-Type.html) 를 참조하자.   

다음은 my_stations 인덱스에서 station.keyword 필드를 기준으로 버킷들을 만드는 
예제이다.   

```
GET my_stations/_search
{
  "size":0,
  "aggs" : {
    "stataions" : {
      "terms": {
        "field": "station.keyword"
      }
    }
  }
}
```   

Output   

```
...
"aggregations" : {
    "stataions" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "강남",
          "doc_count" : 5
        },
        {
          "key" : "불광",
          "doc_count" : 1
        },
        {
          "key" : "신촌",
          "doc_count" : 1
        },
        {
          "key" : "양재",
          "doc_count" : 1
        },
        {
          "key" : "종각",
          "doc_count" : 1
        },
        {
          "key" : "홍제",
          "doc_count" : 1
        }
      ]
    }
  }
```   

terms aggregation 에는 field 외에도 가져올 버킷의 개수를 지정하는 
size 옵션이 있으며 디폴트 값은 10이다.   
`인덱스의 특정 keyword 필드에 있는 모든 값들을 종류별로 버킷을 만들면 
가져와야 할 결과가 매우 많기 때문에 먼저 도큐먼트 개수 또는 
주어진 metrics 연산 결과가 가장 많은 버킷 들을 샤드별로 계산해서 
상위 몇개의 버킷들만 coordinate 노드로 가져오고, 그것들을 
취합해서 결과를 나타낸다. 이 과정은 검색의 query 그리고 fetch 과정과 
유사하다.`   

- - - 

## 3. Sub aggregations      

`Bucket Aggregation 으로 만든 버킷들 내부에 다시 "aggs" : { } 를 선언해서 
또다른 버킷을 만들거나 Metrics Aggregation을 만들어 사용이 가능하다.`     

다음은 terms aggregation을 이용해서 생성한 stations 버킷별로 avg aggregation을 
이용해서 passangers 필드의 평균값을 계산하는 예제이다.    

```
GET my_stations/_search
{
  "size":0,
  "aggs" : {
    "stations" : {
      "terms": {
        "field": "station.keyword"
      },
      "aggs" : {
        "avg_psg_per_st" : {
          "avg" : {
            "field": "passangers"
          }
        }
      }
    }
  }
}
```   

Output   

```
"aggregations" : {
    "stations" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "강남",
          "doc_count" : 5,
          "avg_psg_per_st" : {
            "value" : 5931.2
          }
        },
        {
          "key" : "불광",
          "doc_count" : 1,
          "avg_psg_per_st" : {
            "value" : 971.0
          }
        },
        {
          "key" : "신촌",
          "doc_count" : 1,
          "avg_psg_per_st" : {
            "value" : 3912.0
          }
        },
        {
          "key" : "양재",
          "doc_count" : 1,
          "avg_psg_per_st" : {
            "value" : 4121.0
          }
        },
        {
          "key" : "종각",
          "doc_count" : 1,
          "avg_psg_per_st" : {
            "value" : 2314.0
          }
        },
        {
          "key" : "홍제",
          "doc_count" : 1,
          "avg_psg_per_st" : {
            "value" : 1021.0
          }
        }
      ]
    }
  }
```   

버킷 안에 또 다른 하위 버킷을 만드는 것도 가능하다. 다음은 terms aggregation을 
이용해서 line.keyword 별로 lines 버킷을 만들고 그 안에 
또다시 terms aggregation을 버킷을 만드는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "lines": {
      "terms": {
        "field": "line.keyword"
      },
      "aggs": {
        "stations_per_lines": {
          "terms": {
            "field": "station.keyword"
          }
        }
      }
    }
  }
}
```

Output   

```
"aggregations" : {
    "lines" : {
      "doc_count_error_upper_bound" : 0,
      "sum_other_doc_count" : 0,
      "buckets" : [
        {
          "key" : "2호선",
          "doc_count" : 6,
          "stations_per_lines" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "강남",
                "doc_count" : 5
              },
              {
                "key" : "신촌",
                "doc_count" : 1
              }
            ]
          }
        },
        {
          "key" : "3호선",
          "doc_count" : 3,
          "stations_per_lines" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "불광",
                "doc_count" : 1
              },
              {
                "key" : "양재",
                "doc_count" : 1
              },
              {
                "key" : "홍제",
                "doc_count" : 1
              }
            ]
          }
        },
        {
          "key" : "1호선",
          "doc_count" : 1,
          "stations_per_lines" : {
            "doc_count_error_upper_bound" : 0,
            "sum_other_doc_count" : 0,
            "buckets" : [
              {
                "key" : "종각",
                "doc_count" : 1
              }
            ]
          }
        }
      ]
    }
  }
```

`하위 버킷이 깊어질수록 elasticsearch가 하는 작업량과 메모리 소모량이 
기하급수적으로 늘어나기 때문에 예상치 못한 오류를 발생 시킬수도 있다. 
보통은 2레벨의 깊이 이상의 버킷은 생성하지 않는 것이 좋다.`   

- - - 

## 4. Pipeline Aggregations   

Aggregation 중에는 다른 metrics aggregation의 결과를 새로운 입력으로 하는 
pipeline aggregation이 있다. `pipeline 에는 다른 버킷의 결과들을 다시 
연산하는 min_bucket, max_bucket, avg_bucket, sum_bucket, stats_bucket, 
    이동 평균을 구하는 moving_avg, 미분값을 구하는 derivative, 값의 
    누적 합을 구하는 cumulative_sum등이 있다.`     

`Pipeline aggregation은 "buckets_path": "<버킷 이름>" 옵션을 이용해서 
입력 값으로 사용할 버킷을 지정한다.`   
다음은 my_station에서 date_histogram을 이용해서 월별로 나눈 passangers 의 
합계 sum을 다시 cumulative_sum을 이용해서 누적값을 구하는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "months": {
      "date_histogram": {
        "field": "date",
        "interval": "month"
      },
      "aggs": {
        "sum_psg": {
          "sum": {
            "field": "passangers"
          }
        },
        "accum_sum_psg": {
          "cumulative_sum": {
            "buckets_path": "sum_psg"
          }
        }
      }
    }
  }
}
```

Output   

```
"aggregations" : {
    "months" : {
      "buckets" : [
        {
          "key_as_string" : "2019-06-01T00:00:00.000Z",
          "key" : 1559347200000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 7726.0
          },
          "accum_sum_psg" : {
            "value" : 7726.0
          }
        },
        {
          "key_as_string" : "2019-07-01T00:00:00.000Z",
          "key" : 1561939200000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 12699.0
          },
          "accum_sum_psg" : {
            "value" : 20425.0
          }
        },
        {
          "key_as_string" : "2019-08-01T00:00:00.000Z",
          "key" : 1564617600000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 11545.0
          },
          "accum_sum_psg" : {
            "value" : 31970.0
          }
        },
        {
          "key_as_string" : "2019-09-01T00:00:00.000Z",
          "key" : 1567296000000,
          "doc_count" : 3,
          "sum_psg" : {
            "value" : 9054.0
          },
          "accum_sum_psg" : {
            "value" : 41024.0
          }
        },
        {
          "key_as_string" : "2019-10-01T00:00:00.000Z",
          "key" : 1569888000000,
          "doc_count" : 1,
          "sum_psg" : {
            "value" : 971.0
          },
          "accum_sum_psg" : {
            "value" : 41995.0
          }
        }
      ]
    }
  }
```   

위 결과에서 accum_sum_psg 결과에 sum_psg 값이 계속 누적되어 더해지고 
있는 것을 확인 할 수 있다.    

`서로 다른 버킷에 있는 값들도 bucket_path에 > 기호를 이용해서 
"부모>자녀" 형태로 지정이 가능하다.`     
다음은 sum_bucket을 이용해서 mon>sum_psg 버킷에 있는 passangers 필드값의 합을 
구하는 예제이다.   

```
GET my_stations/_search
{
  "size": 0,
  "aggs": {
    "mon": {
      "date_histogram": {
        "field": "date",
        "interval": "month"
      },
      "aggs": {
        "sum_psg": {
          "sum": {
            "field": "passangers"
          }
        }
      }
    },
    "bucket_sum_psg": {
      "sum_bucket": {
        "buckets_path": "mon>sum_psg"
      }
    }
  }
}
```

Output   

```
...
 "aggregations" : {
    "mon" : {
      "buckets" : [
        {
          "key_as_string" : "2019-06-01T00:00:00.000Z",
          "key" : 1559347200000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 7726.0
          }
        },
        {
          "key_as_string" : "2019-07-01T00:00:00.000Z",
          "key" : 1561939200000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 12699.0
          }
        },
        {
          "key_as_string" : "2019-08-01T00:00:00.000Z",
          "key" : 1564617600000,
          "doc_count" : 2,
          "sum_psg" : {
            "value" : 11545.0
          }
        },
        {
          "key_as_string" : "2019-09-01T00:00:00.000Z",
          "key" : 1567296000000,
          "doc_count" : 3,
          "sum_psg" : {
            "value" : 9054.0
          }
        },
        {
          "key_as_string" : "2019-10-01T00:00:00.000Z",
          "key" : 1569888000000,
          "doc_count" : 1,
          "sum_psg" : {
            "value" : 971.0
          }
        }
      ]
    },
    "bucket_sum_psg" : {
      "value" : 41995.0
    }
  }
```    

이번 장에서는 Elasticsearch가 텍스트 검색엔진을 넘어 데이터 분석 엔진으로서의 
기능을 가능하게 해 준 Aggregations에 대해서 
알아보았다.   
Aggregations에는 다양한 값들을 연산하는 metrics, 범위나 종류 별로 값들을 
분리하는 bucket, 그리고 다른 aggregation의 결과를 입력으로 
받아 
새로운 연산을 수행하는 pipeline이 있었다.   

- - - 

**Reference**   

<https://esbook.kimjmin.net/08-aggregations>     

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

