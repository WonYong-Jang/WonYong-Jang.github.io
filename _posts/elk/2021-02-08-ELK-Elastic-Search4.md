---
layout: post
title: "[ELK] Elastic Search 4"
subtitle: "Search API / Bulk API / Query DSL"    
comments: true
categories : ELK
date: 2021-02-08
background: '/img/posts/mac.png'
---

이번 글에서는 Search API 그리고 Query DSL에 대해 다뤄보자.   

## 1. 검색하기 전 샘플 데이터 셋팅   

검색을 하려면 대량의 데이터가 필요하다. ES 공식 문서에 
이를 제공해주는데, [링크](https://raw.githubusercontent.com/elastic/elasticsearch/master/docs/src/test/resources/accounts.json) 를 복사해서 
json 파일을 만들고 아래 명령어를 실행해서 bulk API를 호출해보자.   

bulk API는 [링크](https://esbook.kimjmin.net/04-data/4.3-_bulk)에서 더 자세하게 확인 할 수 있다.   

```
$ vi test.json   
$ curl -XPOST 'localhost:9200/bank/account/_bulk?pretty' -H 'Content-Type: application/json' --data-binary '@test.json'   
$ curl -XGET 'localhost:9200/_cat/indices?v'
```




- - - 

**Reference**    

<https://victorydntmd.tistory.com/313?category=742451>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

