---
layout: post
title: "[Web] JWT, OAuth 인증"
subtitle: "Session, Cookie 인증방식 / Token 기반 인증방식 "
comments: true
categories : Web
date: 2020-07-21
background: '/img/posts/mac.png'
---

이 글에서는 Session, Cookie를 이용한 인증방식과 Token 인증 방식을 비교해 보고 
Token 인증방식 중에서도 OAuth 와 JWT 인증을 비교해 볼 것이다.   

## OAuth2

아래 그림은 보통 OAuth2.0 하면 생각하는 구조이다.   

`서버는 API 호출 요청에 대해서 Token이 유효한지를 확인할 필요가 있다. 이는
서버에서 클라이언트의 상태(토큰의 유효성)를 관리하게끔 하며, 또 API를 호출 할 때마다
그 토큰(AccessToken)이 유효한지 매번 DB등에서 조회하고 새로 갱신시 업데이트 작업을 해주어야 한다.`   

> OAuth Token 은 무의미한 문자열로 구성되어 있기 때문이다.   

<img width="600" alt="스크린샷 2020-07-21 오후 10 48 16" src="https://user-images.githubusercontent.com/26623547/88063014-83879f80-cba4-11ea-880d-8518a7be6856.png">    


## JWT (JSON Web Token)

<img width="600" alt="스크린샷 2020-07-21 오후 10 48 24" src="https://user-images.githubusercontent.com/26623547/88063018-85e9f980-cba4-11ea-8d35-d411ba1857e5.png">   

> 위 그림은 Oauth2 방식에 JWT 토큰을 사용한 예이다.

`JWT는 정보를 JSON 객체 형태로 주고 받기 위해 표준규약에 따라 생성한 암호화된 문자열(Token)이다.`   

`여기서 JWT의 Token은 의미있는 토큰(유저의 상태를 포함한)으로 
구성되어 있기 때문에 API 서버 쪽의 비용을 절감하면서 stateless한 아키텍처를 구성 할수 있다.`   

> JWT(JSON Web Token)은 유저의 상태(고유번호, 권한, 토큰 만료일자 등을 포함)를 JSON 포맷으로 구성하고, 
    이 텍스트를 다시 특정 알고리즘(Base 64)에 따라 일련의 문자열로 인코딩한 토큰을 의미한다.   



## 인증 방식 비교하기 

<img width="600" alt="스크린샷 2020-07-21 오후 10 40 56" src="https://user-images.githubusercontent.com/26623547/88062139-61d9e880-cba3-11ea-8e9c-eb522496021f.png">

<img width="600" alt="스크린샷 2020-07-21 오후 10 41 02" src="https://user-images.githubusercontent.com/26623547/88062158-67cfc980-cba3-11ea-95bd-5a5b6229c962.png">

- - -
Referrence 

[https://okky.kr/article/409195](https://okky.kr/article/409195)         
[https://medium.com/neillab/what-is-jwt-89889759ae37](https://medium.com/neillab/what-is-jwt-89889759ae37)

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

