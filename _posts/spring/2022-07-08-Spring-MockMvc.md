---
layout: post
title: "[Spring] MockMvc를 이용하여 controller 테스트하기"
subtitle: "standaloneSetup, webAppContextSetup / ContentType 과 Accept" 
comments: true
categories : Spring
date: 2022-07-08
background: '/img/posts/spring.png'
---

## 1. MockMvc란?   

우리는 웹 어플리케이션을 작성한 후, 해당 웹 어플리케이션을 
Tomcat이라는 이름의 WAS(Web Application Server)에 배포하여 실행한다.   

브라우저의 요청은 WAS에 전달되는 것이고 응답도 WAS에게서 받게 된다.   
WAS는 요청을 받은 후, 해당 요청을 처리하는 웹 어플리케이션을 실행하게 된다.   
즉, Web API를 테스트한다는 것은 WAS를 실행해야만 된다는 문제가 있다.    

> Tomcat은 대표적인 서블릿 컨테이너 중 하나이며, 톰캣 같은 WAS가 
java 파일을 컴파일해서 class로 만들고 메모리에 올려 서블릿 객체를 만든다.   

이런 문제를 해결하기 위해 MockMvc가 추가 되었다.   

`MockMvc란 스프링 3.2부터 스프링 MVC를 모킹하여 웹 어플리케이션을 
테스트하는 유용한 라이브러리이다.`        
이 기능으로 실제 서블릿 컨테이너에서 컨트롤러를 실행하지 않고도 
컨트롤러에 HTTP 요청을 할 수 있다.   
스프링 Mock MVC 프레임워크는 어플리케이션을 마치 
서블릿 컨테이너에서 실행하는 것처럼 스프링 MVC를 흉내 내지만 
실제 컨테이너에서 실행하지는 않는다.   

여기서 서블릿 컨테이너를 모킹한다는 의미는 무엇일까?    

`웹 환경에서 컨트롤러를 테스트하려면 서블릿 컨테이너가 구동되고 DispatcherServlet 객체가 
메모리에 올라가야 한다. 이때 서블릿 컨테이너를 모킹하면 실제 서블릿 
컨테이너가 아닌 테스트 모형 컨테이너를 사용해서 간단하게 컨트롤러를 테스트할 수 있다.`    

테스트에서 Mock MVC를 설정하려면 MockMvcBuilders를 사용한다.   
이 클래스는 정적 메서드 두 개를 제공한다.   

standaloneSetup() 메서드와 webAppContextSetup() 이다.    

`먼저 webAppContextSetup은 스프링에서 로드한 WebApplicationContext의 
인스턴스로 작동하기 때문에 스프링 컨트롤러는 물론 의존성까지 로드되기 
때문에 완전한 통합테스트를 할 수 있다.`       

`반면, standaloneSetup은 테스트할 컨트롤러를 수동으로 주입하는 것이며, 
    한 컨트롤러에 집중하여 테스트하는 용도로만 사용한다는 점에서 
    유닛 테스트와 유사하다.`       

이제 예제를 통해 Controller를 에서 아래 내용을 테스트 해보자.     

- 요청 경로에 대해 적절한 handler method가 호출 되는가?   
- 입력 파라미터는 handler method에 잘 전달되는가?   
- model에 설정한 값은 잘 참조 하는가?   
- 요청 결과 페이지는 잘 연결되는가?   

- - -


## 2. MockMvc의 메서드   

#### 2-1) perform()   

`요청을 전송하는 역할을 한다.`    
결과로 ResultActions 객체를 받으며, `ResultActions 객체는 리턴 값을 검증하고 
확인할 수 있는 andExpect() 메서드를 제공해준다.`   

#### 2-2) get("/search")    

HTTP 메소드를 결정할 수 있다(get(), post(), put(), delete())   
인자로는 경로를 전달한다.   

#### 2-3) params   

`키=값의 파라미터를 전달할 수 있다.`   
`여러 개일 때는 params()를, 하나일 때에는 param()을 사용한다.`   

#### 2-4) andExpect()   

`응답을 검증하는 역할을 한다.`    
andExpect가 1개라도 실패하면 테스트는 실패한다.   

- 상태 코드(status())
    - 메소드 이름: 상태 코드   
    - isOk(): 200
    - isNotFound(): 404   
    - isMethodNotAllowed(): 405   
    - isInternalServerError(): 500
    - is(int status): status 상태 코드   
    ```java
    mockMvc.perform(get("/"))
          .andExpect(status().isOk()) // status()로 예상 값을 검증한다.
          .andExpect(is(404))         // 또는 is()로 검증 
    ```

