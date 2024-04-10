---
layout: post
title: "[ELK] ElasticSearch의 Index Aliases 활용 "
subtitle: "인덱스 별명(Index Aliases)를 이용한 Log Lotation"    
comments: true
categories : ELK
date: 2021-03-25
background: '/img/posts/mac.png'
---

## 1. ElasticSearch의 인덱스 별명 활용    

엘라스틱 서치를 안정적으로 운영하기 위해 인덱스 별명(Index Aliases)에 대해 
설명하고 활용 사례를 공유한다.   
이 글은 [링크](https://ridicorp.com/story/index-aliases)를 참고하여 작성하였다.   

엘라스틱 서치는 분산형 Restful 검색 및 분석 엔진이다.    
`분산형이기 때문에 데이터 증가에 따라 유연하게 확장할 수 있고, Restful API를 
제공하기 때문에 손쉽게 색인, 검색, 분석이 가능하다.`     
오늘날 많은 기업 및 개인이 다양한 검색, 로깅, 분석 서비스에 엘라스틱 서치를 
활용하고 있다. 사용자 층이 두터운 만큼 관련 커뮤니티가 활발히 운영되고 
있고 유스케이스 또한 풍부하여 다양한 상황에서 응용 가능하다.   
이 글에서는 엘라스틱 서치를 안정적으로 운영하는데 유용한 Index Aliases(인덱스 별명)를 
소개하고 활용한 몇가지 사례를 공유한다.   

- - - 

## 2. Index Aliases     

유닉스 명령어 중에 별명을 붙여주는 alias 라는 명령어가 있다.   

```
$ alias ll='ls -al'     
$ alias vi='vim'   
$ alias grep='grep --color=auto'   
```

위의 예시 처럼 `엘라스틱 서치에도 인덱스에 별명을 붙여줄 수 있는데 
이를 인덱스 별명(Index Aliases)라고 한다.`   

아래와 같이 bank라는 인덱스에 bank-alias라는 별명을 붙여 보겠다.   
아래 명령어를 키바나에서 실행시키면 된다.   

```
POST /_aliases
{
    "actions": [
        {
            "add" : {
                "index" : "bank",
                "alias" : "bank-alias"
            }
        }
    ]
}
```

"acknowledged":true 의 메시지롤 보게되면 정상적으로 실행 되었음을 알 수 있다.   

`위 예제에서 add 대신 remove 키워드를 사용하면 bank라는 인덱스를 가진 별명 bank-alias를 지우라는 
의미가 된다.`        

별명이 잘 붙었는지 아래와 같이 확인해 볼 수 있다.   

```
GET /_cat/aliases?v
```

Output   

```
alias      index     filter routing.index routing.search
bank-alias bank      -      -             -
```

`이제 조회, 검색 등 거의 모든 기능을 실행하기 위해 bank라는 인덱스 대신 
bank-alias라는 별명으로 접근 할 수 있게 되었다.`    


색인 별명을 변경할 때에는 한 가지 주의해야 할 점이 있는데, 
   `다음과 같이 별명을 붙이고 지우는 두 가지 작업을 동시에 해야 한다는 것이다.`        

```
POST /_aliases
{
  "actions": [
    { "remove": { "index": "bank", "alias": "bank-alias" } },
    { "add": { "index": "bank-new", "alias": "bank-alias" } }
  ]
}
```

`별명을 먼저 붙이면 동일한 별명을 가진 색인이 2개가 되므로 (거의) 동일한 검색 결과가 
2건씩 나오게 된다.`   
`반대로 기존 별명을 먼저 지우면 클라이언트에서 검색 요청이 들어왔을 때 해당 별명이 없으므로 
오류가 발생한다.`    


- - - 

## 3. 인덱스 이중화   

검색 서비스 운영 중에 실수로 인덱스를 잘못 만들어 검색결과에 일부 데이터가 누락된 일이 있었다. 다행히 
미리 만들어 두었던 2차 인덱스로 교체하여 장애를 빠르게 복구할 수 있었다.    

만약 아무런 대비가 없었다면 아마도 아래와 비슷한 절차를 거쳤을 것이다.   

1. 원본 인덱스(bank)의 문제로 인한 장애를 발견한다.   
2. 새로운 인덱스(bank-new)를 만든다.   
3. 스냅샷 또는 원본 데이터 저장소로부터 데이터를 추출하여 새로 만든 인덱스(bank-new)에 색인한다.   
4. 검색 클라이언트 코드 내에 하드코딩되어 있는 인덱스명(bank)를 새로 만든 인덱스(bank-new)으로 변경하고 배포한다.   

위에는 두가지 문제점이 있다.   

`첫번째로 위 과정이 완료될 때까지 장애가 서비스에 그대로 노출된다는 점이다.`   

**색인하는 것은 검색 서비스에서 가장 많은 시간이 소요되는 부분 중 하나이다.** 이러한 
긴 시간동안 장애가 노출되는 것을 피하기 위해서는 별개의 2차 인덱스를 미리 만들어 이중화 
해두는 것이 좋다.     
1차 인덱스에 문제가 생기면 미리 만들어 두었던 2차 인덱스로 교체하면 된다.    

`두번째로 서빙하는 인덱스를 변경할 때마다 검색 클라이언트 코드도 함께 변경해야 한다는 점이다.`   

인덱스에 별명을 미리 붙여두고 검색 클라이언트 코드에는 실제 인덱스명이 아닌 별명을 사용하도록 하면 
검색 클라이언트 코드와 무관하게 서빙중인 인덱스를 교체할 수 있다. 원본 인덱스에 문제가 생기면 별명의 타겟을 
2차 인덱스로 교체하기만 하면 된다.   

- - - 

## 4. Log Rotation    

서비스를 운영하다보면 각종 로그 뿐만 아니라 수없이 쏟아져 나오는 데이터를 
수집, 가공, 분석하는 일이 반드시 필요하게 된다.    

이러한 데이터를 ELK 등을 통해 운영하던 중에 겪었던 장애 상황과 
이를 해결하기 위해 인덱스 별명을 응용하여 [Log Rotaion](https://en.wikipedia.org/wiki/Log_rotation)을 
도입한 사례를 살펴보자.   

ELK Stack을 도입하고 얼마 지나지 않아 디스크가 가득 차서 더 이상 데이터를 
저장할 수 없게 되었다. 디스크 공간을 확보하기 위해 평소처럼 오래된 데이터를 
삭제 했다.   

```
POST /bank/_delete_by_query
{
    "query": {
        "range": {
            "datetime": {"lt": "2018-08-01", "format": "yyyy-MM-dd"}
        }
    }
}
```

하지만 아무런 반응이 없었다. `원인을 찾아보니 엘라스틱 서치는 삭제시 기존 데이터를 
바로 지우는게 아니라 지웠다는 표시만 달아준다고 한다.`    
마찬가지로 갱신시에도 기존 데이터를 직접 수정하는게 아니라 기존 데이터에 지웠다는 
표시만 달아주고 새로운 데이터를 삽입한다.   
`이는 엘라스틱 서치 내부 구현 상 삽입은 쉽지만, 삭제나 갱신은 비용이 크다는 특징이 있기 때문이다.`   


```
// 이러한 흔적을 deleted_docs나 _version 정보를 통해 간접적으로 확인해 볼 수 있다.  


$ curl -X GET 'localhost:9200/log-index/_status?pretty'
{
    ...
    "docs": {
        "num_docs": 1457,
        "max_doc": 1462,
        "deleted_docs": 5
    },
    ...
}

$ curl -X GET 'localhost:9200/log-index/log-type/2?pretty'
{
    "_index" : "log-index",
    "_type" : "log-type",
    "_id" : "2",
    "_version" : 2,
    "found" : true,
    "_source": {
        "referrer": "ridibooks.com",
        "response_code": "200",
        "message": "some message",
        "datetime": "2018-08-01T10:10:10"
    }
}
```

그러면 지워진 데이터는 영원히 남아 있을까?    
그렇지 않고 `지웠다는 표시를 단 채 디스크에 남아 있다가 백그라운드로 
주기적으로 또는 특정 임계치를 넘기면 더 이상 필요 없어진 데이터들을 정리하고 
새로운 세그먼트에 병합한 후 기존 세그먼트를 삭제한다.`    
`이때 비로소 디스크에서 완전히 삭제되는데 이를 세그먼트 병합(Segment Merging)이라고 
한다.`   

세그먼트 병합은 In-Place 업데이트가 아니다. 새로운 세그먼트를 만들 공간이 
있어야 하기 때문에 디스크가 이미 꽉 찬 상태에서는 무용지물이다.   
따라서 디스크가 가득찬 상태에서는 세그먼트 병합을 기반으로 하는 삭제 방법은 
사용할 수 없다.   

세그먼트 병합은 시스템 자원을 비교적 많이 쓰는 부담스러운 작업이므로 시스템 자원이 
여유로울 때 서비스에 영향을 주지 않는 선에서 조심스럽게 진행한다. 원하는 시점에 강제로 
세그먼트 병합을 하고 싶다면 [force merge](https://www.elastic.co/guide/en/elasticsearch/reference/current/indices-forcemerge.html) API를 사용할 수도 있다.   

다른 방법으로 각 문서마다 TTL(Time To Live)을 설정해서 해당 시각이 
지나면 자동으로 삭제 되도록 할 수도 있다. 하지만 이 역시 
세그먼트 병합을 통해 삭제되기 때문에 비효율적이다. 그런 이유 때문인지 ttl 필드는 
ElasticSearch 2.0.0-beta2 버전부터 deprecated 되었다.   

`대안을 찾다가 인덱스를 삭제하면 그 즉시 디스크에서 삭제가 된다는 점을 이용했다.`   
게다가 [delete by query API](https://www.elastic.co/guide/en/elasticsearch/reference/6.8/docs-delete-by-query.html)를 사용하여 
문서를 삭제하는 방법보다 효율적이다.    
하지만 기존에는 하나의 인덱스에 모든 데이터를 저장하고 있었기 때문에 그 하나의 
인덱스를 무작정 삭제할 수는 없었다. 고민 끝에 기존 인덱스를 포기하고 새로운 
인덱스를 만들어 Log Rotation을 적용해 보기로 했다.

Log Rotation 방법은 다음과 같다. 
> 일 단위로 예를 들었지만, 운영하는 시스템 규모에 따라 시간 단위, 주 단위, 월 단위 등등 얼마든지 자유롭게 구성해도 된다.    

> 또한, 로그를 예로 들었는데 주기적으로 생성되어 관리가 필요한 데이터에 
적용할 수도 있다.   

1. 일 단위로 새로운 인덱스를 만든다. ( 인덱스명은 날짜정보를 넣으면 구분하기 쉽다. )   
2. 데이터는 오늘 생성한 인덱스에 저장한다.   
3. 가장 오래된(N일 전에 생성한) 인덱스를 삭제한다.   
4. 로그 분석시에는 최근 N일 간의 모든 인덱스에서 조회한다.   

오늘 생성한 인덱스, 최근 N일 간의 모든 인덱스 등을 쉽게 구분하기 위해 
아래와 같이 절절한 별명을 붙여준다.   

```
$ curl -X POST "localhost:9200/_aliases" -H 'Content-Type: application/json' -d'
{
  "actions": [
      {
            "add": {"index": "log-2018-08-02", "alias": "log"},
            "add": {"index": "log-2018-08-03", "alias": "log"},
            "add": {"index": "log-2018-08-04", "alias": "log"},
            "add": {"index": "log-2018-08-05", "alias": "log"},
            "add": {"index": "log-2018-08-06", "alias": "log"},
            "add": {"index": "log-2018-08-07", "alias": "log"},
            ...
            "add": {"index": "log-2018-09-01", "alias": "log"},
            "remove": {"index": "log-2018-08-01", "alias": "log"},

            "add": {"index": "log-2018-09-01", "alias": "log-today"}
      }
  ]
}'
```

이제 log라는 별명을 통해 전체 기간의 로그데이터를 단일 인덱스인 것처럼 
사용할 수 있게 되었다. 또한, log-today라는 별명을 통해서는 
오늘의 로그데이터만을 한정해서 사용할 수도 있다.   

이렇게 여러 인덱스에 하나의 동일한 별명을 붙여줄 수도 있고, 하나의 인덱스에 
여러개의 별명을 붙여줄 수도 있다. 조금만 응용하면 필요에 따라 오늘의 로그, 
    최근 일주일 간의 로그, 최근 한달 간의 로그 등등의 별명을 얼마든지 
    붙여두고 사용할 수 있다.    

- - -    

## 5. 자동화    

엘라스틱서치에는 [Curator](https://www.elastic.co/guide/en/elasticsearch/client/curator/current/about.html) 라는 자동화 도구가 있다. 
날짜 형식을 (%Y-%m-%d, N일 전)을 표현할 수 있어서 날짜 단위의 반복 작업에 유용하니 참고해보자.   

엘라스틱서치 서비스를 안정적으로 운영하기 위한 다양한 방법들이 존재한다. 대부분 
꽤나 복잡한 설정을 해야하고 추가비용도 발생한다. 이번 글에서는 
사용하기 간편하면서 추가 비용도 들지 않는 인덱스 별명을 활용한 방법에 대해 알아 봤다.   
상황에 맞게 여러 가지 방법들을 적절히 섞어서 구성하면 좀 더 안정적인 
서비스를 운영하는데 도움이 될 것이다.   


- - - 

**Reference**    

<https://ridicorp.com/story/index-aliases>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

