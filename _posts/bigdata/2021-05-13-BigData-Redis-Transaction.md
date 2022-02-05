---
layout: post
title: "[Redis] Transaction 처리 - 이론편"
subtitle: "MULTI, EXEC, DISCARD, WATCH / Optimistic Locking / 레디스 트랜잭션에 Rollback이 없는 이유"       
comments: true
categories : BigData
date: 2021-05-13
background: '/img/posts/mac.png'
---


이번 글에서는 redis의 트랜잭션 이론에 대해서 살펴보자.   
그 이후 포스팅에서 실제로 Spring Data Redis를 이용하여 redis의 
트랜잭션을 실습해보자.   

- - - 

## Redis Transaction    

트랜잭션에 대해서는 [Spring 트랜잭션 관리](https://wonyong-jang.github.io/spring/2020/03/20/Spring-Transaction.html)를 참고해보자.   

Redis에서 트랜잭션이라니 조금 어색하다고 생각할 수 있지만, 여러 
자료구조를 사용할 수 있는 Redis의 특성상 트랜잭션을 잘 
이용하면 더 유용하게 다양한 상황에서 Redis를 사용할 수 있을 것이다.   

그렇다면 Redis의 트랜잭션은 어떻게 이용할 수 있을까?   

`트랜잭션을 유지하기 위해서는 순차성을 가져야 하고 도중에 명령어가 
치고 들어오지 못하게 Lock이 필요하다.`     
`Redis에서는 MULTI, EXEC, DISCARD 그리고 WATCH 명령어를 이용하면 된다.`    
각 명령어에 대한 설명은 아래와 같다.   

- MULTI   
    - Redis의 트랜잭션을 시작하는 커맨드이며 트랜잭션을 시작하면 Redis는 이후 
    커맨드는 바로 실행되지 않고 queue에 쌓인다.   

- EXEC    
    - 정상적으로 처리되어 queue에 쌓여있는 명령어를 일괄적으로 실행한다. RDBMS의 Commit과 비슷하다.   

- DISCARD   
    - queue에 쌓여있는 명령어를 일괄적으로 폐기한다. RDBMS의 Rollback과 비슷하다.   

- WATCH    
    - Redis에서 Lock을 담당하는 명령어이다. Watch 명령어를 사용하면 이 후 UNWATCH 되기전에는 1번의 EXEC 또는 Transaction이 아닌 다른 커맨드만 허용한다.     


- - - 

## Redis 트랜잭션 기본   

redis cli를 통해서 실습을 해보자. 아래는 정상일 경우에 어떻게 동작하는지 
알 수 있는 명령어들이다.   
`먼저 MULTI 커맨드를 입력한다. 그러면 이제 트랜잭션을 사용할 수 있다. 그 이후에 
들어오는 명령어는 바로 실행되는 것이 아니라 큐에 쌓이게 된다. 그리고 
마지막에 EXEC 커맨드를 통해 일괄적으로 실행되는 구조이다.`     
참고로 GET 커맨드 또한 QUEUE에 쌓이게 된다.   

```
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> SET AAA BLOG
QUEUED
127.0.0.1:6379(TX)> SET BBB BLOG
QUEUED
127.0.0.1:6379(TX)> GET AAA
QUEUED
127.0.0.1:6379(TX)> EXEC   # QUEUE에 쌓인 명령어 모두 출력   
1) OK
2) OK
3) "BLOG"     # GET 또한 바로 처리되지 않고 QUEUE 된 후 EXEC 했을 때 처리   
```

정상적으로 커맨드가 실행되었기 때문에 GET 했을 때 모두 정상적으로 
출력될 것이다.   

그렇다면 Rollback은 어떻게 이루어지는지 살펴보자.   
`Redis의 Rollback은 RDBMS와 조금 방식이 다르다.`    
아래의 여러 경우의 예제를 보며 확인해보자.    
`MULTI 커맨드를 사용한 후 DISCARD 명령어를 명시적으로 실행해보면 
QUEUE에 쌓여있던 명령어가 일괄적으로 없어지게 된다.`    

```
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> SET AAA BLOG
QUEUED
127.0.0.1:6379(TX)> SET BBB BLOG
QUEUED
127.0.0.1:6379(TX)> GET AAA
QUEUED
127.0.0.1:6379(TX)> DISCARD
OK
```   

그렇다면 도중에 잘못된 명령어를 사용했을 경우는 어떨까?   
아래의 예제는 Transaction 도중에 "DD HKD" 라고하는 Redis에서는 
정의되지 않은 명령어를 실행했을 때를 보여주고 있다.  
`이 경우에는 QUEUE에 쌓였던 모든 명령어가 DISCARD 되는 것을 알 수 있다.`    
`즉, EXEC 이전에 에러가 발생했을 경우 명령이 누적되는 동안 오류가 있음을 
기억하고, 이후 EXEC 실행시 Tranaction을 거부한다는 오류를 
반환하고 자동으로 DISCARD 처리를 한다.`     

```
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> SET AAA 4
QUEUED
127.0.0.1:6379(TX)> HSET AAA 2 3
QUEUED
127.0.0.1:6379(TX)> DD HKD      # 잘못된 명령어 실행    
(error) ERR unknown command `DD`, with args beginning with: `HKD`,
127.0.0.1:6379(TX)> EXEC
(error) EXECABORT Transaction discarded because of previous errors.
```

그렇다면 잘못된 자료구조 명령어를 사용하는 건 어떨까?   
아래와 같이 SET 자료구조를 사용하고 있고, key값 AAA는 정상적인 
명령어이며, BBB 같은 경우는 잘못된 명령어이다.   


```
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> SET AAA 3
QUEUED
127.0.0.1:6379(TX)> SET BBB 3 3    # SET 자료구조를 잘못 사용하는 경우   
QUEUED
127.0.0.1:6379(TX)> EXEC
1) OK
2) (error) ERR syntax error
```

위와 같이 에러가 발생했기 때문에 정상적인 명령어도 Rollback되어 없어졌을까?   
`그렇지 않다. GET을 해보면 정상적인 명령어는 잘 적용된 것을 확인 할 수 있다.`
`Redis의 트랜잭션은 잘못된 명령어가 하나 있다고 하더라도 정상적으로 사용한 
명령어에 대해서는 잘 적용되는 것을 알 수 있다.`   
`즉, EXEC 이후에 발생한 오류는 특별한 방법으로 처리되지 않고, 트랜잭션 중 
일부 명령이 실패하더라도 다른 명령들이 실행된다.`     

```
127.0.0.1:6379> GET AAA
"3"
```

RDBMS에 배경지식이 있는 경우, Redis의 트랜잭션 처리가 이상하게 보일 수 있다.   

Redis는 왜 이런 트랜잭션 방법을 택했을까?    
[redis 공식문서](https://redis.io/topics/transactions#why-redis-does-not-support-roll-backs)에서는 
이러한 이유는 대부분 개발 과정에서 일어날 수 있는 에러이며, 
    production에서는 거의 발생하지 않는 에러이다.   
또한, `rollback을 채택하지 않음으로써 빠른 성능을 유지할 수 있다고 한다.`       


- - - 

## Redis 트랜잭션 락(WATCH/UNWATCH)     

`트랜잭션에서 해당 키에 대해서 Lock 또한 중요한 요소이다. 내가 해당 값을 
변경하고 있는데 다른 사람이 동일하게 Key를 건드린다면 잘못 된 값이 
입력될 수 있기 때문이다.`   
`여기서 사용되는 Redis 명령어는 WATCH이다.`     

Redis의 WATCH 명령어는 Optimistic Locking을 통해 동시성 이슈를 해결한다.   
Optimistic Locking은 일반적인 RDBMS의 Locking과는 다르다.   
보통의 RDBMS의 경우 Transaction을 잡고 있으면 Locking이 되어 버리는 반면 
Redis의 Optimistic Locking은 실제로 락을 걸지 않고 Redis 내부의 
REDIS_DIRTY_CAS(Check And Set) 값을 체크하여 데이터에 접근하고 있는 
도중 다른 트랜잭션으로 인해 해당 데이터의 버전이 바뀌어 
처음과 일치하지 않으면 문제 상황을 알려준다.   

`즉, WATCH를 선언한 key는 transaction 외부에서 변경이 감지되면, 
    해당 key는 transaction 내부에서의 변경을 허용하지 않는다.`     

우선 아래는 실행 성공의 예이며, bank1 key값이 변하지 않았기 때문에 
성공적으로 명령이 실행되었다.   

```
127.0.0.1:6379> WATCH bank1
OK
127.0.0.1:6379> MULTI
OK
127.0.0.1:6379(TX)> incrby bank1 100
QUEUED
127.0.0.1:6379(TX)> EXEC
(integer)100
```


다른 예로 아래와 같이 bank1에 WATCH를 선언한 뒤 transaction 외부에서 
bank1를 변경했기 때문에, MULTI로 선언한 transaction 내부의 "incrby bank1 100"은 
실행되지 않고 (nil)을 return 한다.    

<img width="800" alt="스크린샷 2022-02-05 오후 7 06 37" src="https://user-images.githubusercontent.com/26623547/152637346-ed749642-9731-4e10-ada1-773c7e88fab6.png">   

`WATCH는 WATCH를 선언한 클라이언트뿐만 아니라 다른 
client에서도 transaction 외부에서 해당 key값을 변경할 경우 
동일하게 transaction 내부의 변경을 허용하지 않는다.`       

<img width="900" alt="스크린샷 2022-02-05 오후 7 13 01" src="https://user-images.githubusercontent.com/26623547/152637957-e8c8d4b1-6b90-4e7a-be34-039870786f78.png">   

`한번 WATCH를 선언한 key는 exec가 실행되면 즉시 UNWATCH 상태로 변경된다.`      
직접 UNWATCH를 선언할 경우 WATCH가 선언된 모든 key를 반환한다.   
또한, 각각의 key별로 UNWATC를 직접 선언할 수 없다.  

<img width="750" alt="스크린샷 2022-02-05 오후 7 13 10" src="https://user-images.githubusercontent.com/26623547/152637967-e231dfb8-5a6e-48db-b3e8-80a4ec0d6ae2.png">   

UNWATCH가 선언된 이후에는 transaction 외부에서 key가 
변경되었다고 하더라도 해당 key는 transaction 내부에서 변경할 수 있다.   

<img width="900" alt="스크린샷 2022-02-05 오후 7 13 22" src="https://user-images.githubusercontent.com/26623547/152637974-854c1315-1723-4cb9-a364-2d3efeb511f1.png">   

WATCH와는 반대로 다른 client에서 선언한 UNWATCH는 허용하지 않는다.   
따라서 외부 client에서 UNWATCH를 선언했다고 하더라도 해당 key는 
UNWATCH 되지 않는다.   

<img width="900" alt="스크린샷 2022-02-05 오후 7 13 31" src="https://user-images.githubusercontent.com/26623547/152637979-df3ecccd-29d7-4eb6-a45e-28ac7b93ca29.png">   





- - - 

**Reference**   

<https://minholee93.tistory.com/entry/Redis-Transaction>   
<https://redis.io/topics/transactions#why-redis-does-not-support-roll-backs>   
<https://redis.io/topics/transactions>    
<https://docs.spring.io/spring-data/data-redis/docs/current/reference/html/#tx>    
<https://sabarada.tistory.com/177>   

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
