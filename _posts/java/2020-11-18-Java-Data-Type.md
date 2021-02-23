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

-  정수형 변수 저장할 때 메모리 덜 잡아먹는 short 사용안하고 보통 int 사용하는 인유?  

    > int는 하드웨어가 가장 효율적으로 처리하는 정수형태의 크기로 설정되고 cpu 연산처리에 더 효율적이며 
    정수형 연산을 진행 할 때 모든 피연산자를 Int형으로 변환하는 과정을 거치기 때문 


- long의 기본값을 0L이라고 표현하는 이유는 자료형이 long임을 명시적으로 알려주는 것이다.  

    > long num = 12345678900;  // 자료형 범위 넘어갈 경우 오버플로우 발생  
    > long num = 12345678900L; // 자바는 기본적으로 모든 정수 값을 int로 처리하기 때문에 long형으로 처리하라고 
    컴파일러에게 명시적으로 알려주기 위해 숫자 뒤에 L을 붙인다.   
    > float f = 2.5F / double d = 5.6D     

- 각각의 정수형은 2진수로 저장되는데, 해당 자료형이 N 비트라고 할 때 최상위 비트와 N-1개 비트로 
구성된다. 이때 음수는 -2^N-1승 까지이며, 양수는 2^N-1승에서 0을 포함하기 때문에 -1를 해준다.   

    > 최상위 비트(MSB: Most Significant Bit) : 양수면 0이고 음수면 1로 표현  

- `실수형`에서 값을 부호, 지수, 가수로 나누어 저장한다. 따라서 같은 크기임에도 훨씬 
큰 범위를 표현 가능하지만 `실수형은 원래 저장하려던 값과 실제 저장된 값이 오차가 날수 있다.`   
따라서, 오차없는 자리 수인 정밀도의 크기가 클 수록 정확도가 높다.

<img width="604" alt="스크린샷 2020-11-22 오후 9 29 15" src="https://user-images.githubusercontent.com/26623547/99903775-eb442780-2d09-11eb-935e-cb1b09c99b0c.png">   

위의 이미지는 실수형 float이며, 가수부분은 23비트인데 여기서 정규화를 통해 24까지 표현 가능하다. 
2^24는 10^7보다는 크고 10^8보다 작기에 float의 정밀도는 7이된다.    
double의 경우에는 가수부분이 52비트이고 위와 같은 계산을 통해 정밀도를 계산하면 
정밀도는 15자리가 된다.    

> 돈관련 계산 앱처럼 절때 오차가 발생하지 않아야 할때는 BigInteger 또는 BigDecimal을 사용하자 

```java
float number = 0f;
for (int i = 0 ; i < 10; i++ ) {
	number += 0.1f;
} // 결과 = 1.00000001 <- 오차가 발생 !
```

```java
BigDecimal number = BigDecimal.ZERO;
for (int i = 0 ; i < 10; i++) {
	number = number.add(BigDecimal.valueOf(0.1));
}
System.out.println(print); // 1.0 <- 정확한 결과값이 나옴 
```

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

`같은 클래스 안에 있는 globalScope 변수를 사용 할 수 없다. main은 static한 메소드 이다. static한
메서드에서는 static 하지 않은 필드를 사용 할 수 없다.`   

`이유는 Static 의 생성시점과 관련이 있고 Static 변수는 클래스 로딩 시점에 생성되고 인스턴스 변수는 그 이후에 
생성되므로 사용할 수 없다. 자세한 내용은 아래와 같다.`   

#### Static 이란 ? 

Static 은 단어 뜻 처럼 프로그램이 실행시부터 종료시까지 그대로 고정되어 있다.    

Static이라는 키워드를 사용하여 Static변수와 Static메소드를 만들 수 있는데 다른말로 정적필드와 정적 
메소드라고도 하며 이 둘을 합쳐 정적 멤버라고 한다.(클래스 멤버라고도 한다.)   

`static 실행되는 시점은 클래스가 메모리상으로 올라갈 때이다. 즉, 우리가 프로그램을 실행하면 필요한 클래스가 
JVM 메모리상에 로딩되는 과정을 거친다. 그리고 로딩된 클래스는 메모리상에서 객체를 인스턴스화 할 수 
있도록 메모리에 상주한다. static은 이 시점에 메모리에 올라가면서 필요한 동작을 처리한다. 결론적으로 static은 
객체의 인스턴스와 관계없이 클래스가 로딩되는 시점에 단 한번만 필요한 동작을 처리하기 위해 사용한다.`  

`이때, JVM의 메소드영역(클래스 영역)에 클래스의 정보들이 올라가게 된다.`   

> 순서 : 프로그램 실행 >> 클래스 로드(static 생성) >> 인스턴스 생성  

<img width="550" alt="스크린샷 2020-11-21 오후 5 51 08" src="https://user-images.githubusercontent.com/26623547/99872031-2ec36680-2c22-11eb-8c92-7e865a5dcd94.png">   

