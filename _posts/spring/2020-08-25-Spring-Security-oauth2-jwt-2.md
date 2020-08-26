---
layout: post
title: "[Spring] Spring Security + OAuth2 + JWT 를 이용한 소셜로그인 2"
subtitle: "Spring Boot에서 Oauth2 + JWT 이용한 Google 로그인"
comments: true
categories : Spring
date: 2020-08-25
background: '/img/posts/spring.png'
---

## 1. Security Configuration    

```java

```

##### 1-1 @EnableGlobalMethodSecurity 

`Spring Security는 Override된 configure(HttpSecurity http)에서 AntMatcher를 이용해 Role을 
확인할 수 있다. 하지만 관리 대상과 요구사항이 많아지면 Role만으로는 문제 해결이 용이하지 않다.`   

특정 메서드에 권한 처리를 하는 MethodSecurity 설정 기능 제공한다. 
 각 설정값 true로 변경하면 사용가능 ( default값은 false)     

MethodSecurity는 WebSecurity와는 별개로 동작하기 때문에 추가 설정이 필요   

> 1) securedEnable : @Secured 사용하여 인가처리하는 옵션   

> 2) prePostEnable : @PreAuthorize, @PostAuthorize 사용하여 인가처리 옵션   

> 3) jsr250Enabled : @RolesAllowed 사용하여 인가처리 옵션 


- - -
Referrence 

- [https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10](https://velog.io/@minholee_93/Spring-Security-JWT-Security-Spring-Boot-10)   
- [https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q](https://www.youtube.com/playlist?list=PLVApX3evDwJ1d0lKKHssPQvzv2Ao3e__Q)   
- [https://www.callicoder.com/spring-boot-security-oauth2-social-login-part-1/](https://www.callicoder.com/spring-boot-security-oauth2-social-login-part-1/)

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

