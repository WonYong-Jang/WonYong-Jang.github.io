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

## 1. 프리미티브 타입 종류, 값의 범위 그리고 기본값 

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
    > float f = 2.5F / double d = 5.6D     

- 각각의 정수형은 2진수로 저장되는데, 해당 자료형이 N 비트라고 할 때 최상위 비트와 N-1개 비트로 
구성된다. 이때 음수는 -2^N-1승 까지이며, 양수는 2^N-1승에서 0을 포함하기 때문에 -1를 해준다.   

    > 최상위 비트(MSB: Most Significant Bit) : 양수면 0이고 음수면 1로 표현   

- - -

## 2. 레퍼런스 타입

프리미티브 타입을 제외한 타입들이 모두 Reference Type이다. 
빈 객체를 의미하는 Null이 존재한다.    
레퍼런스 타입은 기본적으로 java.lang.Object를 상속 받으면 참조형이 된다.   
`프리미티브 타입과 달리 레퍼런스 타입은 JVM Runtime Data Area 영역 중 heap 영역에 할당되는데 레퍼런스 타입의 변수에는 
heap영역에 할당된 오브젝트의 주소가 저장된다.`     
 
`아래 그림과 같이 프리미티브 타입 a와 b는 변수에는 실제 값이 들어가지만, 레퍼런스 타입인 c는 
Car라는 오브젝트를 인스턴스화 시키고 car 변수는 어떠한 값을 저장하는게 아닌 heap 영역에 저장된
오브젝트의 주소가 저장된다.`    

<img width="500" alt="스크린샷 2020-11-21 오후 4 29 14" src="https://user-images.githubusercontent.com/26623547/99870535-139f2980-2c17-11eb-9f60-1ba864a891a4.png">   

> 출처 : https://velog.io/@jaden_94/2%EC%A3%BC%EC%B0%A8-%ED%95%AD%ED%95%B4%EC%9D%BC%EC%A7%80

- - -

## 3. 리터럴    

리터럴은 변수나 상수에 저장되는 값 자체를 의미한다. 그 종류로는 정수, 실수, 문자, boolean, 문자열 등이 있다.   

```java
// 변수를 초기화 할때 사용 되는 값들도 모두 리터럴이다.   
int number1 = 10;
double number2 = 10.11D;
String str = "문자열 리터럴";
```

- - -

## 4. 변수 스코프와 라이프타임 

`프로그램에서 사용되는 변수들은 사용 가능한 범위`를 가진다. 그 범위를 변수의 스코프라고 한다.   

### 4-1) 변수 스코프 
   
**변수가 선언된 블럭이 그 변수의 사용 범위이다.**   

```java
public class ValableScopeExam{

        int globalScope = 10;   // 인스턴스 변수 => 사용 범위는 클래스 전체 

        public void scopeTest(int value){ 
            // => value는 블록 바깥에 존재하지만, 메서드 선언부에 존재하므로 사용범위는 해당 메소드 블럭내이다.   
            int localScope = 10;  // => 사용 범위는 메소드 블럭내이다.   
            System.out.println(globalScope);
            System.out.println(localScpe); 
            System.out.println(value);
        }
    }
```

> main 메소드에서 사용하기  (주의! ) 

`같은 클래스 안에 있는 globalScope 변수를 사용 할 수 없다. main은 static한 메소드 이다. static한 
메서드에서는 static 하지 않은 필드를 사용 할 수 없다.`   

```java
public class VariableScopeExam {
        int globalScope = 10; 

        public void scopeTest(int value){
            int localScope = 20;            
            System.out.println(globalScope);
            System.out.println(localScope);
            System.out.println(value);
        }   
        public static void main(String[] args) {
            System.out.println(globalScope);  //오류
            System.out.println(localScope);   //오류
            System.out.println(value);        //오류  
        }   
    }
```

##### Static 이란 ? 

`Static 은 단어 뜻 처럼 프로그램이 실행시부터 종료시까지 그대로 고정되어 있다.`   

Static이라는 키워드를 사용하여 Static변수와 Static메소드를 만들 수 있는데 다른말로 정적필드와 정적 
메소드라고도 하며 이 둘을 합쳐 정적 멤버라고 한다.(클래스 멤버라고도 한다.)   

Static 실행되는 시점은 클래스가 메모리상으로 올라갈 때이다. 

> 순서 : 프로그램 실행 >> 클래스 로드(static 생성) >> 인스턴스 생성  



**Reference**

[https://programmers.co.kr/learn/courses/5/lessons/231](https://programmers.co.kr/learn/courses/5/lessons/231)   
[https://gbsb.tistory.com/6](https://gbsb.tistory.com/6)   
[https://github.com/whiteship/live-study/issues/1](https://github.com/whiteship/live-study/issues/1)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

