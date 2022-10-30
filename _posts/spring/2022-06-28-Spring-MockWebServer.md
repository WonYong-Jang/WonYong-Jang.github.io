---
layout: post
title: "[Spring] MockWebServer 외부 API 테스트하기"
subtitle: "WebClient, RestTemplate 재처리 테스트 / spock @SpringBean" 
comments: true
categories : Spring
date: 2022-06-28
background: '/img/posts/spring.png'
---

## 1. MockWebServer란?   

어플리케이션을 개발 하다보면 외부 API를 사용해야 할 일이 많다.    
`외부 서버는 우리가 제어할 수 있는 대상이 아니기 때문에 Mocking 하여 
테스트를 진행해야 한다.`       

그럼 외부 서버를 Mocking함으로써 얻을 수 있는 장점은 무엇일까?   

- `외부 서버에 종속적인 외부 API와 나의 비즈니스 로직을 분리함으로써 
나의 비즈니스 로직을 테스트할 수 있게 된다.`      

- `API 스펙만 확립되어 있다면 다른 개발팀에서 개발 중인 외부 API와 
서로 독립적으로 개발이 가능해진다.`      

- `외부 API 혹은 네트워크가 문제가 있더라도 외부 요인과 관계없이 테스트가 가능해진다.`      

일반적으로 Controller 단위 테스트에서 Service를 Mocking하고 테스트를 진행하듯 
외부 서버도 우리의 로직에서는 Mocking하고 우리의 로직만 테스트할 수 있다.     

하나의 예를 들어보자.   