- 뷰(view())   
    - 리턴하는 뷰 이름을 검증한다.   
    ```java
    mockMvc.perform(get("/"))
          .andExpect(view().name("output")) // 리턴하는 뷰 이름이 output 인지 검증   
    ```   

- 핸들러(handler())    
    - 요청에 매핑된 컨트롤러를 검증한다.   
    ```java
    mockMvc.perform(get("/"))
           .andExpect(handler().handlerType(FormController.class))
           .andExpect(handler().methodName("main"))
    ```

- 리다이렉트(redirect())
    - 리다이렉트 응답을 검증한다.    
    ```java
    mockMvc.perform(get("/"))
          .andExpect(redirectUrl("/output")) // /output로 리다이렉트 되는지 검증   
    ```   

- 모델 정보( model() )   
    - 컨트롤러에서 저장한 모델들의 정보 검증  
    - attributeExists(String name) : name에 해당하는 데이터가 model에 있는지 검증   
    - attribute(String name, Object value) : name에 해당하는 데이터가 value 객체인지 검증    
    ```java
    mockMvc.perform(get("/"))
          .andExpect(model().attributeExists("outputFormList"))
          .andExpect(model().attribute("outputFormList", outputDtoList))
    ```    

#### 2-5) 응답 정보 검증(content())   
    
응답에 대한 정보를 검증한다.    

```java
ResultActions result = mockMvc.perform(
                post("/search")
                 .contentType(MediaType.APPLICATION_FORM_URLENCODED) // @ModelAttribute 매핑 검증을 위한 content type 지정
                 .content("address=서울 성북구 종암동"))
```

#### 2-6) ContentType   

`ContentType이란 HTTP 메시지(요청과 응답 모두)에 담겨 보내는 데이터의 형식을 알려주는 헤더이다.`   
HTTP 표준 스펙을 따르는 브라우저와 웹서버는 ContentType 헤더를 확인하고 HTTP 메시지에 담긴 
데이터를 분석과 파싱을 한다.   

즉, ContentType으로 요청 또는 응답의 데이터가 어떤 형식인지 판단하고 처리할 수 있다.   

`만약 ContentType 헤더가 없다면 데이터를 전송하는 쪽(브라우저나 웹서버)에서는 
특정한 형식의 데이터 일지라도 데이터를 받는 입장에서는 단순히 텍스트 데이터로 받아들인다.`       

`중요한 점은 HTTP 요청의 경우 GET방식인 경우에는 무조건 URL 끝에 쿼리스트링으로 
key=value 형식으로 보내지기 때문에 ContentType은 필요 없다.`   
즉, GET방식으로는 데이터를 전송 시 웹서버 입장에서는 key=value 형식 데이터라는 것을 
알 수 있기 때문이다.   

`따라서, ContentType은 POST나 PUT처럼 메시지 바디에 데이터를 보낼 때 필요로 한다.`   

예를 들어 브라우저 기준으로 설명하자면, Ajax를 통해 json 형식의 데이터를 전송하는 경우 
ContentType값을 application/json 으로 지정하여 보낸다.   

form 태그를 통해 첨부파일 등을 전송하는 경우라면 브라우저가 자동으로 
ContentType을 multipart/form-data로 설정하여 요청 메시지를 보낸다.   

#### 2-7) Accept    

Accept 헤더의 경우에는 브라우저(클라이언트)에서 웹서버로 요청시 요청메시지에 담기는 헤더이다.   
이 `Accept 헤더는 쉽게 말해 자신에게 이러한 데이터 타입만 허용하겠다는 뜻이다.`      

즉, 브라우저가 요청 메시지의 Accept 헤더 값을 application/json이라고 설정했다면 
클라이언트는 웹서버에게 json 데이터만 처리할 수 있으니 json 데이터 형식으로 응답을 돌려줘 라고 
말하는 것과 같다.   

ContentType헤더와 Accept 헤더 공통점은 둘 다 데이터 타입(MIME)을 다루는 헤더이다.   

> 과거에는 MIME type으로 불렸지만, 지금은 media type으로 사용된다.   

`하지만 차이점은 ContentType 헤더는 현재 전송하는 데이터가 어떤 타입인지에 대한 설명을 하는 
개념이고, Accept 헤더는 클라이언트가 서버에게 어떤 특정한 데이터 타입을 보낼 때 
클라이언트가 보낸 특정 타입으로만 응답을 해야한다.`    


#### 2-7) andDo()

요청/응답 전체 메시지를 확인할 수 있다.   

- print(): 실행결과를 지정해준 대상으로 출력해준다.(default는 System.out)   
- log(): 실행결과를 디버깅 레벨로 출력한다.    

- - - 

## 3. MockMvc 사용하여 테스트 코드 작성하기   

MockMvc는 spring-test 라이브러리에 포함되어 있으며, MockMvc클래스를 살펴보면 
아래와 같다.   

