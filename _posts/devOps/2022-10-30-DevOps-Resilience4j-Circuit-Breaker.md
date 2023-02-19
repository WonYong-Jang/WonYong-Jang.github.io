---
layout: post
title: "[Resilience4j] CircuitBreaker"
subtitle: "OPEN, CLOSED, HALF OPEN, DISABLED, FORCE OPEN"
comments: true
categories : DevOps
date: 2022-10-30
background: '/img/posts/mac.png'
---

Resilience4j는 Netflix의 Hystrix에 영감을 받아 개발된 경량화 Fault Tolerance 라이브러리이다.   

> Netflix Hystrix는 현재 지원 종료 상태이기 때문에 Resilience4j가 권장되는 상태이다.      

Resilience4j 모듈의 종류는 아래와 같으며, 이 글에서는 Circuit Breaker를 자세히 살펴볼 것이다.    

- Retry
- Circuit Breaker   
- Bulkhead   
- RateLimiter   
- TimeLimiter   
- Cache   

`Circuit Breaker란 서비스에서 타 서비스 호출 시 에러, 응답지연, 무 응답, 일시적인 네트워크 문제 등 요청이 무작위로 
    실패하는 경우에 Circuit를 OPEN하여 미리 정해놓은 Fallback Response를 보내어 서비스 장애가 전파되지 않도록 
    하는 패턴이다.`       

> 주로 MSA 환경에서 사용한다.   


- - - 

## 1. 서킷브레이커의 상태   

서킷 브레이커는 유한한 개수의 상태를 가질 수 있는 장치인 FSM(finite state machine)으로 
세가지 일반적인 상태는 아래와 같다.   

<img width="795" alt="스크린샷 2023-02-19 오후 5 33 06" src="https://user-images.githubusercontent.com/26623547/219937534-2c6ff8ff-2746-42ca-b2fd-49929c503462.png">    


- CLOSED: `초기상태이며 모든 접속은 평소와 같이 실행된다. 서킷브레이커가 닫혀 있는 상태로 서킷 브레이커가 감싼 내부의 프로세스로 요청을 보내고 응답을 받을 수 있다.`     

- OPEN: `에러율 임계치를 넘어서면 서킷 브레이커 상태가 OPEN 되며, 모든 접속은 차단된다.`       

- HALF_OPEN: `OPEN 상태 중간에 한번씩 요청을 날려 응답이 성공인지를 확인하는 상태이며 OPEN 후 일정 시간이 지나면 HALF OPEN 상태가 된다. 접속을 시도하여 성공하면 
CLOSED, 실패하면 OPEN으로 되돌아 간다.`      


- - - 

## 2. 서킷브레이커의 여러가지 설정   

서킷 브레이커에서 제공하는 여러가지 구성 요소에 대해 살펴보자.   

- failureRateThreshold(default 50): 실패 비율 임계치를 백분율로 설정한다. 실패 비율이 임계치보다 크거나 같으면 CircuitBreaker는 OPEN 상태로 전환되며, 이때부터 호출을 끊어 낸다.   

- slowCallRateThreshold(default 100): 임계값을 백분율로 설정한다. 호출에 걸리는 시간이 해당 설정 값보다 길면 느린 호출로 간주한다. 느린 호출 비율이 임계치보다 크거나 같으면 서킷 브레이커는 OPEN 상태로 전환되며, 이때 부터 호출을 끊어 낸다.   

- slowCallDurationThreshold(default 60000ms): 호출에 소요되는 시간이 설정한 임계치보다 길면 느린 호출로 계산한다.   

- permittedNumberOfCallsInHalfOpenState(default 10): HALF OPEN 상태일 때, 받아들일 요청의 개수를 지정한다.     

- maxWaitDurationInHalfOpenState(default 0): 서킷 브레이커를 HALF OPEN 상태로 유지할 수 있는 최대 시간으로, 이 시간 만큼 
                                             경과하면 OPEN 상태로 전환한다. 0일 땐 허용 횟수만큼 호출을 모두 완료할 때까지 HALF OPEN 상태로 무한정 기다린다.   

- slidingWindowType(default COUNT_BASED): 서킷 브레이커가 CLOSED 상태에서 호출 결과를 기록할 때 쓸 슬라이딩 윈도우 타입을 설정한다. 슬라이딩 윈도우는 카운트 기반과 시간 기반이 있다. 슬라이딩 윈도우가 COUNT BASED일 땐 마지막 slidingWindowSize 횟수 만큼 호출을 기록하고 
                                          집계한다. TIME BASED일 땐 마지막 slidingWindowSize 초 동안의 호출을 기록하고 집계한다.     

