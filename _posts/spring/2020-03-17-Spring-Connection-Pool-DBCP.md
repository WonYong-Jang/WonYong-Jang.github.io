---
layout: post
title: "[Spring] 커넥션 풀(Connection Pool) DBCP, DAO, DTO"
subtitle: "Database Connection Pool(DBCP) 와 DAO, DTO"
comments: true
categories : Spring
date: 2020-03-17
background: '/img/posts/spring.png'
---

<h2 class="section-heading">커넥션 풀(Connection pool) 이란? </h2>
<img width="744" alt="스크린샷 2020-03-17 오후 9 10 48" src="https://user-images.githubusercontent.com/26623547/76855296-2bf2c380-6894-11ea-9eb7-5d26687b9409.png">
`웹 컨테이너(WAS)가 실행되면서 DB와 미리 connection(연결)을 해놓은 객체들을 pool에
저장해두었다가 클라이언트 요청이 오면 connection을 빌려주고, 처리가 끝나면
다시 connection을 반납받아 pool에 저장하는 방식을 말한다.`

<img width="730" alt="스크린샷 2020-03-17 오후 9 23 35" src="https://user-images.githubusercontent.com/26623547/76855972-a2dc8c00-6895-11ea-8403-5269349ec36c.png">
<br/><br/>

<h2 class="section-heading">커넥션 풀(Connection pool) 이란? </h2>
<p>DataBase Connection Pool 의 약자로 DB와 커넥션을 맺고 있는 객체를 관리하는 역할을 한다.</p>
`웹 컨테이너(WAS)가 실행되면서 connection 객체를 미리 pool에 생성해 둔다!`   
pool에 미리 connection이 생성되어 있기 때문에 요청마다 connection을 생성하는데 드는 연결 시간이 소비되지 않는다.
<p>HTTP 요청에 따라 pool에서 connection객체를 가져다 쓰고 반환한다.</p>
<p>DB 접근 시 불필요한 작업(커넥션 생성, 끊기)가 사라지므로 성능향상을 기대할 수 있다.</p>
<p>커넥션을 계속해서 재사용하기 때문에 생성되는 커넥션 수를 제한적으로 설정한다.</p>

<h3>동시 접속자가 많을 경우  </h3>
`클라이언트 요청에 대해 pool에서 미리 생성된 connection을 제공하고
없을 경우는 사용자는 connection이 반환될 때까지 번호순서대로 대기상태로 기다린다.`   
<p><u>여기서 WAS에서 커넥션 풀을 크게 설정하면 메모리 소모가 큰 대신 많은 사용자가 대기시간이 줄어들고,
반대로 커넥션 풀을 적게 설정하면 그 만큼 대기 시간이 길어진다.</u></p>

<h3>커넥션 풀 종류 </h3>
<p>Commons DBCP, Tomcat-JDBC, BoneCP ,HikariCP 등이 있다.</p>

<h3>DAO : Data Access Object (DB로 접근해서 로직을 수행)</h3>
<p><i>데이터 추가,삭제,수정 등의 작업을 하는 메소드!!</i></p>
효율적인 커넥션 관리와 보안성 때문에 사용한다. 또한, DB 접근하기 위한 로직과 비즈니스 로직 분리 가능하다.
`HTTP Request를 Web Application이 받게 되면 Thread를 생성하게 되는데 비즈니스 로직이 DB로 부터
데이터를 얻어오기 위해 매번 Driver를 로드하고 Connection 객체를 생성하게 되면 엄청 많은 커넥션이
일어나므로 DAO를 하나 만들어 DB전용 객체로만 쓰는 것!`   

> 즉, DB에 대한 접근을 DAO가 담당하도록 하여 DB 액세스를 DAO에서만 하게 되면 다수의 원격 호출을 통한 오버헤드를 VO 나 DTO를 통해 줄일 수 있다!

<h3>DTO : Data Transfer Object (데이터를 객체 데이터로 변환)</h3>

<p><i>해당 데이터의 클래스를 별도로 만들어 사용(setter, getter)</i></p>

`로직을 갖고 있지 않은 순수한 데이터 객체이며 속성과 속성에 접근하기 위한 getter, setter 메소드만 가진 
클래스를 말한다.`

<p><u>VO(Value Object)와 동일한 개념이지만 VO는 read only 속성을 가진다!</u></p>



<h2 class="section-heading">DBCP 설정과 최적화  </h2>
<img width="700" alt="스크린샷 2020-03-17 오후 10 30 49" src="https://user-images.githubusercontent.com/26623547/76861119-6c0b7380-689f-11ea-83b0-700d384854c4.png">
<img width="700" alt="스크린샷 2020-03-17 오후 10 31 00" src="https://user-images.githubusercontent.com/26623547/76861126-70379100-689f-11ea-8f3a-a2a5d3d2f4dd.png">
<img width="700" alt="스크린샷 2020-03-17 오후 10 32 17" src="https://user-images.githubusercontent.com/26623547/76861186-87767e80-689f-11ea-9003-48701fcc763f.png">
<img width="700" alt="스크린샷 2020-03-17 오후 10 32 02" src="https://user-images.githubusercontent.com/26623547/76861192-8a716f00-689f-11ea-8e91-cf001acec31f.png">

<p><a href="https://linked2ev.github.io/spring/2019/08/14/Spring-3-%EC%BB%A4%EB%84%A5%EC%85%98-%ED%92%80%EC%9D%B4%EB%9E%80/">관련 링크</a></p>
<p><a href="https://www.holaxprogramming.com/2013/01/10/devops-how-to-manage-dbcp/">관련 링크</a></p>


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

