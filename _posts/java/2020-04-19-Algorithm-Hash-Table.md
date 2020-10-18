---
layout: post
title: "[Java] HashMap ,Hash Table"
subtitle: "Java에서 HashMap과 HashTable"
comments: true
categories : Java
date: 2020-04-19
background: '/img/posts/mac.png'
---

# Hash Table과 Hash Map 

<p>해시 테이블은 연관배열 구조를 이용하여 키에 결과값을 저장하는 자료구조이며 연관 배열 구조란 
키 1개와 값 1개가 1:1로 연관되어 있는 자료구조이다.</p>   

Map 인터페이스를 상속받아 구현되었고 키-값 쌍의 개수에 따라 동적으로 크기가 증가하는 자료구조이다.   

`검색하고자 하는 키값을 입력받아서 해시함수를 돌려서 반환 받은 해시코드를 배열의 인덱스로 환산해서 데이터에 접근하는 자료구조!`

`F(key) -> HashCode -> Index -> Value`

<img width="400" alt="스크린샷 2020-10-18 오후 6 06 27" src="https://user-images.githubusercontent.com/26623547/96363053-cdb0fa80-116c-11eb-80fb-5f7e70bb5ac6.png">    


**관련 예제**
- - -
1. YouTube에서 다른 채널의 동영상을 다운받아서 자신의 채널에 올리는 순간 중복 동영상이라는 
문구를 통해서 바로 알려준다.    
2. 블록체인에서 hashtable을 사용한다. 모든 사용자들의 거래내역을 hashcode를 사용자에게 배포 하고 
사용자들은 hashcode만 비교한다.    
hashcode는 입력값의 공백만 달라져도 다른 hashcode를 만들어 내기 때문에 
각 거래 내역을 중복값 없이 만들어 낼수 있다.
- - -

<p><u>해시 테이블은 키(Key), 해시함수(Hash Function), 해시(Hash), 값(value), 저장소(Bucket, Slot)로 이루어져 있다.</u></p>

<p><b>키는 해시함수를 통해 해시로 변경이 되며 해시는 값과 매칭되어 저장소에 저장이 된다.</b></p>

<pre>
- 키(key)   : 고유한 값이며, 해시 함수의 input이 된다. 다양한 길이의 값이 될수 있다. 이 상태로 최종 
              저장소에 저장이 되면 다양한 길이 만큼의 저장소를 구성해 두어야 하기 때문에 해시 함수로 값을
              바꾸어 저장이 되어야 공간의 효율성을 추구할수 있다! 
- 해시함수  : 키를 해시로 바꿔주는 역할을 한다. 다양한 길이를 가지고 있는 키를 일정한 길이를 가지는 해시로
              변경하여 저장소를 효율적으로 운영할 수 있도록 도와준다. 다만, 서로 다른 키가 같은 해시가 되는 경우를
              충돌(Hash Collision)이라고 하는데, 해시 충돌을 일으키는 확률을 최대한 줄이는 함수를 만드는 것이 
              중요하다.
- 해시 코드 : 해시 함수의 결과물이며, 저장소(bucket, slot)에서 값과 매칭되어 저장된다.
- 값        : 저장소(bucket, slot)에 최종적으로 저장되는 값으로 키와 매칭되어 저장, 삭제, 검색, 접근이 가능해야 한다.

</pre>

## HashTable 과 HashMap 차이

**1. HashTable**

Hashtable의 Data 변경 메소드는 syncronized 로 선언되어 있다. 즉, 메소드 호출 전 쓰레드간 동기화 락을 
통해 멀티 쓰레드 환경에서 data의 무결성을 모장해준다.   
key, value에 null을 허용하지 않는다.   

**2. HashMap**

HashMap은 멀티쓰레드에서 여러 쓰레드가 동시에 객체의 data를 조작하는 경우 data 가 깨져버리고 
심각한 오류가 발생할 수 있다.    
따라서 동기화처리를 하지 않기 때문에 값을 찾는 속도가 빠르다.   
key, value에 null을 허용한다.

