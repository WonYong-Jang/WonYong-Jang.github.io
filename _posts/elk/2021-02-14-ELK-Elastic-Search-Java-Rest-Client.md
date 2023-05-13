---
layout: post
title: "[ELK] Java High Level Rest Client "
subtitle: "Elastic Search 를 이용하여 자바에서 High Level Rest Client 사용하기"    
comments: true
categories : ELK
date: 2021-02-14
background: '/img/posts/mac.png'
---

## 1. High Level Rest Client 란?   

`Elasticsearch를 사용하는 자바 어플리케이션을 만들기 위해서는 
적절한 client api를 사용하는 방법을 찾아보게 될 것인데, 
    Transport client와 Rest client를 사용할 수 있다.`   

Transport client는 곧 삭제될 예정이기 때문에 Rest client를 사용하는 코드를 
작성하려고 한다. 

High Level Rest Client를 사용하여 여러 연산을 구현해보자.    

#### 1-1) Compatibility     

Java High Level REST Client 는 최소 자바 8을 요구한다. Client와 엘라스틱 서치 버전도 
동일하게 맞춰야 한다. 엘라스틱 서치 버전과 client 버전을 완전히 동일하게 맞출 필요는 없지만
엘라스틱 버전이 client 버전 보다 높아야 한다.

예를 들면 Client 버전이 6.0 이라면 엘라스틱 서치 버전은 6.x는 호환이 가능하다. 하지만 그렇지 
않을 경우 호환이 되지 않을 수 있다.   

```groovy
implementation group: 'org.elasticsearch.client', name: 'elasticsearch-rest-high-level-client', version: '6.8.2'   
```

#### 1-2) Initialization      

RestHighLevelClient는 내부적으로 제공된 builder를 이용한 request를 수행하기 위해 low-level client를 만든다.    
low-level client는 커넥션 풀을 유지하고 스레드들을 시작하기 때문에 high-level client를 
사용이 끝나게 되면 close를 해야 한다. 


```java
@Configuration   
public class ElasticSearchConfig {
    
    @Bean
    public RestHighLevelClient restHighLevelClient() {
        return new RestHighLevelClient(RestClient.builder(new HttpHost(host, port, protocal)));
    }
}
// host: localhost, port: 9200, protocal: http
```


- - - 


## 1. Search API   

여러가지 Search API에 대해 알아보자.   

#### Search Request   

아래는 SearchReqeust의 기본적인 형태이다.  

```java
SearchRequest searchRequest = new SearchRequest(); 
SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder(); 
searchSourceBuilder.query(QueryBuilders.matchAllQuery());  // SearchSourceBuilder에 모든 쿼리 추가 
searchRequest.source(searchSourceBuilder); 
```

#### Optional arguments   

SearchRequest에 optional arguments를 추가하여 검색의 범위를 지정할 수 있다.   

```java
SearchRequest searchRequest = new SearchRequest("animal");
// 인덱스 animal만 검색 하도록 설정   
```

```java
searchRequest.routing("routing"); // set a routing parameter   
```


#### Using the SearchSourceBuilder   

검색 동작을 제어하는 대부분의 옵션은 SearchSourceBuilder에서 설정 할 수 있다.   

```java
SearchSourceBuilder sourceBuilder = new SearchSourceBuilder(); 
sourceBuilder.query(QueryBuilders.termQuery("user", "mike")); 
// user가 mike인 쿼리 생성   
sourceBuilder.from(0);  // default 0 
sourceBuilder.size(5);  // default 10 
sourceBuilder.timeout(new TimeValue(60, TimeUnit.SECONDS)); 
```

#### Building queries   

`검색 쿼리는 QueryBuilder 객체로 만들어진다. QueryBuilder는 엘라스틱 서치의 Query DSL에서 
제공되는 검색 쿼리 타입을 모두 가지고 있다.`   

```java
QueryBuilder matchQueryBuilder = QueryBuilders.matchQuery("user", "kimchy")
                                                .fuzziness(Fuzziness.AUTO)
                                                .prefixLength(3)
                                                .maxExpansions(10);
```

- - - 

## 2. Count API    

Count Api에 대해 살펴보자.   

#### Count Request   

`CountRequest는 쿼리에 매치되는 갯수를 가져오는데 사용된다.`    
위에서 언급한 SearchSourceBuilder를 사용해서 SearchReqeust을 사용하는 방법과 
유사하게 사용할 수 있다.   

기본 형태로는 아래와 같이 사용 가능하다.   

