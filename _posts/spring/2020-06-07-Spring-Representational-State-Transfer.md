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

`REST는 Client와 Server 사이의 통신 방식 중 하나이며, HTTP 프로토콜을 그대로 활용하기 때문에 웹의 장점을 
최대한 활용한 아키텍처 스타일이다.`   

**REST가 필요한 이유는 최근에 서버 프로그램은 다양한 브라우저와 여러 모바일 디바이스에서도 
통신이 가능하기 때문이다.** 

**과거에는 브라우저에 모든 데이터를 완성된 HTML 형태로 전송했지만, 다양한 브라우저와 여러 디바이스가 
생겨남에 따라서 서버의 역할은 점점 더 순수한 데이터만을 요구하고 처리하는 형태로 진화하고 있다.**   

#### REST 구성 요소  

1) 자원(Resource) 

- 자원 마다 고유한 ID가 존재하고,  식별자인 URI(Uniform Resource Identifier)를 이용하여 자원을 구분한다.    
> ex)  /boards/123 은 게시물 중에 123번이라는 고유한 의미를 가지는 구분자   

2) HTTP Method( GET, POST, PUT, DELETE )   

3) 표현(Representation of Resource) : JSON 혹은 XML를 통해 보통 데이터를 주고 받음   

- - -

### @RestController

`REST 방식에서 가장 먼저 기억해야 하는 점은 서버에서 전송하는 것이 순수한 데이터라는 것이다.`       

기존의 Controller에서 Model에 데이터를 담아서 JSP 등과 같은 View로 전달 하는 방식이 아니므로 
기존의 Controller와는 조금 다르게 동작한다.   

스프링 4에서부터는 @Controller 외에 @RestController라는 어노테이션이 추가되었다.    
@RestController 나오기 이전에는 @Controller와 메서드 선언부에 @ResponseBody를 이용해서 동일한 
결과를 만들 수 있었다.   

#### 실습   

> 추가 라이브러리    
> jackson-databind, jackson-dataformat-xml, gson, junit, spring-test

`주의할 점은 기존의 @Controller는 문자열을 반환하는 경우에는 JSP파일의 이름으로 
처리하지만, @RestController의 경우에는 순수한 데이터가 된다`        

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
> 결과페이지    
<img width="300" alt="스크린샷 2020-06-08 오후 10 27 38" src="https://user-images.githubusercontent.com/26623547/84036173-d1bb5780-a9d7-11ea-8437-8e41c570f324.png">    
```
Response Headers
Content-Length: 5
Content-Type: text/plain;charset=UTF-8   // 
Date: Mon, 08 Jun 2020 13:28:21 GMT
```

- - - 

### ModelAttribute     

`@ModelAttribute는 사용자가 요청시 전달하는 값을 오브젝트 형태로 매핑해주는 어노테이션이다.`      
`/check?name=kaven&age=1 같은 query string 형태 혹은 요청 본문에 삽입되어 있는 
form 형태의 데이터를 처리한다.`     

아래 코드와 같이 InputDto라는 클래스 안에 address 값을 매핑하며, getter와 setter가 존재해야 한다.   

```java
@Getter @Setter
public class InputDto {
    String address;
}
```

```java
@PostMapping("/search")
    public ModelAndView postDirection(@ModelAttribute InputDto inputDto)  {

        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("output");
        modelAndView.addObject("outputFormList",
                pharmacyRecommendationService.recommendPharmacyList(inputDto.getAddress()));

        return modelAndView;
    }
```

```hbs
<form action="/search" method = "post">
       <input type="text">
       <div>
         <button type="submit" class="btn btn-primary" id="btn-save">Search</button>
       </div>
</form>
```

- - -

### ResponseEntity   

REST 방식으로 호출하는 경우는 화면 자체가 아니라 데이터 자체를 전송하는 방식으로 
처리되기 때문에 데이터를 요청한 쪽에서는 정상적인 데이터인지 비정상적인 데이터인지를 
구분할 수 있는 확실한 방법을 제공해야만 한다.

`ResponseEntity는 데이터와 함께 HTTP 헤더의 상태 메시지 등을 같이 전달하는 용도로 사용한다. 
HTTP의 상태 코드와 에러 메시지 등을 함께 데이터를 전달할 수 있기 때문에 받는 입장에서는 
확실하게 결과를 알수 있다.`   




- - -
Referrence 

[http://www.newlecture.com](http://www.newlecture.com)   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
