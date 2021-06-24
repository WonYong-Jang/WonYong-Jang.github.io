---
layout: post
title: "[ELK] Elastic Search 6 애널라이저"
subtitle: "Custom Analyzer, termvectors / term, match 쿼리 애널라이저에 의한 검색 결과 비교"    
comments: true
categories : ELK
date: 2021-02-10
background: '/img/posts/mac.png'
---

엘라스틱서치는 기본적으로 텍스트 데이터를 색인하고 검색한다. `색인과 
검색을 진행하기 전에 Analyzer를 통해 문자열을 모두 토큰으로 쪼갠다.`       

Analyzer를 통해 가장 작은 단위의 의미를 가진 토큰으로 구분해서 
텍스트 의미를 이해하려 한다.    

데이터를 색인할 때와 사용자 질의어를 분석할 때는 서로 다른 종류의 Analyzer를 
사용하고 상황에 따라 토큰의 포지션 정보를 다르게 사용할 수 있다.   
예를 들어, 색인할 때는 높은 재현율(recall)을 위해 포지션 정보를 무시하고, 
    쿼리 분석 시에는 높은 정밀도(precision)을 위해 포지션 정보를 고려한 
    AND 검색을 실시한다.   

Analyzer는 연산 순서가 있는 3개의 컴포넌트인 Character Filter, Tokenizer, 
    Token Filter로 구성된다. 말그대로 Character Filter는 character 단위로 
    전처리하며, 주로 특정 문자열, 문자열 패턴을 치환, 삭제 등을 한다.    
    Token Filter는 token 단위로 후처리를 실시하며, 대소문자화 등의 다양한 처리를 한다.   
    또한, Tokenizer에서는 형태소 분석과 함께 품사 태깅을 실시한다.   

## analyze API   

`Elasticsearch 에서는 분석된 문장을 _analyze API를 이용해서 확인할 수 있다.`   
토크나이저는 tokenizer, 토큰 필터는 filter 항목의 값으로 입력하면 된다.   
토크나이저는 하나만 적용되기 때문에 바로 입력하고, 토큰 필터는 여러개를 
적용할 수 있기 때문에 [ ]안에 배열 형식으로 입력한다.     
아래 문장을 whitespace 토크나이저와 lowercase, stop, snowball 토큰 필터를 
적용하면 다음과 같은 결과를 확인 할 수 있다.   

```
GET _analyze
{
  "text": "The quick brown fox jumps over the lazy dog",
  "tokenizer": "whitespace",
  "filter": [
    "lowercase",
    "stop",
    "snowball"
  ]
}
```

토크나이저, 토큰필터를 이용해 처리된 결과들을 확인 하면 아래와 같다.   

Output   

```
{
  "tokens" : [
    {
      "token" : "quick",
      "start_offset" : 4,
      "end_offset" : 9,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "brown",
      "start_offset" : 10,
      "end_offset" : 15,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "fox",
      "start_offset" : 16,
      "end_offset" : 19,
      "type" : "word",
      "position" : 3
    },
    {
      "token" : "jump",
      "start_offset" : 20,
      "end_offset" : 25,
      "type" : "word",
      "position" : 4
    },
    {
      "token" : "over",
      "start_offset" : 26,
      "end_offset" : 30,
      "type" : "word",
      "position" : 5
    },
    {
      "token" : "lazi",
      "start_offset" : 35,
      "end_offset" : 39,
      "type" : "word",
      "position" : 7
    },
    {
      "token" : "dog",
      "start_offset" : 40,
      "end_offset" : 43,
      "type" : "word",
      "position" : 8
    }
  ]
}
```   

`여러 토큰 필터를 입력 할 때는 순서가 중요하며 만약에 stop 토큰 필터를 lowercase 
보다 먼저 놓게 되면 stop 토큰필터 처리시 대문자로 시작하는 'The'는 불용어로 간주되지 않아 
그냥 남아있게 된다. 그 후에 lowercase가 적용되어 소문자 'the'가 최종 검색 텀으로 
역 색인에 남아있게 된다.`   

`애널라이저는 _analyze API에서 analyzer 항목으로 적용해서 사용이 가능하다.
애널라이저는 캐릭터 필터, 토크나이저 그리고 토큰 필터들을 조합해서 사용자 
정의 애널라이저를 만들 수도 있고, Elasticsearch 에 사전에 정의되어 있어 
바로 사용 가능 한 애널라이저들도 있다. 앞서 실행한 whitespace 토크나이저 그리고 
lowercase, stop, snowball 토큰 필터들을 조합한 것이 snowball 애널라이저이다.`   

다음은 snowball 애널라이저를 적용한 예제이다.   

```
GET _analyze
{
  "text": "The quick brown fox jumps over the lazy dog",
  "analyzer": "snowball"
}
```

snowball 애널라이저를 사용한 결과는 앞의 whitespace 토크나이저 그리고 lowercase, 
         stop, snowball 토큰필터를 사용한 결과와 동일하게 나타난다.   

아래 인덱스 매핑(mappings)설정에 snowball 애널라이저를 적용하고 
문장을 색인해보자.    

```
PUT my_index2
{
  "mappings": {
    "_doc" : {
     "properties": {
      "message": {
        "type": "text",
        "analyzer": "snowball"
        }
      }
    }
  }
}
```   

위에서 생성한 인덱스에 값을 넣고 jumping 으로 검색을 해 보도록 하자.   

```
PUT my_index2/_doc/1
{
  "message": "The quick brown fox jumps over the lazy dog"
}
```

match 쿼리로 jump, jumping 또는 jumps 중 어떤 값으로 검색 해도 결과가 나타난다.   

