---
layout: post
title: "[ELK] ElasticSearch의 인덱스 템플릿(Template) 설정하기 "
subtitle: "mapping, setting 정보를 template으로 설정 후 인덱스에 적용하기"    
comments: true
categories : ELK
date: 2021-03-27
background: '/img/posts/mac.png'
---

이번 글에서는 Elasticsearch에서 인덱스 템플릿을 사용하는 이유와 
사용 방법에 대해서 자세히 다룰 예정이다.   

- - - 

## 1. Index Template   

`인덱스 템플릿은 말 그대로 인덱스 생성을 위한 템플릿을 미리 설정해 놓고 해당 템플릿을 이용해 
인덱스를 생성하는 것을 말한다.`    

`Json 형태의 document를 인덱싱할 때, 매핑 정보를 정해주지 않으면 
엘라스틱 서치가 자동으로 인덱스 매핑을 해주는데, 이를 dynamic mapping(동적 매핑)이라고 한다.`      

아래와 같이 인덱스에 매핑된 값을 확인할 수 있다.   

```
GET index-name/_mapping
```

`이러한 동적 매핑은 편리하기도 하지만, 의도하지 않는 타입이 매핑이 되거나 
숫자 타입의 경우 범위가 가장 넓은 long으로 매핑되는 등 불필요한 용량을 
차지하여 성능에 영향을 미칠 수도 있다.`      

따라서 템플릿을 설정해서 인덱스에 맵핑된 필드 타입을 최적화하여 미리 정의해주면, 
    엘라스틱 서치의 성능 튜닝에도 도움이 된다.    

또한, `템플릿을 사용하는 이유 중 하나는 여러 인덱스들을 패턴으로 매칭하여 설정한 필드 정보 및 settings 들을 
자동으로 적용해 줄 수 있다.`         
아래와 같이 일별로 생성되는 인덱스가 있다고 가정해보면, 
    템플릿을 하나 설정해 놓으면, 해당 템플릿에 설정 해놓은 필드 mappings 및 settings 정보들을 
    동일하게 적용할 수 있다.   

```
summary-20230503   
summary-20230504   
summary-20230505   
```

`위와 같이 인덱스를 생성할 때 설정해놓은 템플릿의 mapping 및 settings 정보를 
이용하여 인덱스를 생성할 수 있는 기능이 바로 template이다.`      

참고로 [dynamic template](https://www.elastic.co/guide/en/elasticsearch/reference/current/dynamic-templates.html)도 
제공하며, 해당 내용은 공식문서를 참고하자.   

이제 직접 template을 생성하여, 인덱스가 생성될 때 설정한 mapping 및 설정 
정보들이 적용 되도록 적용해보자.   

- - - 

## 2. template 생성하기   

먼저 기본적인 template 요청은 아래와 같다.   

```
// 모든 index의 템플릿을 조회      
GET _template

// 모든 인덱스 cat api를 통해 조회  
GET _cat/templates?v

// 인덱스 template을 조회   
GET _template/my-index

// 인덱스 template을 삭제     
DELETE _template/my-index
```

이제 사용할 인덱스 템플릿을 생성해보자.   

```
PUT _template/summary-template
{
    "index_patterns": ["summary*"],
    "settings": {
        "max_result_window": 50000,
        "index.mapping.total_fields.limit": 10000,
        "number_of_shards": 5
    },
    "mappings" : {
      "_doc" : {
        "properties" : {
          "id" : {
            "type" : "keyword"
          },
          "name" : {
            "type" : "text"
          },
          "quantity" : {
            "type" : "long"
          },
          "createdAt" : {
            "type": "date"
          }
        }
      }
    }
}
```

`위 템플릿에서 인덱스 패턴을 지정해 주었기 때문에, 아래와 같이 인덱스가 생성될 때 자동으로 지정한 mappings 및 settings 가 
적용된다.`      

> 물론 일별 뿐 아니라 주 단위 월 단위 모두 가능하다.   

```
summary-20230503
summary-20230504
summary-20230505
```

생성된 인덱스를 확인해보면, 우리가 템플릿으로 설정해놓은 mappgins 및 settings 정보들이 적용 된 것을 확인할 수 있다.   

```
GET summary-20230503

GET summary-20230503/_settings
GET summary-20230503/_mapping
```


- - - 

**Reference**    

<https://www.elastic.co/guide/en/elasticsearch/reference/current/index-templates.html>   
<https://www.elastic.co/guide/en/elasticsearch/reference/current/dynamic-templates.html>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

