---
layout: post
title: "[Spring] Spring Web Security"
subtitle: "스프링 시큐리티 개념과 인증 및 인가 처리"
comments: true
categories : Spring
date: 2020-04-29
background: '/img/posts/spring.png'
---
# 스프링 시큐리티 소개 

`스프링 시큐리티는 지금까지 직접 구현해왔던 아이디/비밀번호를 입력하고 로그인하여 
사용자를 인증(Authentication)하고, 로그인후 프로그램의 각각의 기능에 대한 권한을 
체크(Authorization)하는 작업을 구현해둔 보안프레임워크이다.`   

`프로그램외에 리소스(이미지)에 대한 접근도 제어할 수 있고, CSFR 공격 방어, 세션 공격 방어, 다중 접속 방지 등도 
간단하게 구현할 수 있다.`   
- - -
### 스프링 시큐리티 용어 정리 

<img width="350" alt="스크린샷 2020-08-26 오후 8 49 40" src="https://user-images.githubusercontent.com/26623547/91300303-07552d00-e7de-11ea-89af-460421b456ff.png">   


##### 접근 주체(Principal) : 보호된 리소스에 접근하는 사용자

- 현재 사용자의 정보를 가지고 있는 Principal을 가지고 오려면 Authenticaion 객체에서 가져 올수 있고 
Authenticaion 객체는 SecurityContext에서 가져 올수 있다.

##### Authentication(인증) 

- 현재 유저가 누구인지 스스로 증명, 애플리케이션의 작업을 수행할 수 있는 주체임을 증명하는 과정     
ex) 사용자 id, pw 를 이용하여 증명

```java
public interface Authentication extends Principal, Serializable {
    //현재 사용자의 권한 정보를 가져옴.
	Collection<? extends GrantedAuthority> getAuthorities();
    //증명 값(비밀번호) 같은 것들을 가져옴
	Object getCredentials();
	Object getDetails();
    //Principal 객체를 가져옴.
	Object getPrincipal();
    //인증 여부를 가져온다.
	boolean isAuthenticated();
	void setAuthenticated(boolean isAuthenticated) throws IllegalArgumentException;
}
```


##### Authorization(인가) : 현재 사용자가 보호된 리소스에 권한이 있는지를 검사     
ex) 인증이 되었더라도 권한이 없다면 사용할수 없는 게시판이 존재함   

##### GrantedAuthority : 인증된 사용자의 인증정보(Role 등)을 표현    

##### SecurityContext

- Authenticaion 을 보관하는 역할 Spring Security 에서는 SecurityContext로 부터 Authenticaion 객체를 가져온다.    





<p>스프링 웹 시큐리티를 이용하면 다음과 같은 작업을 간편하게 처리가 가능하다. 
기본 동작 방식은 서블릿의 여러 종류의 필터와 인터셉터를 이용해서 처리된다. 필터는 서블릿에서
 말하는 단순한 필터를 의미하고, 인터셉터는 스프링에서 필터와 유사한 역할을 한다.</p>

`필터와 인터셉터는 특정한 서블릿이나 컨트롤러에 접근에 관여한다는 점에서는 유사하지만 
결정적인 차이는 필터는 스프링과 무관하게 서블릿 자원이고, 인터셉터는 스프링의 빈으로 
관리되면서 스프링의 컨텍스트 내에 속한다는 차이!`

<img width="600" alt="스크린샷 2020-04-29 오후 8 53 08" src="https://user-images.githubusercontent.com/26623547/80593145-9bdf9680-8a5b-11ea-967c-ffd81ad44f8a.png">

<p>스프링 내부에서 컨트롤러를 호출할 때 관여하기 때문에 스프링의 컨텍스트 내에 있는 모든 
자원을 활욜 가능하다. 스프링 시큐리티를 이용하게 되면 위와 같이 인터셉터와 필터를 이용하면서 
별도의 컨텍스트를 생성해서 처리한다. <u>즉, 현재 동작하는 스프링 컨텍스트 내에서 동작하기 때문에 
이미 컨텍스트에 포함된 여러 빈들을 같이 이용해서 다양한 인증 처리가 가능하도록 설계 가능하다.</u></p>


## 시큐리티가 필요한 URI 설계 

1) /sample/all -> 로그인을 하지 않은 사용자도 접근 가능한 URI   
2) /sample/member -> 로그인 한 사용자들만이 접근할 수 있는 URI   
3) /sample/admin -> 로그인 한 사용자들 중에서 관리자 권한 URI   

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

<h2 class="section-heading">CSRF(Cross-site request forgery) 공격과 토큰 </h2>


스프링 시큐리티 post 방식을 이용하는 경우 기본적으로 CSRF 토큰이라는 것을 이용하게 된다. 
별도의 설정이 없다면 스프링 시큐리티가 적용된 사이트의 모든 post 방식에는 CSRF 토큰이 사용되는데 '사이트간 위조 방지'를 
목적으로 특정한 값의 토큰을 사용하는 방식이다.    

`CSRF 공격은 '사이트간 요청 위조'라고 번역되며, 서버에서 받아들이는 정보가 특별히 사전 조건을 검증하지
않는다는 단점을 이용하는 공격 방식이다`   

- - - 
ex) 인터넷에 A라는 사이트가 존재하고 A사이트에는 특정 사용자의 등급을 변경하는 URI가 존재하는 것을 해커는 확인했다고 가정한다.   
공격자는 A 사이트의 관리자가 자주 방문하는 B사이트에 img, form 태그를 이용해서 URI를 추가한 게시물을 작성한다. 또는, 이메일을 통해서 링크를 
보내기도 한다.    
A사이트의 관리자는 자신이 평상시에 방문하던 B사이트를 방문하게 되고 공격자가 작성한 게시물을 클릭하는 순간 태그에 포함된 
URI가 호출되고 서버에서는 로그인한 관리자의 요청에 의해서 공격자는 admin 등급의 사용자로 변경된다.    
- - -    

`즉, CSRF 공격은 서버에서 받아들이는 요청을 해석하고 처리할 때 어떤 출처에서 호출이 진행되었는지 따지지 않기 때문에 생기는 
허점을 노리는 공격 방식이다.`
또한, 하나의 사이트 내에서도 가능한 방법이며 이러한 공격을 막기 위한 방법은 아래와 같다. 

1. CSRF 공격 자체가 사용자의 요청에 대한 출처를 검사하지 않아서 생기는 허점이기 때문에 사용자의 요청에 대한 출처를 의마하는 referer 헤더를 체크  

2. CSRF 토큰사용 하는 방법!

[CSRF 토큰사용 방법 참조](https://wonyong-jang.github.io/web/2020/03/31/Web-OWASP-Top-10.html)

> 공격자 입장에서는 CSRF 공격을 하려면 변경되는 CSRF 토큰 값을 알아야만 하기 때문에 고정된 태그 (form, img) 등을 이용 할수 없게 된다!

```
CSRF토큰 생성을 비활성화 하거나 CSRF 토큰을 쿠키를 이용해서 처리하는 경우
    <security:csrf disabled="true"/>
```

{% highlight ruby linenos %}


{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

