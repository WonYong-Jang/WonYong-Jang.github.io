---
layout: post
title: "[Spring] Dependency Injection"
subtitle: "종속성 주입 ( 부품 조립 )"
comments: true
categories : Spring
date: 2020-05-18
background: '/img/posts/spring.png'
---

# Dependency Injection

Spring 프레임워크는 3가지 핵심 프로그래밍 모델을 지원하고 있는데, 
       그 중 하나가 의존성 주입(Dependency Injection, DI)이다.    
`DI란 외부에서 두 객체 간의 관계를 결정해주는 디자인 패턴으로, 
    인터페이스를 사이에 둬서 클래스 레벨에서는 의존관계가 고정되지 
    않도록 하고 런타임 시에 관계를 다이나믹하게 주입하여 유연성을 
    확보하고 결합도를 낮출 수 있게 해준다.`   

> Spring 프레임워크 3가지 핵심 프로그래밍 모델은 DI/IoC, PSA, AOP이다.   

여기서 의존성이란 한 객체가 다른 객체를 사용할 때 의존성이 있다고 한다.   

`스프링에서 DI는 의존성(종속성) 주입라고 하는데 부품 조립이라고 생각하면 이해하기 쉽다.`        
`즉, 객체를 직접 생성하는 것이 아니라 외부에서 생성한 후 주입 시켜주는 방식이다.`      

예를 들어 다음과 같이 Store 객체가 Pencil 객체를 사용하고 있는 경우에 
우리는 Store객체가 Pencil 객체에 의존성이 있다고 표현한다.   

```java
public class Store { 
    private Pencil pencil; 
}
```

<img width="494" alt="스크린샷 2022-03-28 오후 11 38 10" src="https://user-images.githubusercontent.com/26623547/160422777-2367d5e6-fbaa-4455-86fd-3146c4d645b2.png">   

그리고 두 객체 간의 관계(의존성)를 맺어주는 것을 의존성 주입이라고 하며, 
    생성자 주입, 필드 주입, 수정자 주입 등 다양한 주입 방법이 있다.   

<img width="420" alt="스크린샷 2022-03-28 오후 11 38 15" src="https://user-images.githubusercontent.com/26623547/160422790-ebb336e6-a499-4e35-a5ff-edc356682bcd.png">   

## 의존성 주입이 필요한 이유   

예를 들어 연필이라는 상품과 1개의 연필을 판매하는 Store 클래스가 있다고 하자.   

```java
public class Pencil {
}
```

```java
public class Store {
    private Pencil pencil;
    public Store() {
        this.pencil = new Pencil();   
    }
}
```   

위와 같은 예시는 다음과 같은 문제점을 가지고 있다.   

- 두 클래스가 강하게 결합되어 있다.  
- 객체들 간의 관계가 아니라 클래스 간의 관계가 맺어지고 있다.   

##### 1. 두 클래스가 강하게 결합되어 있다.   

위와 같은 Store 클래스는 현재 Pencil 클래스와 `강하게 결합되어 있다는 문제점`을 
가지고 있다.   
두 클래스가 강하게 결합되어 있어서 만약 Store에서 Pencil이 아닌 Food와 
같은 상품을 판매하고자 한다면 Store 클래스의 생성자에 변경이 필요하다.   
즉, 유연성이 떨어진다.    

> 이에 대한 해결책으로 상속을 떠올릴 수 있지만, 상속은 제약이 많고 
확장성이 떨어지므로 피하는 것이 좋다.   

##### 2. 객체들 간의 관계가 아니라 클래스 간의 관계가 맺어지고 있다.   

또한 위의 Store와 Pencil는 객체들 간의 관계가 아니라 클래스들 간의 
관계가 맺어져 있다는 문제가 있다.    
올바른 객체지향적 설계라면 객체들 간에 관계가 맺어져야 하지만 현재는 
Store 클래스와 Pencil 클래스가 관계를 맺고 있다.   
객체들 간에 관계가 맺어졌다면 다른 객체의 구체 클래스(Pencil 또는 Food)를 
전혀 알지 못하더라도, (해당 클래스가 인터페이스를 구현했다면) 인터페이스 
타입(Product)으로 사용할 수 있다.   

`결국 위와 같은 문제점이 발생하는 근본적인 이유는 Store에서 불필요하게 
어떤 제품을 판매할 지에 대한 관심이 분리되지 않았기 때문이다.`   

Spring에서는 DI를 적용하여 이러한 문제를 해결하고자 하였다.   

## 의존성 주입을 통한 해결   

`위와 같은 문제를 해결하기 위해서는 우선 다형성이 필요하다.`  
Pencil, Food 등 여러가지 제품을 하나로 표현하기 위해서는 Product라는 
Interface가 필요하다.   
그리고 Pencil에서 Product 인터페이스를 우선 구현해주도록 하자.   

```java
public interface Product {
}
```

```java
public class Pencil implements Product {
}
```

이제 우리는 Store와 Pencil이 강하게 결합되어 있는 부분을 제거해 주어야 한다.  
`이를 제거하기 위해서는 다음과 같이 외부에서 상품을 주입받아야 한다.`   



- - - 

## 실습 

