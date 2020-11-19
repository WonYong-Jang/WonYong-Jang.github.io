---
layout: post
title: "[Java] 데이터 타입, 변수 그리고 배열"
subtitle: "리터럴 / 변수 스코프와 라이프 타임/ 타입 변환, 캐스팅, 타입 프로모션  / 타입 추론 var"
comments: true
categories : Java
date: 2020-11-18
background: '/img/posts/mac.png'
---

## 목표

자바의 프리미티브 타입, 변수 그리고 배열을 사용하는 방법을 배운다. 

## 학습할 것 

- 프리미티브 타입 종류와 값의 범위 그리고 기본 값
- 프리미티브 타입과 레퍼런스 타입 
- 리터럴 
- 변수 선언 및 초기화하는 방법 
- 변수의 스코프와 라이프타임 
- 타입 변환, 캐스팅 그리고 타입 프로모션 
- 1차 및 2차 배열 선언하기 
- 타입 추론, var 


- - -

Data Type이란 해당 데이터가 메모리에 어떻게 저장되고, 프로그램에서 어떻게 처리되어야 하는지를 명시적으로 
알려주는 것이다. 자바에서 타입은 크게 프리미티브타입과 레퍼런스 타입이 있다. 

## 프리미티브 타입 종류, 값의 범위 그리고 기본값 

primitive type은 자바의 기본 타입이며, 총 8개 이다. 

`자바에서는 필드 선언시 초기화를 하지 않으면, 기본 값으로 초기화 된다.    
primitive type은 유의미한 값을 가지며, 레퍼런스 타입은 null로 초기화 된다.`      

#### Primitive Type 이란 ? 

기본자료형 혹은 원시자료형 이라고 불리는 프리미티브 타입은 `값이 할당되면 JVM Runtime Data Area 영역 중 
Stack 영역에 값이 저장된다.`    

#### Primitive Type 종류

<img width="700" alt="스크린샷 2020-11-18 오후 11 19 14" src="https://user-images.githubusercontent.com/26623547/99542052-f0952f80-29f4-11eb-814e-1577ecc810ed.png">   

> 출처 : https://gbsb.tistory.com/6   

- long의 기본값을 0L이라고 표현하는 이유는 자료형이 long임을 명시적으로 알려주는 것이다.  

    > long num = 12345678900;  // 자료형 범위 넘어갈 경우 오버플로우 발생  
    > long num = 12345678900L; // 자바는 기본적으로 모든 정수 값을 int로 처리하기 때문에 long형으로 처리하라고 
    컴파일러에게 명시적으로 알려주기 위해 숫자 뒤에 L을 붙인다.   

- 각각의 정수형은 2진수로 저장되는데, 해당 자료형이 N 비트라고 할 때 최상위 비트와 N-1개 비트로 
구성된다. 이때 음수는 -2^N-1승 까지이며, 양수는 2^N-1승에서 0을 포함하기 때문에 -1를 해준다.   

    > 최상위 비트(MSB: Most Significant Bit) : 양수면 0이고 음수면 1로 표현   

- - -

## 레퍼런스 타입

프리미티브 타입을 제외한 타입들이 모두 Reference Type이다. 
빈 객체를 의미하는 Null이 존재한다.    
레퍼런스 타입은 기본적으로 java.lang.Object를 상속 받으면 참조형이 된다.   
`값이 저장되어 있는 곳의 주소값을 저장하는 공간으로 Heap 메모리에 저장된다.`   
 

- - -

**Reference**

[https://gbsb.tistory.com/6](https://gbsb.tistory.com/6)   
[https://github.com/whiteship/live-study/issues/1](https://github.com/whiteship/live-study/issues/1)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

