---
layout: post
title: "[Spring] 트랜잭션 관리"
subtitle: "Transaction"
comments: true
categories : Spring
date: 2020-03-20
background: '/img/posts/spring.png'
---

## 스프링 트랜잭션 관리   

`트랜잭션이란 비즈니스에서 쪼개질 수 없는 하나의 단위 작업`   
`한 번에 이루어지는 작업의 단위를 트랜잭션`     

<h3>ACID 원칙( 트랜잭션의 성격 )</h3>
<p><u>원자성(Atomicity)</u></p>
하나의 트랜잭션은 모두 하나의 단위로 처리되어야 한다. 어떤 트랜잭션이 
A와 B로 구성된다면 항상 처리결과는 A B 동일해야 한다. 즉, A가 성공이면 B도 항상 성공이고
실패면 둘다 실패!
<p><u>일관성(Consistency)</u></p>
트랜잭션이 성공했다면 데이터베이스의 모든 데이터는 일관성을 유지해야만 한다. 
트랜잭션으로 처리된 데이터와 일반 데이터 사이에는 전혀 차이가 없어야만 한다.
<p><u>격리(Isolation)</u></p>
트랜잭션으로 처리되는 중간에 외부에서의 간섭은 없어야만 한다.
<p><u>영속성(Durability)</u></p>
트랜잭션이 성공적으로 처리되면, 그 결과는 영속적으로 보관되어아 한다.

<p>비즈니스에서 하나의 트랜잭션은 데이터베이스 상에서는 하나 혹은 여러 개의 작업이 같은 묶음을
이루는 경우가 많다.</p>
<p>트랜잭션으로 관리한다, 혹은 트랜잭션으로 묶는다는 표현은 프로그래밍에서는 AND연산과 유사하다.</p>
계좌 이체를 예를 들어보면, 입금과 출금을 각각 데이터 베이스와 연결을 맺고 처리하는데 하나의 트랜잭션으로
처리해야 할 경우에는 한쪽이 잘못되는 경우에 이미 성공한 작업까지 다시 원상태로 복구되어야 한다.

<p><b>스프링은 트랜잭션 처리를 간단히 XML 설정을 이용하거나, 어노테이션 처리만으로 할수 있다.</b></p>

<h3>트랜잭션 설정 실습</h3>

<p><u>1) root-context.xml 또는 RootConfig.java 에 트랜잭션을 관리하는 transactionManager를  빈(객체)로 등록하고,
어노테이션 기반으로 트랜잭션을 설정할수 있도록 tx:annotation-driven / aspectj-autoproxy 설 정 추가 </u></p>


- - - 

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