> 출처 : https://ict-nroo.tistory.com/19

프로그램이 실행되면 JVM은 OS로부터 메모리를 할당 받고, 그 메모리를 용도에 따라 여러 영역으로 나누어 관리한다. 
메소드 영역에 대해서만 보면, 프로그램을 수행하기 위해 OS에서 할당 받은 메모리 공간인 Runtime Data Area 안에 
포함되어 있다.   

`메소드 영역은 Class Area, Code Area, Static Area로 불려지며, 의미상 공유 메모리 영역이라고도 불린다. 코드에서 사용되는 
클래스들을 클래스 로더로 읽어 클래스 별로 런타임 상수 풀(runtime constant pool), 필드 데이터, 메소드 데이터, 메소드 코드, 생성자 코드 등을 
분류해서 저장한다. 메소드 영역은 JVM이 동작해서 클래스가 로딩될 때 생성되고, 모든 스레드가 공유하는 영역이다.`   

static이 붙은 변수를 클래스 변수라고 하는 것은 위에 그림에서 확인할 수 있듯이 변수가 존재하는 영역이 클래스가 존재하는 영역과 같기 때문이다.   

즉, 자바 변수 라이프 타임을 아래와 같이 정리 할 수 있다. 

`- 로컬 변수 : 처리 블록({ ~ }) 내에서만 생존, 변수 선언부 ~ 블록 종료 시까지`   
`- 인스턴스 변수: 객체 생성 ~ 객체가 GC에 의해 소멸 전까지`   
`- 클래스 변수 : 클래스 로더에 의해 클래스 로드 시 ~ 프로그램 종료될 때 까지`   

- - - 

## 5. 타입 변환, 캐스팅 그리고 타입 프로모션   

`하나의 타입을 다른 타입으로 변환하는 과정을 타입 변환이라고 한다. Java는 bool type을 
제외한 나머지 기본형 타입 변환을 자유롭게 수행할 수 있다.`   

타입 변환의 종류는 2가지가 있다.

#### 1) 묵시적 타입 변환(자동 타입 변환) : Promotion    

`묵시적 형변환은 작은 타입이 큰 타입으로 변환되는 기법을 말한다.`   
작은 타입이 큰 타입으로 변환될 때 데이터 앞에 따로 타입을 명시하지 않아도 된다.    

대입 연산이나 산술 연산에서 컴파일러가 자동으로 수행해주는 타입 변환을 뜻한다. 
Java에서는 데이터 손실이 발생하지 않거나, 데이터의 손실이 최소화 되는 방향으로 묵시적 
타입 변환을 진행한다.

```java
double num = 10;          // int형인 10이 double로 타입 변환 
double num = 5.0f + 3.14; // float형인 5.0이 double로 타입 변환
```

> int -> double   
> float -> double   

`두 경우 모두 자바 컴파일러가 자동으로 작은 데이터 타입에서 큰 데이터 타입으로 변환했다. 
변환 과정은 언제나 데이터의 손실을 최소화 하려 한다.`   

[요약]

- 대체적으로 어떤 값이 메모리 크기가 작은 데이터 타입에서 메모리 크기가 큰 데이터 타입으로 
변환될 때, Promotion이 일어날 수 있다. (단, 메모리 크기에 상관없이 정수는 모든 
        실수 데이터 타입에 자동 형변환이 가능하다.)   

- 메모리 크기가 큰 데이터 타입이라도, 타입 범위를 포함하지 못한다면 Promotion이 불가능하다. 
(float 데이터 타입 -> long 데이터 타입 자동 형변환 불가)   

> byte -> short -> int -> long -> float -> double   
> (왼쪽에서 오른쪽 기준으로 Promotion 가능)       


#### 2) 명시적 타입 변환(강제 타입 변환) : Casting    

`명시적 형변환은 큰 타입을 작은 타입으로 바꿔야 하는 경우에, 데이터 앞에 타입을 
명시해줌으로써 타입 변환이 가능하게 하는 기법이다.`   

프리미티브 타입의 경우에는 데이터앞에 타입만 명시하면 바꿀수 있다.

```java
int value = 1;
byte result = (byte)value;
```

위의 예제의 경우 value에 저장된 1이라는 값은 byte 데이터 타입에도 저장 가능한 값이다. 
그렇지만, 위의 코드에서 (byte)를 제외하면 컴파일 에러가 발생한다.    
그 이유는 `저장될 값 1에 상관없이 int 데이터 타입이 byte 데이터 타입보다 메모리가 크기 때문이다.`    

<img width="800" alt="스크린샷 2020-11-22 오후 7 14 58" src="https://user-images.githubusercontent.com/26623547/99901046-225d0d80-2cf7-11eb-991f-6fbeb29f9dbf.png">   

