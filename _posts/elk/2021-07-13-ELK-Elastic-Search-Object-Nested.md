---
layout: post
title: "[ELK] ElasticSearch에서 Object와 Nested"
subtitle: "Object 와 Nested 검색 차이"    
comments: true
categories : ELK
date: 2021-07-13
background: '/img/posts/mac.png'
---

## Object     

JSON 에서는 한 필드 안에 하위 필드를 넣는 objejct, 즉 객체 타입의 값을 
사용할 수 있다. 보통은 한 요소가 여러 하위 정보를 가지고 있는 경우 
object 타입 형태로 사용한다. 다음은 movie 인덱스에 하위 필드 "name", "age", 
       "side" 를 가진 object 타입 "characters" 필드의 예제이다.   

```
PUT movie/_doc/1
{
  "characters": {
    "name": "Iron Man",
    "age": 46,
    "side": "superhero"
  }
}
```

object 필드를 선언 할 때는 다음과 같이 properties 를 입력하고 그 아래에 
하위 필드 이름과 타입을 지정한다.   

```
PUT movie
{
  "mappings": {
    "properties": {
      "characters": {
        "properties": {
          "name": {
            "type": "text"
          },
          "age": {
            "type": "byte"
          },
          "side": {
            "type": "keyword"
          }
        }
      }
    }
  }
}
```

object 필드를 쿼리로 검색 하거나 집계를 할 때는 다음과 같이 마침표 . 를 
이용하여 하위 필드에 접근한다.    

```
GET movie/_search
{
  "query": {
    "match": {
      "characters.name": "Iron Man"
    }
  }
}
```

엘라스틱서치에는 따로 배열(array) 타입의 필드를 선언하지 않는다. 필드 
타입의 값만 일치하면 다음과 같이 값을 배열로도 넣을 수 있다.   

- {"title":"Romeo and Juliet"}
- {"title":["Romeo and Juliet","Hamlet"]}     

이번에는 다음과 같이 title 필드 값이 각각 있고, characters 필드에 
object 값이 2개씩 들어있는 두 개의 도큐먼트를 입력해 보자.    

```
PUT movie/_doc/2
{
  "title": "The Avengers",
  "characters": [
    {
      "name": "Iron Man",
      "side": "superhero"
    },
    {
      "name": "Loki",
      "side": "villain"
    }
  ]
}

PUT movie/_doc/3
{
  "title": "Avengers: Infinity War",
  "characters": [
    {
      "name": "Loki",
      "side": "superhero"
    },
    {
      "name": "Thanos",
      "side": "villain"
    }
  ]
}
```

두 개 도큐먼트 모두 characters 필드의 하위 필드 값으로 "name" : "Loki"가 
있다. 그리고 한 도큐먼트는 "name": "Loki"의 "side" 필드 값이 "villain"이고 
다른 도큐먼트는 "superhero"이다.   
`이제 characters 필드의 name 값은 "Loki" 이고 sied 값은 "villain"인 
도큐먼트를 검색해보자.`            

```
GET movie/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "characters.name": "Loki"
          }
        },
        {
          "match": {
            "characters.side": "villain"
          }
        }
      ]
    }
  }
}
```

Output   

```
{
  "took" : 16,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 2,
    "max_score" : 0.5753642,
    "hits" : [
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 0.5753642,
        "_source" : {
          "title" : "The Avengers",
          "characters" : [
            {
              "name" : "Iron Man",
              "side" : "superhero"
            },
            {
              "name" : "Loki",
              "side" : "villain"
            }
          ]
        }
      },
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "3",
        "_score" : 0.5753642,
        "_source" : {
          "title" : "Avengers: Infinity War",
          "characters" : [
            {
              "name" : "Loki",
              "side" : "superhero"
            },
            {
              "name" : "Thanos",
              "side" : "villain"
            }
          ]
        }
      }
    ]
  }
}
```

`검색 결과는 우리가 예상한 것과 다르다. 분명 name: Loki 이고 side: villain 값을 
포함하고 있는 도큐먼트는 _id : 2 뿐인데 _id: 3 인 도큐먼트도 
같이 검색 되었다.`         

이렇게 결과가 나오는 이유는 Elasticsearch는 위 예제에서 역 색인을 다음과 같은 
모양으로 생성하기 때문이다.    
`꼭 기억하자. 역 색인은 필드 별로 생성된다.`     

