---
layout: post
title: "[Spring] Spring Web Security"
subtitle: "스프링 시큐리티 개념과 로그인 처리"
comments: true
categories : Spring
date: 2020-04-29
background: '/img/posts/spring.png'
---

<h2 class="section-heading">스프링 시큐리티 소개</h2>

<p><b>스프링 기반 어플리케이션 보안(인증과 권한)을 담당하는 프레임워크이며, 
    filter 기반으로 동작하기 때문에 spring MVC와 분리되어 관리 및 동작한다.</b></p>

<p><b>Authentication(인증) : 현재 유저가 누구인지 스스로 증명, 애플리케이션의 작업을 수행할 수 있는 주체임을 증명하는 과정<br> ex) 사용자 id, pw 를 이용하여 증명</b></p>

<p><b>Authorization(권한부여) : 인증을 통해 인증된 주체를 하나 이상의 권한을 부여해 보호되는 자원들에 대한 접근 가능 여부를 할당 하는 것 <br>ex) 인증이 되었더라도 
                                권한이 없다면 사용할수 없는 게시판이 존재함 </b></p>


<p>스프링 웹 시큐리티를 이용하면 다음과 같은 작업을 간편하게 처리가 가능하다. 
기본 동작 방식은 서블릿의 여러 종류의 필터와 인터셉터를 이용해서 처리된다. 필터는 서블릿에서
 말하는 단순한 필터를 의미하고, 인터셉터는 스프링에서 필터와 유사한 역할을 한다.</p>
<pre>
- 로그인 처리와 CSRF 토큰 처리
- 암호화 처리
- 자동로그인
- JSP에서 로그인 처리
</pre>

<p>필터와 인터셉터는 특정한 서블릿이나 컨트롤러에 접근에 관여한다는 점에서는 유사하지만 
결정적인 차이는<u> 필터는 스프링과 무관하게 서블릿 자원이고, 인터셉터는 스프링의 빈으로 
관리되면서 스프링의 컨텍스트 내에 속한다는 차이!</u></p>

<img width="600" alt="스크린샷 2020-04-29 오후 8 53 08" src="https://user-images.githubusercontent.com/26623547/80593145-9bdf9680-8a5b-11ea-967c-ffd81ad44f8a.png">

<p>스프링 내부에서 컨트롤러를 호출할 때 관여하기 때문에 스프링의 컨텍스트 내에 있는 모든 
자원을 활욜 가능하다. 스프링 시큐리티를 이용하게 되면 위와 같이 인터셉터와 필터를 이용하면서 
별도의 컨텍스트를 생성해서 처리한다. <u>즉, 현재 동작하는 스프링 컨텍스트 내에서 동작하기 때문에 
이미 컨텍스트에 포함된 여러 빈들을 같이 이용해서 다양한 인증 처리가 가능하도록 설계 가능하다.</u></p>


<h2 class="section-heading">스프링 시큐리티 커스텀 로그인 </h2>

<p>스프링 시큐리티에서 기본적으로 로그인 페이지를 제공하기는 하지만 화면 디자인과 여러 기능 문제로 
로그인 페이지를 다시 제작해서 사용</p>


```html
    <!-- <security:form-login /> -->
    <security:form-login login-page="/customLogin" />
```

<p>아래는 스프링 시큐리티 커스텀 로그인 기본값이며, 속성값을 변경하기 위해서는 
context-security.xml을 변경하면 된다.</p>

<pre>
- form 태그의 action 속성값은 POST /login
- 아이디 입력 input 태그의 name 속성값은 username 
- 비밀번호 입력 input 태그의 name 속성값은 password
- CSRF 토근을 같이 전송한다.
</pre>


{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

