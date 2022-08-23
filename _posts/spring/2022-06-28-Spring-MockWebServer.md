---
layout: post
title: "[Spring] MockWebServer 외부 API 테스트하기"
subtitle: "WebClient, RestTemplate 재처리 테스트" 
comments: true
categories : Spring
date: 2022-06-28
background: '/img/posts/spring.png'
---


## 1. MockWebServer란?   

어플리케이션을 개발 하다보면 외부 API를 사용해야 할 일이 많다.    
`외부 서버는 우리가 제어할 수 있는 대상이 아니기 때문에 Mocking 하여 
테스트를 진행해야 하며, MockWebServer를 통해서 테스트를 쉽게 작성할 수 있다.`    

MockWebServer를 연동하면, 테스트코드가 실제로 로컬에 있는 MockWebServer의 
엔드포인트로 호출을 한다.   
 

그럼 외부 서버를 Mocking함으로써 얻을 수 있는 장점은 무엇일까?   

- `외부 서버에 종속적인 API를 외부 서버와 나의 비즈니스 로직으로 분리함으로써 
나의 비즈니스 로직을 테스트할 수 있게 된다.`      

- `API 스펙만 확립되어 있다면 다른 개발팀에서 개발 중인 외부 서버와 
서로 독립적으로 개발이 가능해진다.`      

- `외부 API 혹은 네트워크가 문제가 있더라도 외부 요인과 관계없이 테스트가 가능해진다.`      

일반적으로 Controller 단위 테스트에서 Service를 Mocking하고 테스트를 진행하듯 
외부 서버도 우리의 로직에서는 Mocking하고 우리의 로직만 테스트할 수 있다.   


## 2. MockWebServer 시작하기   

MockWebServer를 사용하기 위해 build.gradle에 의존성을 추가한다.   

```groovy   
// webClient test
testImplementation group: 'com.squareup.okhttp3', name: 'mockwebserver', version: '4.0.1'
testImplementation group: 'com.squareup.okhttp3', name: 'okhttp', version: '4.0.1'
testImplementation group: 'io.projectreactor', name: 'reactor-test', version: '3.4.6'
```



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

MockWebServer에는 내가 원하는 response를 리턴할 수 있도록 차례대로 stub response를 
만들어서 넣을 수 있다.   
아래와 같이 MockResponse 타입으로 내가 원하는 stub 객체를 생성한 뒤, enqueue해서 넣어 주면 
MockWebServer는 엔큐된 순서대로 응답을 리턴한다.   


- - -
Referrence 

<https://github.com/square/okhttp/blob/master/mockwebserver/README.md>   
<https://github.com/spring-projects/spring-framework/issues/19852#issuecomment-453452354>   
<https://velog.io/@kyle/%EC%99%B8%EB%B6%80-API%EB%A5%BC-%EC%96%B4%EB%96%BB%EA%B2%8C-%ED%85%8C%EC%8A%A4%ED%8A%B8-%ED%95%A0-%EA%B2%83%EC%9D%B8%EA%B0%80>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

