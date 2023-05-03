---
layout: post
title: "[ELK] Java High Level Rest Client 사용하여 Bulk 처리하기"
subtitle: "BulkProcessor, BulkRequest / Bulk error handling 주의사항"    
comments: true
categories : ELK
date: 2021-02-15
background: '/img/posts/mac.png'
---

Elasticsearch를 이용하여 건바이건으로 indexing을 진행할 때, 
    데이터가 많을 수록 Disk I/O 증가와 CPU가 증가할 수 있으며, 
    write thread pool을 모두 점유하고 queue까지 가득차게 되면 
    일부 이벤트가 업데이트 되지 못하고 rejected 되는 경우가 
    발생할 수도 있다.   

DB 사용시에도 insert 성능을 높이기 위해서 작은 여러 연산을 
큰 하나의 연산으로 만들어서 사용한다.   
`Elasticsearch 또한 같은 개념을 가지고 있으며, 단건 request 수행 보다 
bulk request의 효능이 큰 것은 여러 벤치마킹을 통해서도 입증이 되었다.`      

Elasticsearch의 restHighLevelClient java api에서 [BulkProcessor](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.8/java-rest-high-document-bulk.html)라는 
기능을 사용하여 request를 모아서 업데이트 하는 방법을 살펴보자.   

- - -    

## 1. BulkProcessor     

`BulkProcessor는 하나의 독립적인 프로세스를 실행시키고 request를 buffer에 
모아서 정해진 시간, 크기 등에 맞게 Elasticsearch에 데이터를 Bulk request로 
만들어서 flush 하도록 동작하고 있다.`   

<img width="914" alt="스크린샷 2023-04-29 오전 10 01 34" src="https://user-images.githubusercontent.com/26623547/235274367-e3b8872e-03be-4ed0-898b-ed40d11fe9b2.png">   
 
- - -    

## 2. BulkProcessor 구현 

BulkProcessor 구현은 아래와 같이 진행할 수 있고, 제공하는 여러 옵션에 대해서 같이 살펴보자.   

- bulkActions 의 default는 1000이며, 정해진 갯수가 되면 flush를 진행한다.   
    - -1 은 disable 시킨다.   

- bulkSize 의 default 5mb이며, 정해진 사이즈가 되면 flush를 진행한다.   
    - -1 은 disable 시킨다.   

- flushInterval은 default로 설정되지 않으며, 정해진 주기가 되면 flush를 진행한다.   

- concurrentRequest는 default로 1로 설정되어 있으며, flush 를 비동기로 처리하는 횟수이다.  
    - 0이 의미하는 것은 모두 동기 처리방식이며, 1이 의미하는 것은 bulk request를 축적하는 동안 flush 가 실행되는 것을 허용한다.    

- backoffPolicy는 재처리 정책을 정할 수 있다.  

더 자세한 내용은 [공식 문서](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/6.8/java-rest-high-document-bulk.html)를 
살펴보자.   

```java
@Slf4j
public class ESBulkProcessorUtils {

    public static BulkProcessor buildBulkProcessor(
            RestHighLevelClient client,
            int bulkActions,
            long intervalTimeSec,
            long backOffTimeSec,
            int maxRetry,
            String tag
    ) {

        BulkProcessor.Listener listener = new BulkProcessor.Listener() {
            @Override
            public void beforeBulk(long executionId, BulkRequest request) {
                request.requests().forEach(r -> log.info("[{}] bulk before process id: {}", tag, r.id()));
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request, BulkResponse response) {
                Arrays.stream(response.getItems())
                        .forEach(c -> log.info("[{}] bulk after process id: {}, message: {}", tag, c.getId(), c.getFailureMessage()));
            }

            @Override
            public void afterBulk(long executionId, BulkRequest request, Throwable failure) {
                log.error("[{}] bulk process failed message: {} ", tag, failure.getStackTrace());
            }
        };

        BulkProcessor processor = null;

        try {
            processor = BulkProcessor.builder(
                    (request, bulkListener) -> {
                        client.bulkAsync(request, RequestOptions.DEFAULT, bulkListener);
                    },
                    listener)
                    .setBulkActions(bulkActions) // 설정한 갯수가 되면 flush
                    .setFlushInterval(TimeValue.timeValueSeconds(intervalTimeSec)) // 설정한 시간이 되면 flush
                    // .setBulkSize(new ByteSizeValue(7L, ByteSizeUnit.MB))//용량이 7메가가 되면 플러쉬
                    // .setConcurrentRequests(1) // default 1 
                    .setBackoffPolicy(
                            BackoffPolicy.constantBackoff(TimeValue.timeValueSeconds(backOffTimeSec), maxRetry)
                    ) //retry 정책 요청 / 재처리 사이에 backOffTimeSec 시간만큼 delay, maxRetry 회 재시도    
                    .build();

        } catch (Exception e) {
            log.error("[{}] bulk process init failed message: {}. ", tag, e.getMessage(), e);
        }

        return processor;
    }
}
```

