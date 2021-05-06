---
layout: post
title: "[Redis] Redis(Remote Dictionary Server) Collection"
subtitle: "Redis에서 제공하는 자료구조, sorted set"       
comments: true
categories : BigData
date: 2021-05-04
background: '/img/posts/mac.png'
---

# Redis   

Redis는 오픈소스이고, 다양한 서비스에서 Redis를 자유롭게 사용하고 있다.   
`In-Memory 데이터베이스로써 모든 데이터를 메모리에 저장하고 조회한다.`    
기존 관계형 데이터베이스(Oracle, MySql)보다 훨씬 빠른데 그 이유는 메모리 
접근이 디스크 접근보다 빠르기 때문이다.   
하지만 빠르다는 것은 Redis의 여러 특징 중 일부분이다. `다른 In-Memory 데이터 베이스(ex. Memcached)와의 
가장 큰 차이점은 다양한 자료구조를 지원한다는 것이다.`     
아래와 같이 다양한 자료구조를 Key-Value 형태로 저장한다.   

<img width="723" alt="스크린샷 2021-05-05 오후 2 51 23" src="https://user-images.githubusercontent.com/26623547/117101574-79403600-adb1-11eb-9210-2b3eb7dbb7fc.png">    

Redis는 기본적으로 String, Bitmap, Hash, List, Set, Sorted Set를 제공했고, 
    버전이 올라가면서 현재는 Geospatial Index, Hyperloglog, Stream 등의 
    자료형도 지원하고 있다.   

그렇다면 이렇게 다양한 자료구조를 제공하는게 왜 중요할까?    

예를 들어 실시간 랭킹 서버를 구현할 때 DBMS를 이용한다면 DB에 데이터를 저장하고, 
    저장된 SCORE 값으로 정렬하여 다시 읽어오는 과정이 필요할 것이다.   
    디스크 IO를 계속해서 해야 하기 때문에 갯수가 많아 질수록 속도가 느려질 것이다.    
    이 과정에서 속도 향상을 위해 In-memory 기반으로 서버에서 데이터를 처리하도록 
    직접 코드를 짤 수도 있겠지만, Redis의 Sorted-Set을 이용하는게 
    더 빠르고 간단한 방법일 수 있다.   

<img width="702" alt="스크린샷 2021-05-05 오후 2 58 29" src="https://user-images.githubusercontent.com/26623547/117102088-87428680-adb2-11eb-9875-f14ed2c8bdec.png">    


- - - 

그렇다면 이제 Redis에서 제공하는 자료구조에 대해 살펴보자.   

## Redis 자료 구조    

Redis가 다양한 자료구조(Collection)를 지원하지만 주의해야 할 점이 있다.   

`하나의 Collection에 너무 많은 아이템을 담으면 좋지 않다.`   
가능하면 10000개 이하의, 몇천개 수준의 데이터셋을 유지하는게 Redis 성능에 
영향을 주지 않는다.   

`Expire는 Collection의 아이템 개별로 적용되지 않고, 전체 Collection에 대해서만 
적용된다.`   
즉, 10000개의 아이템을 가진 Collection에 expire가 걸려 있다면, 
    그 시간 이후 10000개의 아이템이 모두 삭제된다.     

- - - 

### 1) String   

Redis의 String은 키와 연결할 수 있는 가장 간단한 유형의 값이다. Redis의 
키가 문자열이므로 이 구조는 문자열을 다른 문자열에 매핑하는 것이라고 
볼 수 있다.   

> 값의 최대 사이즈는 512 MB이다.   

```
> set hello world
OK
> get hello
"world"
```

String 타입에는 모든 종류의 문자열(이진 데이터 포함)을 저장할 수 있다. 
따라서 JPEG 이미지를 저장하거나, HTML fragment를 캐시하는 용도로 
자주 사용한다.    
String은 가장 기본적인 자료구조이기 때문에 다음과 같은 다양한 
기능을 제공한다.     

- String을 정수로 파싱하고, 이를 atomic하게 증감하는 커맨드    

```
127.0.0.1:6379> set hello 100
OK
127.0.0.1:6379> get hello
"100"
127.0.0.1:6379> incr hello
(integer) 101
127.0.0.1:6379> incr hello
(integer) 102
127.0.0.1:6379> incrby hello 50
(integer) 152
```

- 키를 새 값으로 변경하고 이전 값을 반환하는 커맨드   