<img width="754" alt="스크린샷 2021-07-13 오후 11 13 02" src="https://user-images.githubusercontent.com/26623547/125467443-01699180-ed2a-47ee-b1bd-1a8d35525f5c.png">    

`역 색인에서는 object 필드의 하위 필드들은 모두 상위 필드의 이름과 함께 
펼쳐져서 한 필드로 저장이 된다. 그렇기 때문에 위 테이블에서 loki와 
villain은 도큐먼트 2, 3번 모두 가지고 있는 것으로 검색이 된다.`    

- - - 

## Nested   

`만약에 object 타입 필드에 있는 여러 개의 object 값들이 서로 다른 역 색인 
구조를 갖도록 하려면 nested 타입으로 지정해야 한다. nested 타입으로 
지정하려면 매핑에 다음과 같이 "type" : "nested" 를 명시해야 한다.`      
`다른 부분은 object와 동일하다.`        

```
PUT movie
{
    "mappings" : {
      "_doc" : {
        "properties" : {
          "characters" : {
            "type": "nested",
            "properties" : {
              "name" : {
                "type" : "text"
              },
              "side" : {
                "type" : "text"
              }
            }
          },
          "title" : {
            "type" : "keyword"
          }
        }
      }
    }
}
```

입력할 데이터는 위 object 예제에서 입력 한 데이터와 동일하다. 매핑을 
위와 같이 nested 형식으로 선언하고 앞에서 했던 예제와 동일하게 
2개의 도큐먼트를 다시 한번 색인해보고 아래와 같이 검색해보자.      

```
GET movie/_search
{
  "query": {
    "bool": {
      "must": [
        {
          "match": {
            "characters.name": "Loki"
          }
        },
        {
          "match": {
            "characters.side": "villain"
          }
        }
      ]
    }
  }
}
```

`검색 결과가 하나도 나타나지 않는다!`   

`nested 필드를 검색 할 때는 반드시 nested 쿼리를 써야 한다. nested 쿼리 
안에는 path 라는 옵션으로 nested로 정의된 필드를 먼저 명시하고 
그 안에 다시 쿼리를 넣어서 입력한다.`    

```
GET movie/_search
{
  "query": {
    "nested": {
      "path": "characters",
      "query": {
        "bool": {
          "must": [
            {
              "match": {
                "characters.name": "Loki"
              }
            },
            {
              "match": {
                "characters.side": "villain"
              }
            }
          ]
        }
      }
    }
  }
}
```   

Output   

```
{
  "took" : 6,
  "timed_out" : false,
  "_shards" : {
    "total" : 5,
    "successful" : 5,
    "skipped" : 0,
    "failed" : 0
  },
  "hits" : {
    "total" : 1,
    "max_score" : 1.4957386,
    "hits" : [
      {
        "_index" : "movie",
        "_type" : "_doc",
        "_id" : "2",
        "_score" : 1.4957386,
        "_source" : {
          "title" : "The Avengers",
          "characters" : [
            {
              "name" : "Iron Man",
              "side" : "superhero"
            },
            {
              "name" : "Loki",
              "side" : "villain"
            }
          ]
        }
      }
    ]
  }
}
```

`결과로 name : Loki 이고 side : villain 값을 포함하고 있는 _id : 2 도큐먼트만 
검색이 되었다.`   

nested 쿼리로 검색하면 nested 필드의 내부에 있는 값 들을 모두 별개로 
도큐먼트로 취급한다.    
앞의 예제에서 본 object 도큐먼트와 nested 도큐먼트를 그림으로 
비교해 보면 다음과 같다.     

<img width="731" alt="스크린샷 2021-07-13 오후 11 50 01" src="https://user-images.githubusercontent.com/26623547/125473946-428c3ea3-e2b8-4737-abea-bdfa26e8f125.png">   

object 필드 값들을 실제로 하나의 도큐먼트 안에 전부 포함되어 있다.    
반면에 nested 필드 값들은 내부적으로 별도의 도큐먼트로 분리되어 저장되며 
쿼리 결과에서 상위 도큐먼트와 합쳐져서 보여지게 된다.   


- - - 

**Reference**   

<https://esbook.kimjmin.net/07-settings-and-mappings/7.2-mappings/7.2.5-object-nested>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

