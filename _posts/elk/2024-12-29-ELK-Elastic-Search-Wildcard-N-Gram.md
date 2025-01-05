---
layout: post
title: "[ELK] ElasticSarch에서 wildcard 쿼리 대신 n-gram으로 성능 개선하기"
subtitle: "term level query 방식인 wildcard 검색에서의 문제점 / n-gram 적용 및 search analyzer"    
comments: true
categories : ELK
date: 2024-12-29
background: '/img/posts/mac.png'
---

ElasticSearch를 이용하여 RDBMS 의 like 검색과 같은 쿼리를 대체하기 위해 
wildcard 또는 regexp 쿼리를 사용할 수 있다.   
이 경우 원하는 결과를 제대로 얻을 수 없을 뿐더러, 
    성능에 문제가 발생하기 쉽다.   

이번글에서는 성능 문제가 발생하는 이유와 이를 n-gram으로 대체하여 
검색하는 방법을 살펴보자.   

- - - 

## 1. RDMBS 와 ElasticSearch 차이   

아래 contents를 이용하여 RDBMS와 Elasticsearch 검색 차이를 확인해보자.   

```
진달래꽃 나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다 영변에 약산 진달래꽃 아름 따다 가실 길에 뿌리우리다 가시는 걸음 걸음 놓인 그 꽃을 사뿐히 즈려밟고 가시옵소서 나 보기가 역겨워 가실 때에는 죽어도 아니 눈물 흘리우리다
```

먼저 RDBMS 의 like 검색을 생각해보자. `걸음` 이라는 텍스트가 포함되어 
있는 row를 찾으려면 아래처럼 쿼리를 실행한다.   

```sql
SELECT * FROM table WHERE contents LIKE '%걸음%'   
```

Elasticsearch의 경우 wildcard 쿼리를 사용해서 아래와 같이 실행한다.   

```
GET index/_search
{
  "query": {
    "wildcard": {
      "contents": {
        "value": "*걸음*"
      }
    }
  }
}
```

결과를 확인해보면 정상적으로 검색 하는 것을 확인할 수 있다.   
그럼 이번에는 키워드를 바꿔서 '나 보기가 역겨워' 라는 문장에서 `'기가'` 라는 
단어를 기준으로 검색해보자.     

RDMBS는 정상적으로 검색하지만, Elasticsearch는 검색하지 못할 수 있다.   

`그 이유는 wildcard 쿼리가 term level query 이기 때문이며 Elasticsearch는 실제로 
저장된 document의 원문을 검사하는 것이 아니라 색인된 term(token) 중에 
쿼리에서 질의한 값을 찾기 때문이다.`   

보통 텍스트 분석을 할 때 부사와 형용사를 제외한 명사, 동명사 정도만 
색인을 하기 때문에 위와 같이 `보기가` 라는 문장은 `보기` 로 색인된다.   
따라서 우리가 찾는 '기가' 와 매칭되는 term(token)은 검색할 수 없게 된다.   

