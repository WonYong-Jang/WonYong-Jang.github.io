---
layout: post
title: "[ELK] 엘라스틱 서치 인덱스 10,000개 이상 검색하기"
subtitle: "max result window, search after, scroll api, composite aggregation"    
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

만약 1000페이지를 가져오는 경우라면(size = 10), 정렬된 문서에서 
10,001에서 10,010번째까지의 문서를 리턴해야 한다.   
이 경우에는 각 노드에서 scoring한 문서 중 10,010개의 문서를 request node에 반환해야 한다.   
coordinating node에서는 총 50,050개의 문서를 정렬하여 10개는 리턴하고, 
             나머지 50,040개의 문서는 버리게 된다.   

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
하지만 근본적으로 10000을 넘게 조회하게되면 많은 리소스 사용으로 
성능문제를 야기할 수 있기 때문에 함부로 설정값을 바꿀것이아니라 
검색을 10000개가 한번에 되지 않도록 검색 조건을 잘 분할해서 
지정해야 한다.   

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
        "max_result_window": "50000",
        "index.mapping.total_fields.limit": 50000,
        "number_of_shards": "5"
    }
}
```

- - - 

## 2. Scroll api 사용 

기존에는 10,000개 이상의 document들에 대해 페이징을 적용할 때 scroll api를 
사용하는 것이 권장되었지만 7 버전이 되면서 상황이 바뀌었다.   

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

ES Search에서 정렬을 하고 조회를 하게 되면, hit 값에 sortValues를 반환하게 
되는데, 이 값을 이용하여 가장 마지막으로 조회한 문서의 다음 값을 다시 
찾게 된다.   

이 때 중요한 점은, PIT(Point In Time) 값을 함께 설정해주어 동일한 시점에 
검색을 한 것과 같은 효과를 내주어야 한다는 것이다.   

> 주의: collapse나 aggregation은 search after를 지원하지 않는다.  


```
GET your_index/_search
{
    "query": {
        "match_all": {}
    },
    "sort": [
        {
            "account_number": {
                "order": "asc"
            }
        }

    ]
}
```


- - - 

**Reference**   

<https://heesutory.tistory.com/29>   
<https://jaimemin.tistory.com/1543>   
<https://wedul.site/518>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