`위에서 beforeBulk는 bulk 실행 전에 수행되며, request.numberOfActions() 으로 
이벤트 갯수를 확인할 수 있다.`    

`첫번째 오버라이드된 afterBulk는 response.hasFailures()로 실패한 요청을 
확인할 수 있다.`   

`두번째 오버라이드된 afterBulk는 요청이 실패했을 때, Throwable 과 함께 통해 호출된다.`    

아래와 같이 Spring bean으로 생성하여 사용할 수 있다.   

```java
@Configuration   
public class ElasticSearchConfig {
    
    public final static int BULK_ACTION_SIZE = 1000;
    public final static int FLUSH_INTERVAL_TIME = 3;
    public final static int RETRY_DELAY_TIME = 3;
    public final static int MAX_RETRY_COUNT = 3;

    @Bean
    public RestHighLevelClient restHighLevelClient() {
        return new RestHighLevelClient(RestClient.builder(new HttpHost(host, port, protocal)));
    }

    @Bean
    public BulkProcessor esBulkProcessor() {
        ESBulkProcessorUtils.buildBulkProcessor(
                restHighLevelClient,
                BULK_ACTION_SIZE,
                FLUSH_INTERVAL_TIME,
                RETRY_DELAY_TIME,
                MAX_RETRY_COUNT,
                "bulkProcessorTag"
                )
    }
}
```   

마지막으로 bulkProcessor를 통해 요청들을 아래와 같이 추가해주면 된다.   

```java
ObjectMapper mapper = new ObjectMapper();
String json = mapper.writeValueAsString(dto);

processor.add(
        new IndexRequest("summary")
                .id("1")
                .type("_doc")
                .source(json, XContentType.JSON)
);

processor.add(
        new IndexRequest("summary")
                .id("2")
                .type("_doc")
                .source(json, XContentType.JSON)
);

processor.add(
        new DeleteRequest("summary")
                .id("1")
                .type("doc")
);
```     

- - - 

## 3. BulkProcessor 종료   

BulkProcessor는 아래와 같이 종료할 수 있다.   

```java
bulkProcessor.awaitClose(10, TimeUnit.MINUTES);

// 두가지 방법으로 종료가 가능하다.   

bulkProcessor.close();
```

`두 메서드 모두 종료 전 남아 있는 요청들을 flush 하며, 추가로 들어오는 요청을 금지 시킨다.`         

`만약 concurrent request가 활성화 되어 있다면, awaitClose 메서드는 
지정된 시간만큼 요청이 완료 될 때까지 기다리며, 완료 후 true를 리턴한다.`   
`모든 bulk 요청이 완료되기전 지정된 시간이 경과하게 되면, false로 리턴한다.`   
`반면, close() 메서드로 종료시킨다면, 남아 있는 bulk 요청이 
완료되기 까지 기다리지 않고, 즉시 
종료 시킨다.`    

- - - 

## 4. Bulk error handling 주의사항   

Elasticsearch에서 단건으로 요청하는 것이 아닌, bulk로 요청하는 경우 
error handling에서 주의사항을 살펴보자.   
요청 중에 실패건이 존재했을 때

```java
try {
    client.bulk(request, RequestOptions.DEFAULT);
} catch (IOException e) {
    log.error("Bulk request fail");
}
```


- - - 

**Reference**    

<https://www.elastic.co/guide/en/elasticsearch/client/java-rest/current/java-rest-high-document-bulk.html>   
<https://www.elastic.co/guide/en/elasticsearch/client/java-api/6.8/java-docs-bulk-processor.html>   
<https://techblog.woowahan.com/2718/>   
<https://ksk-developer.tistory.com/32>    
<https://stackoverflow.com/questions/48588439/scala-elasticsearch-the-new-resthighlevelclient-and-bulkprocessor>    
<https://pro-programmer.tistory.com/entry/ElasticSearch-Bulk-Request%EC%97%90%EC%84%9C%EC%9D%98-Error-Handling>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

