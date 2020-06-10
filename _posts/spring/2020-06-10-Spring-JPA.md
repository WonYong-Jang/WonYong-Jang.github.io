---
layout: post
title: "[Spring] JPA(Java Persistence API)"
subtitle: "자바 표준 ORM, Hibernate, Spring-data-jpa"
comments: true
categories : Spring
date: 2020-06-10
background: '/img/posts/spring.png'
---

## JPA

`자바 어플리케이션에서 관계형 데이터베이스를 사용하는 방식을 정의한 인터페이스이다.`   

객체지향적으로 데이터 관리할 수 있기 때문에 비즈니스 로직에 집중 할 수 있으며, 
객체 지향 개발이 가능하다.   
단, 잘 이해하고 사용하지 않으면 데이터 손실이 있을 수 있다.

### SQL Mapper 와 ORM

**1) SQL Mapper**

Mybatis, JdbcTemplate와 같이 쿼리를 매핑한다.   

> SQL <- mapping -> Object 필드   

**2) ORM**

JPA, Hibernate와 같이 
객체를 매핑하여 객체간 관계를 바탕으로 sql을 자동으로 생성한다.  

> DB 데이터 <- mapping -> Object   

### Spring Data JPA

`Spring에서 제공하는 모듈 중 하나로, 개발자가 JPA를 더 쉽고 편하게 사용할 수 있도록 
도와준다.`      

Hibernate를 쓰는 것과 Spring Data JPA를 쓰는 것 사이에는 큰 차이가 없지만 
아래 이유에서 Spring Data JPA를 사용하는 것을 권장 한다.   

- 구현체 교체의 용이성  
- 저장소 교체의 용이성   

> 추상화 정도는 Spring-Data-JPA -> Hibernate -> JPA 이다.   

- - -
Referrence

{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

