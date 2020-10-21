---
layout: post
title: "[Java] 순서를 유지하는 LinkedHashMap "
subtitle: "HashMap, Hashtable, LinkedHashMap, TreeMap 비교"
comments: true
categories : Java
date: 2020-10-16
background: '/img/posts/mac.png'
---

## LinkedHashMap   

LinkedHashMap은 기본적으로 HashMap을 상속받아 만들어져 있기 때문에 HashMap의 기능을 그대로 사용가능하다.
`LinkedHashMap의 가장 큰 특징은 
자료가 입력된 순서를 기억한다는 것이다.(자바 1.4버전 부터 제공)`        
HashMap의 경우 put을 통해 데이터나 객체를 넣을 때 key의 순서가 지켜지지 않는다는 
것이다. 개발을 할때 코드상으로 순차적으로 key/value를 넣어도, 실제 
HashMap에서는 해당 순서가 지켜지지 않는다.   

`LinkedHashMap은 보통 다른 설정이 없다면 기본 설정으로 Map에 삽입되는 Key값의 순서를 기반으로 정렬된다.`    
하지만 기존에 같은 키값이 LinkedHashMap에 있을 수 있기 때문에 HashMap과 동일하게 put() 직전에 contain()을 호출한다. 
만약 내부에 같은 key가 존재한다면 LinkedHashMap에 새로 들어가는게 아니라 기존에 있던 key에 value 값이 업데이트 된다.   

`LinkedHashMap은 페이지 교체 알고리즘 중 하나인 LRU(Least Recently Used) 캐시를 구현하기에 적합하다. LinkedHashMap의 생성자 중 
하나인 다음 생성자를 사용하면 위에 언급한 key값의 초기 순서 기반 정렬이 아니라 이미 같은 
key값이 있더라도 key:value 쌍은 LinkedHashMap 후미에 들어오게 된다. 또한 get(), getOrDefault() 같은 key를 기반으로 
value값을 꺼내는 메서드를 사용해도 사용된 key값은 LinkedHashMap의 후미로 들어온다.`   

- - - 

### LinkedHashMap 특징 

- LinkedHashMap은 HashMap의 장점을 그대로 가지고 있기 때문에 get,put,remove,containsKey 메소드를 호출할 때 O(1)의 
시간 복잡도를 갖는다.   

- 모든 Map의 동작들을 제공하며 null 역시 허용한다.  

- double-linked List로 모든 Entry를 유지한다.   

- LinkedHashMap 역시 HashMap과 마찬가지로 동기화 처리가 되어있지 않기 때문에 multi-thread환경에서 사용은 적절하지 않다.

    >  만약 사용해야 하는 경우 접근하는 thread들이 외부에서 동기화처리되거나 아래와 같이 동기화된 LinkedHashMap을 얻어 올수 있다.

```java
Map m = Collections.synchronizedMap(new `LinkedHashMap`(...));
```
- - -

### LinkedHashMap 의 removeEldestEntry()

Eldest는 가장 나이가 많은 이라는 의미가 있는데 말 그대로 LinkedHashMap에서 가장 오래된 entry값을 삭제해 준다.   
`아래는 MAX를 상수로 두고, LinkedHashMap의 사이즈가 MAX보다 크면 오래된 데이터를 
자동으로 삭제하는 예제이다.`   



```java 

final int MAX = 10;

Map<Integer, Integer> map = new LinkedHashMap<Integer, Integer>() {
    @Override
    protected boolean removeEldestEntry(Map.Entry eldest) {
        return size() > MAX;
    }
};

```

- - -

### 실습 

