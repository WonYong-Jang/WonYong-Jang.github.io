---
layout: post
title: "[Java] 동시성 문제를 해결하기 위한 ConcurrentHashMap"
subtitle: "thread safety / 사용시 주의사항"
comments: true
categories : Java
date: 2020-10-18
background: '/img/posts/mac.png'
---


[이전글](https://wonyong-jang.github.io/java/2020/10/16/Java-LinkedHashMap.html)에서 설명한 Hashtable 클래스를 
살펴보면 대부분 메소드 전체에 synchronized 키워드가 존재하는 것을 볼 수 있다.     
즉 메소드 전체가 임계구역으로 설정 된다.  
그렇기 때문에 멀티 쓰레드 환경에서는 Thread safe 하다는 특징이 있지만, 위와 같이 전체가 synchronized로 
설정되어 있어서 성능 저하를 가져 올 수 있다.    

```java
public class Hashtable<K,V>
    extends Dictionary<K,V>
    implements Map<K,V>, Cloneable, java.io.Serializable {

    public synchronized int size() { }

    @SuppressWarnings("unchecked")
    public synchronized V get(Object key) { }

    public synchronized V put(K key, V value) { }
}
```

Hashtable 클래스의 단점을 보완하면서 멀티 쓰레드 환경에서 사용할 수 있도록 나온 클래스가 
바로 ConcurrentHashMap이다.   

이번 글에서는 ConcurrentHashMap과 사용시 주의사항에 대해서 살펴보자.   

- - - 

## 1. ConcurrentHashMap   

Hashtable과 다르게, 주요 메소드에 synchronized 키워드가 선언되어 있진 않다.   
key 값에 null을 허용하지 않으며, 데이터 변경 작업에만 동기화가 된다.   

더 자세한 내용은 
[공식문서](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ConcurrentHashMap.html)를 
살펴보자.   

- - -

## 2. 주의사항   

ConcurrentHashMap을 사용할 때 꼭 알고 있어야 하는 주의사항에 대해 살펴보자.   

`먼저, 결론 부터 말하면 아래 문제점들은 JDK 8에서 발생하는 문제점들이며, 
    JDK 9이상 부터는 해결되었다.`   

### 2-1) The Performance Bug   

ConcurrentHashMap에서 제공하는 메소드 중 computeIfAbsent는 2개의 연산을 thread safety 하도록 
사용한다.   

- key가 null인지 확인  
- key가 null이 아니라면, 연산을 진행하여 put한다.   

하지만, 아래 처럼 computeIfAbsent 메소드 안에 똑같은 키를 사용하여 computeIfAbsent를 호출한다면, block 된다.    
`즉, computeIfAbsent는 여러 쓰레드가 환경에서 똑같은 키를 획득하려고 할 때 block 하며, 
    이는 성능에 영향을 끼친다.`        


```java
public <K,V> V computeIfAbsent(ConcurrentMap<K,V> map, K key, Function<? super K, ? extends V> mappingFunction) {
	V value = map.get(key);
	if (value == null) {
		 value = map.computeIfAbsent(key,mappingFunction);
	}
	
	return value;

}
```


### 2-2) Endless Loop In ComputeIfAbsent   

다음으로는 `우연히 동일한 해시 코드를 가진 객체를 다른 computeIfAbsent 
내에서 computeIfAbsent를 하고 있을 때 문제가 발생한다.`      

> AaAa 와 BBBB는 똑같은 hashCode이다.   

```java
ConcurrentHashMap<String, Integer> map = new ConcurrentHashMap<>();
map.computeIfAbsent("AaAa", value -> map.computeIfAbsent("BBBB", key -> 1));
```

위 코드를 실행시켜보면, 무한 루프를 돌며, 발생하는 이유는 아래 코드를 살펴보자.   

<img width="700" alt="스크린샷 2023-01-20 오후 10 32 59" src="https://user-images.githubusercontent.com/26623547/213706860-2b880d86-bb22-4718-b11f-c7b806d3af76.png">    



- - -

**Reference**

<https://enlear.academy/some-bugs-in-concurrenthashmap-you-should-know-eacc5e3cc209>   

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

