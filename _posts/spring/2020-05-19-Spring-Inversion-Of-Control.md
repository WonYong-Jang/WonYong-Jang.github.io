---
layout: post
title: "[Spring] Inversion Of Control"
subtitle: "스프링 컨테이너(IoC컨테이너) 와 Bean"
comments: true
categories : Spring
date: 2020-05-19
background: '/img/posts/spring.png'
---

# 컨테이너란? 

Spring은 거대한 컨테이너임과 동시에 IoC/DI를 기반으로 하고 있는 프레임워크이다.    

여기서 `컨테이너는 보통 인스턴스의 생성과 소멸과 같은 생명주기를 관리하며, 
    생성된 인스턴스들에게 추가적인 기능을 제공한다.`       

> 스프링 컨테이너는 스프링 프레임워크의 핵심부에 위치하며, 종속객체 주입을 이용하여 
애플리케이션을 구성하는 컴포넌트들을 관리한다.   

<br>
## 스프링 컨테이너의 두 종류    
- - - 
### 1. 빈팩토리 BeanFactory   

DI의 기본사항을 제공하는 컨테이너이며 팩토리패턴(디자인패턴)을 구현 한것   
[팩토리패턴 개념](https://wonyong-jang.github.io/java/2020/05/17/Java-Loose-coupling.html)   

>  빈의 정의는 즉시 로딩하는 반면, 빈 자체가 필요하게 되기 전까지 
인스턴스화 하지 않는다 (lazy loading, 게으른 호출)      
<img width="650" alt="스크린샷 2020-05-23 오후 3 58 53" src="https://user-images.githubusercontent.com/26623547/82724074-65213700-9d0e-11ea-8ebc-b1d9281cfc9b.png">   

getBean()이 호출되면, 팩토리는 의존성 주입을 이용해 빈을 인스턴스화하고 빈의 특성을 설정하기 시작하고  
여기서 부터 빈의 일생이 시작된다.   

<br>
### 2. 어플리케이션 컨텍스트 ApplicationContext   

빈팩토리와 유사한 기능을 제공하지만 좀 더 많은 기능을 제공하는 어플리케이션 컨텍스트    
**getBean()이 호출된 시점에서야 해당 빈을 생성하는 빈팩토리와 달리, 컨텍스트 초기화시점에 
모든 싱글톤 빈을 미리 로드해 놓는다.**   

> 따라서 애플리케이션 기동 후에는 빈을 지연 없이 얻을 수 있다! ( 미리 빈을 
        생성해 놓아 빈을 필요할 때 즉시 사용할 수 있도록 보장)   

빈팩토리 보다 추가적으로 제공하는 기능   
- 국제화가 지원되는 텍스트메시지를 관리해 준다.  
- 이미지같은 파일자원을 로드 할 수 있는 포괄적인 방법을 제공해준다.   
- 리스너로 등록된 빈에게 이벤트 발생을 알려준다.   

> 따라서 대부분의 애플리케이션에서는 빈팩토리보다 어플리케이션 컨텍스트를 사용하는 것이 좋다.   

가장 많이 사용되는 어플리케이션 컨텍스트 구현체
- ClassPathXmlApplicationContext : 클래스패스에 위치한 xml 파일에서 컨텍스트 정의 내용을 읽어들인다.   
- FileSystemxmlApplicationContext : 파일 경로로 지정된 xml 파일에서 컨텍스트 정의 내용을 읽어들인다.   
- XmlWebApplicationContext : 웹 어플리케이션에 포함된 xml파일에서 컨텍스트 정의 내용을 읽어들인다.   

<img width="650" alt="스크린샷 2020-05-23 오후 4 09 27" src="https://user-images.githubusercontent.com/26623547/82724323-2ee4b700-9d10-11ea-86b9-653bdc6ad78d.png">

`스프링의 IoC컨테이너는 일반적으로 Application Context를 말한다.(정확히는 
       ApplicationContext인터페이스를 구현한 클래스의 오브젝트)`    

- - -

# Inversion Of Control

제어의 역전이라는 뜻으로 `외부에서 제어를 한다는 것이다!`   
이는 바로 컨테이너를 의미하는 것으로 
기존에 자바 기반으로 어플리케이션을 개발할 때 직접 new 연산자를 통해 생성하고 서로간의 의존관계를 연결시키는 
작업에 대한 제어권은 보통 개발자들이 하였지만 
제어권을 스프링 컨테이너가 가져감으로써 애플리케이션 내에서 사용되는 객체의 생성과 소멸(LifeCycle)을 
프레임워크가 담당하겠다는 것이다.   

`스프링이 모든 의존성 객체를 스프링이 실행될때 다 만들어주고 필요한 곳에 
주입시켜줌으로써 Bean들은 싱글턴 패턴의 특징을 가지며, 제어의 흐름을 사용자가 
컨트롤 하는 것이 아니라 스프링에게 맡겨 작업을 처리하게 된다!`

> IoC란 객체의 생성에서 생명주기의 관리까지 모든 객체에 대한 제어권이 바뀌었다는 것(IoC 컨테이너)  

<img width="495" alt="스크린샷 2020-05-19 오후 10 14 17" src="https://user-images.githubusercontent.com/26623547/82330753-33625480-9a1e-11ea-89e2-6c7066a6c3f7.png">

위 처럼 미리 객체를 IoC 컨테이너에 만들어 놓고 그 객체를 주입받아서 사용 한다면, 
    객체끼리의 불필요한 의존성을 없애거나 줄일 수 있게 된다.

### 자바 빈 VS 스프링 빈   
--- 
#### 1. 자바빈

데이터를 표현하는 것을 목적으로 하는 자바 클래스이다. 
1. 모든 필드가 private이며, getter/setter메서드를 통해서만 접근 가능   
2. 기본 생성자 존재   
3. java.io.Serializable 인터페이스를 구현한다.   

> 자바 빈의 목적은 여러가지 오브젝트들을 하나의 오브젝트에 담기위함이며, 보통 
네트워크를 통해 전송하거나 파일/데이터베이스에 저장한다. 메모리에 존재하는 오브젝트를 
네트워크를 통해 전송하거나 파일에 저장하려면 data stream(byte[])으로 오브젝트를 변환시켜야 한다. 
이 변환 작업을 위해 Serializable을 사용한다.  



#### 2. 스프링 빈 

Beans는 우리가 컨테이너에 공급하는 설정 메타 데이터(XML 파일)에 의해 생성된다.   
`컨테이너는 이 메타 데이터를 통해 Bean의 생성, Bean Life Cycle, Bean Dependency(종속성) 등을 알 수 있다.`   
애플리케이션의 객체가 지정되면, 해당 객체는 getBean() 메서드를 통해 가져올 수 있다.   

`즉, 스프링 IoC 컨테이너에 의해서 관리되고 어플리케이션의 핵심을 이루는 객체들을 스프링에서 bean이라 부른다.`   

> 우리 new 연산자로 어떤 객체를 생성했을 때 객체는 bean이 아니며, ApplicationContext가 만들어서 그 안에 담고 있는 객체를 의미한다. ApplicationContext.getBean()으로 얻어질 수 있는 객체가 Bean이다!  

**스프링 Bean Scope**

`스프링 bean은 별도의 scope를 지정하지 않으면 Default는 singleton으로 생성하여 관리한다!`   
구체적으로는 애플리케이션 구동시 JVM 안에서 스프링이 bean마다 하나의 객체를 생성하는 것을 의미한다.   
그래서 우리는 스프링을 통해서 bean을 제공받으면 언제나 주입받은 bean은 동일한 객체라는 가정하에 개발한다.   




---

Reference   

[http://www.newlecture.com](http://www.newlecture.com)   
[https://limmmee.tistory.com/13](https://limmmee.tistory.com/13)


{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

