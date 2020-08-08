---
layout: post
title: "[Java] Serialization 직렬화 개념"
subtitle: "클래스들이 Serializable 인터페이스를 상속받는 이유 "
comments: true
categories : Java
date: 2020-08-07
background: '/img/posts/mac.png'
---

## Java Serialization 

`Java 내부 시스템에서 사용되는(또는 JVM 메모리에 올려진) 객체나 데이터를 외부에서 사용할 수 있도록 
Byte 형태로 변환하는 것!`   

### 직렬화가 사용되는 상황? 

- - - 

- JVM의 메모리에서 상주하는 객체 데이터를 그대로 영속화(Persistence)할 때 사용된다.

    > 시스템이 종료 되더라도 사라지지 않으며, 영속화된 데이터이기 때문에 네트워크로 전송도 가능하다. 

- Servlet Session : Servlet 기반의 WAS들은 대부분 세션의 Java 직렬화를 지원한다.

    > 파일로 저장, 세션 클러스터링, DB를 저장하는 옵션 등을 선택하면 세션 자체가 직렬화 되어 저장 및 전달된다.   

- Cache : 캐시할 부분을 직렬화된 데이터로 저장해서 사용  

- Java RMI(Remote Method Invocation)

    > 원격 시스템의 메서드를 호출할 때 전달하는 메시지(객체)를 직렬화하여 사용  
    > 메시지(객체)를 전달 받은 원격 시스템에서는 메세지(객체)를 역직렬화하여 사용  

`객체가 세션에 저장하지 않는 단순한 데이터 집합이고, 컨트롤러에서 생성되어서 뷰에서 소멸하는 
데이터의 전달체라면 객체 직렬화는 고려하지 않아도 된다.`   

`세션 관리를 스토리지나 네트워크 자원을 사용한다면 객체 직렬화를 해야하고, 메모리에서만 관리한다면 
객체 직렬화를 할 필요가 없다. 둘다 고려한다면 직렬화가 필요하다.`   

### 직렬화 조건
- - -

- Java.io.Serializable 인터페이스를 상속받은 객체와 Primitive 타입의 데이터가 직렬화의 대상이 
될 수 있다.
    > 기본자료형(Primitive Type)은 정해진 Byte의 변수이기 때문에 Byte 단위로 변환하는 것에 
    문제가 없지만, 객체의 크기는 가변적이며, 객체를 구성하는 자료형들의 종류와 수에 따라 
    객체의 크기가 다양하게 바뀔수 있기 때문에 객체를 직렬화 하기 위해 Serializable 인터페이스를 
    구현해야 한다.   

- 객체의 멤버들 중 Serializable 인터페이스가 구현되지 않은 것이 존재하면 안된다.   
- Transient 가 선언된 멤버는 전송되지 않는다.  

    > 객체 내에 Serializable 인터페이스가 구현되지 않는 멤버 때문에 NonSerializableException 이
    발생하는 경우, Transient를 선언해주면 직렬화 대상에서 제외되기 때문에 문제 없이 해당 객체를 
    직렬화 할 수 있다.   

- - -

**Reference**

[https://ryan-han.com/post/java/serialization/](https://ryan-han.com/post/java/serialization/)    

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