참고로 한글 텍스트 분석의 경우 [nori](http://localhost:4000/elk/2021/06/18/ELK-Elastic-Search-analyze-korean.html)를 
주로 사용한다.   

> 물론 공백 단위로만 분리하여 색인하는 analyzer를 사용하는 경우는 검색이 된다.  

```
GET index/_analyze
{
  "text": "진달래꽃 나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다 영변에 약산 진달래꽃 아름 따다 가실 길에 뿌리우리다 가시는 걸음 걸음 놓인 그 꽃을 사뿐히 즈려밟고 가시옵소서 나 보기가 역겨워 가실 때에는 죽어도 아니 눈물 흘리우리다"
  "analyzer": "my_custom_analyer"   
}
```

Output

```
{
  "tokens": [
    .......
    {
      "token": "보기",
      "start_offset": 0,
      "end_offset": 2,
      "type": "VX",
      "position": 7
    },
    .......
  ]
}
```   

또한, 위와 같이 text 타입을 사용하지 않고 keyword 타입을 사용할 경우 
analyzer를 사용하지 않기 때문에 term(token) 단위로 분리 하지 않고 색인을 한다.   
따라서 wildcard를 이용하여 정상적으로 검색을 할 수 있지만 full scan을 해야 
하기 때문에 성능 문제가 발생할 수 있다.   

- - - 

## 2. wildcard, regexp 성능이슈   

`wildcard, regexp를 사용하게 되면 일치하는 구문을 모두 찾아야 하기 때문에 
엘라스틱 서치의 장점을 제대로 사용하기에 어렵다.`       

> 특히 검색 모수를 미리 필터하지 않거나, like %keyword% 와 같이 prefix 도 wildcard 
를 사용하는 경우는 대용량 데이터 검색시 더욱 성능 이슈가 발생할 가능성이 높다.   

> like keyword% 로 사용하는게 조금은 성능에 유리하다.   


- - -


## 3. N-gram 을 이용하여 검색하기  

위에서의 성능 이슈를 해결하기 위해 [n-gram](https://esbook.kimjmin.net/06-text-analysis/6.6-token-filter/6.6.4-ngram-edge-ngram-shingle) 방식을 
이용하여 검색을 할 수 있다.     

> ngram 외에도 edge ngram, shingle 이 존재하기 때문에 비지니스 요구사항에 따라 적합한 방식을 사용하면 된다.   

N-gram 방식으로 나눠서 term(token) 단위로 색인을 하는 것이며, 엘라스틱서치 를 
예로 들면 아래와 같다.   

- 1-gram: [”엘”, “라”, “스”, “틱”, “서”, “치”]
- 2-gram: [”엘라”, “라스”, “스틱”, “틱서”, “서치”]

아래와 같이 [custom analyzer](https://wonyong-jang.github.io/elk/2021/02/10/ELK-Elastic-Analyzer.html)를 
사용하여 인덱스 생성 및 매핑 설정을 추가해보자.   

```
PUT /test-index
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "my_ngram_tokenizer": {
          "type": "ngram",
          "min_gram": 1,
          "max_gram": 10
        }
      },
      "analyzer": {
        "my_ngram_analyzer": {
          "type": "custom",
          "tokenizer": "my_ngram_tokenizer",
          "filter": ["lowercase"]
        }
      }
    },
    "index.max_ngram_diff": 9
  }
}
```

`index.max_ngram_diff 는 n-gram을 사용할 때 
min 과 max의 최대 차이 크기를 지정한다.`   

```
PUT /test-index/_mapping
{
  "properties": {
    "contents": {
      "type": "text",
      "analyzer": "my_ngram_analyzer",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    }
  }
}
```

위와 같이 mapping 정보에 생성한 analyzer를 추가해주었다.   
그 후 아래와 같이 토큰을 확인해보면 n-gram 방식으로 색인된 것을 확인할 수있다.   

```
GET test-index/_analyze
{
  "text": "진달래꽃 나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다 영변에 약산 진달래꽃 아름 따다 가실 길에 뿌리우리다 가시는 걸음 걸음 놓인 그 꽃을 사뿐히 즈려밟고 가시옵소서 나 보기가 역겨워 가실 때에는 죽어도 아니 눈물 흘리우리다",
  "analyzer": "my_ngram_analyzer"
}
```

Output

```
{
  "tokens" : [
    {
      "token" : "진",
      "start_offset" : 0,
      "end_offset" : 1,
      "type" : "word",
      "position" : 0
    },
    {
      "token" : "진달",
      "start_offset" : 0,
      "end_offset" : 2,
      "type" : "word",
      "position" : 1
    },
    {
      "token" : "진달래",
      "start_offset" : 0,
      "end_offset" : 3,
      "type" : "word",
      "position" : 2
    },
    {
      "token" : "진달래꽃",
      "start_offset" : 0,
      "end_offset" : 4,
      "type" : "word",
      "position" : 3
    },
...
```

위와 같이 적용하고 실제 검색을 하게 되었을 때, 관련 없는 document도 
같이 검색이 될 수 있다.   

아래와 같이 '진달래꽃' 이 포함된 document를 검색하는 것을 의도 했지만, 
'진' 이 포함된 document도 같이 검색이 되었다.   

```
GET test-index/_search
{
  "query": {
    "match": {
      "contents": "진달래꽃"
    }
  }
}
```

Output

```
"hits" : [
      {
        "_index" : "test-index",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 5.6357455,
        "_source" : {
          "contents" : "진달래꽃 나 보기가 역겨워 가실 때에는 말없이 고이 보내 드리우리다 "
        }
      },
      {
        "_index" : "test-index",
        "_type" : "_doc",
        "_id" : "4",
        "_score" : 1.1321255,
        "_source" : {
          "contents" : "진짜"
        }
      },
      {
        "_index" : "test-index",
        "_type" : "_doc",
        "_id" : "5",
        "_score" : 1.1321255,
        "_source" : {
          "contents" : "진실"
        }
```  

`위와 같이 검색되는 이유는 search analyzer를 따로 지정하지 않게되면 
기본적으로 등록된 analyzer 기반으로 검색이 된다.`      
`즉 우리가 등록했던 n-gram 기반 analyzer 를 이용하여 검색한다.`   

> 검색어를 token 단위로 나누어 매칭되는 document들을 찾는다.   

`여기서는 '진달래꽃' 이 포함된 document를 찾고 싶기 때문에 search analyzer를 직접 
구성해야 한다.`   

아래와 같이 기존에 작성했던 인덱스 설정에 추가하고 mapping 정보에도 추가한다.  

```
PUT /test-index
{
  "settings": {
    "analysis": {
      "tokenizer": {
        "my_ngram_tokenizer": {
          "type": "ngram",
          "min_gram": 1,
          "max_gram": 10
        }
      },
      "analyzer": {
        "my_ngram_analyzer": {
          "type": "custom",
          "tokenizer": "my_ngram_tokenizer",
          "filter": ["lowercase"]
        },
        "my_search_analyzer":{
          "type":"custom",
          "tokenizer":"standard",
          "filter": [
            "lowercase"
          ]
        }
      }
    },
    "index.max_ngram_diff": 9
  }
}
```

```
PUT /test-index/_mapping
{
  "properties": {
    "contents": {
      "type": "text",
      "analyzer": "my_ngram_analyzer",
      "search_analyzer": "my_search_analyzer",
      "fields": {
        "keyword": {
          "type": "keyword"
        }
      }
    }
  }
}
```

위와 같이 mapping 정보까지 추가한 후 검색하면 의도한 것처럼 검색어가 포함된 document를 검색한다.   

`ngram 토큰필터를 사용하면 저장되는 term의 갯수도 기하급수적으로 늘어나고 검색어를 'ho'를 
검색했을 때 house, shoes 처럼 검색 결과를 예상하기 어렵기 때문에 일반적인 텍스트 검색에는 
사용하지 않는 것이 좋다.`   

`ngram을 사용하기 적합한 사례는 카테고리 목록이나 태그 목록과 같이 전체 개수가 많지 않은 데이터 집단에 
자동완성 같은 기능을 구현하는데 적합하다.`   


- - - 

**Reference**   

<https://opster.com/guides/elasticsearch/search-apis/elasticsearch-wildcard-queries/>   
<https://findstar.pe.kr/2018/07/14/elasticsearch-wildcard-to-ngram/>   
<https://dgahn.tistory.com/44>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

