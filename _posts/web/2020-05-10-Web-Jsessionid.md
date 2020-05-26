---
layout: post
title: "[WEB] JSESSIONID "
subtitle: "Jsessionid"
comments: true
categories : Web
date: 2020-05-10
background: '/img/posts/mac.png'
---

# JSESSIONID란?   
- 톰캣 컨테이너에서 세션을 유지하기 위해 발급하는 키 (세션에 사용되는 쿠키 이름)
- HTTP 프로토콜은 stateless하다. 요청시마다 새로운 연결이 생성되고 응답후 연결은 
끊기게 되므로 상태를 유지할 수 없다.    
`따라서, 상태를 저장하기 위해서 톰캣은 JSESSIONID 쿠키를 클라이언트에게 발급해주고 
이 값을 통해 세션을 유지할 수 있도록 한다.`   
- 단, 쿠키기술을 허용하지 않는 환경이라면 URL 재작성 매커니즘을 사용해서 세션 아이디를 
전송해야 한다. (URL Rewriting 방식)    

- - - 
## JSESSIONID 동작 방식

**1. 쿠키 형태로 전송되는 JESSIONID**

1. 브라우저에 최초 접근시 톰캣은 Response 헤더에 다음과 같이 JSESSIONID값을 발급된다.     
<img width="595" alt="스크린샷 2020-05-10 오후 5 52 50" src="https://user-images.githubusercontent.com/26623547/81494918-6488a980-92e7-11ea-88c8-e8b017e69f7b.png">
2. 브라우저 재요청시 Response를 통해 받은 JSESSIONID를 Request 헤더의 쿠기에 값을 넣어 
서버에 요청한다. 쿠키를 통해 JSESSIONID값을 전달받게 되면 서버는 새로운 JSESSIONID값을 Response 헤더에 
발급하지 않는다!    
<img width="595" alt="스크린샷 2020-05-10 오후 5 53 01" src="https://user-images.githubusercontent.com/26623547/81494940-8c780d00-92e7-11ea-848d-6f2f60fb6b20.png">
3. 클라이언트로부터 전달받은 JESSIONID값을 기준으로 서버에서는 세션 메모리 영역에 상태를 유지할 값들을 저장할 수 있게 
된다.(HttpSession 등)   

**2. URL과 함께 전송되는 JSESSIONID ( URL Rewriting )**

1. 사용자가 웹 페이지 URL을 서버에 요청 후 URL 끝 부분에 세션을 식별할 수 있는 추가적인 
정보(jsessionid)를 붙인다.   
2. URL에 붙게되는 jsessionid를 서버에 요청할때 마다 전달한다!   
3. 사용자에게 전달 받은 jsessionid 값으로 동일한 사용자의 요청인지를 판단하여 사용자 정보를 유지한다.   
 - jsessionid값이 url이 틀리거나 없을 시 세션이 끊어진다.   

- - -

**Referrence**   
[https://lng1982.tistory.com/143](https://lng1982.tistory.com/143)


{% highlight ruby linenos %}
{% endhighlight %}

{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