```
127.0.0.1:6379> incr mycounter
(integer) 1
127.0.0.1:6379> getset mycounter 0
"1"
127.0.0.1:6379> get mycounter
"0"
```

- 키가 이미 존재하거나, 존재하지 않을 때에만 데이터를 저장하게 하는 옵션   

```
> set mykey newval nx
(nil)
> set mykey newval xx
OK
```
- - - 

### 2) List    

자세한 내용은 [공식문서](https://redis.io/topics/data-types)를 참고하자.

- - -

### 3) Set    

자세한 내용은 [공식문서](https://redis.io/topics/data-types)를 참고하자.

- - - 

### 4) Sorted Set   

일반적으로 Set 자료구조는 저장된 value들을 unique하게 관리하기 위해 사용된다.    
이 때 저장된 value들 사이의 순서는 관리되지 않는다.   
하지만 `Redis에서 제공해주는 자료구조 중 하나인 Sorted Set(또는 ZSET, 둘다 동일한 내용이다)은 
Set의 특성을 그대로 가지면서 추가적으로 저장된 value들의 순서도 관리해 준다.`   
`이 때 이 순서를 위해 각 value에 대해 score를 필요에 맞게 설정할 수 있으며, 이 
score를 가반으로 정렬이 된다.`   

> 이때, score는 double이기 때문에, 부동소수점에 주의해야 한다.   

즉, Sorted set은 정렬된 형태로 저장되기 때문에 인덱스를 이용하여 빠르게 
조회할 수 있다.   

> 인덱스를 이용하여 조회할 일이 많다면 list보다는 sorted set 사용을 권장한다.   

<img width="662" alt="스크린샷 2021-05-05 오후 4 26 13" src="https://user-images.githubusercontent.com/26623547/117108822-b7902200-adbe-11eb-9ad1-0e15416adafc.png">      

위의 그림처럼 key, score, member의 형태로 이루어져 있으며, 
하나의 ZSET에서 member는 unique하고, member 값을 통해 
시간복잡도 O(1)로 해당하는 원소에 바로 접근할 수 있다.   
score는 부동 소수점 수만 허용되고, 이 score값을 기준으로 ZSET 내의 
각 원소들이 순서를 가지게 된다.   

#### ZADD 

> ZADD key score member    

ZSET에 각 유저의 이름과 score를 지정해 추가해보자.   

```
127.0.0.1:6379> zadd user:rank 1 kaven
(integer) 1
127.0.0.1:6379> zadd user:rank 2 mike
(integer) 1
127.0.0.1:6379> zadd user:rank 3 pall 4 bart   // 한번에 추가도 가능    
(integer) 2
```

이미 존재하는 member 값이라면 score가 변경 된다.   

```
127.0.0.1:6379> zadd user:rank 5 kaven
(integer) 0
```    

#### ZSCORE   

> ZSCORE key member    

score를 조회 할 수 있다.   

```
127.0.0.1:6379> zscore user:rank kaven   
"5"  
```

#### ZRANK   

> ZRANK key member   

sorted set에서 member의 정렬 순서를 확인 할 수 있다.   

```
127.0.0.1:6379> zrank user:rank mike
(integer) 0   // 0부터 시작 (가장 첫번째 순서)   
```

#### ZRANGE   

> ZRANGE key start stop    

zrange에서 start, stop에는 정렬된 원소들 중에서 내가 출력하고 싶은 원소의 
시작 위치와 끝 위치를 넣으면 된다.  
한가지 주의해야 할 점은 첫번째 원소를 0이라 했을 때의 
상대적인 위치값이고, 양수/음수 모두 가능하다.    

<img width="400" alt="스크린샷 2021-05-05 오후 4 44 32" src="https://user-images.githubusercontent.com/26623547/117110548-3c7c3b00-adc1-11eb-8aa8-19dcfad5f56b.png">   

`score 기준으로 오름차순으로 모두 출력하고자 할때 아래와 같이 사용할 수 있다.`       

```
127.0.0.1:6379> zrange user:rank 0 -1
1) "mike"
2) "pall"
3) "bart"
4) "kaven"
```

score가 가장 낮은 member, 가장 높은 member만을 출력하고 싶다면,   

```
127.0.0.1:6379> zrange user:rank 0 0
1) "mike"
```

```
127.0.0.1:6379> zrange user:rank -1 -1
1) "kaven"
```

score 기준으로 오름차순 정렬되어 있을 때, 인덱스 2에서 3까지만 
출력하고자 할 때는,   

```
127.0.0.1:6379> zrange user:rank 2 3
1) "bart"
2) "kaven"
```

`만약 과일의 가격도 함께 출력하고 싶다면, withscores 옵션을 추가한다.`   

```
127.0.0.1:6379> zrange user:rank 0 -1 withscores
1) "mike"
2) "2"
3) "pall"
4) "3"
5) "bart"
6) "4"
7) "kaven"
8) "5"
```

`가격이 높은 순서대로 출력하고 싶다면, zrevrange 명령어를 이용하자.`   

```
127.0.0.1:6379> zrevrange user:rank 0 -1 withscores
1) "kaven"
2) "5"
3) "bart"
4) "4"
5) "pall"
6) "3"
7) "mike"
8) "2"
```

#### ZRANGEBYSCORE   

> ZRANGEBYSCORE key min max    

`score 의 범위를 주고 만족하는 member를 찾고 싶을 때 사용 하면 된다.`    

score 2이상 4이하 member를 찾을 때 아래와 같이 낮은 순서대로 출력해준다.   

```
127.0.0.1:6379> zrangebyscore user:rank 2 4 withscores
1) "mike"
2) "2"
3) "pall"
4) "3"
5) "bart"
6) "4"
```

아래는 score 2초과 5미만의 member를 오름차순으로 출력한다.     

```
127.0.0.1:6379> zrangebyscore user:rank (2 (5 withscores
1) "pall"
2) "3"
3) "bart"
4) "4"
```

score 상관없이 모든 member를 오름차순으로 출력한다.   

```
127.0.0.1:6379> zrangebyscore user:rank -inf +inf
1) "mike"
2) "pall"
3) "bart"
4) "kaven"
```

`score 3을 초과하면서 score 기준 내림차순으로 출력하고 싶다면 아래와 같이 하면 된다.`   

> ZREVRANGEBYSCORE 에서 min 과 max 의 위치가 ZRANGEBYSCORE에서와 반대다.   

```
127.0.0.1:6379> zrevrangebyscore user:rank +inf (3 withscores
1) "kaven"
2) "5"
3) "bart"
4) "4"
```

#### ZREM    

> ZREM key member    

`member 제거하려고 할때 사용한다.`    

```
127.0.0.1:6379> zrem user:rank kaven
(integer) 1
127.0.0.1:6379> zrange user:rank 0 -1
1) "mike"
2) "pall"
3) "bart"
```   

ZADD와 마찬가지로 한번에 복수개의 삭제도 가능하다.   

```
127.0.0.1:6379> zrem user:rank bart pall
(integer) 2
127.0.0.1:6379> zrange user:rank 0 -1
1) "mike"
```

- - - 


## Redis 설치 및 실행    

##### Redis 설치    

```
$brew install redis
```

##### Redis 서비스 실행, 중지, 재시작  

```
$brew services start redis

$brew services stop redis

$brew services restart redis
```

##### Redis 설정    

```
# Accept connections on the specified port, default is 6379.

# If port 0 is specified Redis will not listen on a TCP socket.
port  6379   [포트번호 변경]

# Warning: since Redis is pretty fast an outside user can try up to
# 150k passwords per second against a good box. This means that you should
# use a very strong password otherwise it will be very easy to break.
#
requirepass password  [주석제거하고 패스워드 입력]

# By default Redis listens for connections from all the network interfaces
# available on the server. It is possible to listen to just one or multiple
# interfaces using the "bind" configuration directive, followed by one or
# more IP addresses.
#
# Examples:
#
# bind 192.168.1.100 10.0.0.1  
bind 127.0.0.1 192.168.0.101   [외부에서 접근 가능하도록 IP 추가 가능]
```

##### Redis 실행     

```
$redis-server
```

redis-cli 명령을 실행하면 내부 redis 서버에 접속한다.   

```
$ redis-cli
127.0.0.1:6379> 
```

- - - 

**Reference**   

<https://redis.io/topics/data-types>    
<https://jupiny.com/2020/03/28/redis-sorted-set/>    
<https://meetup.toast.com/posts/224>    
<https://blog.voidmainvoid.net/233>    

{% highlight ruby linenos %}

{% endhighlight %}


{%- if site.disqus.shortname -%}
    {%- include disqus.html -%}
{%- endif -%}