> 일반적으로 동기화가 필요 없다면 HashMap을, 동기화 보장이 필요하다면 HashTable을 사용   

> 동기화 이슈가 있다면 HashMap에 synchronized 키워드를 이용하는 것도 방법! 

**3. ConCurrentHashMap**

HashMap의 멀티쓰레드 환경에서 동기화처리로 인한 문제점을 보완한 것!    
HashMap과 다르게 key, value에 null을 허용하지 않는다.   

## HashCode Collision 

<img width="400" alt="스크린샷 2020-10-18 오후 6 10 05" src="https://user-images.githubusercontent.com/26623547/96363124-31d3be80-116d-11eb-8dca-2189b0bb16a2.png">


Hash 함수를 구현하는 가장 간단한 방법은` 나머지 연산`을 이용하는 것이다. **연산 결과를 
해당 데이터의 인덱스로 사용하는 것인데 다른 값인데 같은 인덱스로 배정되는 상황이 발생한다.**      

해시 충돌이 발생하더라도 데이터를 잘 저장하고 조회할 수 있게 하는 방식에는 
대표적으로 아래 두 가지이 있고 대부분 둘을 응용해서 사용한다.   

- - -

**1. 체이닝(Separate Chaining)**

`버켓 내에 연결리스트를 할당하여, 버켓에 데이터를 삽입하다가 해시 충돌이 발생하면 연결리스트로 
데이터를 연결하는 방식이다.`   

- 개방주소법보다는 간단한 계산식이다. (연결리스트, 트리 사용하기 때문에)   
- 해시테이블이 많이 채워질수록 버켓에서 search 할때 Linear하게 찾을수도 있다.  
    - 균형 이진 탐색 트리를 사용하여 개선 
    - Linked list를 통해 구현되면 마지막 데이터는 O(N)의 속도를 가지기 때문에 탐색과 삭제를 위해 균형 이진 탐색 트리를 구성   
    - 데이터가 아무리 많이 연결되더라도 최소 O(logN) 속도 보장 

- Java 7에서는 Separate Chaining 방식을 사용하여 HashMap을 구현하고 있다. (LinkedList 사용)
- **Java 8에서는 하나의 버킷에 상수를 통해 6개 이하의 데이터라면 링크드 리스트를 사용하지만 
8개 이상의 데이터가 쌓이면 이를 Red-Black 트리로 변환한다. 이에 따라 최악의 경우라도 O(logN) 속도 보장**   

- - - 

**2. 개방 주소법(Open Addressing)**

`체이닝의 경우 버켓이 꽉 차더라도 연결리스트로 계속 늘려가기에, 데이터의 주소값은 바뀌지 않는다. 
하지만, 개방 주소법의 경우에는 다르다.   
해시 충돌이 일어나면 다른 버켓에 데이터를 삽입하는 방식을 개방 주소법이라고 한다.`   

- - -




<p>Reference</p>

<p><a href="https://velog.io/@cyranocoding/Hash-Hashing-Hash-Table%ED%95%B4%EC%8B%9C-%ED%95%B4%EC%8B%B1-%ED%95%B4%EC%8B%9C%ED%85%8C%EC%9D%B4%EB%B8%94-%EC%9E%90%EB%A3%8C%EA%B5%AC%EC%A1%B0%EC%9D%98-%EC%9D%B4%ED%95%B4-6ijyonph6o">https://velog.io/@cyranocoding/Hash-Hashing-Hash-Table%ED%95%B4%EC%8B%9C-%ED%95%B4%EC%8B%B1-%ED%95%B4%EC%8B%9C%ED%85%8C%EC%9D%B4%EB%B8%94-%EC%9E%90%EB%A3%8C%EA%B5%AC%EC%A1%B0%EC%9D%98-%EC%9D%B4%ED%95%B4-6ijyonph6o</a></p>
[https://velog.io/@agugu95/Hash-Table-Java-HashMap](https://velog.io/@agugu95/Hash-Table-Java-HashMap)    
[https://d2.naver.com/helloworld/831311](https://d2.naver.com/helloworld/831311)

{% highlight ruby linenos %}


{% endhighlight %}
{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