```
GET my_index2/_search
{
  "query": {
    "match": {
      "message": "jumping"
    }
  }
}
```

<img width="751" alt="스크린샷 2021-06-23 오후 10 36 04" src="https://user-images.githubusercontent.com/26623547/123106476-9d47fb80-d473-11eb-87de-522b84b2bd52.png">    

- - - 

## Term 쿼리    

Elasticsearch에서 제공하는 쿼리 중에서 term 쿼리가 있다. match 쿼리와 문법은 
유사하지만 `term 쿼리는 입력한 검색어는 애널라이저를 적용하지 않고 입력된 
검색어 그대로 일치하는 텀을 찾는다.`     
`따라서 위의 예제에서 jumps, jumping으로 검색하면 결과가 나타나지 않고 jump로 검색해야 
결과가 나타난다.`   

실제로 도큐먼트의 원문은 'The quick brown fox jumps over the lazy dog' 이기 때문에 
jumps를 검색해야 할 것 같지만 snowball 애널라이저를 사용해서 색인을 
했기 때문에 jump로 해야 검색이 가능하다.   

> 텍스트 분석(Analysis) 과정은 검색에 사용되는 역 인덱스에만 관여한다. 즉, 원본 데이터는 
변하지 않으므로 쿼리 결과의 source 항목에는 항상 원본 데이터가 나온다.   

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
  "hits" : {
    "total" : 1,
    "max_score" : 0.2876821,
    "hits" : [
      {
        "_index" : "my_index2",
        "_type" : "doc",
        "_id" : "1",
        "_score" : 0.2876821,
        "_source" : {
          "message" : "The quick brown fox jumps over the lazy dog"
        }
      }
    ]
  }
}

```  

지금까지 본 것처럼 Elasticsearch는 데이터를 실제로 검색에 사용되는 
텀(Term)으로 분석 과정을 거쳐 저장하기 때문에 검색 시 
대소문자, 단수나 복수, 원형 여부와 상관 없이 검색이 가능하다. 
이러한 Elasticsearch의 특징을 풀 텍스트 검색(Full Text Search)라고 하며 
한국어로 전문 검색이라고 한다.   

- - - 

## Custom Analyzer   

analyze API로 애널라이저, 토크나이저, 토큰필터들의 테스트가 가능하지만, 
        실제로 인덱스에 저장되는 데이터의 처리에 대한 설정은 
        애널라이저만 적용할 수 있다.   
인덱스 매핑에 애널라이저를 적용 할 때 보통은 이미 정의되어 제공되는 
애널라이저 보다는 토크나이저, 토큰필터 등을 조합하여 만든 Custom Analyzer를 
주로 사용한다. 이미 정의된 애널라이저들은 매핑에 정의한 text 필드의 
analyzer 항목에 이름을 명시하기만 하면 쉽게 적용이 가능하다.   

> 매핑에 아무 설정을 하지 않는 경우 디폴트로 적용되는 애널라이저는 standard 애널라이저이다.   

사용자 정의 애널라이저는 인덱스 settings의 "index" : { "analysis" : 부분에 정의한다. 
아래 예제를 살펴보자.   

```
PUT my_index3
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "my_custom_analyzer": {
            "type": "custom",
            "tokenizer": "whitespace",
            "filter": [
              "lowercase",
              "stop",
              "snowball"
            ]
          }
        }
      }
    }
  }
}
```   

이제 생성한 인덱스에서 my custom analyzer를 아래와 같이 사용할 수 있다.   

```
GET my_index3/_analyze
{
  "analyzer": "my_custom_analyzer",
  "text": [
    "The quick brown fox jumps over the lazy dog"
  ]
}
```   

토크나이저, 토큰필터의 경우에도 옵션을 지정하는 경우에는 사용자 정의 토크나이저, 
    토큰필터로 만들어 추가해야 한다. 다음은 stop 토큰 필터에 'brown'을 
    불용어로 적용하여 생성하고 커스텀 애널라이저에서 사용하도록 설정한 예제를 
    살펴보자.   

```
PUT my_index3
{
  "settings": {
    "index": {
      "analysis": {
        "analyzer": {
          "my_custom_analyzer": {
            "type": "custom",
            "tokenizer": "whitespace",
            "filter": [
              "lowercase",
              "my_stop_filter",
              "snowball"
            ]
          }
        },
        "filter": {
          "my_stop_filter": {
            "type": "stop",
            "stopwords": [
              "brown"
            ]
          }
        }
      }
    }
  }
}
```

<img width="771" alt="스크린샷 2021-06-23 오후 11 44 00" src="https://user-images.githubusercontent.com/26623547/123117652-e81a4100-d47c-11eb-968c-24596af4c748.png">    

이제 다시 생성한 인덱스를 사용해서 텍스트를 분석해 보면 brown이 불용어 
처리가 되어 사라진 것을 확인 할 수 있다.   


- - - 

## 텀 벡터 (termvectors API)   

`색인된 도큐먼트의 역 인덱스의 내용을 확인할 때는 도큐먼트 별로 termvectors API를 
이용해서 확인이 가능하다.`       

```
// <인덱스>/<도큐먼트 타입>/<도큐먼트id>/_termvectors?fields=<필드명>   
GET my_index2/_doc/1/_termvectors?fields=message
```   


여러개의 필드를 같이 확인하고 싶을 때는 ?fields=field1, field2 처럼 
쉼표로 나열해서 볼 수 있다.   


- - - 

**Reference**    

<https://12bme.tistory.com/471>   
<https://gritmind.blog/2020/07/22/nori_deep_dive/>   
<https://esbook.kimjmin.net/06-text-analysis/6.1-indexing-data>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