```java
/**
 * Main entry point for server-side Spring MVC test support.
 *
 * import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
 * import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
 * import static org.springframework.test.web.servlet.setup.MockMvcBuilders.*;
 *
 * // ...
 *
 * WebApplicationContext wac = ...;
 *
 * MockMvc mockMvc = webAppContextSetup(wac).build();
 *
 * mockMvc.perform(get("/form"))
 *     .andExpect(status().isOk())
 *     .andExpect(content().mimeType("text/html"))
 *     .andExpect(forwardedUrl("/WEB-INF/layouts/main.jsp"));
 *
 * @since 3.2
 */
public final class MockMvc {
    //...
}
```   

위에서 보이는 static 메서드를 import 해서 사용하자.   

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;  
```

아래는 테스트할 Controller이며, 2개의 메소드를 각각 테스트 해보자.    

```java
@Controller
@RequiredArgsConstructor
public class FormController {
    private final PharmacyRecommendationService pharmacyRecommendationService;

    @GetMapping("/")
    public String main() {
        return "main";
    }

    @PostMapping("/search")
    public ModelAndView postDirection(@ModelAttribute InputDto inputDto)  {

        ModelAndView modelAndView = new ModelAndView();
        modelAndView.setViewName("output");
        modelAndView.addObject("outputFormList",
                pharmacyRecommendationService.recommendPharmacyList(inputDto.getAddress()));

        return modelAndView;
    }
}
```

#### 3-1) 테스트 1   

먼저 get방식의 main 메소드를 MockMvc를 이용하여 테스트 해보자.   

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*;

class FormControllerTest extends Specification {

    private MockMvc mockMvc
    private PharmacyRecommendationService pharmacyRecommendationService = Mock()

    def setup() {
        // FormController를 MockMvc 객체로 만든다.
        mockMvc = MockMvcBuilders.standaloneSetup(new FormController(pharmacyRecommendationService)).build();
    }
    def "GET /"() {

        expect:
        // FormController 의 "/" URI를 get방식으로 호출
        mockMvc.perform(get("/"))
                .andExpect(handler().handlerType(FormController.class))
                .andExpect(handler().methodName("main"))
                .andExpect(status().isOk()) // 예상 값을 검증한다.
                .andExpect(view().name("main")) // 호출한 view의 이름이 main인지 검증(확장자는 생략)   
                .andDo(log())
    }
}
```

위와 같이 perform()을 이용하여 설정한 MockMvc를 실행 할 수 있으며, 
    andExpect() 메서드를 통해 테스트를 검증할 수 있다.   

이 메소드가 리턴하는 객체는 ResultActions라는 인터페이스이며, 아래와 같이 
여러가지로 사용 가능하다.   

```java
this.mockMvc.perform(get("/")) // basic
this.mockMvc.perform(post("/")) // send post
this.mockMvc.perform(get("/?foo={var}", "1")) // query string
this.mockMvc.perform(get("/").param("bar", "2")) // using param
this.mockMvc.perform(get("/").accept(MediaType.ALL)) // select media type
```

또한, andDo()를 이용하여 print, log를 사용하여 출력할 수 있다.   

```
MockHttpServletRequest:
      HTTP Method = GET
      Request URI = /
       Parameters = {}
          Headers = []
             Body = <no character encoding set>
    Session Attrs = {}

Handler:
             Type = com.example.demo.direction.controller.FormController
           Method = com.example.demo.direction.controller.FormController#main()

Async:
    Async started = false
     Async result = null

Resolved Exception:
             Type = null

ModelAndView:
        View name = main
             View = null
            Model = null

FlashMap:
       Attributes = null

MockHttpServletResponse:
           Status = 200
    Error message = null
          Headers = [Content-Language:"en"]
     Content type = null
             Body =
    Forwarded URL = main
   Redirected URL = null
          Cookies = []
```


#### 3-2) 테스트 2    

다음으로 post방식의 postDirection 메소드를 테스트해보자.   

```java
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.*

class FormControllerTest extends Specification {

    private MockMvc mockMvc
    private PharmacyRecommendationService pharmacyRecommendationService = Mock()
    private List<OutputDto> outputDtoList

    def setup() {
        // FormController를 MockMvc 객체로 만든다.
        mockMvc = MockMvcBuilders.standaloneSetup(new FormController(pharmacyRecommendationService))
                .build()

        outputDtoList = Lists.newArrayList(
                OutputDto.builder()
                        .pharmacyName("pharmacy1")
                        .build(),
                OutputDto.builder()
                        .pharmacyName("pharmacy2")
                        .build()
        )
    }
    def "POST /search"() {
        given:
        String address = "서울 성북구 종암동"

        when:
        ResultActions result = mockMvc.perform(post("/search")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED) // @ModelAttribute 매핑 검증을 위한 content type 지정
                        .content("address="+address))   // ex) "address=서울 성북구&name=은혜약국" 형태의 쿼리 스트링    

        then:
        1 * pharmacyRecommendationService.recommendPharmacyList(argument -> {
            assert argument == address // mock 객체의 argument 검증    
        }) >> outputDtoList

        result.andExpect(status().isOk())
                .andExpect(view().name("output"))
                .andExpect(model().attributeExists("outputFormList"))
                .andExpect(model().attribute("outputFormList", outputDtoList))
                .andDo(print())
    }
}
```