만약 천단위, 만단위 억단위의 값이 들어있다면 어떻게 될까?   
앞에 3byte의 공간을 삭제하는 시점에서 많은 이진법 데이터가 날아가 정상적인 값이 저장될 수 없을 것이다.   
이와 같이 메모리 크기가 큰 int데이터 타입에서 메모리 크기가 작은 byte 데이터 타입으로 
Promotion이 된다면, 정상적이지 않은 값이 나올 수 있기 때문에 Java 에서는 지원하지 않는다.

하지만, 우리가 형변환 하려는 정수 값은 1이므로 byte 데이터 타입 범위 안에 충분히 들어가는 값이다. 그렇기 때문에 
이럴때는 강제 형변환을 해주면 된다.   

또한, 객체간의 Casting도 가능한데 아래를 확인하자.    

```java
public void casting(Parent parent){
    if(parent instanceof Child) {
        Child child = (Child) parent; // Casting 
    }
}
```

`객체간 Casting을 하기 위해서는 항상 instanceof를 사용하여 상속 관계에 있는지 
확인해야 한다. 상속관계에 있지 않은 객체를 형변환 하려면 에러가 발생한다.`      

- - - 

## 6. 1차 2차 배열 메모리 영역  

자바에서는 배열이 객체이기 때문에, Heap 영역에 생성된다.   

```java
int[] arr = new int[2];   
```

<img width="250" alt="스크린샷 2020-11-22 오후 7 56 58" src="https://user-images.githubusercontent.com/26623547/99901847-0492a700-2cfd-11eb-8f90-f462bf0bed1a.png">   

위의 그림은 arr이 int형을 2개 저장할 수 있는 공간을 가르키고 있다. arr은 메모리 영역 중 스택에, 실제로 
int를 2개 저장할 수 있는 공간은 힙에 할당 된다.   

```java
int[][] arr = new int[2][3];
// [2,3,7], [6,7,9]
```

<img width="250" alt="스크린샷 2020-11-22 오후 7 55 41" src="https://user-images.githubusercontent.com/26623547/99901852-078d9780-2cfd-11eb-9b1c-43cb1c220194.png">   

위의 그림은 arr 변수는 스택에 저장되어 있으며 실제 2차원배열은 힙 메모리 영역에 저장되어 있다.   
각각 arr[0], arr[1]영역은 실제 2,3,7 / 6,7,9 값을 가지고 있는 곳을 가르키고 있다.   


- - -

## 7. 타입 추론, var  

타입추론이란 타입이 정해지지 않은 변수에 대해서 컴파일러가 변수의 타입을 스스로 찾아낼 수 있도록 
하는 기능이다.   

Java10부터 var 구문이 생겼다. var 문법을 통해 변수를 선언하게 되면 컴파일러가 알아서 변수의 
타입을 결정한다.  

type infer 할곳에 var를 붙여준다.   
`반드시 초기화를 해줘야하며, null은 타입추론을 하지 못한다.`    

```java
var a;         // error : cannot infer type for local variable a.
var b = null;  // error : cannot infer type for local variable b.
var c = "abc"; // ok!
```


- - - 

**Reference**

[https://stage-loving-developers.tistory.com/8](https://stage-loving-developers.tistory.com/8)    
[https://codingdog.tistory.com/entry/java-1%EC%B0%A8%EC%9B%90-2%EC%B0%A8%EC%9B%90-%EB%B0%B0%EC%97%B4-%EA%B0%84%EB%8B%A8%ED%95%9C-%EC%98%88%EC%A0%9C%EB%A5%BC-%EB%B3%B4%EA%B3%A0-%EB%B0%B0%EC%9B%8C%EB%B4%85%EC%8B%9C%EB%8B%A4](https://codingdog.tistory.com/entry/java-1%EC%B0%A8%EC%9B%90-2%EC%B0%A8%EC%9B%90-%EB%B0%B0%EC%97%B4-%EA%B0%84%EB%8B%A8%ED%95%9C-%EC%98%88%EC%A0%9C%EB%A5%BC-%EB%B3%B4%EA%B3%A0-%EB%B0%B0%EC%9B%8C%EB%B4%85%EC%8B%9C%EB%8B%A4)   
[https://medium.com/webeveloper/%EC%9E%90%EB%B0%94-%ED%98%95%EB%B3%80%ED%99%98-casting-promotion-%EA%B3%BC-%EB%B0%94%EC%9D%B8%EB%94%A9-binding-ef3e453eb8a6](https://medium.com/webeveloper/%EC%9E%90%EB%B0%94-%ED%98%95%EB%B3%80%ED%99%98-casting-promotion-%EA%B3%BC-%EB%B0%94%EC%9D%B8%EB%94%A9-binding-ef3e453eb8a6)    
[https://ict-nroo.tistory.com/19](https://ict-nroo.tistory.com/19)    
[https://programmers.co.kr/learn/courses/5/lessons/231](https://programmers.co.kr/learn/courses/5/lessons/231)   
[https://gbsb.tistory.com/6](https://gbsb.tistory.com/6)   
[https://github.com/whiteship/live-study/issues/2](https://github.com/whiteship/live-study/issues/2)        

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

