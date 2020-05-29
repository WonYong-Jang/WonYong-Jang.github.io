---
layout: post
title: "[Spring] @Component 를 이용한 빈 객체 생성"
subtitle: "@Controller, @Service, @Repository, @Value"
comments: true
categories : Spring
date: 2020-05-29
background: '/img/posts/spring.png'
---

## Component 어노테이션  
- - -

DI를 하기 위해서는 클래스들을 빈으로 등록해야 하고 빈을 등록하기 위해 xml 설정파일 혹은 
클래스 위에 어노테이션 추가를 통해서 빈 등록을 할 수 있다.    

```
<bean id="console" class = "spring.di.ui.InlineExamConsole">
```

> 위와 같이 XML 설정했던 빈을 제거하여 아래처럼 클래스 위에 직접 @Component 어노테이션 추가해
빈 생성!!
<img width="800" alt="스크린샷 2020-05-28 오후 10 15 58" src="https://user-images.githubusercontent.com/26623547/83146157-d575f100-a130-11ea-9172-5636c75ec2bd.png">   

`@Component를 사용한 클래스들을 bean 등록하기 위해 자동으로 Scan하여 Bean으로 등록해주는 Component scan을 반드시 사용해야 한다!`   
`Component scan는 자동으로 bean을 등록해주고 내부에 등록된 Autowired, Qualifier 등 어노테이션을 
찾아서 주입까지 해준다.`   

따라서 기존에 작성했었던 <del>context:annotation-config</del>은 Bean을 생성하는게 아니라 
생성된 bean 내부 어노테이션을 탐색만 하므로 제거해도 된다. 


```
- 자바 config 클래스를 사용한다면 @ComponentScan 어노테이션을 사용   
- XML 설정파일을 사용한다면 <context:component-scan base-package=""/> 사용   
- @Component("console") // XML 설정파일의 bean id를 지정했던 것처럼 지정 가능하다.   
```

- - - 

### Component 종류

`개발자가 직접 작성한 Class를 Bean으로 등록하기 위한 어노테이션이다.`   

**Component를 구체화하여 상속받고 있는 어노테이션이 @Controller, @Service, @Repository 이다.**      

모두 동일하게 IoC 컨테이너에 의해 자동으로 생성되어 Bean을 생성하지만, @Component를 사용하는 것보다  
MVC 구성으로 각 역할에 맞는 어노테이션을 사용하는 것을 권장한다.   

<img width="596" alt="스크린샷 2020-05-27 오후 11 00 32" src="https://user-images.githubusercontent.com/26623547/83140771-91cbb900-a129-11ea-9142-938a1331a230.png">

- - - 

## Value 어노테이션

`스프링에서 텍스트 파일로 변수값을 선언하고 싶을 때 (보통 이런 변수값들을 프로퍼티 라고 함) 사용한다.`   

#### 사용 이유 

- 사용이유는 프로젝트가 커지다 보면 공통으로 사용하는 값을 별도로 관리를 하게 되는데 
이런 값들을 쉽게 가져다 쓰기 위해 사용한다.   

- 서버환경에 종속적인 정보가 있다면 애플리케이션의 구성정보에서 분리하기 위해서다.(로컬, 개발, 
        운영에 대한 DB 정보가 다를 때)    

- 설정정보를 자바소스코드와 분리 했을 때 수정 후 매번 컴파일이 필요가 없게 된다!   

#### 설정 방법   

1)  프로퍼티 파일 생성

보통 resources/ 파일 밑에 config.properties 파일 생성 

> 파일 내용 작성   
<img width="150" alt="스크린샷 2020-05-29 오후 9 56 13" src="https://user-images.githubusercontent.com/26623547/83262141-6a432200-a1f7-11ea-934c-b4bf4775c0e2.png">   

2) 설정파일에 프로퍼티 파일 선언

<img width="600" alt="스크린샷 2020-05-29 오후 9 56 44" src="https://user-images.githubusercontent.com/26623547/83262155-70d19980-a1f7-11ea-81cd-490b686c8ef0.png">   

3)  선언한 프로퍼티 사용 

<img width="320" alt="스크린샷 2020-05-29 오후 9 52 50" src="https://user-images.githubusercontent.com/26623547/83262162-75964d80-a1f7-11ea-8fd3-f912e3f1cabd.png">   



---

Reference   

[http://www.newlecture.com](http://www.newlecture.com)   


{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