```java
// 모든 인덱스(indices)에 대해 CountRequest를 생성한다.
CountRequest countRequest = new CountRequest();
// 대부분 search parameters는 SearchSourceBuilder를 추가한다.   
SearchSourceBuilder searchSourceBuilder = new SearchSourceBuilder();
// match_all 를 추가 
searchSourceBuilder.query(QueryBuilders.matchAllQuery());
// countRequest에 SearchSourceBuilder를 추가한다.  
countRequest.source(searchSourceBuilder);
```

#### Count Request optional arguments   

`CountReqeust는 또한, optional arguments를 아래와 같이 사용할 수 있다.`      

```java
// index를 request에 제한 할 수 있다.   
CountRequest countRequest = new CountRequest("blog") 
    .routing("routing")    // routing parameter를 설정한다.   
    .indicesOptions(IndicesOptions.lenientExpandOpen())  // IndicesOptions 설정은 사용 할 수 없는 인덱스가 확인되는 방식과 와일드 카드식이 확장되는 방식을 제어한다.   
    .preference("_local");  // 로컬 샤드를 선호하는 검색을 실행한다. 기본값은 샤드 전체에서 무작위로 하는 것.   
```


#### Using the SearchSourceBuilder in CountReqeust   

SearchSourceBuilder를 이용한 쿼리를 생성하여 CountReqeust를 실행해보자.    

```java
SearchSourceBuilder sourceBuilder = new SearchSourceBuilder(); 
sourceBuilder.query(QueryBuilders.termQuery("user", "mike"));
```

위의 예제는 QueryBuilder를 사용하여 user가 mike인 쿼리를 생성하였다.   
그후 SearchSourceBuilder는 CountReqeust에 추가되어 실행 시킬 수 있다.   

```java
CountRequest countRequest = new CountRequest();
countRequest.indices("blog", "author");  // index : blog, author 지정     
countRequest.source(sourceBuilder);
```



더 자세한 쿼리는 [Building Queries](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/master/java-rest-high-query-builders.html)를 
참조해보자.   


#### Synchronous execution   

`CountReqeust를 실행했을 때, client는 CountResponse를 반환 될 때까지 
기다리게 된다.`

```java
CountResponse countResponse = client
                .count(countRequest, RequestOptions.DEFAULT);
```

#### Asynchronous execution    

`CountReqeust는 위의 방법과는 다르게 비동기적으로 실행할 수도 있다. 아래와 같이 
요청과 리스너를 비동기 카운트 메서드에 전달하여 응답 또는 
잠재적 실패를 처리하는 방법을 지정할 수 있다.`    

```java
client.countAsync(countRequest, RequestOptions.DEFAULT, listener);
```

아래와 같이 ActionListener는 수행 후 성공적으로 완료되었다면 onResponse가 실행될 것이고, 
    실패한다면 onFailure가 실행된다.   

```java
ActionListener<CountResponse> listener =
    new ActionListener<CountResponse>() {

        @Override
        public void onResponse(CountResponse countResponse) {
            
        }

        @Override
        public void onFailure(Exception e) {
            
        }
    };
```


#### CountResponse    

`count API 호출을 실행하여 반환되는 CountResponse는 HTTP 상태 코드 또는 hits의 수(적중 수), 카운트 실행 
자체에 대한 세부 정보를 제공한다.`     

```java
long count = countResponse.getCount();  // 갯수 
RestStatus status = countResponse.status(); // HTTP Status 
Boolean terminatedEarly = countResponse.isTerminatedEarly(); // 일찍 종료되었는지 여부   
```

Response는 또한 기본 검색의 영향을 받은 총 샤드수와 성공한 샤드와 
실패한 샤드에 대한 정보도 같이 제공한다. 

실패한 샤드는 아래와 같이 반복문을 통해 처리 할 수도 있다.   

```java
int totalShards = countResponse.getTotalShards();
int skippedShards = countResponse.getSkippedShards();
int successfulShards = countResponse.getSuccessfulShards();
int failedShards = countResponse.getFailedShards();
for (ShardSearchFailure failure : countResponse.getShardFailures()) {
    // failures should be handled here
}
```






- - - 

**Reference**    

<https://www.elastic.co/guide/en/elasticsearch/client/java-rest/master/java-rest-high-search.html>   
<https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.8/java-rest-overview.html>   
<https://velog.io/@jakeseo_me/%EB%B2%88%EC%97%AD-%EC%97%98%EB%9D%BC%EC%8A%A4%ED%8B%B1%EC%84%9C%EC%B9%98%EC%99%80-%ED%82%A4%EB%B0%94%EB%82%98-%EC%8B%A4%EC%9A%A9%EC%A0%81%EC%9D%B8-%EC%86%8C%EA%B0%9C%EC%84%9C>   
<https://medium.com/@sourav.pati09/how-to-use-java-high-level-rest-client-with-spring-boot-to-talk-to-aws-elasticsearch-2b6106f2e2c>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

