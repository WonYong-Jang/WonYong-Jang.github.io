---
layout: post
title: "[ELK] ElasticSearch에서 cardinality 사용시 주의사항과 해결방안"
subtitle: "cardinality는 정확한 distinct 값을 계산하지 못한다 / scripted metric"    
comments: true
categories : ELK
date: 2025-01-22
background: '/img/posts/mac.png'
---

업무에서 엘라스틱 서치를 이용하여 집계를 해야 했고, 
    고유 갯수를 구하는 과정에서 cardinality를 사용했다.   
하지만, 일부 갯수가 일치하지 않는 문제가 발생하였고 cardinality를 사용할 수 없다는 
결론을 내렸다.   

이번 글에서는 cardinality를 사용할 때 주의사항과 그에 따른 해결방안들에 대해서 살펴보자.   

- - - 

## 1. cardinality   

업무에서 요구사항은 각 scenario 별로 group by를 한 후  
나온 prioduct id 값들을 중복 제거한(distinct) 하여 각각 
고유 갯수를 구하는 것이였다.   

sql 쿼리를 예로 들면 아래와 같다.  

```
select scenario, count(distinct product_id)
from table
group by scenario
```

`ES 에서는 Cardinality Aggregation을 제공하는데 문서를 정확하게 확인하지 않고 
사용하면 문제가 생길 수 있다.`    

`공식문서의 내용에 따르면 HashSet을 활용해 정확한 개수를 계산하는 것은 클러스터의 자원을 
너무 많이 소요하기 때문에 cardinality aggregation은 HyperLogLog++ 라고 하는 확률적 자료구조 기반 알고리즘을 
통해 대략적인 값을 반환한다는 것이다.`      

아래와 같이 쿼리를 작성하여 확인해보면, 일부 결과값이 다른 것을 확인할 수 있다.  

```
GET index/_search
{
    "aggregations": {
        "scenario_count": {
            "terms": {
                "field": "scenario"
            },
            "aggregations": {
                "unique_product_count": {
                    "cardinality": {
                        "field": "product_id",
                        "precision_threshold": 40000  // 해당 필드도 추가해봤지만 동일하게 정확한 결과값을 얻지 못했다.   
                    }
                }
            }
        }
    },
    "size": 0,
    "track_total_hits": true   
}
```

> 참고로 elasticsearch 7 부터 결과 개수가 10,000개 이상일 때 정확한 개수를 얻기 위해서는 track_total_hits 를 true로 
설정해야 한다.   

위에서 precision threshold 파라미터는 정확도 수치이며, 값이 크면 정확도가 올라가는 대신 시스템 리소스를 
많이 소모하고, 값이 작으면 정확도가 떨어지는 대신 시스템 리소스를 덜 소모한다고 한다.  
하지만 해당 파라미터를 최대로 지정하여도 동일하게 불일치하여 이슈가 발생하였다.  

> 기본값은 3000이며 0 ~ 40000 까지 조정이 가능하다.    

사용 목적에 따라 다르겠지만 현재 업무에서는 정확한 값을 반환해야 하기 때문에
cardinality는 사용할 수 없다는 판단을 하였다.


- - - 

## 2. Scripted Metric   

script를 활용해서 HashSet으로 distinct value count를 구하는 방법으로 위 문제를 해결할 수 있다.  

또한, 내장된 default 언어인 painless 혹은 java 로 직접 스크립트를 작성하여 적용할 수 있다.  

`하지만, Scripted metric은 매우 유연하지만 스크립트 실행으로 인해 성능에 영향을 줄 수 있기 때문에 
대규모 데이터셋에서는 스크립트의 최적화가 중요하다.`   


```
GET index/_search
{
    "aggregations": {
        "scenario_count": {
            "terms": {
                "field": "scenario"
            },
            "aggregations": {
                "unique_product_count": {
                    "scripted_metric": {
                        "init_script": "state.products = new HashSet();",
                        "map_script": "state.products.add(doc.product_id.value);",
                        "combine_script": "return state.products.size();",
                        "reduce_script": "int total = 0; for(a in states) { total += a; } return total";
                    }
                }
            }
        }
    }
}
```

`init_script 부분에 사용이 필요한 HashSet을 선언했고, map_script 부분에 중복제거가 필요한 필드를 넣어 주었다.`   

`각 shard 에서 combine_script 까지 실행된 후에 reduce_script 에서 합치는데, 이 때 states 밑에 저장된 각각의 hashSet의 
 size를 반복문을 통해 가져오면서 total 변수에 더한다.`   
hashSet에서 이미 중복이 제거된 상태로 담겨 있기 때문에 각 shard 에서 만들어진 hashSet의 크기만 더해주면 전체 수를 알 수 있다.  

주의할 점은 `검색한 인덱스 별 중복 제거의 합의 결과를 원하는지 
아니면 검색한 모든 인덱스에서의 중복 제거가 필요한지에 따라 방식이 달라진다.`     

`states는 현재 인덱스 별 중복 제거된 HashSet의 집합이라고 볼 수 있다.`   

- 예를 들어 a, b, c 라는 인덱스가 있고, 포함된 문서에 product id라는 필드가 있을 때 
위의 쿼리문은 a에서 중복 제거한 product id의 count + b 에서 중복 제거한 product id의 count + 
c 에서 중복 제거한 product id의 count 가 된다.    
- 만약 인덱스가 일자별로 구성되어 있고 일자별로 독립적으로 보고 중복 제거한 카운트를 더하는 형식이라면 
위 코드를 사용해야 한다.   
- 만약 a, b, c 전체에서 중복 제거한 카운트를 원할 경우는 아래와 같이 추가로 로직이 필요하다.   

`아래와 같이 reduce script 부분에 새로운 HashSet을 추가하여 
모든 인덱스에서의 값들을 최종적으로 중복제거를 해주면 된다.`   

```
"aggs": {
  "distinct_count": {
    "scripted_metric": {
      "init_script": "state.docs=new HashSet()",
      "map_script": """
        state.docs.add(doc['field'].value)
      """,
      "combine_script": "return state.docs;",
      "reduce_script": """
        def all_docs = new HashSet();
        for (s in states) {
          all_docs.addAll(s);
        }
        return all_docs;
      """
    }
  }
}
```




- - - 

**Reference**   

<https://d2.naver.com/helloworld/711301>   
<https://velog.io/@jkh9615/cardinality%EC%9D%98-%EC%9C%84%ED%97%98%EC%84%B1distinct-sciript>   
<https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations-metrics-cardinality-aggregation.html#_counts_are_approximate>  

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

