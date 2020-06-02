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

`스프링에서 DI는 종속성 주입라고 하는데 부품 조립이라고 생각 할 것!`   
`객체를 직접 생성하는 것이 아니라 외부에서 생성한 후 주입 시켜주는 방식!`   

A라는 클래스안에 B라는 클래스를 2가지 방법으로 객체화 해서 사용하고 있다.   

- Composition : A클래스가 생성될때 B를 부품 처럼 가지기 때문에 일체형!  
> 여기서 B를 종속 객체라고 하는데 B는 A의 부품이라고 생각!

- Association : setter를 이용하여 B라는 부품을 조립하여 사용하는 조립형!
> 실제 프로그램에서는 조립형을 사용하는게 Loose coupling에 유리하다.

<img width="600" alt="스크린샷 2020-05-17 오후 9 31 17" src="https://user-images.githubusercontent.com/26623547/82146521-e9466b00-9885-11ea-973a-deb3a53f9d0c.png">

#### 1. Setter Injection

```java
B b = new B(); // 부품을 Dependency라고 한다면
A a = new A();
a.setB(b);     // 해당 부품 B를 A에 Injection
```

#### 2. Construction Injection

```
B b = new B(); // 부품을 Dependency라고 한다면
A a = new A(b);
```
<br>
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

[http://www.newlecture.com](http://www.newlecture.com)


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