[Kakao 주소 검색하기 api](https://developers.kakao.com/docs/latest/ko/local/dev-guide)를 
이용하여 개발하고 있으며, 해당 api의 네트워크 통신의 오류 등을 고려하여 
재처리 로직을 구현하였다.   

이를 어떻게 테스트 할까? 

외부 서버의 api를 테스트 하기 가장 쉬운 방법은 직접 외부 서버와 통신해보며, 
    테스트 하는 것일 것이다.     
직접 PostMan을 통해 요청과 응답을 확인하고, 테스트에서 값이 잘 오는지 
확인하면 된다.  

`하지만 위 방식은 재처리 로직을 테스트 하기 위해서 외부 서버 api가 
실제로 네트워크 통신 에러 등의 응답값을 보내 주어야 실패 했을 경우 
재처리가 잘 되는지 테스트가 가능하기 때문에 부적절하다.`   

그렇기 때문에 외부 서버를 Mocking함으로써 내가 원하는 response를 차례대로 
리턴해주어 재처리가 잘 되는지 테스트가 가능하다.    

외부 서버를 Mocking하는 방법은 
`단위 테스트를 하는 방법과 통합 테스트를 하는 방법 2가지가 존재한다.`      

첫번째 방법은 webclient 또는 restTemplate과 같은 http client 모듈을 
mocking하여 단위테스트 하는 방법이다.    
[링크](https://www.arhohuttunen.com/spring-boot-webclient-mockwebserver/)를 참고해보면, 
webclient를 mocking한 예가 나오며, webclient를 mocking하려면 각 chain 별로 모두 
mocking해야 하기 때문에 테스트하기 어려운 단점이 있다.    

`두번째 방법은 MockWebServer를 사용한 통합 테스트이며, 실제 api 호출을 하지만 
외부 서버로 호출하는게 아닌 로컬에 띄운 MockWebServer를 통해 테스트를 진행한다.`       

MockWebServer를 연동하면, 테스트코드가 실제로 로컬에 있는 MockWebServer의
엔드포인트로 호출을 한다.

참고로 [스프링 팀](https://github.com/spring-projects/spring-framework/issues/19852#issuecomment-453452354)에서도 
MockWebServer를 추천하고 있다.   

이 글에서는 MockWebServer를 자세히 살펴보자.    

- - -   

## 2. MockWebServer 시작하기   

MockWebServer를 사용하기 위해 build.gradle에 의존성을 추가한다.   

```groovy   
// webClient test
testImplementation group: 'com.squareup.okhttp3', name: 'mockwebserver', version: '4.0.1'
testImplementation group: 'com.squareup.okhttp3', name: 'okhttp', version: '4.0.1'
// StepVerifier 비동기, 논블록킹 테스트 툴
testImplementation group: 'io.projectreactor', name: 'reactor-test', version: '3.4.6'
```

이제 아래와 같이 테스트 마다 MockWebServer를 시작하고 테스트가 끝나면 종료할 수 있도록 
설정해준다.    

```groovy   
@SpringBootTest
class KakaoAddressSearchServiceRetryTest extends Specification {

    private MockWebServer mockWebServer

    def setup() {
        mockWebServer = new MockWebServer()
        mockWebServer.start()
    }

    def cleanup() {
        mockWebServer.shutdown()
    }
```

이제 아래 코드를 MockWebServer를 통해 재처리가 잘 되는지 확인해보자.    

```java
public KakaoApiResponseDto requestAddressSearch(String address) {

        URI uri = kakaoUriBuilderService.buildUriByAddressSearch(address);

        return webClient.get()
                .uri(uri)
                .header(HttpHeaders.AUTHORIZATION, "KakaoAK " + kakaoRestApiKey)
                .accept(MediaType.APPLICATION_JSON)
                .retrieve()
                .bodyToMono(KakaoApiResponseDto.class)
                .retryWhen(Retry.fixedDelay(3, Duration.ofSeconds(2)))
                .block();
}
```

`MockWebServer에는 내가 원하는 response를 리턴할 수 있도록 차례대로 stub response를
만들어서 넣을 수 있다.`   
`아래와 같이 MockResponse 타입으로 내가 원하는 stub 객체를 생성한 뒤, enqueue 메소드를 이용하여 
넣어 주면 MockWebServer는 순서대로 응답을 리턴한다.`      
`즉, 우리는 response code, headers, response body 등을 지정하여 리턴할 수 있게 된다.`    

또한, 테스트 실행시 MockWebServer의 port는 동적으로 localhost에 할당 된다.     

아래는 최종 retry 테스트 코드이다.   

```java
class KakaoAddressSearchServiceRetryTest extends AbstractIntegrationContainerBaseTest {

    @Autowired
    private KakaoAddressSearchService kakaoAddressSearchService

    @SpringBean
    private KakaoUriBuilderService kakaoUriBuilderService = Mock()

    private MockWebServer mockWebServer

    private ObjectMapper mapper = new ObjectMapper()

    def setup() {
        mockWebServer = new MockWebServer()
        mockWebServer.start()
    }

    def cleanup() {
        mockWebServer.shutdown()
    }

    def "requestAddressSearch retry success"() {
        given:
        def address = "서울 성북구 종암로 10길"
        def metaDto = new MetaDto(1)
        def documentDto = DocumentDto.builder()
                .addressName(address)
                .build()
        def expectedResponse = new KakaoApiResponseDto(metaDto, Arrays.asList(documentDto))
        def uri = mockWebServer.url("/").uri()

        when:
        kakaoUriBuilderService.buildUriByAddressSearch(address) >> uri

        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(200)
                .setBody(mapper.writeValueAsString(expectedResponse))
                .addHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE))

        def kakaoApiResult = kakaoAddressSearchService.requestAddressSearch(address)

        then:
        def takeRequest = mockWebServer.takeRequest()
        takeRequest.getMethod() == "GET"
        kakaoApiResult.getDocumentList().size() == 1
        kakaoApiResult.getMetaDto().totalCount == 1
        kakaoApiResult.getDocumentList().get(0).getAddressName() == address
    }

    def "requestAddressSearch retry fail "() {
        given:
        def address = "서울 성북구 종암로 10길"
        def uri = mockWebServer.url("/").uri()

        when:
        kakaoUriBuilderService.buildUriByAddressSearch(address) >> uri

        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(429))
        mockWebServer.enqueue(new MockResponse().setResponseCode(429))

        kakaoAddressSearchService.requestAddressSearch(address)

        then:
        def e = thrown(Exceptions.RetryExhaustedException.class)
    }
}
```   

위의 `@SpringBean`는 Spock에서는 @MockBean 대신에 [@SpringBean](https://spockframework.org/spock/docs/1.2/module_spring.html#_using_code_springbean_code)을 사용한다.     

Mock은 껍데기만 있는 객체를 의미한다.    
인터페이스의 추상메서드가 메소드 바디는 없고 파라미터 타입과 
리턴타입만 선언된 것처럼, `Mock Bean은 기존에 사용되던 Bean의 껍데기만 
가져오고 내부의 구현 부분은 모두 사용자에게 위임한 형태이다.`      

즉, 해당 Bean의 어떤 메소드가 어떤 값이 입력 되면 어떤 값이 
리턴 되어야 한다는 내용을 모두 개발자 필요에 의해서 
조작이 가능하다.   

위에서는 KakaoUriBuilderService mock bean 객체를 이용하여 
실제 서버 url을 호출하는 것이 아니라, mockWebServer url (localhost)을 
호출 하기 위해서 스프링 컨테이너 내에 있는 bean 객체를 mocking하여 
테스트 하였다.   

- - -
Referrence 

<https://spockframework.org/spock/docs/1.3/module_spring.html>    
<https://www.arhohuttunen.com/spring-boot-webclient-mockwebserver/>    
<https://github.com/square/okhttp/blob/master/mockwebserver/README.md>   
<https://github.com/spring-projects/spring-framework/issues/19852#issuecomment-453452354>   
<https://velog.io/@kyle/%EC%99%B8%EB%B6%80-API%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%95%A0-%EA%B2%83%EC%9D%B8%EA%B0%80>   
<https://developers.kakao.com/docs/latest/ko/local/dev-guide>    
<https://www.baeldung.com/spring-mocking-webclient>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