- slidingWindowSize(default 100): 서킷 브레이커가 CLOSED 상태에서 호출 결과를 기록할 때 쓸 슬라이딩 윈도우의 크기를 설정한다.   


- minimumNumberOfCalls(default 100): 서킷브레이커가 실패 비율이나 느린 호출 비율을 계산할 때 필요한(슬라이딩 윈도우 주기마다) 최소 호출 수를 설정한다. 
                                     예를 들어서 minimumNumberOfCallsrk 10이라면 최소한 호출을 10번을 기록해야 실패 비율을 계산할 수 있다. 기록한 호출 횟수가 
                                     9번 뿐이라면 9번 모두 실패했더라도 서킷 브레이커는 열리지 않는다.   

- waitDurationInOpenState(default 60000ms): 서킷 브레이커가 OPEN에서 HALF OPEN으로 전환하기 전 기다리는 시간이다.     

- - - 

## 3. Failure rate and slow call rate thresholds   

`실패 비율이 설정한 임계치보다 크거나 같을 땐 서킷 브레이커의 상태는 CLOSED에서 OPEN으로 변경된다.`   

> 예를 들면 50% 이상 실패로 기록 되었을 때이다.   

`기본적으로는 모든 exceptions을 실패로 간주한다.`    
`실패로 간주할 exceptions 리스트를 정의해도 되며, 그 외 exceptions들은 성공으로 처리된다.`      
`exception을 ignore할 수도 있으며, ignore하게 되면 실패 또는 성공 등으로 계산하지 않는다.`       

느린 호출(slow call) 비율이 설정한 임계치보다 크거나 같을 때도 서킷브레이커는 CLOSED에서 OPEN으로 변경된다.   

> 예를 들면 50% 이상이 5초 이상 소요된 것으로 기록되었을 때이다.   

`실패 비율과 느린 호출 비율을 계산하려면 먼저 minimumNumberOfCalls 가 기록되어야 한다.`   
예를 들어 minimumNumberOfCalls가 10이라면, 호출을 최소 10번은 기록한 다음에야 실패 비율을 계산할 수 있다.    
9번 밖에 측정하지 않았다면 9번 모두 실패했더라도 서킷브레이커는 열리지 않는다.   

`또한, 서킷 브레이커는 OPEN 상태일 땐 CallNotPermittedException을 던져 호출을 반려한다.`    
대기 시간이 경과하고 나면 OPEN에서 HALF OPEN으로 상태가 변경되며, 설정한 횟수만큼 호출을 허용해 
이 벡엔드가 아직도 이용 불가능한지, 아니면 사용 가능한 상태로 돌아왔는지 확인한다.   
허용한 호출을 모두 완료할 때까지는 그 이상의 호출은 CallNotPermittedException으로 거부된다.    
실패 비율이나 느린 호출 비율이 설정한 임계치보다 크거나 같으면 상태는 다시 OPEN으로 변경된다.   
둘 모두 임계치 미만이면 CLOSED 상태로 돌아간다.   

서킷 브레이커는 두가지 특수 상태 DISABLED(항상 접근 허용)과 FORCED OPEN(항상 접근 거부)을 지원한다.   
이 두 상태에선 서킷 브레이커 이벤트(상태 전환은 예외)를 생성하지도, 메트릭을 기록하지도 않는다.   
이 상태에서 빠져나오려면 상태 전환을 트리거하거나 서킷 브레이커를 리셋하는 방법 밖에 없다.   




- - - 

## 4. Create a CircuitBreakerRegistry   

Resilience4j는 thread safety와 원자성을 보장해주는 ConcurrentHashMap 기반 인 메모리 CircuitBreakerRegistry를 
함께 제공한다.  
`이 CircuitBreakerRegistry를 사용해서 CircuitBreaker 인스턴스들을 관리(생성, 조회)할 수 있다.`   
모든 CircuitBreaker 인스턴스를 위한 글로벌 디폴트 CircuitBreakerConfig를 사용하는 CircuitBreakerRegistry는 
다음과 같이 생성할 수 있다.   

```kotlin
CircuitBreakerRegistry circuitBreakerRegistry = 
  CircuitBreakerRegistry.ofDefaults();
```


- - -
Referrence 

<https://resilience4j.readme.io/docs/circuitbreaker>    
<https://godekdls.github.io/Resilience4j/circuitbreaker/>    

{% highlight ruby linenos %}
{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}

