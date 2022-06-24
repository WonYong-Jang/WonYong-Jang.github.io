---
layout: post
title: "[Spring] WebClient"
subtitle: "WebClient와 RestTemplate 비교 / HttpClient 모듈" 
comments: true
categories : Spring
date: 2022-06-26
background: '/img/posts/spring.png'
---

## 1. Spring WebClient 소개   

`Spring WebClient는 스프링 5.0 부터 제공되며, 
웹으로 API를 호출하기 위해 사용되는 Http Client 모듈 중 하나이다.`      

참고로 Java에서 가장 많이 사용하는 Http Client는 RestTemplate이며, 스프링 3.0부터 지원하여 
Http 통신에 유용하게 쓸 수 있는 템플릿이다.    

`공통점은 둘다 HttpClient 모듈이라는 것이고 차이점은 
통신방법이 RestTemplate은 Blocking 방식이고, WebClient는 Non-Blocking방식이다.`       

Non-blocking방식이 필요한 이유는 네트워킹의 병목현상을 줄이고 성능을 
향상시키기 위해서이다.   
결론적으로, Spring WebClient가 필요한 이유는 요청자와 제공자 사이의 
통신을 좀 더 효율적인 Non-Blocking방식으로 하기 위해서이다.   

- - -   

## 2. WebClient와 RestTemplate 비교   

그럼 RestTemplate과 WebClient를 비교하여 차이점을 자세히 살펴보자.   

#### 2-1) RestTemplate   

`먼저, RestTemplate은 Multi-Thread와 Blocking방식을 사용한다.`   

기본 스트링 부트 의존성을 추가하면 RestTemplate 관련 의존성은 자동으로 
추가된다. 따라서 스프링 부트를 사용한다면 별다른 신경을 쓰지 않아도 된다.   

```gradle
implementation 'org.springframework.boot:spring-boot-starter-web'
```   

아래 그림으로 동작 방식을 살펴보자.   

<img width="600" alt="스크린샷 2022-06-24 오후 4 37 41" src="https://user-images.githubusercontent.com/26623547/175487150-47c3e695-57be-43ff-98f0-a2ca04b8ce37.png">   

Thread pool은 어플리케이션 구동시에 미리 만드어 놓는다.   
Request는 먼저 Queue에 쌓이고 가용한 스레드가 있으면 그 스레드에 
할당되어 처리된다.   
즉, 1 요청 당 1 스레드가 할당된다.   
각 스레드에서는 Blocking방식으로 처리되어 응답이 올때까지 그 
스레드는 다른 요청에 할당될 수 없다.   

`요청을 처리할 스레드가 있으면 아무런 문제가 없지만 스레드가 다 차는 
경우 이후의 요청은 Queue에 대기하게 된다.`   
`대부분의 문제는 네트워킹이나 DB와의 통신에서 생기는데 
이런 문제가 여러 스레드에서 발생하면 가용한 스레드수가 
현저하게 줄어들게 되고, 결국 전체 서비스는 매우 느려지게 된다.`   

#### 2-2) WebClient   

`WebClient는 Single Thread와 Non-Blocking 방식을 사용한다.`   

WebClient를 사용하기 위해서는 RestTemplate와 달리 의존성을 추가해야 할 부분이 있다.     
webflux 의존성을 추가해줘야 한다.     

```gradle
// webflux
implementation 'org.springframework.boot:spring-boot-starter-webflux'
```

아래 그림으로 동작방식을 살펴보자.   

<img width="611" alt="스크린샷 2022-06-24 오후 4 44 35" src="https://user-images.githubusercontent.com/26623547/175488473-56b3df39-2a96-4bb8-ba95-ad43b55a248e.png">    

각 요청은 Event Loop내에 Job으로 등록이 된다.   
Event Loop는 각 Job을 제공자에게 요청한 후, 결과를 기다리지 않고 
다른 Job을 처리한다.   
Event Loop는 제공자로부터 callback으로 응답이 오면, 그 결과를 요청자에게 
제공한다.   
WebClient는 이렇게 이벤트에 반응형으로 동작하도록 설계되었다.   
그래서 반응성, 탄력성, 가용성, 비동기성을 보장하는 Spring React 프레임워크를 사용한다.   
또한, React Web 프레임워크인 Spring WebFlux에서 Http Client로 사용된다.   


#### 2-3) 성능 비교   

아래는 RestTemplate을 사용하는 Spring Boot1과 WebClient를 사용하는 
Spring Boot2의 성능 비교 결과이다.   
1000명까지는 비슷하지만 동시 사용자가 늘수록 RestTemplate은 급격하게 느려지는 것을 볼 수 있다.   

<img width="721" alt="스크린샷 2022-06-24 오후 4 49 47" src="https://user-images.githubusercontent.com/26623547/175490636-04d18250-c28e-43c9-9f54-75449bf8eca8.png">   

[Spring 공식문서](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html)에서는 아래와 같이 
WebClient를 사용할 것을 권고 하고 있다.   

<img width="1392" alt="스크린샷 2022-06-24 오후 4 56 45" src="https://user-images.githubusercontent.com/26623547/175490653-f7737dc4-2f3a-47ae-836a-5e3e530330e2.png">   

- - - 

## 정리   

이전까지 RestTemplate을 문제 없이 사용하고 있는 시스템이라면 굳이 WebClient로 
모두 변경할 필요는 없지만, 새롭게 개발을 진행한다면 WebClient의 도입을 
고려해 봐야한다.   
WebClient는 RestTemplate이 할 수 있는 동기호출을 할 수 있고 비동기 호출도 가능하다.   
하지만 RestTemplate은 WebClient가 가능한 비동기 호출을 할 수 없다.   
그렇기 때문에 규모 있는 시스템 개발을 시작한다면, 
    RestTemplate 대신 WebClient를 고려해 보자.   

- - -
Referrence 

<https://musma.github.io/2019/04/17/blocking-and-synchronous.html>   
<https://tecoble.techcourse.co.kr/post/2021-07-25-resttemplate-webclient/>   
<https://happycloud-lee.tistory.com/220>   
<https://gngsn.tistory.com/154>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

