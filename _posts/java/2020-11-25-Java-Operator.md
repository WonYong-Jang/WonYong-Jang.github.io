---
layout: post
title: "[Java] 연산자 "
subtitle: "자바가 제공하는 다양한 연산자/ instanceof / Java13 switch 연산자"
comments: true
categories : Java
date: 2020-11-25
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
비트 연산자는 기능에 따라 비트 이동연산자, 비트 논리연산자로 구분한다.

#### 2-1. 비트 이동 연산자

<img width="700" alt="스크린샷 2020-11-27 오후 10 08 33" src="https://user-images.githubusercontent.com/26623547/100452917-6a1bd480-30fd-11eb-8514-51d676271328.png">   

> https://coding-factory.tistory.com/521   

비트 이동 연산자는 정수 데이터의 비트를 왼쪽 또는 오른쪽으로 이동시키는 연산을 한다.   

<img width="581" alt="스크린샷 2020-11-27 오후 10 13 27" src="https://user-images.githubusercontent.com/26623547/100453169-ddbde180-30fd-11eb-918e-6a84945d018b.png">

2 << 3 은 2를 32비트로 분해한 다음 왼쪽으로 3비트를 이동시키는 연산이다. 비트를 
왼쪽으로 3비트 이동할 때 맨 왼쪽 3비트는 밀려서 버려지게 되고 맨 오른쪽에는 0으로 채워진다.   

<img width="573" alt="스크린샷 2020-11-27 오후 10 13 34" src="https://user-images.githubusercontent.com/26623547/100453179-df87a500-30fd-11eb-96e4-7a51f526ca7b.png">

16 >> 3 은 위와 같이 3비트를 오른쪽으로 이동시키는 연산이다. 비트를 오른쪽으로 3비트 이동할 때 맨 오른쪽 3비트는 
밀려서 버려지게 되고 맨 왼쪽에는 최상위 부호비트와 동일한 값으로 채워진다. 
`즉, 최상위 부호비트가 0이라면 동일하게 0으로 채워지고, 1이라면 1로 빈공간을 채우게 된다.`   

<img width="610" alt="스크린샷 2020-11-27 오후 10 13 49" src="https://user-images.githubusercontent.com/26623547/100453192-e3b3c280-30fd-11eb-96ef-0367c8483501.png">

`>>> 연산은 오직 자바에만 있는 연산이며 >> 와 기본원리는 같다. 다른 점은 
최상위 부호비트와 관계없이 무조건 0으로만 채워지게 된다.    
앞자리가 0으로만 채워지므로 결과값은 무조건 양수로 나타난다.`   

#### 2-2. 비트 논리 연산자(&, |, ^, ~)   

- &(AND) 연산자 : 두 비트 모두 1일 경우에만 연산 결과가 1   
- |(OR) 연산자: 두 비트 중 하나만 1일 경우에만 연산결과가 1   
- ^(XOR) : 두 비트중 하나는 1이고 다른 하나가 0일 경우에만 연산결과가 1   
- ~(NOT) : 비트 반전(보수)   

- - - 

## 3. 관계 연산자 

비교 연산자라고도 하며 부등호를 생각하면 된다. 관계연산자의 결과는 true 혹은 
false 값인 boolean 자료형으로 반환이 된다. 


- - - 

## 4. 논리 연산자 

- 논리 연산자는 AND(&&), OR(||), NOT(!) 세가지 연산자가 있으며 관계연산자와 
같이 사용되는 경우가 많다. 논리 연산자 역시 연산 결과가 true 혹은 false로 
반환된다.    

- - - 

## 5. instanceof 연산자 

참조변수가 참조하고 있는 인스턴스의 실제 타입을 알아보기 위해 instanceof 연산자를 
사용한다.    
주로 조건문에 사용되며, instanceof의 왼쪽에는 참조변수를 
오른쪽에는 타입(클래스명)이 피연산자로 위치한다.  

`instanceof를 이용한 연산결과로 true를 얻었다는 것은 참조변수가 검사한 타입으로 
형변환이 가능하다는 것을 뜻한다.`   

- - -

## 6. assignment(=) operator 

변수에 값 또는 수식의 연산결과를 저장(메모리에)하는데 사용한다. 왼쪽에는 
반드시 변수가 위치해야 하며, 오른쪽에는 리터럴이나 변수 또는 수식이 올수 있다.   


- - -

## 7. 화살표(->) 연산자 

자바가 람다가 도입되면서 등장한 연산자이다. 

```java
int min(int x, int y) {

    return x < y ? x : y;

}
```

위의 예제처럼 메소드를 람다 표현식으로 표현하면, 클래스를 작성하고 
객체를 생성하지 않아도 메소드를 사용할 수 있다. 

```java
(x, y) -> x < y ? x : y;
```

- - - 

## 8. 3항 연산자    

조건식에 따라 참이면 A, 거짓이면 B를 선택 

```java
(조건식) ? A : B   
```

- - -

## 9. 연산자 우선 순위   

수학에서도 그렇지만 모든 연산에서는 우선순위가 있다. 괄호안에 있는 
연산이 가장 먼저 수행되며, 연산자 우선순위가 같은 경우 연산 방향에 
따라 진행된다.


> ex) 100 * 2 / 3 % 5  => 연산자들 우선순위 같다. 연산방향 왼쪽에서 오른쪽 이므로   결과 : 1   

> ex) a = b = c = 5;   => 연산자들 우선순위 같다. 연산방향 오른쪽에서 왼쪽으로 진행되고 a,b,c, 변수에 5 대입된다. 

- - - 




- - - 

**Reference**

[http://www.tcpschool.com/java/java_lambda_concept](http://www.tcpschool.com/java/java_lambda_concept)   
[https://kephilab.tistory.com/28](https://kephilab.tistory.com/28)   
[https://coding-factory.tistory.com/521](https://coding-factory.tistory.com/521)         
[https://studymake.tistory.com/416](https://studymake.tistory.com/416)    
[https://github.com/whiteship/live-study/issues/3](https://github.com/whiteship/live-study/issues/3)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

