---
layout: post
title: "[Spring] Non-Blocking 방식의 WebClient 이해하기"
subtitle: "WebClient와 RestTemplate 비교 / HttpClient 모듈 / Blocking, Non-Blocking / 동기, 비동기" 
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

> Blocking, Non-Blocking 에 대해서는 아래에서 자세히 살펴보자.   

Non-blocking방식이 필요한 이유는 네트워킹의 병목현상을 줄이고 성능을 
향상시키기 위해서이다.   
결론적으로, Spring WebClient가 필요한 이유는 요청자와 제공자 사이의 
통신을 좀 더 효율적인 Non-Blocking방식으로 하기 위해서이다.   

- - -      

## 2. Blocking, Non-Blocking 과 동기, 비동기    

위에서 Non-Blocking과 Blocking이라는 용어가 언급되었고, 
    이를 동기와 비동기라는 개념으로 잘못 이해할 수 있다.     

아래 그림은 왼쪽이 Application이고 오른쪽이 Kernel이며, 이를 통해 
차이점을 확인해보자.   

설명 전, 먼저 알아야할 개념들이 있는데 `제어권`, `결과값`이라는 말이다.   

- 제어권: 함수를 실행시킬 수 있는 권리, 말 그대로 작업을 실행시킬 수 있는 권한이다.   
- 결과값: 우리가 보통 알고 있는 함수의 리턴값이며, 만약 함수가 계산을 끝마치치 못했는데, 갑자기 결과값을 요구한다면 아직 계산못함 이라는 임시 결과값을 보낼 수도 있다.   

<img width="751" alt="스크린샷 2022-06-25 오후 3 56 20" src="https://user-images.githubusercontent.com/26623547/175762719-babb3080-f974-4747-bf73-42755a49fa5e.png">    

#### 2-1) Blocking과 Non-Blocking   

`Blocking이란` Application이 kernel로 작업 요청을 할 때, kernel에서는 
요청에 대한 로직을 실행한다.   
이때, Application은 요청에 대한 응답을 받을 때까지 대기를 한다.   
즉, Kernel에 작업을 요청할 때, 제어권도 함께 넘겨주고 작업이 끝난 후에 돌려 
받는 방식이다.   

`반면, Non-Blocking이란 Application이 요청을 하고 바로 제어권을 받는다.`    
다른 로직을 실행할 수 있도록 하는 것이 Non-blocking이다.      
즉, Kernel에 작업을 요청할 때, 제어권을 넘겨주기는 하지만 바로 
돌려받는다.

이를 아래 예시를 통해서 이해를 해보자.   
먼저, Blocking의 경우는 아래와 같다.   

```
Application: 이 서류 확인 해주세요.
Kernel: 다 볼때까지 대기해 주세요.
...

Kernel: 확인 끝났어요. 자리로 돌아가서 결과 확인하세요.   
Application: (결과를 받아 바로 일을 처리한다.)       
```

반면, Non-Blocking 방식의 예는 아래와 같다.   

```
Application: 이 서류 확인해주세요.   
Kernel: 확인할테니 돌아가서 일 보세요.  
...
Application: (다른 일을 진행할 수 있다.)   
```

`위에서 Blocking과 Non-Blocking의 가장 중요한 차이는 Kernel이 일을 진행할 때, 
    제어권이 있는지 없는지로 볼 수 있다.`   

#### 2-2) Synchronous 와 Asynchronous   

`Synchronous는 동기라는 뜻을 가지며, 작업을 동시에 수행하거나 동시에 
끝나거나 끝나는 동시에 시작함을 의미한다.`   
이런 규칙을 정하고 지킬 수 있는 이유는, 요청자가 요청한 일들이 
완료되었는지를 계속 확인하기 때문이다.    

`Asynchronous는 비동기라는 뜻을 가지며, 시작 종료가 일치하지 않으며, 
    끝나는 동시에 시작하지 않음을 의미한다.`   
다시말해 두 함수는 서로 언제 시작하고, 언제 일을 마치는지 전혀 
신경쓰지 않는 것이다.   
요청자는 작업을 요청해놓고 계속 완료되었는지 확인하는게 아니라, 
    완료되면 알아서 알려주겠거니 하고 다른 일을 진행한다.   

이번에도 아래 예시를 통해 이해해보자.   
먼저 동기의 경우는 아래와 같다.   

```
Application: 이 서류 확인해 주세요.   
Kernel: (기다리거나 다른일을 해도 신경쓰지 않는다) 확인 중..
... 
Kernel: 확인했어요. 결과 확인해보세요.   
Application: (바로 결과를 확인하여 일을 처리한다.)   
```

반면, 비동기의 경우는 아래와 같다.   

