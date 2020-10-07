---
layout: post
title: "[Java] TreeMap 사용"
subtitle: "자바의 자료구조(TreeMap)"
comments: true
categories : Java
date: 2020-10-07
background: '/img/posts/mac.png'
---

## TreeMap

`TreeMap은 이진트리를 기반으로 한 Map 컬렉션이다. 같은 Tree구조로 이루어진 TreeSet과의 차이점은 
TreeSet은 그냥 값만 저장한다면 TreeMap은 키와 값이 저장된 Map, Entry를 저장한다는 점이다.`    

`TreeMap에 객체를 저장하면 자동으로 정렬되는데, 키는 저장과 동시에 자동 오름차순으로 정렬되고 
숫자 타입일 경우에는 값으로, 문자열 타입일 경우에는 유니코드로 정렬한다.`    
정렬 순서는 기본적으로 부모 키값과 비교해서 키 값이 낮은 것은 왼쪽 자식 노드에 키값이 높은 것은 
오른쪽 자식 노드에 Map.Entry 객체를 저장한다. TreeMap은 일반적으로 Map으로써의 성능이 HashMap 보다는 
떨어진다. TreeMap은 데이터를 저장할 때 즉시 정렬하기에 추가나 삭제가 HashMap보다 오래 걸린다. 하지만 
정렬된 상태로 Map을 유지해야 하거나 정렬된 데이터를 조회해야 하는 범위 검색이 필요한 경우 TreeMap을 
사용하는 것이 효율성면에서 좋다.

- - - 

<img width="579" alt="스크린샷 2020-10-07 오후 7 40 08" src="https://user-images.githubusercontent.com/26623547/95320862-1b0fab00-08d5-11eb-9744-c8eb61c2ee35.png">   

`TreeMap은 이진탐색트리의 문제점을 보완한 레드-블랙 트리(Red-Black Tree)로 이루어져 있다. 일반적인 이진 탐색 트리는 트리의 높이만큼 
시간이 필요하다.( O(logN) ) 값이 전체 트리에 잘 분산되어 있다면 효율성에 있어 크게 문제가 없으나 데이터가 들어올 때 값이 한쪽으로 편향되게 들어올 경우 
한쪽 방면으로 크게 치우쳐진 트리가 되어 굉장히 비효율적인 퍼포먼스를 낸다.( O(n) )`

따라서 레드 블랙트리는 편향된 트리를 만드려고 할때 몇가지의 조건을 이용하여 balanced binary search tree를 
만들수 있도록 해준다. 자세한 알고리즘은 아래 링크를 이용한다.

[https://zeddios.tistory.com/237](https://zeddios.tistory.com/237)   


### TreeMap 사용

```java
TreeMap<Integer, String> map = new TreeMap<>();
map.put(2,"사과");
map.put(1,"복숭아");
map.put(3, "수박");

System.out.println(map);   // {1=복숭아, 2=사과, 3=수박} 


for(Map.Entry<Integer, String> next : map.entrySet()) {
       System.out.println(next);
}
// 1번부터 key기준 정렬되어 출력!
// 1=복숭아
// 2=사과
// 3=수박


System.out.println(map.firstEntry()); // 출력 : 1=복숭아
System.out.println(map.firstKey());   // 출력 : 1

System.out.println(map.lastEntry());  // 출력 : 3=수박
System.out.println(map.lastKey());    // 출력 : 3
```

- - -    

#### 그 외 사용 함수 

- [ ceilingEntry() / ceilingKey() / floorEntry() / floorKey() ] 

ceilingEntry() : 제공된 키 값보다 크거나 같은 값 중 가장 작은 키의 Entry를 반환
ceilingKey() : 제공된 키 값보다 크거나 같은 값 중 가장 작은 키의 키값을 반환
floorEntry() : 제공된 키 값보다 같거나 작은 값 중 가장 큰 키의 Entry를 반환
floorKey() : 제공된 키 값보다 같거나 작은 값 중 가장 큰 키의 키값을 반환
// Entry란 키와 값을 저장하고 있는 Map의 내부 클래스(C언어 구조체의 역할과 유사함)   

- [ higherEntry() / higherKey() / lowerEntry() / lowerKey() ]

위의 메소드와 비슷하지만, "같거나"가 빠짐
더 큰 값 중에서 가장 작은 값, 더 작은 값 중에서 가장 큰 값을 Entry 또는 key 타입으로 반환함

- [ pollFirstEntry() / pollLastEntry() ]

현재 맵에서 가장 큰 작은 키 값(first) / 큰 키 값(last)의 Entry를 반환 후 삭제



- - -

**Reference**

[https://coding-factory.tistory.com/557](https://coding-factory.tistory.com/557)    
[https://codevang.tistory.com/134](https://codevang.tistory.com/134)

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

