---
layout: post
title: "[Cache] Caffeine 과 EhCache "
subtitle: "로컬 캐시(Local Cache) / Caffeine 기본 사용 방법 / Java 용 Caffeine / Scala 용 Scaffeine"       
comments: true
categories : BigData
date: 2021-05-15
background: '/img/posts/mac.png'
---


이번 글에서는 Local Cache에 주로 사용되는 Caffeine Cache와 EhCache에 대해서 살펴보자.   
Local cache란 Global cache와는 다르게 서버마다 캐시를 따로 저장한다.   
서버 내에서 작동하기 때문에 Global cache보다 속도가 빠르지만, 다른 서버의 캐시를 참조하기 어렵다.   

회사에서 지금까지 Global cache인 레디스만 사용해서 Local cache를 사용할 일이 
없다고 생각했지만, Oauth 토큰 등을 Global cache에 저장해서 사용하게 되면 
보안 문제가 생기므로 Local cache로 전환이 필요해서 알아보게 되었다.   


- - - 

# 1. Caffeine Cache   

Caffeine Cache [Github 페이지](https://github.com/ben-manes/caffeine)에서 high performance 그리고 
최적의 캐싱 라이브러리라고 소개하고 있다.    

`Caffeine은 EhCache보다 캐시의 성능이 높으며, 실제로 더 우수한 캐시 제거 전략을 
사용한다.`       

문서를 읽어보면, 캐시와 ConcurrentMap 과의 차이점을 설명하고 있는데, ConcurrentMap에 저장된 
데이터는 해당 Map이 제거될 때까지 영구적으로 보관된다고 한다.   

반면, 캐시는 evict 로직이 Auto로 동작하게끔 구성된다고 한다.   
Caffeine Cache는 eviction policy로 [Window TinyLfu](https://github.com/ben-manes/caffeine/wiki/Efficiency)라는 것을 사용한다.   
해당 알고리즘을 사용함으로써 최적의 적중률(near-optimal hit rate)을 보여준다고 한다.    

그럼 Caffeine 어떤 기능들을 제공하는지 살펴보자.   

참고로 scala 언어를 사용하는 경우는 [Scaffeine](https://github.com/blemale/scaffeine)을 사용할 수 있다.   


## 1-1) Population Strategy   

Caffeine Cache는 아래의 세가지 타입의 캐시로 제작하여 사용할 수 있다.   
더 자세한 내용은 [링크](https://github.com/ben-manes/caffeine/wiki/Population)를 참고해보자.   

#### 1-1-1) Manual   

이 전략에서는 값을 수동으로 캐시에 넣고 나중에 검색한다.   

```java
Cache<String, DataObject> cache = Caffeine.newBuilder()
  .expireAfterWrite(1, TimeUnit.MINUTES)
  .maximumSize(100)
  .build();

cache.put(key, dataObject);  // Manually using the put method   
dataObject = cache.getIfPresent(key);

assertNotNull(dataObject);
```

get 메서드를 사용하여 값을 가져올 수 있다.    
`아래는 키가 캐시에 없는 경우 대체 값을 제공하는데 사용되며 계산 후 캐시에 삽입된다.`        

```java
dataObject = cache
  .get(key, k -> DataObject.get("Data for A"));

assertNotNull(dataObject);
assertEquals("Data for A", dataObject.getData());
```

`get 메서드는 계산을 원자적으로 수행한다.`          
`즉, 여러 스레드가 동시에 값을 
요청하더라도 계산은 한 번만 수행된다. 그렇기 때문에 get을 사용하는 것이 
getIfPresent보다 선호된다.`        


아래와 같이 일부 캐시된 값을 수동으로 무효화할 수 있다.   

```java
cache.invalidate(key);
dataObject = cache.getIfPresent(key);

assertNull(dataObject);
```


#### 1-1-2) Loading (Synchronously)   

동기 방식으로 loader를 통해 캐시 생성한다.   

```java
LoadingCache<String, DataObject> cache = Caffeine.newBuilder()
  .maximumSize(100)
  .expireAfterWrite(1, TimeUnit.MINUTES)
  .build(k -> DataObject.get("Data for " + k));
```

아래와 같이 get 메서드를 사용하여 값을 검색한다.   

```java
DataObject dataObject = cache.get(key);

assertNotNull(dataObject);
assertEquals("Data for " + key, dataObject.getData());
```

getAll 메서드를 사용하여 값 세트를 얻을 수도 있다.   

```java
Map<String, DataObject> dataObjectMap 
  = cache.getAll(Arrays.asList("A", "B", "C"));

assertEquals(3, dataObjectMap.size());
```


#### 1-1-3) Asynchronous Loading   

비동기 방식으로 loader를 통해 캐시 생성하며, [CompletableFuture](https://www.baeldung.com/java-completablefuture)를 반환한다.    

```
AsyncLoadingCache<String, DataObject> cache = Caffeine.newBuilder()
  .maximumSize(100)
  .expireAfterWrite(1, TimeUnit.MINUTES)
  .buildAsync(k -> DataObject.get("Data for " + k));
```

CompletableFuture를 반환한다는 사실을 고려하여 get 및 getAll 메서드를 동일한 방식으로 
사용할 수 있다.   

```java
String key = "A";

cache.get(key).thenAccept(dataObject -> {
    assertNotNull(dataObject);
    assertEquals("Data for " + key, dataObject.getData());
});

cache.getAll(Arrays.asList("A", "B", "C"))
  .thenAccept(dataObjectMap -> assertEquals(3, dataObjectMap.size()));
```


## 1-2) Eviction   

Caffeine Cache는 아래 세가지 타입으로 캐시를 Evict하는 설정을 할 수 있다.   
더 자세한 내용은 [링크](https://github.com/ben-manes/caffeine/wiki/Eviction)를 참고해보자.   

Caffeine은 [Window TinyLfu](https://github.com/ben-manes/caffeine/wiki/Efficiency)를 사용하기 때문에 
히트율이 높고 효율적이다.      

#### 1-2-1) Size-based   

`크기 기준으로 캐시를 제거하는 방식은 개발자가 설정한 특정 값을 기준으로, 
    entries의 크기가 그 값을 넘을 때 entries의 일부분을 제거한다.`   

그렇다면, 어떤 값을 제거 할까?   

`위에서 언급했던, Window TinyLfu를 적용하여 자주 사용되어지지 않는 것을 제거한다.`       

```
Caffeine.newBuilder().maximumSize(long)    
Caffeine.newBuilder().maximumWeight(long)
```

- maximumSize : 캐시에 포함할 수 있는 최대 엔트리 수를 지정한다.   
- maximumWeight: 캐시에 포함할 수 있는 엔트리의 최대 무게를 지정한다.    

> maximumSize와 maximumWeight는 함께 지정될 수 없다.   

#### 1-2-2) Time-based    

```
Caffeine.newBuilder().expireAfterAccess(long, TimeUnit)
Caffeine.newBuilder().expireAfterWrite(long, TimeUnit)
Caffeine.newBuilder().expireAfter(Expiry)
```


- expireAfterAccess: (캐시 생성 이후) 해당 값이 `가장 최근에 대체되거나 마지막으로 읽은 후` 특정 기간이 지나면 
각 항목이 캐시에서 자동으로 제거되도록 지정한다.   

- expireAfterWrite: 캐시 생성 후 또는 `가장 최근에 바뀐 후` 특정 시간이 지나면 각 항목이 캐시에서 자동으로 제거되도록 지정한다.    

- expireAfter: 캐시가 생성되거나 마지막으로 업데이트된 후 지정된 시간 간격으로 캐시를 새로 고침한다.   

> expireAfterWrite와 expireAfterAccess가 함께 지정된 경우, expireAfterWrite가 우선순위로 적용된다.    

#### 1-2-3) Reference-based    

```
Caffeine.newBuilder().weakKeys().weakValues()
Caffeine.newBuilder() .softValues()
```

- weakKeys: 키를 weak reference로 지정한다.    
- weakValues: Value를 weak reference로 지정한다.    


## 1-3) Statistics   

캐시 엑세스 통계 정보를 제공한다.   

```java
LoadingCache<String, DataObject> cache = Caffeine.newBuilder()
  .maximumSize(100)
  .recordStats()
  .build(k -> DataObject.get("Data for " + k));
cache.get("A");
cache.get("A");

assertEquals(1, cache.stats().hitCount());
assertEquals(1, cache.stats().missCount());
```

`통계 정보를 사용하려면 Caffeine.recordStats()를 설정해주면 된다.`    


- - - 

# 2. EhCache   

EhCache는 Java 진영에서 유명한 Local Cache 라이브러리 종류 중 하나이며, 
EhCache는 Caffeine Cache 보다 더 많은 기능을 제공해 준다.   

> 서버 간 분산캐시, 동기/비동기, 디스크 저장 지원 등    

EhCache는 Heap 메모리 공간 이외에 데이터를 저장할 수 있는 Off Heap 기능을 
지원한다.   
Off Heap 기능을 사용하면 GC로 부터 자유로워 질 수 있는 장점이 있지만, 
    Off Heap에 저장되어 있는 데이터를 저장 및 불러올 때는 직렬화 비용이 
    발생하게 된다.   

<img width="820" alt="스크린샷 2022-11-03 오후 8 15 56" src="https://user-images.githubusercontent.com/26623547/199707371-b712a001-e872-42c6-a564-218b86c1595e.png">   

- - - 

**Reference**   

<https://www.baeldung.com/java-caching-caffeine>   
<https://github.com/ben-manes/caffeine/wiki/Population>   
<https://www.ehcache.org/documentation/3.4/tiering.html>   
<https://github.com/blemale/scaffeine>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