출처는 [링크](https://sup2is.github.io/2019/10/31/linked-hash-map.html) 의 예제이며, LinkedHashMap의 기본생성자, capacity와 load factor, 
accessOrder 파라미터를 받는 생성자를 비교해보고 accessOrder 속성을 사용해서 LRU를 구성해 보자. 

#### 예제 1   

```java 
public class MyLinkedHashMap {

	public static void main(String[] args) throws InterruptedException {

		LinkedHashMap<String, String> lhm = new LinkedHashMap<>();

		for (int i = 0; i < 10; i++) {
			lhm.put("foo" + i, "bar" + i);
		}

		lhm.put("foo5", "re-insert bar5");
		lhm.put("foo11", "bar11");

		for (Entry<String, String> string : lhm.entrySet()) {
			System.out.println(string);
		}

	}
}
```
다음과 같이 foo를 key값으로 둔 10개가량의 String 인스턴스를 LinkedHashMap에 넣어주고 
이후에 기존 foo5라는 key에 새로운 값을 넣어주는 예제이다.   

- console   

```
foo0=bar0
foo1=bar1
foo2=bar2
foo3=bar3
foo4=bar4
foo5=re-insert bar5
foo6=bar6
foo7=bar7
foo8=bar8
foo9=bar9
foo11=bar11
```
예상했던것과 마찬가지로 foo5라는 key값의 위치는 변경되지 않고 value값만 update된 걸 확인할 수 있다.   

#### 예제 2

다음으로 capacity와 load factor, accessOrder를 받는 생성자를 이용해서 위 예제와 조금 다른 동작을 하도록 
구성해봤다.   

```java
public class MyLinkedHashMap2 {

	public static void main(String[] args) throws InterruptedException {

		LinkedHashMap<String, String> lhm = new LinkedHashMap<>(1000, 0.75f, true);

		for (int i = 0; i < 10; i++) {
			lhm.put("foo" + i, "bar" + i);
		}

		lhm.put("foo5", "re-insert bar5");
		lhm.put("foo11", "bar11");
		lhm.get("foo3");
		
		for (Entry<String, String> string : lhm.entrySet()) {
			System.out.println(string);
		}
	}
}
```
`첫번째 예제와 다른점이 있다면 LinkedHashMap을 생성할 때 order 속성을 true로 주었다.`   

- console

```
foo0=bar0
foo1=bar1
foo2=bar2
foo4=bar4
foo6=bar6
foo7=bar7
foo8=bar8
foo9=bar9
foo5=re-insert bar5
foo11=bar11
foo3=bar3
```

`보이는 것처럼 put() 또는 get()을 호출한 key값인 foo5, foo11, foo3 key들이 
LinkedHashMap의 후미로 들어온 것을 확인 할수 있다.`   

#### 예제 3

마지막으로 removeEldestEntry를 사용해서 고정 사이즈가 10인 LRU 캐시의 흉내를 한번 내보도록 하겠다.   

```java
public class MyLinkedHashMap3 {

	public static void main(String[] args) throws InterruptedException {

		LinkedHashMap<String, String> lhm = new LinkedHashMap<String, String>(1000,0.75f,true) {
			
			private final int MAX = 10;
			
			protected boolean removeEldestEntry(java.util.Map.Entry<String,String> eldest) {
				return size() >= MAX;
			};
			
		};
		
		for (int i = 0; i < 10; i++) {
			lhm.put("foo" + i, "bar" + i);
		}

		lhm.put("foo5", "re-insert bar5");
		lhm.put("foo4", "re-insert bar4");
		lhm.put("foo12", "bar12");
		lhm.put("foo13", "bar13");
		lhm.put("foo14", "bar14");
		lhm.put("foo15", "bar15");
		lhm.put("foo5", "re-insert bar5");

		for (Entry<String, String> string : lhm.entrySet()) {
			System.out.println(string);
		}
		
	}	
}
```
`2번 예제에서 removeEldestEntry()을 지정하고 MAX값을 10으로 지정했을 때 나오는 결과값이다.`   

- console

```
foo7=bar7
foo8=bar8
foo9=bar9
foo4=re-insert bar4
foo12=bar12
foo13=bar13
foo14=bar14
foo15=bar15
foo5=re-insert bar5
```

- - -

<br>

### HashMap, LinkedHashMap, HashTable, TreeMap 정리 및 비교 
 

##### HashMap

- 입력 순서 보장하지 않음 
- 검색기능 O(1) 시간복잡도, 동기화(Synchronized) 지원하지 않음 
- null Key 허용 

##### HashTable

- 입력 순서 보장하지 않음 
- 검색기능 O(1) 시간복잡도, 동기화(Synchronized) 지원   
- null Key 허용 안함 (Null Pointer Exception 발생)
- HashMap보다는 느리다 하지만 동기화된 HashMap 보다는 빠르다.   

##### LinkedHashMap

- 입력 순서 보장 
- 검색기능 O(1) 시간복잡도, 더블링크드리스트 자료구조로 이루어짐 
- null Key 허용 
- HashMap과 동일하게 좋은 성능을 가지지만 링크드리스트를 구성하고 있어야 한다. 

##### TreeMap

- 입력 순서 보장하지 않으며, 정렬된 순서로 저장되어 출력됨 
- 검색기능 O(log(n)) 시간복잡도, Red Black Tree 자료구조로 이루어짐 
- null Key 허용 안함 ( Null Pointer Exception 발생)

- - -

**Reference**

[https://medium.com/@igniter.yoo/java-linkedhashmap-%EC%88%9C%EC%84%9C%EB%A5%BC-%EC%9C%A0%EC%A7%80%ED%95%98%EB%8A%94-%ED%95%B4%EC%8B%9C%EB%A7%B5-11a7846d8893](https://medium.com/@igniter.yoo/java-linkedhashmap-%EC%88%9C%EC%84%9C%EB%A5%BC-%EC%9C%A0%EC%A7%80%ED%95%98%EB%8A%94-%ED%95%B4%EC%8B%9C%EB%A7%B5-11a7846d8893)    
[https://sup2is.github.io/2019/10/31/linked-hash-map.html](https://sup2is.github.io/2019/10/31/linked-hash-map.html)        

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

