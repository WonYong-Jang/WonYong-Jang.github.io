---
layout: post
title: "[Spring] Java Configuration을 이용한 설정 "
subtitle: "@Bean 과 @Component 차이 / @Configuration  "
comments: true
categories : Spring
date: 2020-05-30
background: '/img/posts/spring.png'
---

## Java Configuration으로 지시서 작성방식 변경  

XML 설정파일 대신 자바 클래스를 새로 생성하여 클래스 상단에 @Configuration을 적용하여 지시서를 
작성할 수 있다.  
<img width="800" alt="스크린샷 2020-05-30 오후 4 44 03" src="https://user-images.githubusercontent.com/26623547/83322700-d3c53e00-a294-11ea-969c-b00f85c074d2.png">   
> @Bean으로 선언된 메소드 이름을 bean 이름으로 IoC 컨테이너에 담는다. (exam 으로 담는다)   


<img width="598" alt="스크린샷 2020-05-30 오후 10 04 44" src="https://user-images.githubusercontent.com/26623547/83328953-acd13100-a2c1-11ea-8a24-9de63cf384d6.png">   

<br>
## @Bean 과 @Component 차이 
- - -

##### @Bean  

`개발자가 컨트롤이 불가능한 외부 라이브러리를 Bean으로 등록하고 싶은 경우에 사용된다.`   
ex) JDBC 라이브러리   

즉, 개발자가 생성한 Class에 @Bean 선언이 불가능하다!   
@bean은 @Configuration으로 선언된 클래스 내에 있는 메소드 선언으로 사용한다.      

**이 메소드가 반환하는 객체가 bean이 되며 default로 메소드 이름이 bean의 이름이 된다.**   

##### @Component   

`개발자가 직접 작성한 Class들의 경우에 @Component를 사용하여 bean으로 등록한다.`      

**@Component는 클래스 상단에 적으며 default로 클래스 이름이 bean의 이름이 된다.**  

---

Reference   

[http://www.newlecture.com](http://www.newlecture.com)   


{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

