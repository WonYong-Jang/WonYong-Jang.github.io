---
layout: post
title: "[Spring] Rest 방식"
subtitle: "@RestController, @PathVariable, @RequestBody, ResponseEntity"
comments: true
categories : Spring
date: 2020-06-07
background: '/img/posts/spring.png'
---

## REST (Representational State Transfer)

`자원을 이름으로 구분하여 해당 자원의 상태를 주고 받는 모든 것을 의미한다.`    

`REST는 Client와 Server 사이의 통신 방식 중 하나미여, HTTP 프로토콜을 그대로 활용하기 때문에 웹의 장점을 
최대한 활용한 아키텍처 스타일이다.`   

**REST가 필요한 이유는 최근에 서버 프로그램은 다양한 브라우저와 여러 모바일 디바이스에서도 
통신이 가능하기 때문이다.**   

#### REST 구성 요소  

1) 자원(Resource) 

- 자원 마다 고유한 ID가 존재하고,  식별자인 URI를 이용하여 자원을 구분한다.    
> ex)  /boards/123 은 게시물 중에 123번이라는 고유한 의미를 가지는 구분자   

2) HTTP Method( GET, POST, PUT, DELETE )   

3) 표현(Representation of Resource) : JSON 혹은 XML를 통해 보통 데이터를 주고 받음   

- - -

### @RestController

`REST 방식에서 가장 먼저 기억해야 하는 점은 서버에서 전송하는 것이 순수한 데이터라는 점!!`   

기존의 Controller에서 Model에 데이터를 담아서 JSP 등과 같은 View로 전달 하는 방식이 아니므로 
기존의 Controller와는 조금 다르게 동작한다.   

스프링 4에서부터는 @Controller 외에 @RestController라는 어노테이션이 추가되었다.    
@RestController 나오기 이전에는 @Controller와 메서드 선언부에 @ResponseBody를 이용해서 동일한 
결과를 만들 수 있었다.   
- - -

### 실습   

> 추가 라이브러리    
> jackson-databind, jackson-dataformat-xml, gson, junit, spring-test

`주의할 점은 기존의 @Controller는 문자열을 반환하는 경우에는 JSP파일의 이름으로 
처리하지만, @RestController의 경우에는 순수한 데이터가 된다!`   

```java

@RestController
@RequestMapping("/sample")
@Log4j
public class SampleController {

    // produces속성은 해당 메서드가 생산하는 MIME 타입을 의미한다. 생략 가능 
    @GetMapping(value="/getText", produces = "text/plain; charset=UTF-8")
    public String getText() {
        log.info("MIME TYPE: " + MediaType.TEXT_PLAIN_VALUE);

        return "hello";
    }
}

```

- - -
Referrence 

[http://www.newlecture.com](http://www.newlecture.com)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