```
Application: 이 서류 확인해 주세요.   
Kernel: (기다리거나 다른일을 해도 신경쓰지 않는다) 확인 중..
...
Kernel: 확인했어요. 결과 확인해보세요.  
Application: (자신의 일이 끝나면, 받은 결과를 확인하여 일을 처리한다.)      
```

`Blocking과 Non-Blocking이 제어권 반환에 중점을 두었다면, 
    동기와 비동기는 작업들이 시간에 맞춰서 실행되는지 아닌지에 대한 이야기이다.`       

그럼 마지막으로 위에서 블로킹과 논블로킹, 동기와 비동기를 
크로스 오버한 표에 대해서 살펴보자.   

#### 2-3) Blocking과 Sync 조합  

`이 조합은 요청받은 함수의 작업이 끝나야 제어권을 돌려받으며, 요청자는 결과가 
나올때까지 계속 확인을 한다.`   

> 자바에서 I/O 입력을 받는 동안 Blocking 되어 있는 상황을 예로 들 수 있다.   

```
Application: 서류 확인해주세요.   
Kernel: 확인 끝날때까지 대기해주세요.       
Application: (아무것도 안하고 기다리며, 언제끝나는지 궁금해 한다.)      
...
Kernel: 확인 끝났어요.
Application: (바로 결과를 받아 다음 일을 처리한다.)   
```


#### 2-4) Blocking과 Async 조합   

`이 조합은 요청받은 함수의 작업이 끝나야 제어권을 돌려받으며, 결과는 요청받은 함수가 알려준다.`   

> 이 조합은 비동기인데 굳이 Blocking 사용하는 경우는 거의 없을 것 같다.   
> 보통, 개발자의 실수로 비동기로 의도하여 코드를 작성했지만 동기로 
동작하는 것을 예로 들 수 있다.   

```
Application: 이 서류 확인해주세요.   
Kernel: 확인할테니 대기하세요.    
Application: (아무것도 안하고 기다리며, 언제끝나는지 관심없음)
Kernel: 완료했어요.   
Application: (돌아가서 일을 진행하다가, 시간 날때 아까 받은 결과값을 이어 받아 진행한다.)   
```


#### 2-5) Non-Blocking과 Sync 조합   

`이 조합은 제어권을 바로 돌려주며, 요청자는 다른 일을 진행하면서 결과가 나올때까지 계속 확인한다.`   

```
Application: 이 서류 확인해주세요.   
Kernel: 확인할테니 돌아가서 일보세요.   

Application: (다른 일 진행하다가) 끝나셨나요?  
Kernel: 아직이요.
Application: (다른 일 진행하다가) 끝나셨나요?   
Kernel: 완료했습니다.   
Application: (즉시 결과를 확인하여 다음 일을 처리한다.)    
```

#### 2-6) Non-Blocking과 Async 조합   

`이 조합은 제어권을 바로 돌려주며, 결과는 요청받은 함수가 알아서 알려준다.`   

```
Application: 이 서류 확인해주세요.   
Kernel: 네 확인할테니 돌아가서 일 보세요.   
Application: (다른 일 하는 중)  
...
Kernel: 완료했어요.  
Application: (자신의 일이 끝나면, 결과값을 확인하여 다음 일을 처리한다.)      
```


- - -

## 3. WebClient와 RestTemplate 비교   

그럼 RestTemplate과 WebClient를 더 자세하게 비교하여 차이점을 자세히 살펴보자.     

### 3-1) RestTemplate   

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
이런 문제가 여러 스레드에서 발생하면 가용한 스레드 수가 
현저하게 줄어들게 되고, 결국 전체 서비스는 매우 느려지게 된다.`   

### 3-2) WebClient   

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


### 3-3) 성능 비교   

아래는 RestTemplate을 사용하는 Spring Boot1과 WebClient를 사용하는 
Spring Boot2의 성능 비교 결과이다.   
1000명까지는 비슷하지만 동시 사용자가 늘수록 RestTemplate은 급격하게 느려지는 것을 볼 수 있다.   

<img width="721" alt="스크린샷 2022-06-24 오후 4 49 47" src="https://user-images.githubusercontent.com/26623547/175490636-04d18250-c28e-43c9-9f54-75449bf8eca8.png">   

[Spring 공식문서](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/web/client/RestTemplate.html)에서는 RestTemplate 보다 
WebClient를 사용할 것을 권고 하고 있다.   


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

<https://joooing.tistory.com/entry/%EB%8F%99%EA%B8%B0%EB%B9%84%EB%8F%99%EA%B8%B0-%EB%B8%94%EB%A1%9C%ED%82%B9%EB%85%BC%EB%B8%94%EB%A1%9C%ED%82%B9>   
<https://musma.github.io/2019/04/17/blocking-and-synchronous.html>   
<https://tecoble.techcourse.co.kr/post/2021-07-25-resttemplate-webclient/>   
<https://happycloud-lee.tistory.com/220>   
<https://gngsn.tistory.com/154>   

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

