---
layout: post
title: "[Spring] application 설정 파일을 통해 profile 설정"
subtitle: "Spring boot 2.4 이후 profile 설정 방법 " 
comments: true
categories : Spring
date: 2022-08-11
background: '/img/posts/spring.png'
---

Spring boot 2.4 버전이 릴리즈 되면서 application.properties, application.yml 파일 
로드 방식에 변화가 있었다.   

아래 사진과 같이 Spring boot 2.4부터는 spring.profiles가 deprecated 되었다.   

<img width="700" alt="스크린샷 2022-08-11 오후 11 48 10" src="https://user-images.githubusercontent.com/26623547/184162231-6ff1a3ac-a589-4661-ab1f-25bcd49201f9.png">    

따라서, 아래와 같이 spring.profiles.group 을 이용해서 여러 profile들을 
한꺼번에 그룹지어 하나의 profile로 만들 수 있다.   

```yml
spring:
  profiles:
    group:
      "local": "local"
      "prod": "prod"

---   

spring:
  config:
    activate:
      on-profile: "local"
// ...

---

spring:
  config:
    activate:
      on-profile: "prod"
// ...

```

- - -
Referrence 

<https://data-make.tistory.com/722>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

