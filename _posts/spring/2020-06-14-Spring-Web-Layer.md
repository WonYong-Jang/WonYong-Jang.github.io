---
layout: post
title: "[Spring] Web Layer(웹 계층)"
subtitle: "Web, Service, Repository, Dtos, Domain"
comments: true
categories : Spring
date: 2020-06-14
background: '/img/posts/spring.png'
---

<img width="624" alt="스크린샷 2020-06-14 오후 5 33 35" src="https://user-images.githubusercontent.com/26623547/84589073-2a22a700-ae67-11ea-99c8-4ce1086150df.png">
- - -

## 1. Web Layer 

- 흔히 사용하는 Controller와 JSP/Freemaker 등의 뷰 템플릿 영역이다.   
- 이외에도 필터(@Filter), 인터셉터, 컨트롤러 어드바이스(@ControllerAdvice) 등 
`외부 요청과 응답에 대한 전반적인 영역을 의미한다.`   

## 2. Service Layer  

- @Service에 사용되는 서비스 영역이다.   
- 일반적으로 Controller와 DAO의 중간 영역에서 사용된다.  
- @Transactional이 사용되어야 하는 영역이기도 하다.   

## 3. Repository Layer

- Database와 같이 데이터 저장소에 접근하는 영역이다.   
- Dao(Data Access Object) 영역이라고 생각하면 된다.   

## 4. Dtos

- Dto ( Data Transfer Object)는 `계층 간에 데이터 교환을 위한 객체`를 의미하며, 
    Dtos는 이들의 영역을 의미한다.   
- 예를 들어 뷰 템플릿 엔진에서 사용될 객체나 Repository Layer에서 결과로 넘겨준 객체 등이 
이들을 이야기 한다.   

## 5. Domain Model

- 도메인이라 불리는 개발 대상을 모든 사람이 동일한 관점에서 이해할 수 있고 
공유할 수 있도록 단순화시킨 것을 도메인 모델이라고 한다.   
- 비즈니스 로직을 처리하는 영역!!   
- 이를테면 택시 앱이라고 하면 배차, 탑승, 요금 등이 모두 도메인이 될 수 있다.   
- @Entity가 사용된 영역 역시 도메인 모델이라고 이해하면 된다.   
- 다만, 무조건 데이터베이스의 테이블과 관계가 있어야 하는 것은 아니다. VO처럼 값 
객체들도 이 영역에 해당하기 때문이다.   

- - - 

`여기서 많은 사람들이 잘못 알고 있는 것은 
Service에서 비지니스 로직을 처리해야 한다는 것이다.`      
`Service는 트랜잭션, 도메인 간 순서 보장의 역할만 한다는 것!!`   
`Domain이 비즈니스 로직을 처리한다!`   

- - -
Referrence 

[https://jojoldu.tistory.com/](https://jojoldu.tistory.com/)         


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

