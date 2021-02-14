---
layout: post
title: "[ELK] Java High Level Rest Client "
subtitle: "Elastic Search 를 이용하여 자바에서 High Level Rest Client 사용하기"    
comments: true
categories : ELK
date: 2021-02-14
background: '/img/posts/mac.png'
---

## High Level Rest Client 란?   

`Elasticsearch를 사용하는 자바 어플리케이션을 만들기 위해서는 
적절한 client api를 사용하는 방법을 찾아보게 될 것인데, 
    Transport client와 Rest client를 사용할 수 있다.`   

Transport client는 곧 삭제될 예정이기 때문에 Rest client를 사용하는 코드를 
작성하려고 한다. 

이 중에서 High Level Rest Client를 사용할 예정이다. 

- - - 

### Compatibility 

Java High Level REST Client 는 최소 자바 8을 요구한다. Client와 엘라스틱 서치 버전도 
동일하게 맞춰야 한다. 엘라스틱 서치 버전과 client 버전을 완전히 동일하게 맞출 필요는 없지만
엘라스틱 버전이 client 버전 보다 높아야 한다.

예를 들면 Client 버전이 6.0 이라면 엘라스틱 서치 버전은 6.x는 호환이 가능하다. 하지만 그렇지 
않을 경우 호환이 되지 않을 수 있다. 

### Initialization   

RestHighLevelClient는 내부적으로 제공된 builder를 이용한 request를 수행하기 위해 low-level client를 만든다.    
low-level client는 커넥션 풀을 유지하고 스레드들을 시작하기 때문에 high-level client를 
사용이 끝나게 되면 close를 해야 한다. 


```java
RestHighLevelClient client = new RestHighLevelClient(
        RestClient.builder(
                new HttpHost("localhost", 9200, "http"),
                new HttpHost("localhost", 9201, "http")));
```

```java
client.close();   
```

- - - 


### Search API   

여러가지 Search API에 대해 알아보자.   

##### Search Request   

아래는 SearchReqeust의 기본적인 형태이다.  

```java
SearchRequest searchRequest = new SearchRequest(); 
SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder(); 
searchSourceBuilder.query(QueryBuilders.matchAllQuery());  // SearchSourceBuilder에 모든 쿼리 추가 
searchRequest.source(searchSourceBuilder); 
```

##### Optional arguments   

SearchRequest에 optional arguments를 추가하여 검색의 범위를 지정할 수 있다.   

```java
SearchRequest searchRequest = new SearchRequest("animal");
// 인덱스 animal만 검색 하도록 설정   
```

```java
searchRequest.routing("routing"); // set a routing parameter   
```


##### Using the SearchSourceBuilder   

검색 동작을 제어하는 대부분의 옵션은 SearchSourceBuilder에서 설정 할 수 있다.   

```java
SearchSourceBuilder sourceBuilder = new SearchSourceBuilder(); 
sourceBuilder.query(QueryBuilders.termQuery("user", "mike")); 
// user가 mike인 쿼리 생성   
sourceBuilder.from(0);  // default 0 
sourceBuilder.size(5);  // default 10 
sourceBuilder.timeout(new TimeValue(60, TimeUnit.SECONDS)); 
```

##### Building queries   

`검색 쿼리는 QueryBuilder 객체로 만들어진다. QueryBuilder는 엘라스틱 서치의 Query DSL에서 
제공되는 검색 쿼리 타입을 모두 가지고 있다.`   

```java
QueryBuilder matchQueryBuilder = QueryBuilders.matchQuery("user", "kimchy")
                                                .fuzziness(Fuzziness.AUTO)
                                                .prefixLength(3)
                                                .maxExpansions(10);
```


- - - 

**Reference**    

<https://www.elastic.co/guide/en/elasticsearch/client/java-rest/master/java-rest-high-search.html>   
<https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.8/java-rest-overview.html>   
<https://velog.io/@jakeseo_me/%EB%B2%88%EC%97%AD-%EC%97%98%EB%9D%BC%EC%8A%A4%ED%8B%B1%EC%84%9C%EC%B9%98%EC%99%80-%ED%82%A4%EB%B0%94%EB%82%98-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EC%86%8C%EA%B0%9C%EC%84%9C>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

