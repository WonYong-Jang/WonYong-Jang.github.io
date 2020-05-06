---
layout: post
title: "[Spring] MVC1 vs MVC2"
subtitle: "MVC1 패턴과 MVC2 패턴 차이 및 Spring MVC 처리 방식 "
comments: true
categories : Spring
date: 2020-03-16
background: '/img/posts/spring.png'
---

<h2 class="section-heading">MVC 란?</h2>

<p><u> MVC 란 Model, View, Controller을 가르키며, 사용자 인터페이스와 비즈니스 로직을 분리하여 웹 개발하는 아키텍쳐</u></p>

<p>1) Model</p>
프로그램의 정보(데이터)를 말한다.  JSP 를 통해 예시를 들면 Bean 안에 있는 정보를 model 에 
해당한다고 할수 있다.
<p>2) Controller</p>
데이터와 비즈니스 로직간의 상호 작용을 뜻한다.
<p>3) View</p>
<p>사용자 인터페이스 요소를 뜻한다(유저에게 보여지는 것)</p>

<br/>
<h3>1. MVC1 패턴</h3>
<br/>
<img width="700" alt="스크린샷 2020-03-16 오후 10 17 24" src="https://user-images.githubusercontent.com/26623547/76762662-0488f180-67d5-11ea-8a21-70d44055c73f.png">
<br/><br/>
<p>JSP 단에서 View와 Controller의 역할을 같이 수행한다.(모든 클라이언트 요청과 응답을 JSP 가 담당) </p>
<p>Bean Model의 역할을 가지고 있다.</p>

<p><b>- 장점 </b></p>
<p><u>단순한 페이지 작성으로 쉽게 구현 가능하다(개발 쉬움), 구조가 간단하다</u></p>

<p><b>- 단점</b></p>
<p><u>애플리케이션이 복잡해지면 개발과 유지보수가 어려워지고 개발자와 디자이너간 역할 분담이 어려워진다.</u></p>
<br/>
<h3>2. MVC2 패턴</h3>
<br/>
<img width="700" alt="스크린샷 2020-03-16 오후 10 17 29" src="https://user-images.githubusercontent.com/26623547/76762713-1f5b6600-67d5-11ea-9c02-1210b9c42b97.png">
<br/><br/>
<p>들어오는 요청을 다루는 서블릿 단이 있고, 이 서블릿 단이 Controller 역할을 수행한다.</p>
<p>Controller는 다음 작업을 결정하고 모든 작업 후 JSP 단에 어떻게 뿌려질지를 결정 한다.</p>

<p><b>- 장점</b></p>
<p><u>어플리케이션이 복잡하여도 controller와 view 의 분리로 개발과 유지보수, 확장이 용이하다. </u></p>

<p><b>- 단점</b></p>
<p><u>개발이 어렵다(구조 설계를 위한 충분한 시간이 필요하며 높은 수준의 이해가 필요하다)</u></p>

<h2 class="section-heading">스프링 MVC 처리 순서 </h2>

<img width="768" alt="스크린샷 2020-03-16 오후 10 45 11" src="https://user-images.githubusercontent.com/26623547/76764271-e4a6fd00-67d7-11ea-858b-61ae99f8e6f9.png">
<p><b>1) client 가 서버에 어떤 요청을 한다면 스프링에서 제공하는 dispatcherServlet이라는 클래스가 요청을
가로챈다</b></p>
(web.xml 에 살펴보면 모든 url( / ) 에 서블릿 매핑을 하여 모든 요청을 dispatcherServlet이 가로채게 해둠)
<p><b>2) 그 후 dispatcherServlet은 handlerMapping에게 어떤 컨트롤러에게 요청을 위임하면 좋을지 물어본다.</b></p>
(servlet-context.xml 에서 @Controller로 등록한 것들을 스캔해서 찾아줌)
<p><b>3) 요청에 매핑된 컨트롤러가 있다면 @RequestMapping을 통하여 요청을 처리할 메서드에 도달한다.</b></p>
<p><b>4) 컨트롤러에서는 해당 요청을 처리할 Service를 주입(DI)받아 비즈니스 로직을 Service에게 위임한다.</b></p>
(예를들면 로그인에 필요한 서비스인 LoginService를 @Inject 라는 어노테이션을 통해 주입)
<p><b>5) Service에서는 요청에 필요한 작업 대부분(코딩)을 담당하며 DB에 접근이 필요하면 DAO를 주입받아 DB처리를 DAO에게 위임한다.</b></p>
<p><b>6) DAO 는 sql 쿼리를 날려 DB의 정보를 받아 서비스에게 다시 돌려줌</b></p>
(이때 보통 VO(dto)를 컨트롤러에서 부터 내려받아 쿼리의 결과를 VO에 담는다)
사용 이유는 효율적인 커넥션 관리와 보안성 때문이다. 
<p><b>7) 모든 로직을 끝낸 서비스가 결과를 컨트롤러에게 넘긴다.</b></p>
<p><b>8) 결과를 받은 컨트롤러는 model 객체에 결과물을 어떤 View(jsp) 파일로 보여줄 것인지 등의 정보를 담아 
dispatcherServlet에게 보낸다.</b></p>
<p><b>9) DispatcherServlet은 viewResolver에게 받은 뷰의 대한 정보를 넘긴다.</b></p>
<p><b>10) 여기서 viewResolver는 해당 jsp 를 찾아서(응답할 view를 찾음) DispatcherServlet에게 알려준다.</b></p>
(servlet-context.xml 에서 suffix, prefix를 통해 /WEB-INF/views/index.jsp 이렇게 만들어주는 것도 ViewResolver)
<p><b>11) DispatcherServlet은 응답할 View 에게 Render를 지시하고 View는 응답 로직을 처리</b></p>



{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

