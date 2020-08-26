---
layout: post
title: "[Web] JWT, OAuth2 인증"
subtitle: "Session, Cookie 인증방식 / Token 기반 인증방식 "
comments: true
categories : Web
date: 2020-07-21
background: '/img/posts/mac.png'
---

이 글에서는 Session, Cookie를 이용한 인증방식과 Token 인증 방식을 비교해 보고 
Token 인증방식 중에서도 OAuth2 와 JWT을 추가한 인증방식을 비교해 볼 것이다.   

## OAuth2 (Open Authorization, Open Authentication 2)

OAuth 2.0은인증을 위한 표준 프로토콜이다. 구글, 페이스북, 네이버 등에서 제공하는 
Authorization Server를 통해 회원정보를 인증하고 Access Token을 발급받는다. 그리고 
발급받은 Access Token을 이용해 타사의 API 서비스를 이용할 수 있다. 


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

`JWT는 Claim 기반이라는 방식을 사용하는데, Claim이란 사용자에 대한 프로퍼티 속성을 이야기 한다.`

```
// Claim을 JSON으로 서술한 예이다. JSON 자체를 토큰으로 사용하는 것이 
// Claim 기반의 토큰 방식이다.   
{
    "id":"test",
    "role":"user"
}
```

`여기서 JWT의 Token은 의미있는 토큰(유저의 상태를 포함한)으로 
구성되어 있기 때문에 Auth 서버 쪽의 비용을 절감하면서 stateless한 아키텍처를 구성 할수 있다.`   
`중요한 점은 application server가 더이상 로그인한 사용자의 session을 관리 하지 않는다는 것이다. 단지 
전달받은 JWT가 유효한 Token인지만 확인한다.`   

> JWT(JSON Web Token)은 유저의 상태(고유번호, 권한, 토큰 만료일자 등을 포함)를 JSON 포맷으로 구성하고, 
    이 텍스트를 다시 특정 알고리즘(Base 64)에 따라 일련의 문자열로 인코딩한 토큰을 의미한다.   

- 1) client는 Auth Server에 로그인을 한다. 이때 Auth Server는 application server 내에 위치할 수도 있으며, 
    google, naver와 같은 제 3자가 될 수도 있다.   
- 2) Auth Server에서 인증을 완료한 사용자는 JWT Token을 전달 받는다.   
- 3) client는 application server에 resource를 요청할때 앞서 전달받은 JWT Token을 Authorization Header에 전달한다.   
- 4) application server는 전달받은 JWT Token이 유효하면 200 ok와 함께 data를 response 한다.   

#### JWT Structure

JWT는 아래와 같이 Header / Payload / Signature 3가지로 구성된다.   

<img width="650" alt="스크린샷 2020-08-16 오후 8 44 34" src="https://user-images.githubusercontent.com/26623547/90333526-8b9af980-e001-11ea-9ce9-b984af5aba60.png">   

- Header : token의 type과 JWT를 digitally sign할때 사용한 algorithm을 정의
    - type은 JWT이며, alg는 해싱 알고리즘을 지정하며, HMAC SHA256 혹은 RSA가 사용된다.   


- Payload : JWT에 담아서 전달할 data를 정의한다.

- Signature : 위의 Header와 Payload 값을 base64로 encode한 값을 JWT secret key값으로 
encrypt한 값을 명시한다.

<img width="650" alt="스크린샷 2020-08-16 오후 8 44 43" src="https://user-images.githubusercontent.com/26623547/90333531-8f2e8080-e001-11ea-80fb-009f5d386433.png">   



- - -

## 인증 방식 비교하기 

<img width="600" alt="스크린샷 2020-07-21 오후 10 40 56" src="https://user-images.githubusercontent.com/26623547/88062139-61d9e880-cba3-11ea-8e9c-eb522496021f.png">

<img width="600" alt="스크린샷 2020-07-21 오후 10 41 02" src="https://user-images.githubusercontent.com/26623547/88062158-67cfc980-cba3-11ea-95bd-5a5b6229c962.png">

- - -
Referrence 

[https://okky.kr/article/409195](https://okky.kr/article/409195)         
[https://medium.com/neillab/what-is-jwt-89889759ae37](https://medium.com/neillab/what-is-jwt-89889759ae37)   
[https://velog.io/@minholee_93/Spring-Security-JWT-Authentication](https://velog.io/@minholee_93/Spring-Security-JWT-Authentication)


{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

