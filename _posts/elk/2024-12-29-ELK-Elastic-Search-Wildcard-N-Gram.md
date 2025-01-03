---
layout: post
title: "[ELK] ElasticSarch에서 wildcard 쿼리 대신 n-gram으로 성능 개선하기"
subtitle: "term level query 방식인 wildcard 검색에서의 문제점"    
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
그럼 이번에는 키워드를 바꿔서 나 보기가 역겨워라는 문장에서 `기가` 라는 
단어를 기준으로 검색해보자.   

RDMBS는 정상적으로 검색하지만, Elasticsearch는 검색하지 못할 수 있다.   

`그 이유는 wildcard 쿼리가 term level query 이기 때문이며 Elasticsearch는 실제로 
저장된 document의 원문을 검사하는 것이 아니라 색인된 term(token) 중에 
쿼리에서 질의한 값을 찾기 때문이다.`   

보통 텍스트 분석을 할 때 부사와 형용사를 제외한 명사, 동명사 정도만 
색인을 하기 때문에 위와 같이 `보기가` 라는 문장은 `보기` 로 색인된다.   
따라서 우리가 찾는 '기가' 와 매칭되는 term(token)은 검색할수 없게 된다.   

참고로 한글 텍스트 분석의 경우 [nori](http://localhost:4000/elk/2021/06/18/ELK-Elastic-Search-analyze-korean.html)를 
주로 사용한다.   

> 물론 analyzer를 공백 단위로만 분리하여 색인한 경우는 검색이 된다.  

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

- - - 

## 2. wildcard, regexp 성능이슈   

`wildcard, regexp를 사용하게 되면 일치하는 구문을 모두 찾아야 하기 때문에 
엘라스틱 서치의 장점을 제대로 사용하기에 어렵다.`       

> 특히 검색 모수를 미리 필터하지 않거나, like %keyword% 와 같이 prefix 도 wildcard 
를 사용하는 경우는 대용량 데이터 검색시 더욱 성능 이슈가 발생할 가능성이 높다.   

> like keyword% 로 사용하는게 조금은 성능에 유리하다.   


- - -


## 3. N-gram 을 이용하여 검색하기  

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
          "max_gram": 9
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
    "index.max_ngram_diff": 10
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

- - - 

**Reference**   

<https://findstar.pe.kr/2018/07/14/elasticsearch-wildcard-to-ngram/>   
<https://dgahn.tistory.com/44>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