Exam 이라는 인터페이스가 있고 그 인터페이스를 구현한 NewLecExam 클래스가 있다.    
ExamConsole이라는 인터페이스는 출력 방식에 따라 InlineExamConsole 과 GridExamConsole를 
사용하는데 Exam 객체를 주입하여 출력해준다. 


<img width="211" alt="스크린샷 2020-05-18 오후 10 24 13" src="https://user-images.githubusercontent.com/26623547/82218347-bc15bd80-9956-11ea-8eec-a078ea1864f1.png">

#### 스프링 DI를 사용하지 않고 직접 구현    
<img width="572" alt="스크린샷 2020-05-18 오후 10 22 17" src="https://user-images.githubusercontent.com/26623547/82218363-c1730800-9956-11ea-82a3-c9c68b13f86a.png">

> Exam 과 ExamConsole 인터페이스 
<img width="700" alt="스크린샷 2020-05-18 오후 10 31 11" src="https://user-images.githubusercontent.com/26623547/82218783-5e35a580-9957-11ea-9c45-4d76954a3c39.png">

> Exam 인터페이스를 받아 구현   
<img width="300" alt="스크린샷 2020-05-18 오후 10 34 46" src="https://user-images.githubusercontent.com/26623547/82219289-05b2d800-9958-11ea-9262-334620415e1e.png">

> 출력 방식에 따른 console 구현
<img width="900" alt="스크린샷 2020-05-18 오후 10 35 55" src="https://user-images.githubusercontent.com/26623547/82219292-08adc880-9958-11ea-9a54-d4314554dfdd.png">

<br>
#### 스프링 Application Context 를 이용 

`DI 지시서를 읽어서 생성해주고 조립해주는 스프링의 객체 이름`   
`Application Context는 인터페이스이며, 실질적으로 구현하는 대표적인 예는 ClassPathXmlApplicationContext`   

Application Context가 관리하는 객체들을 **Bean**이라고 부르며, Bean과 Bean 사이의 
의존관계를 처리하는 방식을 XML, 어노테이션, Java 설정 방식을 이용가능    

> 사용하기 전 spring-context 라이브러리를 메이븐 또는 그래들에 추가

- Program.java   
<img width="550" alt="스크린샷 2020-05-19 오후 9 01 37" src="https://user-images.githubusercontent.com/26623547/82324158-26406800-9a14-11ea-8424-92a2b9051e19.png">

- setting.xml ( Ref 형식 DI )
<img width="550" alt="스크린샷 2020-05-19 오후 9 02 15" src="https://user-images.githubusercontent.com/26623547/82324171-2d677600-9a14-11ea-826c-67bbcc69ea53.png">

- 위의 setting.xml 에서 console을 GridExamConsole을 사용하도록 설정한 상태에서 
InlineExamConsole로 변경하려면 ?

`자바 소스코드는 변경이 필요 없고 DI 설정 파일인 setting.xml의 console 설정 부분만 변경하면 된다! `   
`스프링 DI를 사용함으로써 소스코드 유지보수가 쉽고 Loose coupling을 통해 유연한 변경이 가능 `   

- setting.xml( 값 형식 DI )   
<img width="435" alt="스크린샷 2020-05-24 오후 4 50 16" src="https://user-images.githubusercontent.com/26623547/82748941-cca7b700-9de0-11ea-9e20-4b541ba9bd73.png">   

- setting.xml( 생성자 형식 DI )   
<img width="460" alt="스크린샷 2020-05-24 오후 5 08 19" src="https://user-images.githubusercontent.com/26623547/82748999-33c56b80-9de1-11ea-8205-d27dd69209fb.png">   

- setting.xml( 네임스페이스 형식 DI )   
<img width="809" alt="스크린샷 2020-05-24 오후 5 43 01" src="https://user-images.githubusercontent.com/26623547/82749733-337b9f00-9de6-11ea-816e-4c1c55af56e7.png">   
> 위 처럼 소스 유지보수를 위해 네임스페이스를 적극 활용 할 것 

##### 콜렉션 형식 DI   

- Program.java   
<img width="489" alt="스크린샷 2020-05-24 오후 6 25 06" src="https://user-images.githubusercontent.com/26623547/82750556-f31f1f80-9deb-11ea-8700-bdaa7c8dbd2b.png">   


- setting.xml( 생성자를 통해 Colletion 목록을 추가하는 DI )    
<img width="540" alt="스크린샷 2020-05-24 오후 6 05 55" src="https://user-images.githubusercontent.com/26623547/82750168-3deb6800-9de9-11ea-90d3-c963845cdf90.png">   
> 위의 소스는 ArrayList 사이즈는 2이며, 생성자 안의 list 태그는 목록을 단지 
셋팅 할 뿐 객체 자체를 만들지 못한다!!   

- setting.xml( Colletion 을 개별적으로 생성 )    
<img width="482" alt="스크린샷 2020-05-24 오후 6 24 50" src="https://user-images.githubusercontent.com/26623547/82750553-eef30200-9deb-11ea-991f-61bcf9397b8b.png">    
네임스페이스 이용(xmlns:util="http://www.springframework.org/schema/util)   
`실제로 객체를 만들어서 개별적으로 사용 가능하다.`    



---

<https://mangkyu.tistory.com/150>  
<http://www.newlecture.com>   


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