위의 경우 테스트 하기 위한 controller 로직을 살펴보면, 
    pharmacyRecommendationService.recommendPharmacyList() 메소드를 호출하여 
리턴한 결과 리스트를 outputFormList라는 이름으로 ModelAndView에 추가해준다.   

하지만, Controller 레이어만 단위 테스트를 통해서 검증하고자 하므로 
Service 레이어는 Mock 객체로 생성하여 결과값을 Stubbing 해준다.   

따라서 위와 같이 post방식으로 호출하였을 때, 결과값이 정상적으로 200상태인지 
model attribute 값들이 기대한 값과 동일한지 위와 같이 검증이 가능하다.   

또한, ModelAttribute 어노테이션으로 의도한 값이 매핑이 되었는지 확인하기 위하여,  
    contentType과 content를 지정하고, 이를 기대한 주소값과 동일한지 
    확인하였다.   

참고로 [@ModelAttribute](https://wonyong-jang.github.io/spring/2020/06/07/Spring-ModelAttribute-RequestBody.html)를 application/json 형태의 content type을 지정하여 요청하면, 
    null이 출력되기 때문에 form 형식으로 content type을 요청해야 한다.     

또는 param을 사용하여 아래와 같이 사용할 수도 있다.   

```java
when:
def resultActions = mockMvc.perform(post("/search")
       .param("address", inputAddress))

// param 에 대한 주석 

/**
 * Add a request parameter to {@link MockHttpServletRequest#getParameterMap()}.
* <p>In the Servlet API, a request parameter may be parsed from the query
 * string and/or from the body of an {@code application/x-www-form-urlencoded}
 * request. This method simply adds to the request parameter map. You may
 * also use add Servlet request parameters by specifying the query or form
 * data through one of the following:
 * <ul>
 * <li>Supply a URL with a query to {@link MockMvcRequestBuilders}.
 * <li>Add query params via {@link #queryParam} or {@link #queryParams}.
 * <li>Provide {@link #content} with {@link #contentType}
 * {@code application/x-www-form-urlencoded}.
 * </ul>
 * @param name the parameter name
 * @param values one or more values
 */
public MockHttpServletRequestBuilder param(String name, String... values) {
	addToMultiValueMap(this.parameters, name, values);
	return this;
}
```

#### 3-3) 테스트 3    

이번에는 아래 예제를 통해 `redirect 여부를 테스트` 해보자.    

```java
@GetMapping("/dir/{encodedId}")
public String searchDirection(@PathVariable("encodedId") String encodedId) {

    Direction resultDirection = directionService.findById(encodedId);

    String result = buildRedirectUrl(resultDirection);

    return "redirect:"+result;
}
```


```java
mockMvc.perform(get("/dir/{encodedId}", "r"))
        .andExpect(redirectedUrl("https://map.kakao.com/link/map/address,38.11,128.11"));
        .andExpect(status().is3xxRedirection());
```

위처럼 리다이렉트는 status().is3xxRedirection()으로 확인 가능하다.    

```
MockHttpServletRequest:
      HTTP Method = GET
      Request URI = /dir/r
       Parameters = {}
          Headers = []
             Body = <no character encoding set>
    Session Attrs = {}

Handler:
             Type = com.example.demo.direction.controller.DirectionController
           Method = com.example.demo.direction.controller.DirectionController#searchDirection(String)

Async:
    Async started = false
     Async result = null

Resolved Exception:
             Type = null

ModelAndView:
        View name = redirect:https://map.kakao.com/link/map/address,38.11,128.11
             View = null
            Model = null

FlashMap:
       Attributes = null

MockHttpServletResponse:
           Status = 302
    Error message = null
          Headers = [Content-Language:"en", Location:"https://map.kakao.com/link/map/address,38.11,128.11"]
     Content type = null
             Body = 
    Forwarded URL = null
   Redirected URL = https://map.kakao.com/link/map/address,38.11,128.11
          Cookies = []
```


- - -
Referrence 

<https://shinsunyoung.tistory.com/52>   
<https://jdm.kr/blog/165>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

