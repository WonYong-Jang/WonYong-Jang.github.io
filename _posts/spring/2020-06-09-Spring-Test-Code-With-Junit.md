---
layout: post
title: "[Spring] Junit을 이용한 테스트 코드 작성"
subtitle: "단위 테스트를 위한 MockMvc, WebMvcTest"
comments: true
categories : Spring
date: 2020-06-09
background: '/img/posts/spring.png'
---

## 테스트 코드 소개 

시작 전에 TDD와 단위 테스트는 다른 이야기 이다. TDD는 테스트가 주도하는 개발을 이야기하며 
테스트 코드를 먼저 작성하는 것부터 시작한다.

반면 단위 테스트는 TDD의 첫 번째 단계인 `기능 단위의 테스트 코드를 작성` 하는 것을 이야기 한다.   
TDD와 달리 테스트 코드를 꼭 먼저 작성해야 하는 것도 아니고, 리팩토링도 포함되지 않는다.

### 테스트 코드 작성 장점 

- 단위 테스트는 개발단계 초기에 문제 발견에 도움을 준다.
- 단위 테스트는 기능에 대한 불확실성을 감소시킬 수 있으며, 단위 테스트 자체가 문서로 
사용 될수 있다. 
- 테스트 코드를 작성하지 않고 개발한다면 아래와 같은 작업을 반복하게 된다.    

`코드 작성 후 Tomcat 실행 -> Postman 같은 테스트 도구로 http 요청 확인 -> 결과를 sysout으로 확인`

- 개발자가 만든 기능을 안전하게 보호해 준다.

`B라는 기능을 새로 추가 하여 오픈했더니 기존에 잘되던 A기능이 문제가 생기는 경우가 많다. A B 기능 모두 테스트 코드를 작성 
했다면 오픈 전에 문제를 확인 가능하다.`   

- - - 
### 실습 1

```java

@RunWith(SpringRunner.class)
@WebMvcTest(controllers = HelloController.class)
public class HelloControllerTest {

    @Autowired
    private MockMvc mvc;

    @Test
    public void hello가_리턴된다() throws Exception {
        String hello = "hello";

        mvc.perform(MockMvcRequestBuilders.get("/hello"))
                .andExpect(status().isOk())
                .andExpect(content().string(hello));
    }
}

```

##### @RunWith(SpringRunner.class)

테스트를 진행할 때 Junit에 내장된 실행자 외에 다른 실행자를 실행시킨다. SpringRunner라는 스프링 실행자를 
실행시킴으로써 스프링 부트 테스트와 JUnit 사이에 연결자 역할을 한다.

##### @WebMvcTest

여러 스프링 테스트 어노테이션 중, Web(Spring MVC)에 집중할 수 있는 어노테이션이다. 선언할 경우 
@Controller, @ControllerAdvice 사용 가능하다. 

##### MockMvc mvc

`웹API를 테스트할 때 사용한다. 스프링 MVC 테스트의 시작점이며, 이 클래스를 통해 HTTP GET, POST 등에 대한 API 테스트를 
할 수 있다.`   

- mvc.perform(get("/hello"))
MockMvc를 통해 /hello 주소로 HTTP GET 요청을 한다. 

- .andExpect(status().isOk())
mvc.perform의 결과를 검증하며, HTTP Header의 Status를 검증한다. 우리가 흔히 알고 있는 
200, 404, 500 등의 상태를 검증하고 여기서는 200인지를 검증하고 있다.    

- .andExpect(content().string(hello))
mvc.perform의 결과를 검증하며 응답 본문의 내용을 검증한다. Controller에서 
hello를 리턴하는데 이 값이 맞는지 검증 한다.   

- - -

### 실습 2

```java

public class HelloResponseDtoTest {

    @Test
    public void 롬북_기능_테스트() {
        String name = "test";
        int amount = 1000;

        HelloResponseDto dto = new HelloResponseDto(name, amount);

        assertThat(dto.getName()).isEqualTo(name);
        assertThat(dto.getAmount()).isEqualTo(amount);
    }
}

```

##### assertThat

`assertj라는 테스트 검증 라이브러리의 검증 메소드이다. 검증하고 싶은 대상을 메소드 인자로 받는다.`   
isEqualTo와 같이 메소드를 이어서 사용 가능   

Junit의 기본 assertThat이 아닌 assertj의 assertThat을 사용한다. assertj 역시 Junit에서 자동으로 
라이브러리 등록을 해주며, Junit과 비교하여 assertj의 장점은 다음과 같다.   

> Junit의 assertThat을 쓰게 되면 is()와 같이 CoreMatchers 라이브러리가 추가로 필요하다.   
> 자동완성이 좀 더 확실하게 지원된다.   

##### isEqualTo

비교 메소드이며, assertThat에 있는값과 비교해서 같을 때만 성공이다.   

- - -
Referrence 

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

