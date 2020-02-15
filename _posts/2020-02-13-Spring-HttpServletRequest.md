---
layout: post
title:  "스프링 HttpServletRequest"
commnets : true
date:   2020-02-13
---

**Spring 에서 HttpServletRequest 접근**
Java에서 HttpServletRequest에 대한 접근은 제한이 있습니다. servlet, filter, interceptor, AOP, controller 정도에서만
접근이 가능합니다. 

**Spring RequestContextHolder**
Spring RequestContextHolder는 Spring 2.x부터 제공되던 기능으로 controller, service, DAO 전 구간에서
HttpServletRequest에 접근할수 있도록 도와줍니다.

**getParameter() 와 getAttribute() 의 차이점**

- getParameter()   
값이 어떤것이든 String 타입을 리턴한다.  
또한, 웹브라우저에서 전송받은 request영역의 값을 읽어온다. 
Client 에서 Server 로 전달한다. ex) http://example.com/servlet?parameter=1   

- getAttribute()
Object 타입을 리턴하기 때문에 주로 빈 객체나 다른 클래스를 받아올때 사용된다.(형변환을 하고 사용)   
setAttribute()속성을 통한 설정이 없으면 무조건 null값을 리턴한다.   
서버사이드에서 사용하기때문에 똑같은 request 안에서 사용할수 있다.(setAttribute 사용)

