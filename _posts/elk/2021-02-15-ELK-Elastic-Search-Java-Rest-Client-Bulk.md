---
layout: post
title: "[ELK] Java High Level Rest Client 사용하여 Bulk 처리하기"
subtitle: "BulkProcessor"    
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

Elasticsearch의 restHighLevelClient java api에서 [BulkProcessor](https://www.elastic.co/guide/en/elasticsearch/client/java-api/6.8/java-docs-bulk-processor.html)라는 
기능을 사용하여 request를 모아서 업데이트 하는 방법을 살펴보자.   

- - -    

## 1. BulkProcessor     

`BulkProcessor는 하나의 독립적인 프로세스를 실행시키고 request를 buffer에 
모아서 정해진 시간, 크기 등에 맞게 Elasticsearch에 데이터를 Bulk request로 
만들어서 flush 하도록 동작하고 있다.`   

<img width="914" alt="스크린샷 2023-04-29 오전 10 01 34" src="https://user-images.githubusercontent.com/26623547/235274367-e3b8872e-03be-4ed0-898b-ed40d11fe9b2.png">   
 
- - -    

## 2. BulkProcessor 구현 

BulkProcessor 구현은 아래와 같이 진행할 수 있고, 제공하는 옵션의 default 값도 확인해보자.   

- bulkActions 의 default는 1000이며, 정해진 갯수가 되면 flush를 진행한다.   

- bulkSize 의 default 5mb이며, 정해진 사이즈가 되면 flush를 진행한다.   

- flushInterval은 default로 설정되지 않으며, 정해진 주기가 되면 flush를 진행한다.   

- concurrentRequest는 default로 1로 설정되어 있으며, flush 를 비동기로 처리하는 횟수이다.  
    - 0이 의미하는 것은 모두 동기 처리방식이며, 1이 의미하는 것은 bulk request를 축적하는 동안 flush 가 실행된다.   

- backoffPolicy는 재처리 정책을 정할 수 있다.  

더 자세한 내용은 [공식 문서](https://www.elastic.co/guide/en/elasticsearch/client/java-api/6.8/java-docs-bulk-processor.html)를 
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
                    ) //retry 정책 요청 / backOffTimeSec 시간만큼 delay, maxRetry 회 재시도
                    .build();

        } catch (Exception e) {
            log.error("[{}] bulk process init failed message: {}. ", tag, e.getMessage(), e);
        }

        return processor;
    }
}
```

아래와 같이 bean으로 생성하여 사용할 수 있다.   

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


- - - 

**Reference**    

<https://www.elastic.co/guide/en/elasticsearch/client/java-api/6.8/java-docs-bulk-processor.html>   
<https://techblog.woowahan.com/2718/>   
<https://ksk-developer.tistory.com/32>    


{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

