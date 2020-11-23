---
layout: post
title: "[Java] 연산자 "
subtitle: "자바가 제공하는 다양한 연산자/ instanceof / Java13 switch 연산자"
comments: true
categories : Java
date: 2020-11-23
background: '/img/posts/mac.png'
---

## 목표

자바가 제공하는 다양한 연산자를 학습한다.   

## 학습할 것 

- 산술 연산자
- 비트 연산자
- 관계 연산자
- 논리 연산자
- instanceof
- assignment(=) operator 
- 화살표(->) 연산자
- 3항 연산자
- 연산자 우선 순위
- (optional) Java 13 switch 연산자 


- - -

## 1. 산술 연산자   

`수학적 계산(사칙 연산/ 덧셈, 뺄셈, 곱셈, 나눗셈)에 사용되는 연산자이다. 자바에서 산술 연산은 
사칙연산과 나머지 연산을 포함한 다섯가지연산을 뜻한다.`     

자바에서 나머지 연산의 피연산자는 정수형과 실수형 모두 가능하다.

```java
double num=5.2, mod=4.1;
System.out.println(num%mod); // 1.1 출력됨  
```

자바는 컴파일하는 시점에서 변수에 어떤 상수를 입력할 때 범위를 체크하여 허용 범위를 넘어선다면 
에러를 발생시킨다. 또한 `산술 연산을 할 때 다음과 같이 자동 형변환(Promotion)이 일어 난다.`   

- 두 피연산자 중 하나라도 double 형이면 다른 하나도 double 형으로 변환하고 결과도 double형이다.  
- 그렇지 않고 두 피연산자 중 하나라도 float 형이면 다른 하나도 float 형으로 변환하고 결과도 float형이다.   
- 그렇지 않고 두 피연산자 중 하나라도 long 형이면 다른 하나도 long 형으로 변환하고 결과도 long형이다.   
- 그렇지 않다면 두 피연산자를 모두 int 형으로 변환하고 결과도 int 형이다.   

자바에서 산술연산에 대해서는 이 네 가지의 규칙을 따른다. 특히 마지막 규칙에 대해 아래 예를 확인해보자. 
byte형이나 short 형의 연산 결과는 int형이 된다. 따라서 다음과 같은 간단한 연산도 에러를 발생한다.   

```java
short num1 = 10, num2 = 20;
short result = -num1;       // error
short reuslt = num1 + num2; // error
```

범위를 벗어나는 것도 아닌데 왜 에러가 발생하는지 처음에는 의아할 수 있다. -num1과 
num1 + num2 연산 결과는 int형이고 이것을 short형에 대입하려고 하기 때문이다. 
자바에서는 데이터 타입의 크기가 작은 자료형으로 타입 변환은 명시적으로 해주어야 한다. 
따라서 아래와 같이 명시적 타입 변환(Casting)을 해주어야 한다.   

```java
short num1 = 10, num2 = 20;
short result = (short)(-num1);       
short reuslt = (short)(num1 + num2); 
```

이것은 byte형에 대해서도 마찬가지이다.   

- - -

## 2. 비트 연산자   

비트연산은 1과 0을 가지고 이루어진다. 일반적으로 0이 false, 그 외의 모든 값을 true를 나타낸다.  



- - - 

**Reference**


[https://studymake.tistory.com/416](https://studymake.tistory.com/416)    
[https://github.com/whiteship/live-study/issues/3](https://github.com/whiteship/live-study/issues/3)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

